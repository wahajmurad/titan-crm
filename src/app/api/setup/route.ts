import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession, getTokenCookieOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const ownerCount = await db.user.count({ where: { role: 'OWNER' } })
    if (ownerCount > 0) {
      return NextResponse.json({ error: 'Owner already exists' }, { status: 400 })
    }

    const { email, password, name } = await req.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashPassword(password),
        name,
        role: 'OWNER',
      },
    })

    const token = await createSession(user)
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: 'OWNER' } })
    res.cookies.set('titan_token', token, getTokenCookieOptions())
    return res
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (msg.includes('Unique')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  const ownerCount = await db.user.count({ where: { role: 'OWNER' } })
  return NextResponse.json({ needsSetup: ownerCount === 0 })
}