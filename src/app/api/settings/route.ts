import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { hashPassword, verifyPassword, validatePassword, sanitizeString, sanitizeEmail } from '@/lib/types'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const settings = await db.appSetting.findMany({
      orderBy: { key: 'asc' },
    })

    // Never expose session tokens or reset tokens to the client
    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      if (s.key.startsWith('session_') || s.key.startsWith('reset_')) continue
      settingsMap[s.key] = s.value
    }

    return NextResponse.json({ settings: settingsMap })
  } catch (e: unknown) {
    console.error('[SETTINGS GET ERROR]', e)
    return NextResponse.json({ error: 'Failed to load settings.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'OWNER') return NextResponse.json({ error: 'Only the owner can modify settings.' }, { status: 403 })

    const body = await req.json()
    const { settings } = body
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid settings format.' }, { status: 400 })
    }

    // Block protected keys from being set via API
    const protectedPrefixes = ['session_', 'reset_', 'password', 'secret', 'token', 'api_key']
    for (const key of Object.keys(settings)) {
      if (protectedPrefixes.some(p => key.toLowerCase().startsWith(p))) {
        return NextResponse.json({ error: `Cannot modify protected setting: ${key}` }, { status: 400 })
      }
    }

    for (const [key, value] of Object.entries(settings)) {
      const strVal = String(value).slice(0, 10000)
      await db.appSetting.upsert({
        where: { key: sanitizeString(key).slice(0, 200) },
        update: { value: strVal },
        create: { key: sanitizeString(key).slice(0, 200), value: strVal },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('[SETTINGS POST ERROR]', e)
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const { currentPassword, newPassword, name, email } = data

    // Update name
    if (name !== undefined) {
      const cleanName = sanitizeString(name)
      if (cleanName.length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 })
      }
      await db.user.update({ where: { id: session.id }, data: { name: cleanName } })
    }

    // Update email (OWNER only)
    if (email !== undefined) {
      if (session.role !== 'OWNER') return NextResponse.json({ error: 'Only owner can change email.' }, { status: 403 })
      const cleanEmail = sanitizeEmail(email)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 })
      }
      await db.user.update({ where: { id: session.id }, data: { email: cleanEmail } })
    }

    // Change password
    if (currentPassword && newPassword) {
      const pwCheck = validatePassword(newPassword)
      if (!pwCheck.valid) {
        return NextResponse.json({ error: `Password requirements: ${pwCheck.errors.join(', ')}.` }, { status: 400 })
      }

      const user = await db.user.findUnique({ where: { id: session.id } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      // Use verifyPassword (bcrypt.compare) instead of re-hashing
      if (!verifyPassword(currentPassword, user.password)) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
      }

      await db.user.update({ where: { id: session.id }, data: { password: hashPassword(newPassword) } })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('[SETTINGS PATCH ERROR]', e)
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 })
  }
}