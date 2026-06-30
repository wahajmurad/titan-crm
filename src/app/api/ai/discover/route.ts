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

    const { industry, country, city, businessSize, campaignId } = await req.json()

    if (!industry?.trim() || !country?.trim()) {
      return NextResponse.json({ error: 'Industry and country are required' }, { status: 400 })
    }

    // Verify campaign if provided
    if (campaignId) {
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
    let companies: Array<Record<string, string>> = []
    try {
      const cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      companies = JSON.parse(cleaned)
      if (!Array.isArray(companies)) companies = [companies]
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI discovery results', raw: rawResult }, { status: 500 })
    }

    // Create Business + Lead records for each discovered company
    const createdLeads: Array<Record<string, unknown>> = []
    const skipped: string[] = []

    for (const company of companies) {
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
          campaignId: campaignId || null,
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
    if (campaignId && createdLeads.length > 0) {
      await db.campaign.update({
        where: { id: campaignId },
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

    return NextResponse.json({
      leads: createdLeads,
      total: companies.length,
      created: createdLeads.length,
      skipped: skipped.length,
      skippedNames: skipped,
    }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}