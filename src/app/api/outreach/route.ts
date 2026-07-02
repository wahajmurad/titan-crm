import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sanitizeString } from '@/lib/types'
import { OUTREACH_STATUS, OUTREACH_TYPE } from '@/lib/types'

// Only allow these fields from the client
const ALLOWED_OUTREACH_FIELDS = ['leadId', 'type', 'subject', 'body', 'status', 'channel', 'scheduledAt'] as const
const VALID_STATUSES = new Set(OUTREACH_STATUS)
const VALID_TYPES = new Set(OUTREACH_TYPE)

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
    console.error('[OUTREACH GET ERROR]', e)
    return NextResponse.json({ error: 'Failed to load outreaches.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.outreach?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()

    // Validate required fields
    if (!data.leadId || typeof data.leadId !== 'string') {
      return NextResponse.json({ error: 'leadId is required.' }, { status: 400 })
    }
    if (data.type && !VALID_TYPES.has(data.type)) {
      return NextResponse.json({ error: 'Invalid outreach type.' }, { status: 400 })
    }
    if (data.status && !VALID_STATUSES.has(data.status)) {
      return NextResponse.json({ error: 'Invalid outreach status.' }, { status: 400 })
    }

    // Whitelist fields — prevent mass assignment
    const cleanData: Record<string, unknown> = { userId: session.id }
    for (const field of ALLOWED_OUTREACH_FIELDS) {
      if (data[field] !== undefined) {
        cleanData[field] = field === 'body' || field === 'subject'
          ? sanitizeString(String(data[field]))
          : data[field]
      }
    }

    const outreach = await db.outreach.create({
      data: {
        ...cleanData,
        sentAt: cleanData.status === 'SENT' ? new Date() : null,
      } as Parameters<typeof db.outreach.create>[0]['data'],
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
    console.error('[OUTREACH POST ERROR]', e)
    return NextResponse.json({ error: 'Failed to create outreach.' }, { status: 500 })
  }
}