import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/leads/search — search real businesses via Google Places API (New)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.leads?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { query, location, type } = await req.json()

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required (e.g. "digital marketing agency")' }, { status: 400 })
    }
    if (!location?.trim()) {
      return NextResponse.json({ error: 'Location is required (e.g. "New York")' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Google Places API key is not configured. Please add GOOGLE_PLACES_API_KEY to your environment variables. ' +
            'You can get one from https://console.cloud.google.com/apis/credentials (enable "Places API (New)")',
        },
        { status: 503 },
      )
    }

    const textQuery = `${query.trim()} in ${location.trim()}`
    const body: Record<string, unknown> = { textQuery }
    if (type?.trim()) {
      body.includeType = type.trim()
    }

    const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.id,places.googleMapsUri',
      },
      body: JSON.stringify(body),
    })

    if (!placesRes.ok) {
      const errBody = await placesRes.text().catch(() => 'Unknown error')
      console.error(`Google Places API error ${placesRes.status}:`, errBody)
      return NextResponse.json(
        { error: `Google Places API returned error ${placesRes.status}. Please check your API key and quota.`, details: errBody },
        { status: 502 },
      )
    }

    const placesData = (await placesRes.json()) as { places?: GooglePlace[] }
    const rawPlaces = placesData.places || []

    // Parse into clean lead format
    const leads: DiscoveredLead[] = rawPlaces.map((place) => ({
      name: place.displayName?.text || 'Unknown',
      address: place.formattedAddress || '',
      phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
      website: place.websiteUri || '',
      mapsUrl: place.googleMapsUri || '',
      rating: place.rating || 0,
      placeId: place.id || '',
      source: 'GOOGLE_MAPS' as const,
    }))

    // Check which ones already exist in DB (by name or website)
    if (leads.length > 0) {
      const names = leads.map((l) => l.name)
      const websites = leads.filter((l) => l.website).map((l) => l.website)

      const existingByWebsite =
        websites.length > 0
          ? await db.business.findMany({
              where: { website: { in: websites } },
              select: { name: true, website: true },
            })
          : []

      const existingByName =
        names.length > 0
          ? await db.business.findMany({
              where: { name: { in: names } },
              select: { name: true, website: true },
            })
          : []

      const existingWebsites = new Set(existingByWebsite.map((b) => b.website?.toLowerCase()).filter(Boolean) as string[])
      const existingNames = new Set(existingByName.map((b) => b.name.toLowerCase()))

      for (const lead of leads) {
        const isDuplicate =
          (lead.website && existingWebsites.has(lead.website.toLowerCase())) || existingNames.has(lead.name.toLowerCase())
        lead.existing = isDuplicate
      }
    }

    const newCount = leads.filter((l) => !l.existing).length
    const existingCount = leads.filter((l) => l.existing).length

    return NextResponse.json({
      leads,
      total: leads.length,
      newCount,
      existingCount,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('Lead search error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Types for Google Places API (New) response
interface GooglePlace {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  websiteUri?: string
  rating?: number
  googleMapsUri?: string
}

interface DiscoveredLead {
  name: string
  address: string
  phone: string
  website: string
  mapsUrl: string
  rating: number
  placeId: string
  source: 'GOOGLE_MAPS'
  existing?: boolean
}