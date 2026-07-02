import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sanitizeString } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50))

    const where: Record<string, unknown> = { userId: session.id }
    if (unreadOnly) where.read = false

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.notification.count({
        where: { userId: session.id, read: false },
      }),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (e: unknown) {
    console.error('[Notifications GET ERROR]', e)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const { userId, title, message, type, link, linkId } = data

    if (userId && userId !== session.id && session.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const notification = await db.notification.create({
      data: {
        userId: userId || session.id,
        title: title ? sanitizeString(title) : 'Notification',
        message: message ? sanitizeString(message) : '',
        type: type || 'info',
        link: link ? sanitizeString(link) : null,
        linkId: linkId || null,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (e: unknown) {
    console.error('[Notifications POST ERROR]', e)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const { id, markAllRead } = data

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: session.id, read: false },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    if (id) {
      await db.notification.update({
        where: { id, userId: session.id },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'id or markAllRead required' }, { status: 400 })
  } catch (e: unknown) {
    console.error('[Notifications PATCH ERROR]', e)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}