import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiChat } from '@/lib/ai'

// ---------- Types ----------

interface QualifyRequestBody {
  businessId: string
  companyName?: string
  industry?: string
  website?: string
  companySize?: string
  auditScore?: number
}

interface QualificationScores {
  businessQuality: number
  revenuePotential: number
  aiReadiness: number
  automationPotential: number
  websiteQuality: number
  conversionProbability: number
}

interface QualificationReasoning {
  businessQuality: string
  revenuePotential: string
  aiReadiness: string
  automationPotential: string
  websiteQuality: string
  conversionProbability: string
}

interface QualificationResult {
  scores: QualificationScores
  reasoning: QualificationReasoning
  overallScore: number
  temperature: string
  estimatedDealSize: string
  summary: string
  keyInsights: string[]
  pitchAngle: string
}

const SCORE_KEYS = [
  'businessQuality',
  'revenuePotential',
  'aiReadiness',
  'automationPotential',
  'websiteQuality',
  'conversionProbability',
] as const

// ---------- Helpers ----------

function clampScore(v: unknown): number {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10)
  if (isNaN(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function deriveTemperature(overallScore: number): string {
  if (overallScore >= 70) return 'HOT'
  if (overallScore >= 40) return 'WARM'
  return 'COLD'
}

function buildQualificationPrompt(context: {
  companyName: string
  industry: string
  website: string
  companySize: string
  city: string
  country: string
  auditScore: number | null
  auditDetails: {
    overallScore: number
    uiScore: number
    uxScore: number
    seoScore: number
    performanceScore: number
    accessibilityScore: number
    mobileScore: number
    securityScore: number
    aiReadinessScore: number
    automationScore: number
    conversionScore: number
    problemsFound: string | null
    opportunities: string | null
    recommendations: string | null
    executiveSummary: string | null
  } | null
}): { role: string; content: string }[] {
  const { companyName, industry, website, companySize, city, country, auditScore, auditDetails } = context

  const businessContext = `
**Company Profile**
- Company Name: ${companyName}
- Industry: ${industry || 'Unknown'}
- Website: ${website || 'Not available'}
- Company Size: ${companySize || 'Unknown'}
- Location: ${city ? `${city}, ${country || ''}`.trim() : country || 'Unknown'}
- Website Audit Score: ${auditScore !== null ? auditScore + '/100' : 'Not yet audited'}
`.trim()

  const auditContext = auditDetails
    ? `
**Website Audit Breakdown** (scores out of 100)
- UI Design: ${auditDetails.uiScore}
- UX / Usability: ${auditDetails.uxScore}
- SEO: ${auditDetails.seoScore}
- Performance: ${auditDetails.performanceScore}
- Accessibility: ${auditDetails.accessibilityScore}
- Mobile Optimization: ${auditDetails.mobileScore}
- Security: ${auditDetails.securityScore}
- AI Readiness: ${auditDetails.aiReadinessScore}
- Automation Score: ${auditDetails.automationScore}
- Conversion Potential: ${auditDetails.conversionScore}

**Audit Summary**: ${auditDetails.executiveSummary || 'N/A'}
**Problems Found**: ${auditDetails.problemsFound || 'N/A'}
**Opportunities Identified**: ${auditDetails.opportunities || 'N/A'}
**Recommendations**: ${auditDetails.recommendations || 'N/A'}
`.trim()
    : ''

  return [
    {
      role: 'system',
      content: `You are a world-class B2B lead qualification analyst. Your job is to evaluate companies as potential clients for an AI & automation consulting agency that sells AI integration, workflow automation, chatbots, data analytics, and digital transformation services.

You MUST score the lead across 6 categories (0–100) AND provide a detailed, specific 2–3 sentence reasoning for EVERY category. Your reasoning must reference concrete factors from the company profile and audit data — never be vague or generic.

**Scoring Criteria:**

1. **Business Quality** (0–100): Evaluate company reputation, market position, growth potential, financial health indicators, brand strength, and industry standing. Consider company size, industry maturity, and competitive landscape.

2. **Revenue Potential** (0–100): Estimate deal size based on company scale, upsell opportunities, contract value potential, recurring revenue possibilities, and expansion potential. Larger companies and those with more automation needs score higher.

3. **AI Readiness** (0–100): Assess current tech stack sophistication, data maturity, existing automation, digital transformation stage, engineering team capability, and openness to new technology. Companies further along in digital maturity score higher.

4. **Automation Potential** (0–100): Evaluate repetitive processes likely present, manual workflows that could be automated, scaling bottlenecks, operational complexity, and volume of routine tasks. Industries with high process repetition score higher.

5. **Website Quality** (0–100): Base this on the audit score if available. If no audit, infer from industry norms. A strong digital presence indicates investment in growth and higher conversion potential.

6. **Conversion Probability** (0–100): Assess pain level (urgent problems needing solving), budget awareness (do they invest in solutions?), decision-making speed, competitive pressure (are competitors ahead?), and timing readiness.

**Additional fields to include:**
- **overallScore**: Weighted average (Business Quality 20%, Revenue Potential 25%, AI Readiness 15%, Automation Potential 15%, Website Quality 10%, Conversion Probability 15%), rounded to nearest integer.
- **temperature**: "HOT" (≥70), "WARM" (40–69), "COLD" (<40)
- **estimatedDealSize**: Realistic USD range like "$2,000 – $8,000" or "$15,000 – $50,000"
- **summary**: 2–3 sentence executive summary of this lead's potential
- **keyInsights**: Array of exactly 3 specific, actionable insights about this lead
- **pitchAngle**: A specific, personalized angle to use when approaching this lead (1–2 sentences)

You MUST respond ONLY with valid JSON. No markdown, no code fences, no extra text.`,
    },
    {
      role: 'user',
      content: `Qualify this lead using the information below. Return ONLY valid JSON with this exact structure:

{
  "scores": {
    "businessQuality": <number 0-100>,
    "revenuePotential": <number 0-100>,
    "aiReadiness": <number 0-100>,
    "automationPotential": <number 0-100>,
    "websiteQuality": <number 0-100>,
    "conversionProbability": <number 0-100>
  },
  "reasoning": {
    "businessQuality": "<2-3 sentences explaining the score>",
    "revenuePotential": "<2-3 sentences explaining the score>",
    "aiReadiness": "<2-3 sentences explaining the score>",
    "automationPotential": "<2-3 sentences explaining the score>",
    "websiteQuality": "<2-3 sentences explaining the score>",
    "conversionProbability": "<2-3 sentences explaining the score>"
  },
  "overallScore": <number 0-100>,
  "temperature": "HOT|WARM|COLD",
  "estimatedDealSize": "$X,XXX – $Y,YYY",
  "summary": "<2-3 sentence executive summary>",
  "keyInsights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "pitchAngle": "<specific pitch angle>"
}

${businessContext}

${auditContext}

Now score this lead.`,
    },
  ]
}

// ---------- Route Handler ----------

// POST /api/ai/qualify — qualify a lead using AI with detailed reasoning
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: QualifyRequestBody = await req.json()
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 },
      )
    }

    // ── 1. Fetch business ────────────────────────────────────────────────
    const business = await db.business.findUnique({
      where: { id: businessId },
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 },
      )
    }

    // ── 2. Fetch latest website audit (if exists) ────────────────────────
    const audit = await db.websiteAudit.findUnique({
      where: { businessId: business.id },
    })

    // ── 3. Find associated Lead ───────────────────────────────────────────
    const lead = await db.lead.findUnique({
      where: { businessId: business.id },
    })

    // If no lead exists yet, create one so we can store qualification results
    let leadRecord = lead
    if (!leadRecord) {
      leadRecord = await db.lead.create({
        data: {
          businessId: business.id,
          stage: 'DISCOVERED',
        },
      })
    }

    // ── 4. Resolve field values (request overrides > DB values) ───────────
    const companyName = body.companyName || business.name
    const industry = body.industry || business.industry || 'Unknown'
    const website = body.website || business.website || ''
    const companySize = body.companySize || business.companySize || ''
    const city = business.city || ''
    const country = business.country || ''
    const auditScore = body.auditScore ?? (audit ? audit.overallScore : null)

    // Build audit details object if audit exists
    const auditDetails = audit
      ? {
          overallScore: audit.overallScore,
          uiScore: audit.uiScore,
          uxScore: audit.uxScore,
          seoScore: audit.seoScore,
          performanceScore: audit.performanceScore,
          accessibilityScore: audit.accessibilityScore,
          mobileScore: audit.mobileScore,
          securityScore: audit.securityScore,
          aiReadinessScore: audit.aiReadinessScore,
          automationScore: audit.automationScore,
          conversionScore: audit.conversionScore,
          problemsFound: audit.problemsFound,
          opportunities: audit.opportunities,
          recommendations: audit.recommendations,
          executiveSummary: audit.executiveSummary,
        }
      : null

    // ── 5. Call AI with comprehensive prompt ──────────────────────────────
    const messages = buildQualificationPrompt({
      companyName,
      industry,
      website,
      companySize,
      city,
      country,
      auditScore,
      auditDetails,
    })

    const rawResult = await aiChat(messages)

    // ── 6. Parse AI response ──────────────────────────────────────────────
    let parsed: Record<string, unknown>
    try {
      const cleaned = rawResult
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        {
          error: 'Failed to parse qualification results from AI',
          raw: rawResult,
        },
        { status: 500 },
      )
    }

    // ── 7. Validate & clamp scores ─────────────────────────────────────────
    const rawScores = (parsed.scores as Record<string, unknown>) || {}

    const scores: QualificationScores = {
      businessQuality: clampScore(rawScores.businessQuality),
      revenuePotential: clampScore(rawScores.revenuePotential),
      aiReadiness: clampScore(rawScores.aiReadiness),
      automationPotential: clampScore(rawScores.automationPotential),
      websiteQuality: clampScore(rawScores.websiteQuality),
      conversionProbability: clampScore(rawScores.conversionProbability),
    }

    // Validate reasoning — provide fallbacks if missing
    const rawReasoning = (parsed.reasoning as Record<string, string>) || {}
    const reasoning: QualificationReasoning = {
      businessQuality:
        rawReasoning.businessQuality ||
        'Insufficient data to evaluate business quality.',
      revenuePotential:
        rawReasoning.revenuePotential ||
        'Insufficient data to evaluate revenue potential.',
      aiReadiness:
        rawReasoning.aiReadiness ||
        'Insufficient data to evaluate AI readiness.',
      automationPotential:
        rawReasoning.automationPotential ||
        'Insufficient data to evaluate automation potential.',
      websiteQuality:
        rawReasoning.websiteQuality ||
        'Insufficient data to evaluate website quality.',
      conversionProbability:
        rawReasoning.conversionProbability ||
        'Insufficient data to evaluate conversion probability.',
    }

    // Overall score
    const overallScore = clampScore(parsed.overallScore)

    // Temperature
    const temperature = ['HOT', 'WARM', 'COLD'].includes(
      String(parsed.temperature || ''),
    )
      ? String(parsed.temperature)
      : deriveTemperature(overallScore)

    // Other fields with fallbacks
    const estimatedDealSize = String(parsed.estimatedDealSize || 'TBD')
    const summary = String(
      parsed.summary ||
        `${companyName} has been evaluated with an overall score of ${overallScore}/100. Further analysis recommended.`,
    )
    const keyInsights = Array.isArray(parsed.keyInsights)
      ? parsed.keyInsights.map(String).slice(0, 5)
      : ['No specific insights generated.']
    const pitchAngle = String(
      parsed.pitchAngle || 'Approach with a general value proposition highlighting AI and automation benefits.',
    )

    // ── 8. Build the complete result ──────────────────────────────────────
    const result: QualificationResult = {
      scores,
      reasoning,
      overallScore,
      temperature,
      estimatedDealSize,
      summary,
      keyInsights,
      pitchAngle,
    }

    // ── 9. Update Lead record ─────────────────────────────────────────────
    const shouldPromote =
      overallScore >= 60 &&
      (leadRecord.stage === 'DISCOVERED' || leadRecord.stage === 'AUDITED')

    await db.lead.update({
      where: { id: leadRecord.id },
      data: {
        qualificationScore: overallScore,
        temperature,
        score: overallScore,
        aiAnalysis: JSON.stringify(result),
        ...(shouldPromote ? { stage: 'QUALIFIED' } : {}),
      },
    })

    // ── 10. Log activity ──────────────────────────────────────────────────
    await db.activity.create({
      data: {
        userId: session.id,
        leadId: leadRecord.id,
        action: 'LEAD_QUALIFIED',
        details: `Lead qualified: ${overallScore}/100 (${temperature}) — ${companyName}. Deal estimate: ${estimatedDealSize}. ${summary.slice(0, 120)}`,
      },
    })

    // ── 11. Return response ───────────────────────────────────────────────
    return NextResponse.json({
      leadId: leadRecord.id,
      ...result,
    })
  } catch (e) {
    console.error('[AI QUALIFY POST ERROR]', e)
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 })
  }
}
