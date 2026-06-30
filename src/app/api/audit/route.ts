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

    const { url, businessId, businessName } = await req.json()

    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const normalizedUrl = url.trim().replace(/\/+$/, '')
    const auditPrompt = `You are a senior website auditor. Analyze this website comprehensively and return ONLY a valid JSON object (no markdown, no code fences, no commentary) with this exact structure:

{
  "designScore": <0-100 integer>,
  "technicalScore": <0-100 integer>,
  "businessScore": <0-100 integer>,
  "automationScore": <0-100 integer>,
  "designDetails": "Detailed analysis covering: visual design quality (colors, typography, spacing), UI consistency, mobile responsiveness, image quality, branding, navigation clarity, call-to-button design, overall professionalism. List specific problems found with -5 to -10 point deductions each.",
  "technicalDetails": "Detailed analysis covering: page load speed indicators, SEO (meta titles, descriptions, headings H1-H3, alt text on images, schema markup, sitemap, robots.txt), security (HTTPS, content security headers), accessibility (contrast, keyboard nav, ARIA labels), mobile-friendliness, broken links indicators, code quality hints. List specific problems found with -5 to -10 point deductions each.",
  "businessDetails": "Detailed analysis covering: value proposition clarity, lead capture forms (contact forms, newsletter signups), trust signals (testimonials, reviews, case studies, client logos, certifications), pricing transparency, social proof, content quality, blog presence, call-to-action effectiveness, unique selling proposition. List specific problems found with -5 to -10 point deductions each.",
  "automationDetails": "Detailed analysis covering: chatbot/live chat presence, CRM indicators, email marketing signup, marketing automation tools, social media integration, analytics presence, AI features, booking/scheduling systems, automation opportunities. List specific problems found with -5 to -10 point deductions each.",
  "opportunities": "Provide 6-8 specific, actionable opportunities. Format: numbered list. Each must include: the current gap observed, the potential solution we could offer, and estimated business impact.",
  "recommendations": "Provide 6-8 prioritized recommendations. Format: numbered list. Order by business impact. Include specific implementation suggestions.",
  "talkingPoints": "Provide 8-10 sales conversation talking points. Format: numbered list. Each must reference a SPECIFIC finding from this audit. Connect each problem to a concrete service we provide. Make them conversational and compelling."
}

Scoring guidelines:
- 90-100: Exceptional, 70-89: Good, 50-69: Average, 30-49: Below Average, 0-29: Poor
- Be honest and critical. Most real websites score between 35-65.
- Start at 80 and deduct points for each specific problem found.
- Every deduction must be explained in the details.

Website URL: ${normalizedUrl}`

    const rawResult = await aiAnalyzeWebsite(normalizedUrl, auditPrompt)

    // Parse the AI response
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

    // Resolve or create business record
    let resolvedBusinessId = businessId

    if (!resolvedBusinessId) {
      // Try to find existing business by website
      let domain = ''
      try {
        domain = new URL(normalizedUrl).hostname.replace(/^www\./, '')
      } catch {
        domain = normalizedUrl
      }

      const existing = await db.business.findFirst({
        where: { website: { contains: domain } },
      })

      if (existing) {
        resolvedBusinessId = existing.id
      } else {
        // Create a new business record
        const newBusiness = await db.business.create({
          data: {
            name: businessName || domain,
            website: normalizedUrl,
            source: 'MANUAL_AUDIT',
          },
        })
        resolvedBusinessId = newBusiness.id

        // Also create a lead for this business
        await db.lead.create({
          data: {
            businessId: newBusiness.id,
            stage: 'DISCOVERED',
            assignedToId: session.id,
          },
        })
      }
    } else {
      // Verify business exists
      const biz = await db.business.findUnique({ where: { id: businessId } })
      if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 })
      resolvedBusinessId = biz.id
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

    // Update the lead stage to AUDITED
    await db.lead.updateMany({
      where: { businessId: resolvedBusinessId, stage: 'DISCOVERED' },
      data: { stage: 'AUDITED' },
    })

    await db.activity.create({
      data: {
        userId: session.id,
        leadId: (await db.lead.findFirst({ where: { businessId: resolvedBusinessId }, select: { id: true } }))?.id || null,
        action: 'AUDIT_COMPLETED',
        details: `Website audit completed for ${normalizedUrl} — overall score: ${overallScore}/100`,
      },
    })

    // Parse string fields into arrays for the frontend
    const parseList = (text: string): string[] => {
      if (!text) return []
      return text.split('\n').map((line) => line.replace(/^\d+[\.\)\-]\s*/, '').trim()).filter((line) => line.length > 0)
    }

    // Extract domain for frontend
    let domain = ''
    try { domain = new URL(normalizedUrl).hostname } catch { domain = normalizedUrl }

    return NextResponse.json({
      id: audit.id,
      domain,
      url: audit.url,
      scores: {
        design: audit.designScore,
        technical: audit.technicalScore,
        business: audit.businessScore,
        automation: audit.automationScore,
        overall: audit.overallScore,
      },
      details: {
        design: audit.designDetails,
        technical: audit.technicalDetails,
        business: audit.businessDetails,
        automation: audit.automationDetails,
      },
      opportunities: parseList(audit.opportunities || ''),
      recommendations: parseList(audit.recommendations || ''),
      talkingPoints: parseList(audit.talkingPoints || ''),
      createdAt: audit.createdAt,
    }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/audit — list all audits or get one by businessId/id
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.audit?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get('businessId')
    const id = searchParams.get('id')

    // Get single audit
    if (businessId || id) {
      const audit = await db.websiteAudit.findUnique({
        where: businessId ? { businessId } : { id: id! },
        include: {
          business: {
            include: {
              lead: { select: { id: true } },
            },
          },
        },
      })

      if (!audit) {
        return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
      }

      let domain = ''
      try { domain = new URL(audit.url).hostname } catch { domain = audit.url }

      const parseList = (text: string): string[] => {
        if (!text) return []
        return text.split('\n').map((line) => line.replace(/^\d+[\.\)\-]\s*/, '').trim()).filter((line) => line.length > 0)
      }

      return NextResponse.json({
        id: audit.id,
        domain,
        url: audit.url,
        scores: {
          design: audit.designScore,
          technical: audit.technicalScore,
          business: audit.businessScore,
          automation: audit.automationScore,
          overall: audit.overallScore,
        },
        details: {
          design: audit.designDetails,
          technical: audit.technicalDetails,
          business: audit.businessDetails,
          automation: audit.automationDetails,
        },
        opportunities: parseList(audit.opportunities || ''),
        recommendations: parseList(audit.recommendations || ''),
        talkingPoints: parseList(audit.talkingPoints || ''),
        createdAt: audit.createdAt,
      })
    }

    // List all audits (recent 20)
    const audits = await db.websiteAudit.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        business: {
          include: {
            lead: {
              select: { id: true, business: { select: { name: true } } },
            },
          },
        },
      },
    })

    const parseList = (text: string): string[] => {
      if (!text) return []
      return text.split('\n').map((line) => line.replace(/^\d+[\.\)\-]\s*/, '').trim()).filter((line) => line.length > 0)
    }

    const result = audits.map((audit) => {
      let domain = ''
      try { domain = new URL(audit.url).hostname } catch { domain = audit.url }

      return {
        id: audit.id,
        domain,
        url: audit.url,
        scores: {
          design: audit.designScore,
          technical: audit.technicalScore,
          business: audit.businessScore,
          automation: audit.automationScore,
          overall: audit.overallScore,
        },
        createdAt: audit.updatedAt.toISOString(),
        lead: audit.business.lead ? {
          id: audit.business.lead.id,
          business: { name: audit.business.name },
        } : null,
      }
    })

    return NextResponse.json({ audits: result })
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