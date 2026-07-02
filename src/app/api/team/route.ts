import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { hashPassword, validatePassword, sanitizeEmail, sanitizeString, rateLimit, MODULES } from '@/lib/types'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.team?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const users = await db.user.findMany({
      where: { role: 'TEAM' },
      include: { permissions: true },
      orderBy: { createdAt: 'desc' },
    })

    // Never expose password hashes
    const safeUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      isActive: u.isActive,
      permissions: u.permissions,
      createdAt: u.createdAt,
    }))

    return NextResponse.json({ users: safeUsers })
  } catch (e: unknown) {
    console.error('[TEAM GET ERROR]', e)
    return NextResponse.json({ error: 'Failed to load team members.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.team?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Rate limit team creation
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rl = rateLimit(`team:create:${session.id}`, 10, 60 * 60 * 1000) // 10 per hour
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many team members added recently. Please wait.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const rawEmail = body.email
    const rawPassword = body.password
    const rawName = body.name
    const permData = body.permissions

    if (!rawEmail || !rawPassword || !rawName) {
      return NextResponse.json({ error: 'Email, password, and name are required.' }, { status: 400 })
    }

    const email = sanitizeEmail(rawEmail)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    // Validate password strength
    const pwCheck = validatePassword(rawPassword)
    if (!pwCheck.valid) {
      return NextResponse.json({ error: `Password requirements: ${pwCheck.errors.join(', ')}.` }, { status: 400 })
    }

    const name = sanitizeString(rawName)
    if (name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        email,
        password: hashPassword(rawPassword),
        name,
        role: 'TEAM',
      },
    })

    if (permData && typeof permData === 'object') {
      for (const mod of MODULES) {
        const p = permData[mod]
        if (p && typeof p === 'object') {
          await db.permission.create({
            data: {
              userId: user.id,
              module: mod,
              canView: !!p.canView,
              canCreate: !!p.canCreate,
              canEdit: !!p.canEdit,
              canDelete: !!p.canDelete,
            },
          })
        }
      }
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    }, { status: 201 })
  } catch (e: unknown) {
    console.error('[TEAM POST ERROR]', e)
    if (e instanceof Error && e.message.includes('Unique')) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create team member.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.team?.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()
    const { id, isActive, name, password, permissions: permData } = data

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const updateData: Record<string, unknown> = {}
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    if (name) {
      const cleanName = sanitizeString(name)
      if (cleanName.length >= 2) updateData.name = cleanName
    }

    // Allow resetting team member passwords (OWNER only)
    if (password && session.role === 'OWNER') {
      const pwCheck = validatePassword(password)
      if (!pwCheck.valid) {
        return NextResponse.json({ error: `Password requirements: ${pwCheck.errors.join(', ')}.` }, { status: 400 })
      }
      updateData.password = hashPassword(password)
    }

    await db.user.update({ where: { id }, data: updateData })

    // Update permissions if provided
    if (permData && typeof permData === 'object' && session.role === 'OWNER') {
      for (const mod of MODULES) {
        const p = permData[mod]
        if (p && typeof p === 'object') {
          await db.permission.upsert({
            where: { userId_module: { userId: id, module: mod } },
            update: {
              canView: !!p.canView,
              canCreate: !!p.canCreate,
              canEdit: !!p.canEdit,
              canDelete: !!p.canDelete,
            },
            create: {
              userId: id,
              module: mod,
              canView: !!p.canView,
              canCreate: !!p.canCreate,
              canEdit: !!p.canEdit,
              canDelete: !!p.canDelete,
            },
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('[TEAM PATCH ERROR]', e)
    return NextResponse.json({ error: 'Failed to update team member.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'OWNER') return NextResponse.json({ error: 'Only owner can delete team members.' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'User ID required.' }, { status: 400 })

    // Prevent deleting yourself
    if (id === session.id) {
      return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 })
    }

    // Verify it's a TEAM member, not an OWNER
    const target = await db.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    if (target.role === 'OWNER') return NextResponse.json({ error: 'Cannot delete owner account.' }, { status: 403 })

    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('[TEAM DELETE ERROR]', e)
    return NextResponse.json({ error: 'Failed to delete team member.' }, { status: 500 })
  }
}