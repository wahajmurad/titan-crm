import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, sanitizeEmail, rateLimit } from '@/lib/types'
import { createSession, getSession, destroySession, getTokenCookieOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// ── POST: Login ──
export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rl = rateLimit(`auth:login:${ip}`, 5, 15 * 60 * 1000) // 5 attempts per 15 min
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      )
    }

    const body = await req.json()
    const rawEmail = body.email
    const password = body.password

    if (!rawEmail || typeof rawEmail !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const email = sanitizeEmail(rawEmail)

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    // Prevent timing attacks on non-existent emails by always doing a hash comparison
    const user = await db.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      // Still do a dummy hash to prevent timing attacks
      bcrypt.compareSync(password, '$2a$12$dummyhashfordummyuser0000000000000000000000000000000000')
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const token = await createSession(user)
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    })
    res.cookies.set('titan_token', token, getTokenCookieOptions())
    return res
  } catch (e: unknown) {
    console.error('[AUTH LOGIN ERROR]', e)
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
  }
}

// ── DELETE: Logout ──
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('titan_token')?.value
    if (token) await destroySession(token)

    const res = NextResponse.json({ success: true })
    res.cookies.set('titan_token', '', { ...getTokenCookieOptions(), maxAge: 0 })
    return res
  } catch (e: unknown) {
    console.error('[AUTH LOGOUT ERROR]', e)
    // Still clear cookie even if server error
    const res = NextResponse.json({ success: true })
    res.cookies.set('titan_token', '', { ...getTokenCookieOptions(), maxAge: 0 })
    return res
  }
}

// ── GET: Check session ──
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    return NextResponse.json({ user: session })
  } catch (e: unknown) {
    console.error('[AUTH SESSION ERROR]', e)
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
}