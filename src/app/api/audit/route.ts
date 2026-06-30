import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiAnalyzeWebsite } from '@/lib/ai'

// POST /api/audit — run website audit for a business
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.audit?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { url, businessId } = await req.json()

    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const normalizedUrl = url.trim().replace(/\/+$/, '')
    const auditPrompt = `Analyze this website comprehensively and return a JSON object with the following structure. Be thorough and specific in your findings.

{
  "designScore": <0-100>,
  "technicalScore": <0-100>,
  "businessScore": <0-100>,
  "automationScore": <0-100>,
  "designDetails": "Detailed analysis of UI quality, UX flow, visual branding consistency, color scheme, typography, imagery, layout quality, mobile responsiveness, and overall design professionalism. Include specific issues found and improvements needed.",
  "technicalDetails": "Detailed analysis of page load performance, Core Web Vitals potential, SEO implementation (meta tags, headings, structured data, sitemap, robots.txt), security (HTTPS, headers, forms), accessibility (WCAG compliance, alt text, keyboard navigation, contrast ratios), and code quality indicators.",
  "businessDetails": "Detailed analysis of lead capture mechanisms (forms, CTAs, landing pages), conversion funnel effectiveness, trust signals (testimonials, case studies, certifications, client logos), value proposition clarity, pricing transparency, and overall business communication quality.",
  "automationDetails": "Detailed analysis of AI readiness and integration opportunities, CRM implementation indicators, chatbot or live chat presence, email marketing automation potential, workflow automation opportunities, marketing automation tools detected, and overall digital maturity.",
  "opportunities": "List 5-8 specific, actionable business opportunities where our AI and automation services could help this company. For each opportunity, explain the current gap and the potential value. Format as a numbered list.",
  "recommendations": "List 5-8 prioritized recommendations for improving their online presence and digital strategy. Order by impact. Format as a numbered list.",
  "talkingPoints": "Provide 6-10 specific talking points for a sales conversation, referencing actual findings from this audit. Each point should connect an observed weakness or opportunity to a concrete service we could provide. Make them conversational and compelling."
}

Scoring guidelines:
- Design (UI/UX/Branding/Mobile): 90-100 = exceptional, 70-89 = good, 50-69 = average, 30-49 = below average, 0-29 = poor
- Technical (Performance/SEO/Security/Accessibility): Same scale
- Business (Lead Capture/Conversion/Trust): Same scale  
- Automation (AI/CRM/Chatbot/Email Automation): Same scale

Be specific. Reference actual elements you observe. Do not be generic.`

    const rawResult = await aiAnalyzeWebsite(normalizedUrl, auditPrompt)

    // Parse the AI response — handle potential markdown code fences
    let parsed: Record<string, unknown>
    try {
      const cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse audit results from AI', raw: rawResult }, { status: 500 })
    }

    const designScore = clampScore(parsed.designScore)
    const technicalScore = clampScore(parsed.technicalScore)
    const businessScore = clampScore(parsed.businessScore)
    const automationScore = clampScore(parsed.automationScore)
    const overallScore = Math.round((designScore + technicalScore + businessScore + automationScore) / 4)

    // If businessId provided, verify it exists
    let resolvedBusinessId = businessId
    if (businessId) {
      const biz = await db.business.findUnique({ where: { id: businessId } })
      if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 })
      resolvedBusinessId = biz.id
    }

    if (!resolvedBusinessId) {
      return NextResponse.json({ error: 'businessId is required to save audit results' }, { status: 400 })
    }

    // Upsert the audit (one audit per business)
    const audit = await db.websiteAudit.upsert({
      where: { businessId: resolvedBusinessId },
      update: {
        url: normalizedUrl,
        designScore,
        technicalScore,
        businessScore,
        automationScore,
        overallScore,
        designDetails: String(parsed.designDetails || ''),
        technicalDetails: String(parsed.technicalDetails || ''),
        businessDetails: String(parsed.businessDetails || ''),
        automationDetails: String(parsed.automationDetails || ''),
        opportunities: String(parsed.opportunities || ''),
        recommendations: String(parsed.recommendations || ''),
        talkingPoints: String(parsed.talkingPoints || ''),
        updatedAt: new Date(),
      },
      create: {
        businessId: resolvedBusinessId,
        url: normalizedUrl,
        designScore,
        technicalScore,
        businessScore,
        automationScore,
        overallScore,
        designDetails: String(parsed.designDetails || ''),
        technicalDetails: String(parsed.technicalDetails || ''),
        businessDetails: String(parsed.businessDetails || ''),
        automationDetails: String(parsed.automationDetails || ''),
        opportunities: String(parsed.opportunities || ''),
        recommendations: String(parsed.recommendations || ''),
        talkingPoints: String(parsed.talkingPoints || ''),
      },
    })

    // Update the lead stage to AUDITED if there's a lead for this business
    await db.lead.updateMany({
      where: { businessId: resolvedBusinessId, stage: 'DISCOVERED' },
      data: { stage: 'AUDITED' },
    })

    await db.activity.create({
      data: {
        userId: session.id,
        leadId: (await db.lead.findUnique({ where: { businessId: resolvedBusinessId }, select: { id: true } }))?.id || null,
        action: 'AUDIT_COMPLETED',
        details: `Website audit completed for ${normalizedUrl} — overall score: ${overallScore}/100`,
      },
    })

    return NextResponse.json({ audit }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/audit — get audit by businessId
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.audit?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'businessId query parameter is required' }, { status: 400 })
    }

    const audit = await db.websiteAudit.findUnique({
      where: { businessId },
    })

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found for this business' }, { status: 404 })
    }

    return NextResponse.json({ audit })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function clampScore(value: unknown): number {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  if (isNaN(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}