import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiCompanyIntelligence, aiGenerateSolutions, aiGenerateOffer } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'intelligence'

    const body = await req.json()
    const { leadId, companyName, website, industry, location, decisionMaker, problems, auditFindings, opportunities, solutions, estimatedDealSize } = body

    let resolvedCompany = companyName
    let resolvedWebsite = website
    let resolvedIndustry = industry
    let resolvedLocation = location
    let resolvedDecisionMaker = decisionMaker
    let resolvedProblems = problems
    let resolvedAuditFindings = auditFindings
    let resolvedOpportunities = opportunities
    let resolvedSolutions = solutions

    if (leadId) {
      const lead = await db.lead.findUnique({
        where: { id: leadId },
        include: { business: true },
      })
      if (lead) {
        resolvedCompany = resolvedCompany || lead.business?.name
        resolvedWebsite = resolvedWebsite || lead.business?.website || undefined
        resolvedIndustry = resolvedIndustry || lead.business?.industry || undefined
        resolvedLocation = resolvedLocation || lead.business?.city || undefined
        resolvedDecisionMaker = resolvedDecisionMaker || lead.decisionMaker || undefined
        resolvedProblems = resolvedProblems || lead.problems || undefined
      }

      if (resolvedWebsite) {
        try {
          const hostname = resolvedWebsite.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
          const audit = await db.websiteAudit.findFirst({
            where: { url: { contains: hostname } },
          })
          if (audit) {
            resolvedAuditFindings = resolvedAuditFindings || [
              audit.uiDetails, audit.uxDetails, audit.seoDetails, audit.performanceDetails,
              audit.accessibilityDetails, audit.mobileDetails, audit.securityDetails,
              audit.aiReadinessDetails, audit.automationDetails, audit.conversionDetails,
              audit.problemsFound,
            ].filter(Boolean).join('\n\n')
            resolvedOpportunities = resolvedOpportunities || audit.opportunities || undefined
          }
        } catch { /* skip audit lookup on invalid URL */ }
      }
    }

    if (!resolvedCompany?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    let rawResult: string

    if (type === 'solutions') {
      rawResult = await aiGenerateSolutions({
        companyName: resolvedCompany,
        website: resolvedWebsite,
        industry: resolvedIndustry,
        problems: resolvedProblems,
        auditFindings: resolvedAuditFindings,
        opportunities: resolvedOpportunities,
      })
    } else if (type === 'offer') {
      rawResult = await aiGenerateOffer({
        companyName: resolvedCompany,
        industry: resolvedIndustry,
        decisionMaker: resolvedDecisionMaker,
        solutions: resolvedSolutions,
        auditFindings: resolvedAuditFindings,
        estimatedDealSize,
      })
    } else {
      rawResult = await aiCompanyIntelligence({
        companyName: resolvedCompany,
        website: resolvedWebsite,
        industry: resolvedIndustry,
        location: resolvedLocation,
      })
    }

    // Parse JSON from AI response
    let parsed: Record<string, unknown>
    try {
      const cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      const match = rawResult.match(/\{[\s\S]*\}/)
      if (match) {
        try { parsed = JSON.parse(match[0]) } catch { parsed = { raw: rawResult } }
      } else {
        parsed = { raw: rawResult }
      }
    }

    return NextResponse.json(parsed)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}