import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, validatePassword, sanitizeEmail, sanitizeString, rateLimit } from '@/lib/types'
import { createSession, getTokenCookieOptions, cleanupExpiredSessions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rl = rateLimit(`auth:setup:${ip}`, 3, 60 * 60 * 1000) // 3 attempts per hour
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many setup attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      )
    }

    const ownerCount = await db.user.count({ where: { role: 'OWNER' } })
    if (ownerCount > 0) {
      return NextResponse.json({ error: 'Owner account already exists.' }, { status: 400 })
    }

    const body = await req.json()
    const rawEmail = body.email
    const password = body.password
    const rawName = body.name

    if (!rawEmail || !password || !rawName) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const email = sanitizeEmail(rawEmail)

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    // Password validation
    const pwCheck = validatePassword(password)
    if (!pwCheck.valid) {
      return NextResponse.json({ error: `Password requirements: ${pwCheck.errors.join(', ')}.` }, { status: 400 })
    }

    const name = sanitizeString(rawName)
    if (name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 })
    }

    const hashedPassword = hashPassword(password)

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'OWNER',
      },
    })

    // Create default OWNER permissions
    const MODULES = ['dashboard', 'discovery', 'audit', 'leads', 'campaigns', 'email-center', 'inbox', 'meetings', 'ai-assistant', 'prompts', 'team', 'settings']
    await db.permission.createMany({
      data: MODULES.map(mod => ({
        userId: user.id,
        module: mod,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      })),
    })

    const token = await createSession(user)
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: 'OWNER' },
    })
    res.cookies.set('titan_token', token, getTokenCookieOptions())
    return res
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (msg.includes('Unique')) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
    }
    console.error('[SETUP ERROR]', e)
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Cleanup expired sessions on setup check
    await cleanupExpiredSessions().catch(() => {})
    const ownerCount = await db.user.count({ where: { role: 'OWNER' } })
    return NextResponse.json({ needsSetup: ownerCount === 0 })
  } catch {
    return NextResponse.json({ needsSetup: true })
  }
}