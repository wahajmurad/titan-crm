import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeEmail, rateLimit, generateToken } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 requests per hour per IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rl = rateLimit(`auth:forgot:${ip}`, 3, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      )
    }

    const body = await req.json()
    const email = sanitizeEmail(body.email || '')

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    // Only actually create reset token if user exists
    if (user && user.isActive) {
      const resetToken = generateToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await db.appSetting.upsert({
        where: { key: `reset_${resetToken}` },
        update: { value: `${user.id}|${expiresAt.toISOString()}`, updatedAt: new Date() },
        create: {
          key: `reset_${resetToken}`,
          value: `${user.id}|${expiresAt.toISOString()}`,
        },
      })

      // In production, send email with reset link
      // For now, the token is stored and can be verified
      console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`)
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been generated.',
    })
  } catch (e: unknown) {
    console.error('[FORGOT PASSWORD ERROR]', e)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}