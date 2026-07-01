import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiChat } from '@/lib/ai'

// ═══════════════════════════════════════════════════════════════════
// OUTREACH PACKAGE GENERATOR
// Auto-selects assets based on estimated deal value.
// High-value = richer, more customized. Low-value = focused, efficient.
// ═══════════════════════════════════════════════════════════════════

interface GeneratedPackage {
  companyName: string
  estimatedDealValue: string
  tier: 'platinum' | 'gold' | 'silver'
  assets: {
    personalizedEmail: boolean
    linkedinOutreach: boolean
    auditPDF: boolean
    htmlDemoPage: boolean
    growthBlueprint: boolean
    roiReport: boolean
    bookingLink: boolean
    annotatedScreenshots: boolean
  }
  rationale: string
  recommendedSequence: Array<{ step: number; action: string; asset: string; timing: string; reason: string }>
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { leadId, companyName, industry, companySize, estimatedDealValue, auditScore, intelData } = body

    // Resolve lead data
    let resolvedCompany = companyName
    let resolvedIndustry = industry
    let resolvedSize = companySize
    let resolvedDealValue = estimatedDealValue
    let resolvedAuditScore = auditScore
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
      resolvedSize = resolvedSize || lead.business.companySize || undefined
    }

    // Fetch audit score if not provided
    if (businessId && !resolvedAuditScore) {
      const audit = await db.websiteAudit.findUnique({ where: { businessId } }).catch(() => null)
      if (audit) resolvedAuditScore = audit.overallScore
    }

    // Fetch existing assets
    const existingAssets: string[] = []
    if (businessId) {
      const assets = await db.generatedAsset.findMany({
        where: { businessId },
        select: { type: true },
      })
      existingAssets.push(...assets.map(a => a.type))
    }

    if (!resolvedCompany?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Determine tier based on deal value and company size
    const dealNum = parseDealValue(resolvedDealValue)
    const sizeMultiplier = getSizeMultiplier(resolvedSize)
    const compositeScore = dealNum * sizeMultiplier

    let tier: 'platinum' | 'gold' | 'silver'
    if (compositeScore >= 15000 || dealNum >= 10000) {
      tier = 'platinum'
    } else if (compositeScore >= 5000 || dealNum >= 3000) {
      tier = 'gold'
    } else {
      tier = 'silver'
    }

    // AI selects the optimal outreach package
    const prompt = `You are an outreach strategist for an AI solutions company. Determine the optimal outreach package for "${resolvedCompany}".
Industry: ${resolvedIndustry || 'Unknown'} | Size: ${resolvedSize || 'Unknown'} | Estimated Deal: $${resolvedDealValue || 'Unknown'}
Audit Score: ${resolvedAuditScore || 'N/A'}/100 | Calculated Tier: ${tier}
Existing Assets: ${existingAssets.join(', ') || 'None'}
Additional Intel: ${typeof intelData === 'string' ? intelData?.substring(0, 800) : JSON.stringify(intelData || '')}

TIER GUIDELINES:
- PLATINUM (high-value): Full package — personalized email, LinkedIn strategy, premium audit PDF, custom HTML demo page, growth blueprint, ROI report, booking link, annotated screenshots. Sequence: 5-7 touchpoints over 21 days.
- GOLD (medium-value): Core package — personalized email, LinkedIn strategy, audit PDF, growth blueprint, booking link. Sequence: 3-5 touchpoints over 14 days.
- SILVER (standard): Focused package — personalized email, basic audit summary, booking link. Sequence: 2-3 touchpoints over 7 days.

The AI should intelligently adjust based on the specific company, NOT blindly follow tiers.
Return JSON:
{
  "tier": "${tier}",
  "adjustedRationale": "why this specific package for THIS company — 2-3 sentences",
  "assets": {
    "personalizedEmail": true,
    "linkedinOutreach": true,
    "auditPDF": true,
    "htmlDemoPage": true,
    "growthBlueprint": true,
    "roiReport": true,
    "bookingLink": true,
    "annotatedScreenshots": true
  },
  "recommendedSequence": [
    {"step": 1, "action": "what to do", "asset": "which asset to send/use", "timing": "when (Day 1, Day 3, etc.)", "reason": "why this order for THIS company"}
  ],
  "personalizationRequirements": ["what research must be completed before outreach"],
  "estimatedResponseRate": "estimated reply rate percentage",
  "estimatedMeetingRate": "estimated meeting booking rate percentage",
  "totalAssetsToGenerate": 5,
  "estimatedPrepTime": "how long the AI needs to prepare all assets"
}

Return valid JSON only. No markdown.`

    const rawResult = await aiChat(prompt, 0.4, 2000)

    let parsed: Record<string, unknown>
    try {
      const cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : {}
    } catch {
      parsed = {}
    }

    const pkg: GeneratedPackage = {
      companyName: resolvedCompany,
      estimatedDealValue: resolvedDealValue || 'Unknown',
      tier: (parsed.tier as GeneratedPackage['tier']) || tier,
      assets: {
        personalizedEmail: Boolean((parsed.assets as Record<string, unknown>)?.personalizedEmail),
        linkedinOutreach: Boolean((parsed.assets as Record<string, unknown>)?.linkedinOutreach),
        auditPDF: Boolean((parsed.assets as Record<string, unknown>)?.auditPDF),
        htmlDemoPage: Boolean((parsed.assets as Record<string, unknown>)?.htmlDemoPage),
        growthBlueprint: Boolean((parsed.assets as Record<string, unknown>)?.growthBlueprint),
        roiReport: Boolean((parsed.assets as Record<string, unknown>)?.roiReport),
        bookingLink: Boolean((parsed.assets as Record<string, unknown>)?.bookingLink),
        annotatedScreenshots: Boolean((parsed.assets as Record<string, unknown>)?.annotatedScreenshots),
      },
      rationale: String(parsed.adjustedRationale || `Optimized ${tier} package for ${resolvedCompany}`),
      recommendedSequence: Array.isArray(parsed.recommendedSequence)
        ? parsed.recommendedSequence.map((s: Record<string, unknown>) => ({
            step: Number(s.step) || 0,
            action: String(s.action || ''),
            asset: String(s.asset || ''),
            timing: String(s.timing || ''),
            reason: String(s.reason || ''),
          }))
        : [],
    }

    // Append AI-generated metadata
    return NextResponse.json({
      ...pkg,
      estimatedResponseRate: parsed.estimatedResponseRate || '5-8%',
      estimatedMeetingRate: parsed.estimatedMeetingRate || '2-4%',
      personalizationRequirements: parsed.personalizationRequirements || [],
      totalAssetsToGenerate: parsed.totalAssetsToGenerate || 5,
      estimatedPrepTime: parsed.estimatedPrepTime || '3-5 minutes',
    })
  } catch (err) {
    console.error('[Outreach Package]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate outreach package' }, { status: 500 })
  }
}

function parseDealValue(val: string | number | undefined): number {
  if (!val) return 0
  if (typeof val === 'number') return val
  const num = parseFloat(val.replace(/[^0-9.]/g, ''))
  const lower = val.toLowerCase()
  if (lower.includes('k')) return num * 1000
  if (lower.includes('m')) return num * 1000000
  return num
}

function getSizeMultiplier(size: string | undefined): number {
  if (!size) return 1
  if (size.includes('500+')) return 3
  if (size.includes('201')) return 2.5
  if (size.includes('51')) return 2
  if (size.includes('11')) return 1.5
  return 1
}