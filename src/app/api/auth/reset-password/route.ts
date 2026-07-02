import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, validatePassword, rateLimit } from '@/lib/types'
import { destroySession, getTokenCookieOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 attempts per hour
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rl = rateLimit(`auth:reset:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      )
    }

    const body = await req.json()
    const { token, password } = body

    if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 })
    }

    // Validate password strength
    const pwCheck = validatePassword(password)
    if (!pwCheck.valid) {
      return NextResponse.json({ error: `Password requirements: ${pwCheck.errors.join(', ')}.` }, { status: 400 })
    }

    // Look up reset token
    const resetEntry = await db.appSetting.findUnique({
      where: { key: `reset_${token}` },
    })

    if (!resetEntry) {
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 })
    }

    const [userId, expiresAtStr] = resetEntry.value.split('|')
    const expiresAt = new Date(expiresAtStr)

    if (Date.now() > expiresAt.getTime()) {
      await db.appSetting.delete({ where: { key: `reset_${token}` } })
      return NextResponse.json({ error: 'Reset token has expired. Please request a new one.' }, { status: 400 })
    }

    // Update password
    const hashedPassword = hashPassword(password)
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Delete reset token
    await db.appSetting.delete({ where: { key: `reset_${token}` } })

    // Invalidate all sessions for this user (force re-login)
    const sessions = await db.appSetting.findMany({
      where: { key: { startsWith: 'session_' }, value: userId },
    })
    for (const s of sessions) {
      const sToken = s.key.replace('session_', '')
      await destroySession(sToken).catch(() => {})
    }

    return NextResponse.json({ success: true, message: 'Password has been reset successfully.' })
  } catch (e: unknown) {
    console.error('[RESET PASSWORD ERROR]', e)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}