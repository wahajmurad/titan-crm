import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { aiChat, aiIndustryExpert } from '@/lib/ai'

// POST /api/ai/chat — general AI chat endpoint
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, context } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let response: string

    if (context === 'industry_expert' || context === 'industry') {
      // Use industry expert for industry-specific queries
      response = await aiIndustryExpert(message)
    } else {
      // General chat with conversation context
      const messages = [
        {
          role: 'system' as const,
          content: `You are an AI assistant for TITAN CRM, a B2B client acquisition platform. You help sales teams with lead research, email writing, campaign strategy, industry insights, and general sales productivity. Be concise, actionable, and specific. Format responses clearly with markdown when helpful.`,
        },
        {
          role: 'user' as const,
          content: message,
        },
      ]
      response = await aiChat(messages)
    }

    return NextResponse.json({ response })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}