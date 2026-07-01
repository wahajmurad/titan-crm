import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiChat } from '@/lib/ai'

// ═══════════════════════════════════════════════════════════════════
// AI GROWTH BLUEPRINT — 30 / 60 / 90 Day Plan
// Instead of saying "We can build this" — show the EXACT path
// ═══════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { leadId, companyName, industry, website, problems, solutions, auditFindings, opportunities, estimatedDealSize } = body

    // Resolve lead data
    let resolvedCompany = companyName
    let resolvedIndustry = industry
    let resolvedWebsite = website
    let resolvedProblems = problems
    let resolvedSolutions = solutions
    let resolvedAudit = auditFindings
    let resolvedOpps = opportunities
    let businessId: string | null = null

    if (leadId) {
      const lead = await db.lead.findUnique({
        where: { id: leadId },
        include: { business: true },
      })
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      businessId = lead.businessId
      resolvedCompany = resolvedCompany || lead.business.name
      resolvedIndustry = resolvedIndustry || lead.business.industry || undefined
      resolvedWebsite = resolvedWebsite || lead.business.website || undefined
    }

    // Fetch additional data from DB
    if (businessId) {
      const [intel, audit] = await Promise.all([
        db.companyIntel.findUnique({ where: { businessId } }).catch(() => null),
        db.websiteAudit.findUnique({ where: { businessId } }).catch(() => null),
      ])

      if (intel && !resolvedProblems) {
        resolvedProblems = intel.painPoints
        resolvedOpps = resolvedOpps || intel.aiOpportunities
      }
      if (audit && !resolvedAudit) {
        resolvedAudit = [
          'UI: ' + (audit.uiDetails || 'N/A'),
          'UX: ' + (audit.uxDetails || 'N/A'),
          'SEO: ' + (audit.seoDetails || 'N/A'),
          'Performance: ' + (audit.performanceDetails || 'N/A'),
          'AI Readiness: ' + (audit.aiReadinessDetails || 'N/A'),
          'Conversion: ' + (audit.conversionDetails || 'N/A'),
          audit.problemsFound,
          audit.opportunities,
        ].filter(Boolean).join('\n')
      }
    }

    if (!resolvedCompany?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const prompt = `You are a senior growth strategist creating a personalized 30/60/90 day AI Growth Blueprint for "${resolvedCompany}".
Industry: ${resolvedIndustry || 'Unknown'} | Website: ${resolvedWebsite || 'N/A'}
Estimated Deal Size: ${estimatedDealSize || 'Not specified'}

CURRENT SITUATION:
Problems: ${typeof resolvedProblems === 'string' ? resolvedProblems : JSON.stringify(resolvedProblems || [])}
Audit Findings: ${typeof resolvedAudit === 'string' ? resolvedAudit?.substring(0, 1500) : JSON.stringify(resolvedAudit || '')}
Opportunities: ${typeof resolvedOpps === 'string' ? resolvedOpps : JSON.stringify(resolvedOpps || [])}
Proposed Solutions: ${typeof resolvedSolutions === 'string' ? resolvedSolutions : JSON.stringify(resolvedSolutions || [])}

CRITICAL: This blueprint must be UNIQUE to this company. Reference their specific problems, industry, and situation.
Every recommendation should feel like a consultant spent hours analyzing their business.

Return JSON:
{
  "currentSituation": "2-3 paragraph honest assessment of where ${resolvedCompany} is right now",
  "problems": [
    {"problem": "specific problem", "impact": "business impact with estimated numbers", "priority": "Critical|High|Medium|Low"}
  ],
  "priorityImprovements": [
    {"improvement": "what to improve", "why": "why this first", "expectedResult": "specific expected result"}
  ],
  "thirtyDayPlan": {
    "focus": "primary focus for first 30 days",
    "actions": [
      {"action": "specific action item", "owner": "who does this", "deliverable": "what gets delivered", "successMetric": "how we measure success"}
    ],
    "expectedResults": "what they should see by day 30",
    "estimatedROI": "ROI estimate for this phase"
  },
  "sixtyDayPlan": {
    "focus": "primary focus for days 30-60",
    "actions": [
      {"action": "specific action item", "owner": "who does this", "deliverable": "what gets delivered", "successMetric": "how we measure success"}
    ],
    "expectedResults": "what they should see by day 60",
    "estimatedROI": "ROI estimate for this phase"
  },
  "ninetyDayPlan": {
    "focus": "primary focus for days 60-90",
    "actions": [
      {"action": "specific action item", "owner": "who does this", "deliverable": "what gets delivered", "successMetric": "how we measure success"}
    ],
    "expectedResults": "what they should see by day 90",
    "estimatedROI": "ROI estimate for this phase"
  },
  "recommendedAISolutions": [
    {"solution": "name", "description": "what it does specifically for this company", "category": "Customer Service|Automation|Analytics|Marketing|Operations|Sales", "implementationTime": "timeline", "expectedROI": "ROI range", "confidence": "High|Medium|Low"}
  ],
  "estimatedROI": {
    "potentialRevenueIncrease": "conservative estimate range",
    "potentialTimeSavings": "hours per week",
    "potentialCostReduction": "annual savings range",
    "potentialStaffHoursSaved": "hours per month",
    "potentialConversionImprovement": "percentage range",
    "paybackPeriod": "estimated time to ROI",
    "disclaimer": "All estimates are conservative projections based on industry benchmarks"
  },
  "riskAssessment": [
    {"risk": "potential risk", "mitigation": "how to mitigate", "likelihood": "High|Medium|Low"}
  ],
  "nextSteps": [
    "immediate next step 1",
    "immediate next step 2",
    "immediate next step 3"
  ]
}

Return valid JSON only. No markdown.`

    const rawResult = await aiChat(prompt, 0.5, 5000)

    let parsed: Record<string, unknown>
    try {
      const cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : { raw: rawResult }
    } catch {
      parsed = { raw: rawResult }
    }

    // Save as GeneratedAsset
    if (businessId) {
      await db.generatedAsset.create({
        data: {
          businessId,
          leadId: leadId || null,
          type: 'growth_blueprint',
          title: `Growth Blueprint — ${resolvedCompany}`,
          content: JSON.stringify(parsed),
        },
      })
    }

    return NextResponse.json({
      success: true,
      companyName: resolvedCompany,
      ...parsed,
    })
  } catch (err) {
    console.error('[Growth Blueprint]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate growth blueprint' }, { status: 500 })
  }
}