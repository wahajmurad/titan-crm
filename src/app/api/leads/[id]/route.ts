import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.leads?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        business: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        outreaches: { orderBy: { createdAt: 'desc' } },
        meetings: { orderBy: { date: 'desc' } },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
          take: 50,
        },
      },
    })

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    return NextResponse.json({ lead })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.leads?.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const data = await req.json()

    const oldLead = await db.lead.findUnique({ where: { id } })
    if (!oldLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const { business, ...leadData } = data

    const updateData: Record<string, unknown> = { ...leadData }

    if (business) {
      await db.business.update({ where: { id: oldLead.businessId }, data: business })
    }

    if (leadData.stage && leadData.stage !== oldLead.stage) {
      await db.activity.create({
        data: {
          userId: session.id,
          leadId: id,
          action: 'STAGE_CHANGED',
          details: `Stage changed from ${oldLead.stage} to ${leadData.stage}`,
        },
      })
    }

    const lead = await db.lead.update({
      where: { id },
      data: updateData,
      include: { business: true, assignedTo: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ lead })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.leads?.canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    await db.lead.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}