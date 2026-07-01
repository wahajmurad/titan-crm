import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

interface InboxItem {
  id: string
  type: 'reply' | 'meeting_request' | 'positive' | 'ooo'
  subject: string
  snippet: string
  from: string
  company: string
  website: string | null
  leadId: string
  businessId: string
  date: string
  read: boolean
}

// GET /api/inbox — unified inbox of replies and meeting requests
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.inbox?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const items: InboxItem[] = []

    // --- Fetch replied outreaches ---
    if (!type || type === 'replies' || type === 'positive' || type === 'ooo') {
      const outreachWhere: Record<string, unknown> = { status: 'REPLIED' }

      // Filter by type context: for TEAM users, only their assigned leads
      if (session.role === 'TEAM') {
        outreachWhere.lead = { assignedToId: session.id }
      }

      const repliedOutreaches = await db.outreach.findMany({
        where: outreachWhere,
        include: {
          lead: {
            include: {
              business: { select: { id: true, name: true, website: true, email: true, country: true } },
            },
          },
        },
        orderBy: { repliedAt: 'desc' },
        take: 200,
      })

      for (const o of repliedOutreaches) {
        const body = (o.body || '').toLowerCase()

        // Classify reply
        let itemType: InboxItem['type'] = 'reply'
        if (body.includes('out of office') || body.includes('ooo') || body.includes('on leave') || body.includes('away from office') || body.includes('auto-reply') || body.includes('autoreply')) {
          itemType = 'ooo'
        } else if (body.includes('interested') || body.includes('let\'s discuss') || body.includes('schedule a call') || body.includes('meeting') || body.includes('tell me more') || body.includes('would love') || body.includes('sounds good') || body.includes('let\'s talk')) {
          itemType = 'positive'
        }

        if (type && type !== itemType && type !== 'replies') continue

        items.push({
          id: `outreach-${o.id}`,
          type: itemType,
          subject: o.subject,
          snippet: o.body?.slice(0, 200) || '',
          from: o.lead.business.email || o.lead.decisionMakerEmail || o.lead.decisionMaker || 'Unknown',
          company: o.lead.business.name,
          website: o.lead.business.website,
          leadId: o.leadId,
          businessId: o.lead.business.id,
          date: o.repliedAt?.toISOString() || o.createdAt.toISOString(),
          read: false,
        })
      }
    }

    // --- Fetch scheduled meetings ---
    if (!type || type === 'meeting_request') {
      const meetingWhere: Record<string, unknown> = { status: 'SCHEDULED' }

      if (session.role === 'TEAM') {
        meetingWhere.lead = { assignedToId: session.id }
      }

      const meetings = await db.meeting.findMany({
        where: meetingWhere,
        include: {
          lead: {
            include: {
              business: { select: { id: true, name: true, website: true, email: true, country: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
        take: 200,
      })

      for (const m of meetings) {
        items.push({
          id: `meeting-${m.id}`,
          type: 'meeting_request',
          subject: m.title,
          snippet: m.description?.slice(0, 200) || `Scheduled for ${new Date(m.date).toLocaleString()}`,
          from: m.lead.business.email || m.lead.decisionMakerEmail || m.lead.decisionMaker || 'Unknown',
          company: m.lead.business.name,
          website: m.lead.business.website,
          leadId: m.leadId,
          businessId: m.lead.business.id,
          date: m.date.toISOString(),
          read: false,
        })
      }
    }

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Group by type for counts
    const grouped = {
      replies: items.filter(i => i.type === 'reply'),
      meeting_requests: items.filter(i => i.type === 'meeting_request'),
      positive: items.filter(i => i.type === 'positive'),
      ooo: items.filter(i => i.type === 'ooo'),
    }

    // Pagination
    const filtered = type
      ? items.filter(i => i.type === type || (type === 'replies' && (i.type === 'positive' || i.type === 'ooo')))
      : items

    const total = filtered.length
    const paginated = filtered.slice((page - 1) * limit, page * limit)

    return NextResponse.json({
      items: paginated,
      total,
      page,
      limit,
      counts: {
        total: items.length,
        replies: grouped.replies.length,
        meeting_requests: grouped.meeting_requests.length,
        positive: grouped.positive.length,
        ooo: grouped.ooo.length,
      },
      groups: grouped,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}