import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sanitizeString } from '@/lib/types'
import { LEAD_STAGES, LEAD_TEMPERATURE } from '@/lib/types'

const VALID_STAGES = new Set(LEAD_STAGES)
const VALID_TEMPS = new Set(LEAD_TEMPERATURE)

// Fields allowed to be updated on a lead
const ALLOWED_LEAD_FIELDS = ['stage', 'temperature', 'score', 'decisionMaker', 'decisionMakerEmail', 'decisionMakerTitle', 'notes', 'assignedToId', 'source', 'status']

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
  } catch (e) {
    console.error('[LEADS ID GET ERROR]', e)
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 })
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

    // Whitelist lead fields to prevent mass assignment
    const updateData: Record<string, unknown> = {}
    for (const field of ALLOWED_LEAD_FIELDS) {
      if (leadData[field] !== undefined) {
        if (field === 'stage') {
          if (!VALID_STAGES.has(leadData[field])) continue
        }
        if (field === 'temperature') {
          if (!VALID_TEMPS.has(leadData[field])) continue
        }
        if (typeof leadData[field] === 'string') {
          updateData[field] = sanitizeString(leadData[field])
        } else {
          updateData[field] = leadData[field]
        }
      }
    }

    // Whitelist business fields
    if (business && typeof business === 'object') {
      const ALLOWED_BIZ_FIELDS = ['name', 'website', 'email', 'phone', 'country', 'city', 'industry', 'employees', 'revenue', 'description', 'logo']
      const bizUpdate: Record<string, unknown> = {}
      for (const field of ALLOWED_BIZ_FIELDS) {
        if (business[field] !== undefined) {
          bizUpdate[field] = typeof business[field] === 'string'
            ? sanitizeString(business[field])
            : business[field]
        }
      }
      if (Object.keys(bizUpdate).length > 0) {
        await db.business.update({ where: { id: oldLead.businessId }, data: bizUpdate })
      }
    }

    if (updateData.stage && updateData.stage !== oldLead.stage) {
      await db.activity.create({
        data: {
          userId: session.id,
          leadId: id,
          action: 'STAGE_CHANGED',
          details: `Stage changed from ${oldLead.stage} to ${updateData.stage}`,
        },
      })
    }

    const lead = await db.lead.update({
      where: { id },
      data: updateData,
      include: { business: true, assignedTo: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ lead })
  } catch (e) {
    console.error('[LEADS ID PATCH ERROR]', e)
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 })
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
  } catch (e) {
    console.error('[LEADS ID DELETE ERROR]', e)
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 })
  }
}