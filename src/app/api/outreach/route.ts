import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.outreach?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (leadId) where.leadId = leadId
    if (status) where.status = status

    const [outreaches, total] = await Promise.all([
      db.outreach.findMany({
        where,
        include: {
          lead: { include: { business: { select: { name: true, website: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.outreach.count({ where }),
    ])

    return NextResponse.json({ outreaches, total, page, limit })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.outreach?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()

    const outreach = await db.outreach.create({
      data: {
        ...data,
        sentAt: data.status === 'SENT' ? new Date() : null,
      },
      include: {
        lead: { include: { business: { select: { name: true } } } },
      },
    })

    if (data.status === 'SENT') {
      await db.lead.update({
        where: { id: data.leadId },
        data: { stage: 'OUTREACH_SENT' },
      })
    }

    await db.activity.create({
      data: {
        userId: session.id,
        leadId: data.leadId,
        action: data.status === 'SENT' ? 'OUTREACH_SENT' : 'OUTREACH_DRAFTED',
        details: `${data.type || 'Initial'} outreach ${data.status === 'SENT' ? 'sent' : 'drafted'} for outreach #${outreach.id.slice(-6)}`,
      },
    })

    return NextResponse.json({ outreach }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}