import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sanitizeString } from '@/lib/types'
import { MEETING_STATUS } from '@/lib/types'

const VALID_STATUSES = new Set(MEETING_STATUS)

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.meetings?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (status && VALID_STATUSES.has(status as "SCHEDULED")) where.status = status
    if (from || to) {
      where.date = {} as Record<string, unknown>
      if (from) {
        const fromDate = new Date(from)
        if (!isNaN(fromDate.getTime())) (where.date as Record<string, unknown>).gte = fromDate
      }
      if (to) {
        const toDate = new Date(to)
        if (!isNaN(toDate.getTime())) (where.date as Record<string, unknown>).lte = toDate
      }
    }

    const meetings = await db.meeting.findMany({
      where,
      include: {
        lead: { include: { business: { select: { name: true, website: true, email: true, phone: true } } } },
      },
      orderBy: { date: 'asc' },
      take: 200,
    })

    return NextResponse.json({ meetings })
  } catch (e: unknown) {
    console.error('[MEETINGS GET ERROR]', e)
    return NextResponse.json({ error: 'Failed to load meetings.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.meetings?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()

    // Validate required fields
    if (!data.leadId || typeof data.leadId !== 'string') {
      return NextResponse.json({ error: 'leadId is required.' }, { status: 400 })
    }
    if (!data.date) {
      return NextResponse.json({ error: 'Meeting date is required.' }, { status: 400 })
    }
    if (!data.title) {
      return NextResponse.json({ error: 'Meeting title is required.' }, { status: 400 })
    }

    const meetingStatus = VALID_STATUSES.has(data.status) ? data.status : 'SCHEDULED'

    // Whitelist fields to prevent mass assignment
    const meeting = await db.meeting.create({
      data: {
        leadId: data.leadId,
        title: sanitizeString(data.title),
        description: data.description ? sanitizeString(data.description) : null,
        date: new Date(data.date),
        duration: typeof data.duration === 'number' ? Math.min(480, Math.max(5, data.duration)) : 30,
        status: meetingStatus,
        meetingLink: data.meetingLink ? String(data.meetingLink).slice(0, 500) : null,
        notes: data.notes ? sanitizeString(data.notes) : null,
      },
      include: {
        lead: { include: { business: { select: { name: true } } } },
      },
    })

    await db.lead.update({
      where: { id: data.leadId },
      data: { stage: 'MEETING_BOOKED' },
    })

    await db.activity.create({
      data: {
        userId: session.id,
        leadId: data.leadId,
        action: 'MEETING_BOOKED',
        details: `Meeting booked: ${meeting.title} on ${new Date(meeting.date).toLocaleDateString()}`,
      },
    })

    return NextResponse.json({ meeting }, { status: 201 })
  } catch (e: unknown) {
    console.error('[MEETINGS POST ERROR]', e)
    return NextResponse.json({ error: 'Failed to create meeting.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.meetings?.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()
    if (!data.id) return NextResponse.json({ error: 'Meeting ID is required.' }, { status: 400 })

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = sanitizeString(data.title)
    if (data.description !== undefined) updateData.description = data.description ? sanitizeString(data.description) : null
    if (data.date !== undefined) updateData.date = new Date(data.date)
    if (data.duration !== undefined) updateData.duration = Math.min(480, Math.max(5, data.duration))
    if (data.status !== undefined && VALID_STATUSES.has(data.status)) updateData.status = data.status
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink ? String(data.meetingLink).slice(0, 500) : null
    if (data.notes !== undefined) updateData.notes = data.notes ? sanitizeString(data.notes) : null

    const meeting = await db.meeting.update({
      where: { id: data.id },
      data: updateData,
      include: {
        lead: { include: { business: { select: { name: true } } } },
      },
    })

    return NextResponse.json({ meeting })
  } catch (e: unknown) {
    console.error('[MEETINGS PATCH ERROR]', e)
    return NextResponse.json({ error: 'Failed to update meeting.' }, { status: 500 })
  }
}