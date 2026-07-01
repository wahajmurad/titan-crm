import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { executeAgent } from '@/lib/ai-agents'
import type { CompanyIntelReport } from '@/lib/types'

function parseJSON(text: string): Record<string, unknown> {
  // Try direct parse
  try { return JSON.parse(text) } catch {}
  // Strip code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) { try { return JSON.parse(fenceMatch[1].trim()) } catch {} }
  // Regex fallback
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) { try { return JSON.parse(objMatch[0]) } catch {} }
  return {}
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { businessId, companyName, website, industry, location } = await req.json()
    if (!companyName && !businessId) {
      return NextResponse.json({ error: 'Company name or businessId required' }, { status: 400 })
    }

    // Get business if ID provided
    let bizName = companyName || ''
    let bizWebsite = website || ''
    let bizIndustry = industry || ''
    let bizLocation = location || ''

    if (businessId) {
      const business = await prisma.business.findUnique({ where: { id: businessId } })
      if (business) {
        bizName = bizName || business.name
        bizWebsite = bizWebsite || business.website || ''
        bizIndustry = bizIndustry || business.industry || ''
        bizLocation = bizLocation || `${business.city || ''}, ${business.country || ''}`.trim()
      }
    }

    // Run research agent
    const result = await executeAgent('research', {
      companyName: bizName,
      website: bizWebsite,
      industry: bizIndustry,
      location: bizLocation,
    })

    const data = parseJSON(result) as Partial<CompanyIntelReport>

    // Save to database
    const intel = await prisma.companyIntel.upsert({
      where: { businessId: businessId || 'none' },
      create: {
        businessId: businessId || 'none',
        businessOverview: data.businessOverview || null,
        coreServices: data.coreServices || null,
        idealCustomers: data.idealCustomers || null,
        uniqueSellingProp: data.uniqueSellingProp || null,
        strengths: data.strengths ? JSON.stringify(data.strengths) : null,
        weaknesses: data.weaknesses ? JSON.stringify(data.weaknesses) : null,
        painPoints: data.painPoints ? JSON.stringify(data.painPoints) : null,
        growthOpportunities: data.growthOpportunities ? JSON.stringify(data.growthOpportunities) : null,
        automationOpportunities: data.automationOpportunities ? JSON.stringify(data.automationOpportunities) : null,
        aiOpportunities: data.aiOpportunities ? JSON.stringify(data.aiOpportunities) : null,
        trustSignals: data.trustSignals ? JSON.stringify(data.trustSignals) : null,
        websiteQuality: data.websiteQuality || null,
        estimatedRevenue: data.estimatedRevenue || null,
        recommendedOutreachStyle: data.recommendedOutreachStyle || null,
        personalizationNotes: data.personalizationNotes || null,
      },
      update: {
        businessOverview: data.businessOverview || undefined,
        coreServices: data.coreServices || undefined,
        idealCustomers: data.idealCustomers || undefined,
        uniqueSellingProp: data.uniqueSellingProp || undefined,
        strengths: data.strengths ? JSON.stringify(data.strengths) : undefined,
        weaknesses: data.weaknesses ? JSON.stringify(data.weaknesses) : undefined,
        painPoints: data.painPoints ? JSON.stringify(data.painPoints) : undefined,
        growthOpportunities: data.growthOpportunities ? JSON.stringify(data.growthOpportunities) : undefined,
        automationOpportunities: data.automationOpportunities ? JSON.stringify(data.automationOpportunities) : undefined,
        aiOpportunities: data.aiOpportunities ? JSON.stringify(data.aiOpportunities) : undefined,
        trustSignals: data.trustSignals ? JSON.stringify(data.trustSignals) : undefined,
        websiteQuality: data.websiteQuality || undefined,
        estimatedRevenue: data.estimatedRevenue || undefined,
        recommendedOutreachStyle: data.recommendedOutreachStyle || undefined,
        personalizationNotes: data.personalizationNotes || undefined,
      },
    }).catch(() => {
      // If upsert fails (no businessId), just return data without saving
      return null
    })

    return NextResponse.json({ intel: data, saved: !!intel })
  } catch (err) {
    console.error('[Intel Report]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate intel report' }, { status: 500 })
  }
}