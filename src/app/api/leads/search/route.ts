import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/leads/search — search real businesses via FREE APIs
// Supports: Serper.dev (Google Search) + web scraping fallback
// Env var: SERPER_API_KEY — free 2500 searches/month from https://serper.dev

interface DiscoveredLead {
  name: string
  address: string
  phone: string
  website: string
  email: string
  mapsUrl: string
  rating: number
  placeId: string
  source: string
  existing?: boolean
}

// ─── Serper.dev: Google Search Results ────────────────────────────────

async function searchSerper(query: string, location: string): Promise<DiscoveredLead[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return []

  const searchQuery = `${query} in ${location} business directory`
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      q: searchQuery,
      num: 20,
      gl: 'us',
      hl: 'en',
    }),
  })

  if (!res.ok) return []

  const data = await res.json() as Record<string, unknown>
  const organic = (data.organic || []) as Array<Record<string, unknown>>
  const knowledgeGraph = data.knowledgeGraph as Record<string, unknown> | undefined

  const leads: DiscoveredLead[] = []

  for (const item of organic) {
    const title = String(item.title || '')
    const link = String(item.link || '')
    const snippet = String(item.snippet || '')

    if (!link || link.includes('youtube.com') || link.includes('facebook.com') ||
        link.includes('twitter.com') || link.includes('instagram.com') ||
        link.includes('linkedin.com/in/') || link.includes('wikipedia.org') ||
        link.includes('reddit.com') || link.includes('amazon.com') ||
        link.includes('google.com/maps')) continue

    const phoneMatch = snippet.match(/[\+]?[\d\s\-\(\)]{7,}/)
    const phone = phoneMatch ? phoneMatch[0].trim() : ''
    const name = title.split(/\s*[-|–—]\s*/)[0].trim() || title

    leads.push({
      name,
      address: location,
      phone,
      website: link,
      email: '',
      mapsUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + location)}`,
      rating: 0,
      placeId: `serper-${Buffer.from(link).toString('base64url').slice(0, 16)}`,
      source: 'GOOGLE_SEARCH',
    })
  }

  if (knowledgeGraph && knowledgeGraph.title) {
    const kgLink = String(knowledgeGraph.website || knowledgeGraph.link || '')
    if (kgLink) {
      leads.unshift({
        name: String(knowledgeGraph.title || ''),
        address: [String(knowledgeGraph.address || ''), location].filter(Boolean).join(', '),
        phone: String(knowledgeGraph.phone || ''),
        website: kgLink,
        email: String(knowledgeGraph.email || ''),
        mapsUrl: `https://www.google.com/search?q=${encodeURIComponent(String(knowledgeGraph.title || '') + ' ' + location)}`,
        rating: 0,
        placeId: `kg-${Buffer.from(kgLink).toString('base64url').slice(0, 16)}`,
        source: 'GOOGLE_SEARCH',
      })
    }
  }

  return leads
}

// ─── Direct Web Scraping: DuckDuckGo fallback ────────────────────────

async function searchWebScraping(query: string, location: string): Promise<DiscoveredLead[]> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' in ' + location + ' business website')}`

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return []

    const html = await res.text()
    const leads: DiscoveredLead[] = []
    const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet" href="[^"]+">([\s\S]*?)<\/a>/g
    let match: RegExpExecArray | null

    while ((match = resultRegex.exec(html)) !== null && leads.length < 15) {
      const rawUrl = match[1]
      const title = match[2].replace(/<[^>]+>/g, '').trim()
      const snippet = match[3].replace(/<[^>]+>/g, '').trim()

      let actualUrl = rawUrl
      const uddgMatch = rawUrl.match(/uddg=([^&]+)/)
      if (uddgMatch) actualUrl = decodeURIComponent(uddgMatch[1])

      if (!actualUrl || actualUrl.includes('wikipedia.org') ||
          actualUrl.includes('youtube.com') || actualUrl.includes('reddit.com') ||
          actualUrl.includes('facebook.com') || actualUrl.includes('twitter.com') ||
          actualUrl.includes('linkedin.com/in/')) continue

      const phoneMatch = snippet.match(/[\+]?[\d\s\-\(\)]{7,}/)
      const phone = phoneMatch ? phoneMatch[0].trim() : ''
      const name = title.split(/\s*[-|–—]\s*/)[0].trim() || title

      if (name.length > 2) {
        leads.push({
          name,
          address: location,
          phone,
          website: actualUrl,
          email: '',
          mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + location)}`,
          rating: 0,
          placeId: `scrape-${Buffer.from(actualUrl).toString('base64url').slice(0, 16)}`,
          source: 'WEB_SCRAPING',
        })
      }
    }

    return leads
  } catch {
    return []
  }
}

// ─── Deduplicate leads by name ────────────────────────────────────────

function deduplicateLeads(leads: DiscoveredLead[]): DiscoveredLead[] {
  const seen = new Set<string>()
  return leads.filter((lead) => {
    const key = lead.name.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ─── Main Route Handler ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.leads?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { query, location } = await req.json()

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required (e.g. "digital marketing agency")' }, { status: 400 })
    }
    if (!location?.trim()) {
      return NextResponse.json({ error: 'Location is required (e.g. "New York")' }, { status: 400 })
    }

    const hasSerper = !!process.env.SERPER_API_KEY

    if (!hasSerper) {
      const scrapedLeads = await searchWebScraping(query.trim(), location.trim())
      const leads = deduplicateLeads(scrapedLeads)

      if (leads.length === 0) {
        return NextResponse.json({
          error: 'No results found. For better results, add a free API key:\n\n' +
            'Serper.dev (2,500 free searches/month): Get your key at https://serper.dev\n' +
            'Add SERPER_API_KEY to your Vercel environment variables.',
          leads: [],
          total: 0,
          newCount: 0,
          existingCount: 0,
          source: 'WEB_SCRAPING',
        }, { status: 200 })
      }

      const { enrichedLeads, newCount, existingCount } = await checkExisting(leads)
      return NextResponse.json({ leads: enrichedLeads, total: enrichedLeads.length, newCount, existingCount, source: 'WEB_SCRAPING' })
    }

    const serperLeads = await searchSerper(query.trim(), location.trim())
    const allLeads = deduplicateLeads(serperLeads)

    if (allLeads.length === 0) {
      return NextResponse.json({
        error: 'No businesses found. Try a different search query or location.',
        leads: [], total: 0, newCount: 0, existingCount: 0, source: 'SERPER',
      })
    }

    const { enrichedLeads, newCount, existingCount } = await checkExisting(allLeads)
    return NextResponse.json({ leads: enrichedLeads, total: enrichedLeads.length, newCount, existingCount, source: 'SERPER' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('Lead search error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ─── Check existing businesses in DB ──────────────────────────────────

async function checkExisting(leads: DiscoveredLead[]): Promise<{
  enrichedLeads: DiscoveredLead[]
  newCount: number
  existingCount: number
}> {
  if (leads.length === 0) return { enrichedLeads: [], newCount: 0, existingCount: 0 }

  const names = leads.map((l) => l.name)
  const websites = leads.filter((l) => l.website).map((l) => l.website)

  const [existingByWebsite, existingByName] = await Promise.all([
    websites.length > 0
      ? db.business.findMany({ where: { website: { in: websites } }, select: { name: true, website: true } })
      : [],
    names.length > 0
      ? db.business.findMany({ where: { name: { in: names } }, select: { name: true, website: true } })
      : [],
  ])

  const existingWebsites = new Set(existingByWebsite.map((b) => b.website?.toLowerCase()).filter(Boolean) as string[])
  const existingNames = new Set(existingByName.map((b) => b.name.toLowerCase()))

  let newCount = 0
  let existingCount = 0

  const enrichedLeads = leads.map((lead) => {
    const isDuplicate =
      (lead.website && existingWebsites.has(lead.website.toLowerCase())) ||
      existingNames.has(lead.name.toLowerCase())
    lead.existing = isDuplicate
    if (isDuplicate) existingCount++
    else newCount++
    return lead
  })

  return { enrichedLeads, newCount, existingCount }
}