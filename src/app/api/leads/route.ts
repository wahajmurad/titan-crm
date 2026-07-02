import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.leads?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortDir = searchParams.get('sortDir') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (stage) where.stage = stage
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
    console.error('Leads GET error:', e)
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.leads?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()
    const { business, ...leadData } = data

    const createdBusiness = await db.business.create({ data: business })

    const lead = await db.lead.create({
      data: {
        ...leadData,
        businessId: createdBusiness.id,
      },
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
    console.error('Leads POST error:', e)
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
  }
}