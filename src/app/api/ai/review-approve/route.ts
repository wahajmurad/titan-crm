import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════════════
// REVIEW & APPROVE — Human-in-the-Loop for Personalized Outreach
// Philosophy: AI generates, Human approves. Never send without review.
// ═══════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, leadId, emailSubject, emailBody, linkedinStrategy, reviewNotes } = await req.json()

    if (action === 'approve' && leadId) {
      const lead = await db.lead.findUnique({
        where: { id: leadId },
        include: { business: true },
      })
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

      const subject = emailSubject || 'Personalized Outreach'
      const body = emailBody || ''

      const outreach = await db.outreach.create({
        data: {
          leadId,
          subject,
          body,
          type: 'INITIAL',
          status: 'SENT',
          sentAt: new Date(),
          campaignId: lead.campaignId || null,
        },
      })

      await db.lead.update({
        where: { id: leadId },
        data: {
          stage: 'OUTREACH_SENT',
          aiAnalysis: reviewNotes
            ? `Approved by ${session.name}. Notes: ${reviewNotes}`
            : `Approved by ${session.name}. Personalized outreach sent.`,
        },
      })

      await db.activity.create({
        data: {
          userId: session.id,
          leadId,
          action: 'OUTREACH_APPROVED',
          details: `Personalized outreach approved and sent to ${lead.business.name}. Review: ${reviewNotes || 'Auto-approved'}`,
        },
      })

      try {
        await db.aIMemory.upsert({
          where: { category_key: { category: 'email_performance', key: `approved_${lead.business.industry || 'general'}` } },
          create: {
            category: 'email_performance',
            key: `approved_${lead.business.industry || 'general'}`,
            value: JSON.stringify({ count: 1, lastApproved: new Date().toISOString(), industry: lead.business.industry }),
            confidence: 0.6,
            source: 'auto',
          },
          update: {
            value: JSON.stringify({ count: 1, lastApproved: new Date().toISOString(), industry: lead.business.industry }),
            confidence: 0.7,
          },
        })
      } catch { /* skip */ }

      return NextResponse.json({
        success: true,
        outreachId: outreach.id,
        message: `Outreach approved and recorded for ${lead.business.name}`,
      })
    }

    if (action === 'reject' && leadId) {
      const lead = await db.lead.findUnique({ where: { id: leadId }, include: { business: true } })
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

      await db.activity.create({
        data: {
          userId: session.id,
          leadId,
          action: 'OUTREACH_REJECTED',
          details: `Personalized outreach rejected for ${lead.business.name}. Reason: ${reviewNotes || 'No reason provided'}`,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Outreach rejected for ${lead.business.name}`,
      })
    }

    if (action === 'edit' && leadId) {
      const subject = emailSubject || 'Edited Outreach'
      const body = emailBody || ''

      const outreach = await db.outreach.create({
        data: {
          leadId,
          subject,
          body,
          type: 'INITIAL',
          status: 'DRAFT',
        },
      })

      await db.activity.create({
        data: {
          userId: session.id,
          leadId,
          action: 'OUTREACH_EDITED',
          details: `Personalized outreach edited for review`,
        },
      })

      return NextResponse.json({
        success: true,
        outreachId: outreach.id,
        message: 'Edited outreach saved as draft',
      })
    }

    if (action === 'save_linkedin' && leadId && linkedinStrategy) {
      const lead = await db.lead.findUnique({ where: { id: leadId }, include: { business: true } })
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

      await db.activity.create({
        data: {
          userId: session.id,
          leadId,
          action: 'LINKEDIN_STRATEGY_SAVED',
          details: `LinkedIn outreach strategy saved for ${lead.business.name}`,
        },
      })

      await db.generatedAsset.create({
        data: {
          businessId: lead.businessId,
          leadId,
          type: 'sales_pitch',
          title: `LinkedIn Strategy — ${lead.business.name}`,
          content: JSON.stringify(linkedinStrategy),
        },
      })

      return NextResponse.json({
        success: true,
        message: `LinkedIn strategy saved for ${lead.business.name}`,
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use: approve, reject, edit, save_linkedin' }, { status: 400 })
  } catch (e) {
    console.error('[AI REVIEW APPROVE POST ERROR]', e)
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 })
  }
}