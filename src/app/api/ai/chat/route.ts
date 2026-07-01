import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { aiChat, aiIndustryExpert } from '@/lib/ai'

// POST /api/ai/chat — general AI chat endpoint
// Accepts two formats:
//   1. { message: string, context?: string } — simple chat
//   2. { messages: Array<{role, content}> } — multi-message chat (used by Strategy Assistant)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { message, context, messages } = body

    let response: string

    // Format 2: Pre-built messages array (from Strategy Assistant, etc.)
    if (Array.isArray(messages) && messages.length > 0) {
      response = await aiChat(messages)
    }
    // Format 1: Simple message string
    else if (message?.trim()) {
      if (context === 'industry_expert' || context === 'industry') {
        response = await aiIndustryExpert(message)
      } else {
        const chatMessages = [
          {
            role: 'system' as const,
            content: `You are an AI assistant for TITAN CRM, a B2B client acquisition platform. You help sales teams with lead research, email writing, campaign strategy, industry insights, and general sales productivity. Be concise, actionable, and specific. Format responses clearly with markdown when helpful.`,
          },
          {
            role: 'user' as const,
            content: message,
          },
        ]
        response = await aiChat(chatMessages)
      }
    } else {
      return NextResponse.json({ error: 'Message or messages is required' }, { status: 400 })
    }

    return NextResponse.json({ response })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}