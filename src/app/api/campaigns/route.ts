import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/campaigns — list campaigns with counts, filter by status
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.campaigns?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (session.role === 'TEAM') where.ownerId = session.id

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true, avatar: true } },
          _count: { select: { leads: true, outreaches: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.campaign.count({ where }),
    ])

    return NextResponse.json({ campaigns, total, page, limit })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/campaigns — create campaign
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.campaigns?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()
    const { name, industry, targetLocation, targetCity, targetSize, serviceOffering, dailyLimit, aiModel, notes, status } = data

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }

    const campaign = await db.campaign.create({
      data: {
        name: name.trim(),
        industry: industry || null,
        targetLocation: targetLocation || null,
        targetCity: targetCity || null,
        targetSize: targetSize || null,
        serviceOffering: serviceOffering || null,
        dailyLimit: dailyLimit ?? 20,
        aiModel: aiModel || 'default',
        notes: notes || null,
        status: status || 'ACTIVE',
        ownerId: session.id,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { leads: true, outreaches: true } },
      },
    })

    await db.activity.create({
      data: {
        userId: session.id,
        action: 'CAMPAIGN_CREATED',
        details: `New campaign created: ${campaign.name}`,
      },
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH /api/campaigns — update campaign fields or increment counters
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.campaigns?.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()
    const { id, status, notes, name, industry, targetLocation, targetCity, targetSize, serviceOffering, dailyLimit, aiModel, increment } = data

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const existing = await db.campaign.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name.trim()
    if (industry !== undefined) updateData.industry = industry || null
    if (targetLocation !== undefined) updateData.targetLocation = targetLocation || null
    if (targetCity !== undefined) updateData.targetCity = targetCity || null
    if (targetSize !== undefined) updateData.targetSize = targetSize || null
    if (serviceOffering !== undefined) updateData.serviceOffering = serviceOffering || null
    if (dailyLimit !== undefined) updateData.dailyLimit = dailyLimit
    if (aiModel !== undefined) updateData.aiModel = aiModel
    if (notes !== undefined) updateData.notes = notes || null
    if (status !== undefined) updateData.status = status

    // Handle counter increments: { field: 'leadCount' | 'sentCount' | 'replyCount' | 'meetingCount' | 'wonCount', amount?: number }
    if (increment) {
      const counterField = increment.field
      const amount = increment.amount ?? 1
      if (['leadCount', 'sentCount', 'replyCount', 'meetingCount', 'wonCount'].includes(counterField)) {
        updateData[counterField] = { increment: amount }
      }
    }

    const campaign = await db.campaign.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { leads: true, outreaches: true } },
      },
    })

    await db.activity.create({
      data: {
        userId: session.id,
        action: 'CAMPAIGN_UPDATED',
        details: `Campaign "${campaign.name}" updated${status ? ` — status changed to ${status}` : ''}`,
      },
    })

    return NextResponse.json({ campaign })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}