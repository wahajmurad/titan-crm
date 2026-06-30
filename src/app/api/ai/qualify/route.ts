import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiQualifyLead } from '@/lib/ai'

// POST /api/ai/qualify — qualify a lead using AI
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { leadId } = await req.json()

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    // Fetch lead with business and optional audit
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        business: true,
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get audit score if available
    let auditScore: number | undefined
    if (lead.businessId) {
      const audit = await db.websiteAudit.findUnique({
        where: { businessId: lead.businessId },
        select: { overallScore: true },
      })
      if (audit) auditScore = audit.overallScore
    }

    const rawResult = await aiQualifyLead({
      companyName: lead.business.name,
      industry: lead.business.industry || undefined,
      website: lead.business.website || undefined,
      companySize: lead.business.companySize || undefined,
      auditScore,
    })

    // Parse the AI response
    let parsed: Record<string, unknown>
    try {
      const cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse qualification results from AI', raw: rawResult }, { status: 500 })
    }

    const overallScore = typeof parsed.overallScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.overallScore)))
      : 0

    const temperature = ['HOT', 'WARM', 'COLD'].includes(String(parsed.temperature || ''))
      ? String(parsed.temperature)
      : overallScore >= 70 ? 'HOT' : overallScore >= 40 ? 'WARM' : 'COLD'

    // Update the lead with qualification data
    const updatedLead = await db.lead.update({
      where: { id: leadId },
      data: {
        qualificationScore: overallScore,
        temperature,
        score: overallScore,
        aiAnalysis: JSON.stringify(parsed),
        stage: lead.stage === 'DISCOVERED' || lead.stage === 'AUDITED' ? 'QUALIFIED' : lead.stage,
      },
      include: { business: true },
    })

    await db.activity.create({
      data: {
        userId: session.id,
        leadId,
        action: 'LEAD_QUALIFIED',
        details: `Lead qualified: ${overallScore}/100 (${temperature}) — ${lead.business.name}`,
      },
    })

    return NextResponse.json({
      lead: updatedLead,
      scores: parsed,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}