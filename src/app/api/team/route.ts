import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { hashPassword } from '@/lib/types'
import { MODULES } from '@/lib/types'

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

    return NextResponse.json({ users })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.team?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { email, password, name, permissions: permData } = await req.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashPassword(password),
        name,
        role: 'TEAM',
      },
    })

    if (permData) {
      for (const mod of MODULES) {
        const p = permData[mod]
        if (p) {
          await db.permission.create({
            data: {
              userId: user.id,
              module: mod,
              canView: p.canView || false,
              canCreate: p.canCreate || false,
              canEdit: p.canEdit || false,
              canDelete: p.canDelete || false,
            },
          })
        }
      }
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (msg.includes('Unique')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.team?.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, isActive } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await db.user.update({ where: { id }, data: { isActive } })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}