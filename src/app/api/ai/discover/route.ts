import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiDiscoverLeads } from '@/lib/ai'

// POST /api/ai/discover — discover leads via AI and create Business + Lead records
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.discovery?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { industry, country, city, businessSize, campaignId, campaignName } = await req.json()

    if (!industry?.trim() || !country?.trim()) {
      return NextResponse.json({ error: 'Industry and country are required' }, { status: 400 })
    }

    // Resolve or create campaign
    let resolvedCampaignId = campaignId || null
    if (campaignName && !campaignId) {
      const existing = await db.campaign.findFirst({ where: { name: campaignName.trim() } })
      if (existing) {
        resolvedCampaignId = existing.id
      } else {
        if (session) {
          const newCampaign = await db.campaign.create({
            data: {
              name: campaignName.trim(),
              industry: industry.trim(),
              targetLocation: country.trim(),
              targetCity: city?.trim() || null,
              targetSize: businessSize?.trim() || null,
              ownerId: session.id,
              status: 'ACTIVE',
            },
          })
          resolvedCampaignId = newCampaign.id
        }
      }
    } else if (campaignId) {
      const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
      if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const rawResult = await aiDiscoverLeads({
      industry: industry.trim(),
      country: country.trim(),
      city: city?.trim() || undefined,
      businessSize: businessSize?.trim() || undefined,
    })

    // Parse the AI response
    let aiCompanies: Array<Record<string, string>> = []
    try {
      const cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      aiCompanies = JSON.parse(cleaned)
      if (!Array.isArray(aiCompanies)) aiCompanies = [aiCompanies]
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI discovery results', raw: rawResult }, { status: 500 })
    }

    // Create Business + Lead records for each discovered company
    const createdLeads: Array<Record<string, unknown>> = []
    const skipped: string[] = []

    for (const company of aiCompanies) {
      const name = company.name?.trim()
      const website = company.website?.trim()

      if (!name) continue

      // Check if business already exists (by name or website)
      const existing = await db.business.findFirst({
        where: {
          OR: [
            { name },
            ...(website ? [{ website }] : []),
          ],
        },
      })

      if (existing) {
        skipped.push(name)
        continue
      }

      const business = await db.business.create({
        data: {
          name,
          website: website || null,
          industry: company.industry?.trim() || industry.trim(),
          city: company.location?.trim() || city?.trim() || null,
          country: country.trim(),
          email: company.email?.trim() || company.contactEmail?.trim() || null,
          companySize: businessSize?.trim() || company.size?.trim() || null,
          source: 'AI_DISCOVERY',
        },
      })

      const lead = await db.lead.create({
        data: {
          businessId: business.id,
          campaignId: resolvedCampaignId,
          stage: 'DISCOVERED',
          assignedToId: session.id,
        },
        include: { business: true },
      })

      createdLeads.push({
        id: lead.id,
        businessId: business.id,
        businessName: business.name,
        website: business.website,
        industry: business.industry,
        city: business.city,
      })
    }

    // Update campaign lead count if campaignId provided
    if (resolvedCampaignId && createdLeads.length > 0) {
      await db.campaign.update({
        where: { id: resolvedCampaignId },
        data: { leadCount: { increment: createdLeads.length } },
      })
    }

    await db.activity.create({
      data: {
        userId: session.id,
        action: 'LEADS_DISCOVERED',
        details: `AI discovered ${createdLeads.length} new leads in ${industry} (${country})${skipped.length > 0 ? ` — ${skipped.length} duplicates skipped` : ''}`,
      },
    })

    // Build companies list for frontend (matching DiscoveryResult interface)
    const resultCompanies: Array<Record<string, string | undefined>> = createdLeads.map(l => ({
      id: String(l.businessId || ''),
      name: String(l.businessName || ''),
      website: String(l.website || ''),
      location: [l.city, country].filter(Boolean).join(', '),
      industry: String(l.industry || ''),
      status: 'new',
      leadId: String(l.id || ''),
    }))
    // Also include skipped as "existing"
    for (const skippedName of skipped) {
      resultCompanies.push({
        name: skippedName,
        website: '',
        location: '',
        industry: industry.trim(),
        status: 'existing',
      })
    }

    return NextResponse.json({
      companies: resultCompanies,
      discoveredCount: resultCompanies.length,
      newLeadsAdded: createdLeads.length,
    }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}