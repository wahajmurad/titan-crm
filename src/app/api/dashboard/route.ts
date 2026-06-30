import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const where = session.role === 'TEAM' ? { assignedToId: session.id } : {}

    const [
      totalLeads,
      stageCounts,
      outreachStats,
      meetingStats,
      recentActivities,
      leadsByIndustry,
      temperatureCounts,
      activeCampaignsCount,
    ] = await Promise.all([
      db.lead.count({ where }),
      db.lead.groupBy({
        by: ['stage'],
        where,
        _count: { stage: true },
      }),
      db.outreach.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      db.meeting.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      db.activity.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          lead: { include: { business: { select: { name: true } } } },
        },
      }),
      db.business.groupBy({
        by: ['industry'],
        where: { industry: { not: null } },
        _count: { industry: true },
        orderBy: { _count: { industry: 'desc' } },
        take: 10,
      }),
      db.lead.groupBy({
        by: ['temperature'],
        where,
        _count: { temperature: true },
      }),
      db.campaign.count({ where: { status: 'ACTIVE' } }),
    ])

    const stageMap: Record<string, number> = {}
    for (const s of stageCounts) {
      stageMap[s.stage] = s._count.stage
    }

    const outreachMap: Record<string, number> = {}
    for (const o of outreachStats) {
      outreachMap[o.status] = o._count.status
    }

    const meetingMap: Record<string, number> = {}
    for (const m of meetingStats) {
      meetingMap[m.status] = m._count.status
    }

    const tempMap: Record<string, number> = {}
    for (const t of temperatureCounts) {
      tempMap[t.temperature] = t._count.temperature
    }

    const totalSent = outreachMap['SENT'] || 0
    const totalReplied = outreachMap['REPLIED'] || 0
    const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0

    return NextResponse.json({
      totalLeads,
      stages: stageMap,
      outreach: outreachMap,
      meetings: meetingMap,
      replyRate,
      recentActivities,
      leadsByIndustry,
      temperature: tempMap,
      wonCount: stageMap['WON'] || 0,
      meetingBooked: stageMap['MEETING_BOOKED'] || 0,
      outreachSent: totalSent,
      qualifiedCount: stageMap['QUALIFIED'] || 0,
      activeCampaigns: activeCampaignsCount,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
