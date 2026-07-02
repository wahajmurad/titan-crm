import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sanitizeString } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.leads?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')
    const search = searchParams.get('search')
    // Only allow known sortable fields to prevent injection
    const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'temperature', 'stage', 'score'])
    const sortBy = ALLOWED_SORT_FIELDS.has(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'updatedAt'
    const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50))

    const where: Record<string, unknown> = {}
    if (stage && ['DISCOVERED','AUDITED','QUALIFIED','OUTREACH_SENT','REPLIED','MEETING_BOOKED','PROPOSAL_SENT','WON','LOST'].includes(stage)) {
      where.stage = stage
    }
    if (search) {
      where.OR = [
        { business: { name: { contains: search } } },
        { business: { website: { contains: search } } },
        { business: { email: { contains: search } } },
        { decisionMaker: { contains: search } },
        { notes: { contains: search } },
      ]
    }
    if (session.role === 'TEAM') {
      where.assignedToId = session.id
    }

    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortDir

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        include: {
          business: true,
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { outreaches: true, meetings: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.lead.count({ where }),
    ])

    return NextResponse.json({ leads, total, page, limit })
  } catch (e: unknown) {
    console.error('[LEADS GET ERROR]', e)
    return NextResponse.json({ error: 'Failed to load leads.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.leads?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()
    const { business: bizData, ...leadData } = data

    if (!bizData || !bizData.name) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    // Whitelist business fields
    const ALLOWED_BIZ_FIELDS = ['name', 'website', 'email', 'phone', 'country', 'city', 'industry', 'employees', 'revenue', 'description', 'logo', 'source']
    const cleanBusiness: Record<string, unknown> = {}
    for (const field of ALLOWED_BIZ_FIELDS) {
      if (bizData[field] !== undefined) {
        cleanBusiness[field] = typeof bizData[field] === 'string'
          ? sanitizeString(bizData[field])
          : bizData[field]
      }
    }

    const createdBusiness = await db.business.create({ data: cleanBusiness as Parameters<typeof db.business.create>[0]['data'] })

    // Whitelist lead fields
    const ALLOWED_LEAD_FIELDS = ['stage', 'temperature', 'score', 'decisionMaker', 'decisionMakerEmail', 'decisionMakerTitle', 'notes', 'assignedToId', 'source', 'status']
    const cleanLead: Record<string, unknown> = { businessId: createdBusiness.id }
    for (const field of ALLOWED_LEAD_FIELDS) {
      if (leadData[field] !== undefined) {
        cleanLead[field] = typeof leadData[field] === 'string'
          ? sanitizeString(leadData[field])
          : leadData[field]
      }
    }

    const lead = await db.lead.create({
      data: cleanLead as Parameters<typeof db.lead.create>[0]['data'],
      include: { business: true, assignedTo: { select: { id: true, name: true } } },
    })

    await db.activity.create({
      data: {
        userId: session.id,
        leadId: lead.id,
        action: 'LEAD_CREATED',
        details: `New lead created: ${createdBusiness.name}`,
      },
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (e: unknown) {
    console.error('[LEADS POST ERROR]', e)
    return NextResponse.json({ error: 'Failed to create lead.' }, { status: 500 })
  }
}