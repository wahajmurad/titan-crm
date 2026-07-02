import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

function timeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  if (diffWeek < 4) return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`
  return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`
}

// GET /api/ai/knowledge — return AI knowledge base entries
export async function GET(req: NextRequest) {
  try {
    // Demo mode: allow even without session
    await getSession()

    const { searchParams } = req.nextUrl
    const search = searchParams.get('search')?.toLowerCase().trim() || ''
    const type = searchParams.get('type')?.trim() || ''

    // Query real data from the database
    const [audits, campaigns, assets] = await Promise.all([
      db.websiteAudit.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { business: true },
      }),
      db.campaign.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      db.generatedAsset.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { business: true },
      }),
    ])

    // Map WebsiteAudit → audit knowledge items
    const auditItems = audits.map((a) => ({
      id: a.id,
      type: 'audit' as const,
      title: `${a.business?.name || 'Unknown'} — Website Audit`,
      company: a.business?.name || 'Unknown',
      industry: a.business?.industry || 'General',
      score: a.overallScore || null,
      createdAt: timeAgo(a.createdAt),
      summary: a.executiveSummary || `Overall score: ${a.overallScore}/100 across 10 categories.`,
    }))

    // Map Campaign → campaign knowledge items
    const campaignItems = campaigns.map((c) => ({
      id: c.id,
      type: 'campaign' as const,
      title: c.name,
      company: 'Multiple',
      industry: c.industry || 'General',
      score: c.leadCount > 0 ? Math.round((c.meetingCount / c.leadCount) * 100) : null,
      createdAt: timeAgo(c.createdAt),
      summary: `${c.leadCount} leads, ${c.sentCount} sent, ${c.replyCount} replies, ${c.meetingCount} meetings.`,
    }))

    // Map GeneratedAsset → appropriate type knowledge items
    const assetItems = assets.map((a) => {
      let assetType: 'audit' | 'campaign' | 'email' | 'proposal' | 'research' | 'workflow' = 'research'
      if (a.type.includes('email')) assetType = 'email'
      else if (a.type.includes('proposal')) assetType = 'proposal'
      else if (a.type.includes('audit')) assetType = 'audit'
      else if (a.type.includes('campaign')) assetType = 'campaign'
      else if (a.type.includes('workflow')) assetType = 'workflow'

      return {
        id: a.id,
        type: assetType,
        title: a.title,
        company: a.business?.name || 'Multiple',
        industry: a.business?.industry || 'General',
        score: null as number | null,
        createdAt: timeAgo(a.createdAt),
        summary: a.content?.substring(0, 200) || 'Generated asset',
      }
    })

    // Combine and sort by createdAt descending (use the original Date objects for sorting)
    const allItems = [
      ...audits.map((a, i) => ({ ...auditItems[i], _sortDate: a.createdAt })),
      ...campaigns.map((c, i) => ({ ...campaignItems[i], _sortDate: c.createdAt })),
      ...assets.map((a, i) => ({ ...assetItems[i], _sortDate: a.createdAt })),
    ].sort((a, b) => b._sortDate.getTime() - a._sortDate.getTime())

    // Remove the internal sort key
    const items = allItems.map(({ _sortDate, ...item }) => item)

    // Apply search filtering
    let filtered = items
    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          item.company.toLowerCase().includes(search) ||
          item.industry.toLowerCase().includes(search),
      )
    }

    // Apply type filtering
    if (type) {
      filtered = filtered.filter((item) => item.type === type)
    }

    return NextResponse.json({ success: true, items: filtered, total: filtered.length })
  } catch (err) {
    console.error('[AI Knowledge]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch knowledge base' },
      { status: 500 },
    )
  }
}