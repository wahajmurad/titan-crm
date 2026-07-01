import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiGenerateEmail } from '@/lib/ai'

// POST /api/ai/email — generate personalized outreach email
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { leadId, companyName, website, industry, decisionMaker, auditFindings, opportunities, tone } = body

    // If leadId provided, fetch lead + business + audit data
    let resolvedCompany = companyName
    let resolvedWebsite = website
    let resolvedIndustry = industry
    let resolvedDecisionMaker = decisionMaker
    let resolvedAuditFindings = auditFindings
    let resolvedOpportunities = opportunities

    if (leadId) {
      const lead = await db.lead.findUnique({
        where: { id: leadId },
        include: {
          business: true,
        },
      })

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }

      resolvedCompany = resolvedCompany || lead.business.name
      resolvedWebsite = resolvedWebsite || lead.business.website || undefined
      resolvedIndustry = resolvedIndustry || lead.business.industry || undefined
      resolvedDecisionMaker = resolvedDecisionMaker || lead.decisionMaker || undefined
    }

    if (!resolvedCompany?.trim()) {
      return NextResponse.json({ error: 'Company name is required (provide companyName or leadId)' }, { status: 400 })
    }

    // Fetch audit findings if not provided and we have a website
    if (!resolvedAuditFindings && resolvedWebsite) {
      try {
        const hostname = new URL(resolvedWebsite).hostname.replace(/^www\./, '')
        if (hostname) {
          const audit = await db.websiteAudit.findFirst({
            where: { url: { contains: hostname } },
          })
          if (audit) {
            resolvedAuditFindings = [
              audit.uiDetails,
              audit.uxDetails,
              audit.seoDetails,
              audit.performanceDetails,
              audit.accessibilityDetails,
              audit.mobileDetails,
              audit.securityDetails,
              audit.aiReadinessDetails,
              audit.automationDetails,
              audit.conversionDetails,
              audit.problemsFound,
            ].filter(Boolean).join('\n\n')
            resolvedOpportunities = resolvedOpportunities || audit.opportunities || undefined
          }
        }
      } catch {
        // Invalid URL format — skip audit lookup, continue with email generation
      }
    }

    const rawResult = await aiGenerateEmail({
      companyName: resolvedCompany,
      website: resolvedWebsite,
      industry: resolvedIndustry,
      decisionMaker: resolvedDecisionMaker,
      auditFindings: resolvedAuditFindings,
      opportunities: resolvedOpportunities,
      tone: tone || 'professional',
    })

    // Parse the AI response — handle markdown code fences
    let parsed: { subject?: string; body?: string }
    try {
      const cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      // If JSON parsing fails, extract subject from the raw text or provide a fallback
      parsed = {
        subject: `AI-Generated Outreach for ${resolvedCompany}`,
        body: rawResult,
      }
    }

    return NextResponse.json({
      subject: parsed.subject || 'No Subject',
      body: parsed.body || rawResult,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}