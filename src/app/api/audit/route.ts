import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiAnalyzeWebsite } from '@/lib/ai'

// ── Helpers ────────────────────────────────────────────────────────────────

function clampScore(value: unknown): number {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  if (isNaN(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

// Normalize any value (string, array of strings, array of objects) to a clean string array
function normalizeList(val: unknown): string[] {
  if (!val) return []
  // Already an array
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (typeof item === 'object' && item !== null) {
          // Extract text from objects — try common keys
          const obj = item as Record<string, unknown>
          return String(obj.title || obj.text || obj.description || obj.point || obj.name || obj.content || JSON.stringify(obj)).trim()
        }
        return String(item).trim()
      })
      .filter((s) => s.length > 0 && !s.startsWith('[object'))
  }
  // String — try JSON parse first, then split by newlines
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) {
        return normalizeList(parsed)
      }
    } catch { /* not JSON, split by lines */ }
    return val
      .split('\n')
      .map((line) => line.replace(/^\d+[\.\)\-]\s*/, '').trim())
      .filter((line) => line.length > 0 && !line.startsWith('[object'))
  }
  return []
}

function parseList(text: string | null | undefined): string[] {
  return normalizeList(text)
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function extractFullHost(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

// ── Score fields ───────────────────────────────────────────────────────────

const SCORE_KEYS = [
  'uiScore',
  'uxScore',
  'seoScore',
  'performanceScore',
  'accessibilityScore',
  'mobileScore',
  'securityScore',
  'aiReadinessScore',
  'automationScore',
  'conversionScore',
] as const

type ScoreKey = (typeof SCORE_KEYS)[number]

const DETAIL_KEYS: Record<ScoreKey, string> = {
  uiScore: 'uiDetails',
  uxScore: 'uxDetails',
  seoScore: 'seoDetails',
  performanceScore: 'performanceDetails',
  accessibilityScore: 'accessibilityDetails',
  mobileScore: 'mobileDetails',
  securityScore: 'securityDetails',
  aiReadinessScore: 'aiReadinessDetails',
  automationScore: 'automationDetails',
  conversionScore: 'conversionDetails',
}

// ── AI Prompt ──────────────────────────────────────────────────────────────

function buildAuditPrompt(url: string): string {
  return `You are a world-class senior website auditor performing a comprehensive 10-category analysis. Analyze this website thoroughly and return ONLY a valid JSON object (no markdown, no code fences, no commentary) with this exact structure:

{
  "uiScore": <0-100 integer>,
  "uxScore": <0-100 integer>,
  "seoScore": <0-100 integer>,
  "performanceScore": <0-100 integer>,
  "accessibilityScore": <0-100 integer>,
  "mobileScore": <0-100 integer>,
  "securityScore": <0-100 integer>,
  "aiReadinessScore": <0-100 integer>,
  "automationScore": <0-100 integer>,
  "conversionScore": <0-100 integer>,
  "uiDetails": "<detailed analysis>",
  "uxDetails": "<detailed analysis>",
  "seoDetails": "<detailed analysis>",
  "performanceDetails": "<detailed analysis>",
  "accessibilityDetails": "<detailed analysis>",
  "mobileDetails": "<detailed analysis>",
  "securityDetails": "<detailed analysis>",
  "aiReadinessDetails": "<detailed analysis>",
  "automationDetails": "<detailed analysis>",
  "conversionDetails": "<detailed analysis>",
  "executiveSummary": "<2-3 paragraph executive summary of the website's overall digital presence, key strengths, and critical weaknesses>",
  "problemsFound": "1. First problem description here.\\n2. Second problem description here.\\n3. Third problem etc. Use numbered list as a SINGLE STRING, not an array.",
  "opportunities": "1. First opportunity here.\\n2. Second opportunity. Use numbered list as a SINGLE STRING.",
  "recommendations": "1. First recommendation.\\n2. Second. Use numbered list as a SINGLE STRING.",
  "pitchStrategy": "<A detailed sales pitch strategy paragraph explaining how to position services to this prospect based on the audit findings. Include suggested opener, value props tied to their weaknesses, and a suggested close.>",
  "talkingPoints": "1. First talking point.\\n2. Second talking point. Use numbered list as a SINGLE STRING."
}

SCORING METHODOLOGY — CRITICAL:
- For EACH category, start at 80 points.
- Deduct points for EVERY specific problem found (typically -3 to -10 per issue depending on severity).
- Explain EVERY deduction explicitly in the corresponding details field.
- A well-executed category may score 70-85. Most real websites score 35-65 per category.
- Exceptional: 90-100, Good: 70-89, Average: 50-69, Below Average: 30-49, Poor: 0-29.

CATEGORY ANALYSIS REQUIREMENTS:

1. uiScore — Visual Design (uiDetails):
   - Color palette harmony and brand consistency
   - Typography hierarchy, font choices, readability
   - Imagery quality, relevance, and professional look
   - Layout balance, whitespace usage, visual hierarchy
   - Icon and graphic design quality
   - Overall visual polish and professionalism

2. uxScore — User Experience (uxDetails):
   - Navigation clarity and ease of use
   - Information architecture and content organization
   - User flow and journey logic
   - Content readability and scannability
   - Error handling and user feedback
   - Intuitiveness for first-time visitors

3. seoScore — Search Engine Optimization (seoDetails):
   - Meta titles and descriptions (presence, quality, uniqueness)
   - Heading structure (H1-H3 hierarchy)
   - Schema markup / structured data
   - Sitemap and robots.txt presence
   - Alt text on images
   - URL structure, internal linking
   - Page speed as SEO factor

4. performanceScore — Performance (performanceDetails):
   - Load time indicators and perceived speed
   - Resource optimization (images, scripts, CSS)
   - Caching strategy indicators
   - Code quality hints (render blocking, unused resources)
   - Server response indicators

5. accessibilityScore — Accessibility (accessibilityDetails):
   - Color contrast ratios
   - Keyboard navigation support
   - ARIA labels and roles
   - Screen reader compatibility indicators
   - Focus management and visible focus states
   - Form label associations

6. mobileScore — Mobile Experience (mobileDetails):
   - Responsive design quality
   - Touch target sizes and spacing
   - Mobile-specific UX patterns
   - Viewport configuration
   - Mobile content prioritization
   - Mobile navigation patterns

7. securityScore — Security (securityDetails):
   - HTTPS implementation
   - Security headers (CSP, X-Frame-Options, etc.)
   - Form security indicators
   - Data protection indicators
   - Cookie policies and privacy signals
   - Third-party script security

8. aiReadinessScore — AI Readiness (aiReadinessDetails):
   - Chatbot or AI assistant presence
   - AI-powered features (personalization, recommendations)
   - Automation potential indicators
   - Data maturity (analytics, tracking, data collection)
   - API readiness and integration points
   - Content personalization capabilities

9. automationScore — Automation (automationDetails):
   - CRM system indicators
   - Email marketing automation
   - Workflow and process automation tools
   - Marketing automation presence
   - Social media automation
   - Booking/scheduling automation
   - Lead nurturing automation

10. conversionScore — Conversion Optimization (conversionDetails):
    - Call-to-action clarity and prominence
    - Lead capture forms (presence, quality, friction)
    - Trust signals (testimonials, reviews, case studies, logos)
    - Social proof effectiveness
    - Pricing clarity and transparency
    - Value proposition communication
    - Conversion funnel indicators
    - Urgency/scarcity elements

Website URL: ${url}

CRITICAL FORMAT RULES:
- ALL list fields (problemsFound, opportunities, recommendations, talkingPoints) MUST be plain text strings with numbered items separated by \\n — NOT arrays, NOT objects, NOT JSON arrays.
- ALL score fields MUST be integers between 0-100, NOT strings.
- ALL detail fields MUST be plain text strings.
- Return ONLY the JSON object, no markdown fences, no commentary.`
}

// ── Build DB payload from parsed AI result ─────────────────────────────────

function buildAuditData(parsed: Record<string, unknown>) {
  const scores: Record<string, number> = {}
  const details: Record<string, string> = {}

  let total = 0
  for (const key of SCORE_KEYS) {
    const s = clampScore(parsed[key])
    scores[key] = s
    total += s
    details[DETAIL_KEYS[key]] = String(parsed[DETAIL_KEYS[key]] || '')
  }

  const overallScore = Math.round(total / SCORE_KEYS.length)

  return {
    ...scores,
    overallScore,
    ...details,
    executiveSummary: String(parsed.executiveSummary || ''),
    // Normalize list fields to clean strings before DB storage
    problemsFound: normalizeList(parsed.problemsFound).join('\n'),
    opportunities: normalizeList(parsed.opportunities).join('\n'),
    recommendations: normalizeList(parsed.recommendations).join('\n'),
    pitchStrategy: String(parsed.pitchStrategy || ''),
    talkingPoints: normalizeList(parsed.talkingPoints).join('\n'),
  }
}

// ── POST /api/audit ────────────────────────────────────────────────────────

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

    // Call AI
    const auditPrompt = buildAuditPrompt(normalizedUrl)
    const rawResult = await aiAnalyzeWebsite(normalizedUrl, auditPrompt)

    // Parse AI response — robust JSON extraction
    let parsed: Record<string, unknown>
    try {
      let cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      // Try to extract JSON object from response if there's extra text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleaned = jsonMatch[0]
      }
      parsed = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('Audit JSON parse error:', parseErr, 'Raw:', rawResult.substring(0, 500))
      return NextResponse.json({ error: 'Failed to parse audit results from AI. Please try again.' }, { status: 500 })
    }

    const auditData = buildAuditData(parsed)

    // Resolve or create business record
    let resolvedBusinessId = businessId

    if (!resolvedBusinessId) {
      const domain = extractDomain(normalizedUrl)

      const existing = await db.business.findFirst({
        where: { website: { contains: domain } },
      })

      if (existing) {
        resolvedBusinessId = existing.id
      } else {
        const newBusiness = await db.business.create({
          data: {
            name: businessName || domain,
            website: normalizedUrl,
            source: 'MANUAL_AUDIT',
          },
        })
        resolvedBusinessId = newBusiness.id

        // Create a lead for the new business
        await db.lead.create({
          data: {
            businessId: newBusiness.id,
            stage: 'DISCOVERED',
            assignedToId: session.id,
          },
        })
      }
    } else {
      const biz = await db.business.findUnique({ where: { id: businessId } })
      if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 })
      resolvedBusinessId = biz.id
    }

    // Upsert the audit (one audit per business)
    const audit = await db.websiteAudit.upsert({
      where: { businessId: resolvedBusinessId },
      update: {
        url: normalizedUrl,
        ...auditData,
        updatedAt: new Date(),
      },
      create: {
        businessId: resolvedBusinessId,
        url: normalizedUrl,
        ...auditData,
      },
    })

    // Update lead stage to AUDITED
    await db.lead.updateMany({
      where: { businessId: resolvedBusinessId, stage: 'DISCOVERED' },
      data: { stage: 'AUDITED' },
    })

    // Log activity
    const leadRecord = await db.lead.findFirst({
      where: { businessId: resolvedBusinessId },
      select: { id: true },
    })
    await db.activity.create({
      data: {
        userId: session.id,
        leadId: leadRecord?.id || null,
        action: 'AUDIT_COMPLETED',
        details: `Website audit completed for ${normalizedUrl} — overall score: ${auditData.overallScore}/100`,
      },
    })

    // Return flat response
    const domain = extractFullHost(normalizedUrl)

    return NextResponse.json({
      id: audit.id,
      businessId: resolvedBusinessId,
      domain,
      url: audit.url,
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
      overallScore: audit.overallScore,
      uiDetails: audit.uiDetails,
      uxDetails: audit.uxDetails,
      seoDetails: audit.seoDetails,
      performanceDetails: audit.performanceDetails,
      accessibilityDetails: audit.accessibilityDetails,
      mobileDetails: audit.mobileDetails,
      securityDetails: audit.securityDetails,
      aiReadinessDetails: audit.aiReadinessDetails,
      automationDetails: audit.automationDetails,
      conversionDetails: audit.conversionDetails,
      executiveSummary: audit.executiveSummary,
      problemsFound: parseList(audit.problemsFound),
      opportunities: parseList(audit.opportunities),
      recommendations: parseList(audit.recommendations),
      pitchStrategy: audit.pitchStrategy,
      talkingPoints: parseList(audit.talkingPoints),
      createdAt: audit.createdAt,
      updatedAt: audit.updatedAt,
    }, { status: 201 })
  } catch (e: unknown) {
    console.error('Audit POST error:', e)
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
  }
}

// ── GET /api/audit ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.audit?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get('businessId')
    const id = searchParams.get('id')

    // ── Single audit by id or businessId ──────────────────────────────────
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

      const domain = extractFullHost(audit.url)

      return NextResponse.json({
        id: audit.id,
        businessId: audit.businessId,
        domain,
        url: audit.url,
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
        overallScore: audit.overallScore,
        uiDetails: audit.uiDetails,
        uxDetails: audit.uxDetails,
        seoDetails: audit.seoDetails,
        performanceDetails: audit.performanceDetails,
        accessibilityDetails: audit.accessibilityDetails,
        mobileDetails: audit.mobileDetails,
        securityDetails: audit.securityDetails,
        aiReadinessDetails: audit.aiReadinessDetails,
        automationDetails: audit.automationDetails,
        conversionDetails: audit.conversionDetails,
        executiveSummary: audit.executiveSummary,
        problemsFound: parseList(audit.problemsFound),
        opportunities: parseList(audit.opportunities),
        recommendations: parseList(audit.recommendations),
        pitchStrategy: audit.pitchStrategy,
        talkingPoints: parseList(audit.talkingPoints),
        createdAt: audit.createdAt,
        updatedAt: audit.updatedAt,
        business: audit.business ? {
          id: audit.business.id,
          name: audit.business.name,
        } : null,
      })
    }

    // ── List recent audits ────────────────────────────────────────────────
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

    const result = audits.map((audit) => {
      const domain = extractFullHost(audit.url)

      return {
        id: audit.id,
        businessId: audit.businessId,
        domain,
        url: audit.url,
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
        overallScore: audit.overallScore,
        executiveSummary: audit.executiveSummary,
        createdAt: audit.createdAt,
        updatedAt: audit.updatedAt,
        lead: audit.business.lead ? {
          id: audit.business.lead.id,
          business: { name: audit.business.name },
        } : null,
      }
    })

    return NextResponse.json({ audits: result })
  } catch (e: unknown) {
    console.error('Audit GET error:', e)
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
  }
}