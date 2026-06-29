import { db } from '@/lib/db'
import { verifyPassword, generateToken, type UserSession, type PermissionMap, MODULES } from './types'
import { cookies } from 'next/headers'

const TOKEN_COOKIE = 'titan_token'

export async function createSession(user: { id: string; email: string; name: string; role: string; avatar?: string | null }): Promise<string> {
  const token = generateToken()
  await db.appSetting.upsert({
    where: { key: `session_${token}` },
    update: { value: user.id, updatedAt: new Date() },
    create: { key: `session_${token}`, value: user.id },
  })
  return token
}

export async function getSession(): Promise<(UserSession & { permissions: PermissionMap }) | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  if (!token) return null

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
    where: { key: { startsWith: `session_${token}` } },
  })
}

export function getTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: false,
    sameName: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  }
}