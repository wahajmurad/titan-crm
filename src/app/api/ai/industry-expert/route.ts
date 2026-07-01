import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiChat } from '@/lib/ai'

const SYSTEM_PROMPT = `You are a senior business consultant and industry expert with 20+ years of experience. You provide comprehensive, actionable industry analysis. Your analysis must be detailed, specific, and immediately useful for a sales team selling AI and automation services.

For the given industry, provide a comprehensive analysis covering ALL of these sections. Use clear headings for each section:

## 1. Industry Overview
Provide a detailed overview of the industry including market size, growth trajectory, key characteristics, and current state of technology adoption.

## 2. Common Business Problems
List 8-12 specific, common problems businesses in this industry face. Be specific — not generic. Reference actual industry pain points.

## 3. Current Market Trends
Describe 6-8 current trends affecting this industry, including technology adoption, consumer behavior changes, regulatory changes, and competitive landscape shifts.

## 4. AI & Automation Opportunities
Identify 8-12 specific AI and automation opportunities for businesses in this industry. For each, explain: what it is, why it matters, and the potential ROI impact.

## 5. Services We Can Sell
List 8-12 specific services an AI/automation agency can sell to businesses in this industry. Include estimated pricing ranges and value propositions.

## 6. Outreach Strategy
Provide a detailed outreach strategy including: ideal customer profile, best channels to reach them, optimal timing, messaging frameworks, and follow-up sequences.

## 7. Email Angles & Templates
Provide 5-7 specific email subject line angles that work for this industry, with 2-3 example subject lines for each angle.

## 8. Objection Handling
List 8-10 common objections this industry's decision makers raise, with specific, effective responses for each.

## 9. Closing Strategies
Provide 5-7 closing strategies and techniques specifically effective for this industry.

## 10. Offer Recommendations
Suggest 3-5 specific offer structures (packages, pricing tiers, guarantees) that would convert well for this industry.

Be thorough, specific, and actionable. Use real industry knowledge. Avoid generic advice — everything should be tailored to the specific industry requested.`

// POST /api/ai/industry-expert — generate comprehensive industry analysis
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { industry, context } = await req.json()

    if (!industry?.trim()) {
      return NextResponse.json({ error: 'industry is required' }, { status: 400 })
    }

    const userMessage = `Analyze the following industry in comprehensive detail: ${industry}${context ? `\nAdditional context: ${context}` : ''}`

    const result = await aiChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ])

    await db.activity.create({
      data: {
        userId: session.id,
        action: 'INDUSTRY_ANALYSIS',
        details: `Industry analysis generated for: ${industry}`,
      },
    })

    return NextResponse.json({ result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}