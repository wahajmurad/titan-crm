import { db } from '@/lib/db'
import { verifyPassword, generateToken, type UserSession, type PermissionMap, MODULES } from './types'
import { cookies } from 'next/headers'

const TOKEN_COOKIE = 'titan_token'
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function createSession(user: { id: string; email: string; name: string; role: string; avatar?: string | null }): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS)

  await db.appSetting.upsert({
    where: { key: `session_${token}` },
    update: { value: user.id, updatedAt: new Date() },
    create: {
      key: `session_${token}`,
      value: user.id,
    },
  })

  // Store expiry separately for cleanup
  await db.appSetting.upsert({
    where: { key: `session_exp_${token}` },
    update: { value: expiresAt.toISOString(), updatedAt: new Date() },
    create: {
      key: `session_exp_${token}`,
      value: expiresAt.toISOString(),
    },
  })

  return token
}

export async function getSession(): Promise<(UserSession & { permissions: PermissionMap }) | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  if (!token) return null

  // Check session expiry
  try {
    const expSetting = await db.appSetting.findUnique({
      where: { key: `session_exp_${token}` },
    })
    if (!expSetting) return null

    const expiresAt = new Date(expSetting.value)
    if (Date.now() > expiresAt.getTime()) {
      // Session expired, clean up
      await destroySession(token)
      return null
    }
  } catch {
    return null
  }

  const session = await db.appSetting.findUnique({
    where: { key: `session_${token}` },
  })
  if (!session) return null

  const user = await db.user.findUnique({
    where: { id: session.value },
    include: { permissions: true },
  })
  if (!user || !user.isActive) return null

  const permissions: PermissionMap = {}
  if (user.role === 'OWNER') {
    for (const m of MODULES) {
      permissions[m] = { canView: true, canCreate: true, canEdit: true, canDelete: true }
    }
  } else {
    for (const m of MODULES) {
      const p = user.permissions.find(perm => perm.module === m)
      permissions[m] = {
        canView: p?.canView ?? false,
        canCreate: p?.canCreate ?? false,
        canEdit: p?.canEdit ?? false,
        canDelete: p?.canDelete ?? false,
      }
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'OWNER' | 'TEAM',
    avatar: user.avatar ?? undefined,
    permissions,
  }
}

export async function destroySession(token: string): Promise<void> {
  await db.appSetting.deleteMany({
    where: {
      OR: [
        { key: `session_${token}` },
        { key: `session_exp_${token}` },
      ],
    },
  })
}

export function getTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours (matches SESSION_MAX_AGE_MS)
  }
}

// Clean up expired sessions periodically
export async function cleanupExpiredSessions() {
  try {
    const expiredSessions = await db.appSetting.findMany({
      where: {
        key: { startsWith: 'session_exp_' },
      },
    })

    const now = Date.now()
    const expiredTokens: string[] = []

    for (const session of expiredSessions) {
      const expiresAt = new Date(session.value)
      if (now > expiresAt.getTime()) {
        const token = session.key.replace('session_exp_', '')
        expiredTokens.push(token)
      }
    }

    if (expiredTokens.length > 0) {
      const conditions = expiredTokens.flatMap(token => [
        { key: `session_${token}` },
        { key: `session_exp_${token}` },
      ])

      await db.appSetting.deleteMany({
        where: { OR: conditions },
      })
    }
  } catch {
    // Silent fail — cleanup is best-effort
  }
}