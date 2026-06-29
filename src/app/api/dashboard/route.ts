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
        take: 15,
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

    const totalSent = outreachMap['SENT'] || 0
    const totalReplied = (outreachMap['REPLIED'] || 0) + (outreachMap['OPENED'] || 0)
    const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0

    return NextResponse.json({
      totalLeads,
      stages: stageMap,
      outreach: outreachMap,
      meetings: meetingMap,
      replyRate,
      recentActivities,
      leadsByIndustry,
      wonCount: stageMap['WON'] || 0,
      meetingBooked: meetingMap['SCHEDULED'] || 0,
      outreachSent: totalSent,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}