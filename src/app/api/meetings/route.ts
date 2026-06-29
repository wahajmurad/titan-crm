import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.meetings?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (from || to) {
      where.date = {}
      if (from) (where.date as Record<string, unknown>).gte = new Date(from)
      if (to) (where.date as Record<string, unknown>).lte = new Date(to)
    }

    const meetings = await db.meeting.findMany({
      where,
      include: {
        lead: { include: { business: { select: { name: true, website: true, email: true, phone: true } } } },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ meetings })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.meetings?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()

    const meeting = await db.meeting.create({
      data,
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
        details: `Meeting booked: ${data.title} on ${new Date(data.date).toLocaleDateString()}`,
      },
    })

    return NextResponse.json({ meeting }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}