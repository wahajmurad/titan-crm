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

    // Always return the same success shape to prevent email enumeration
    // But only include resetToken if user actually exists
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

      // Return token directly — this is an owner-only app, no email service needed
      return NextResponse.json({
        success: true,
        resetToken,
        message: 'Use the reset token to set a new password.',
      })
    }

    // User not found — return generic success to prevent enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a reset token has been generated.',
    })
  } catch (e: unknown) {
    console.error('[FORGOT PASSWORD ERROR]', e)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}