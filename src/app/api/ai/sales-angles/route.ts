import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { aiChat } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { industry, serviceName, targetAudience, competitorDifferentiator } = await req.json()

    const result = await aiChat([
      {
        role: 'system',
        content: `You are a master sales strategist and copywriter. Generate 10 unique sales angles for the given service targeting the specified audience. Each angle should:
- Sell OUTCOMES not technology
- Be specific to the industry
- Have a compelling hook
- Include a subject line for email
- Include a one-liner opening
- Include a value proposition statement
- Be emotionally resonant

Return valid JSON array: [
  {
    "angleName": "...",
    "hook": "...",
    "subjectLine": "...",
    "openingLine": "...",
    "valueProposition": "...",
    "emotionalTrigger": "...",
    "bestFor": "cold|warm|follow_up",
    "estimatedEffectiveness": "High|Medium|Low"
  }
]. Return ONLY valid JSON, no markdown.`,
      },
      {
        role: 'user',
        content: `Service: ${serviceName || 'AI Automation'}
Industry: ${industry || 'General'}
Target Audience: ${targetAudience || 'Business owners'}
Key Differentiator: ${competitorDifferentiator || 'AI-powered, personalized solutions'}`,
      },
    ])

    let parsed: unknown[] = []
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/)
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result)
    } catch {
      const arrMatch = result.match(/\[[\s\S]*\]/)
      if (arrMatch) parsed = JSON.parse(arrMatch[0])
    }

    return NextResponse.json({ angles: parsed })
  } catch (e) {
    console.error('[AI SALES ANGLES POST ERROR]', e)
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 })
  }
}