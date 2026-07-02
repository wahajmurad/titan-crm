import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/ai/human-in-loop — Human-in-the-Loop system
// Philosophy: Automate everything until genuine interest, then hand to human
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, leadId, outreachId, replyContent } = await req.json()
    const results: Array<{ leadId: string; businessName: string | null; classification: string; recommendation: string; notified: boolean }> = []

    if (action === 'check_replies') {
      const repliedOutreaches = await prisma.outreach.findMany({
        where: { status: 'REPLIED', repliedAt: { not: null } },
        include: { lead: { include: { business: true } } },
        orderBy: { repliedAt: 'desc' },
        take: 20,
      })

      for (const outreach of repliedOutreaches) {
        const classification = classifyReply(replyContent || outreach.body || '')
        if (classification.isPositiveInterest) {
          await prisma.lead.update({ where: { id: outreach.leadId }, data: { stage: 'REPLIED' } })
          await prisma.notification.create({
            data: {
              userId: session.id,
              title: `Reply from ${outreach.lead.business?.name || 'Lead'}`,
              message: `${outreach.lead.business?.name}: ${classification.type}. ${classification.recommendedAction}`,
              type: 'positive_reply',
              link: 'inbox',
              linkId: outreach.leadId,
            },
          })
          results.push({ leadId: outreach.leadId, businessName: outreach.lead.business?.name, classification: classification.type, recommendation: 'STOP automation — hand to human', notified: true })
        } else if (classification.isMeetingRequest) {
          await prisma.lead.update({ where: { id: outreach.leadId }, data: { stage: 'MEETING_BOOKED' } })
          await prisma.notification.create({
            data: {
              userId: session.id,
              title: `Meeting Request: ${outreach.lead.business?.name || 'Lead'}`,
              message: `${outreach.lead.business?.name} wants to schedule a meeting!`,
              type: 'meeting_request',
              link: 'meetings',
              linkId: outreach.leadId,
            },
          })
          results.push({ leadId: outreach.leadId, businessName: outreach.lead.business?.name, classification: 'MEETING_REQUEST', recommendation: 'Send booking link', notified: true })
        } else {
          results.push({ leadId: outreach.leadId, businessName: outreach.lead.business?.name, classification: classification.type, recommendation: classification.recommendedAction, notified: false })
        }
      }
      return NextResponse.json({ results, total: results.length })
    }

    if (action === 'stop_automation') {
      if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 })
      await prisma.lead.update({ where: { id: leadId }, data: { stage: 'REPLIED' } })
      await prisma.outreach.updateMany({ where: { leadId, status: 'DRAFT', type: 'FOLLOW_UP' }, data: { status: 'FAILED' } })
      return NextResponse.json({ success: true, message: 'Automation stopped' })
    }

    return NextResponse.json({ error: 'Invalid action. Use check_replies or stop_automation' }, { status: 400 })
  } catch (e) {
    console.error('[AI HUMAN-IN-LOOP POST ERROR]', e)
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const [replied, meetingBooked, awaitingHuman] = await Promise.all([
      prisma.lead.count({ where: { stage: 'REPLIED' } }),
      prisma.lead.count({ where: { stage: 'MEETING_BOOKED' } }),
      prisma.lead.count({ where: { stage: { in: ['REPLIED', 'MEETING_BOOKED', 'PROPOSAL_SENT'] } } }),
    ])
    const recentReplies = await prisma.outreach.findMany({
      where: { status: 'REPLIED', repliedAt: { not: null } },
      include: { lead: { include: { business: true } } },
      orderBy: { repliedAt: 'desc' },
      take: 10,
    })
    return NextResponse.json({
      stats: { replied, meetingBooked, awaitingHuman },
      recentReplies: recentReplies.map(r => ({ id: r.id, businessName: r.lead.business?.name, subject: r.subject, repliedAt: r.repliedAt, leadStage: r.lead.stage })),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

function classifyReply(reply: string): {
  type: string; isPositiveInterest: boolean; isMeetingRequest: boolean; recommendedAction: string
} {
  if (!reply) return { type: 'NEUTRAL', isPositiveInterest: false, isMeetingRequest: false, recommendedAction: 'Review manually' }
  const l = reply.toLowerCase()
  if (l.includes('out of office') || l.includes('ooo') || l.includes('on vacation') || l.includes('away from desk') || l.includes('until'))
    return { type: 'OUT_OF_OFFICE', isPositiveInterest: false, isMeetingRequest: false, recommendedAction: 'Schedule follow-up after OOO period' }
  if (l.includes('schedule') || l.includes('meeting') || l.includes('call') || l.includes('zoom') || l.includes('book') || l.includes('available') || l.includes('discuss') || l.includes('pricing') || l.includes('how much') || l.includes('cost'))
    return { type: 'MEETING_REQUEST', isPositiveInterest: true, isMeetingRequest: true, recommendedAction: 'STOP automation. Send booking link. Notify user.' }
  if (l.includes('interested') || l.includes('tell me more') || l.includes('sounds good') || l.includes('how does it work') || l.includes('send proposal') || l.includes('we need') || l.includes('been thinking about'))
    return { type: 'POSITIVE', isPositiveInterest: true, isMeetingRequest: false, recommendedAction: 'STOP automation. Notify user for human negotiation.' }
  if (l.includes('not interested') || l.includes('unsubscribe') || l.includes('remove') || l.includes('stop emailing') || l.includes('no thanks') || l.includes('already have'))
    return { type: 'NOT_INTERESTED', isPositiveInterest: false, isMeetingRequest: false, recommendedAction: 'Mark as LOST. Stop all outreach.' }
  if ((l.includes('http://') || l.includes('https://')) && (l.includes('.xyz') || l.includes('click here') || l.includes('free money')))
    return { type: 'SPAM', isPositiveInterest: false, isMeetingRequest: false, recommendedAction: 'Mark as spam.' }
  return { type: 'NEUTRAL', isPositiveInterest: false, isMeetingRequest: false, recommendedAction: 'Send value-add follow-up in 3-5 days.' }
}