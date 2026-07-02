import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { aiChat } from '@/lib/ai'

// POST /api/ai/proposals — generate an AI proposal
export async function POST(req: NextRequest) {
  try {
    // Demo mode: allow even without session
    await getSession()

    const { company, industry, services, budget, challenges } = await req.json()

    const companyName = company || 'Your Company'
    const industryName = industry || 'Technology'
    const servicesList = services || 'AI-powered lead generation and sales automation'
    const budgetRange = budget || 'To be discussed'
    const challengesList = challenges || 'Improving lead generation and conversion rates'

    const systemPrompt = `You are an expert B2B proposal writer for TITAN CRM, an AI-powered client acquisition platform. You create compelling, professional proposals that focus on outcomes and ROI. Always be specific to the company and industry mentioned. Format responses in valid JSON. Return JSON with: {"sections": [{"title": "...", "content": "..."}], "totalValue": "...", "confidence": <number 0-100>}. Include 5-7 sections covering: Executive Summary, Business Challenges, Recommended AI Solutions, Project Scope & Deliverables, Estimated ROI, Investment, and Implementation Roadmap. Use markdown for formatting. Return ONLY valid JSON, no markdown code blocks.`

    const userPrompt = `Generate a professional AI services proposal for:\n\nCompany: ${companyName}\nIndustry: ${industryName}\nServices Requested: ${servicesList}\nBudget: ${budgetRange}\nKey Challenges: ${challengesList}\n\nCreate a specific, compelling proposal tailored to this company. Include specific metrics, realistic timelines, and clear value propositions.`

    const aiResponse = await aiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    let proposal
    try {
      // Strip markdown code block wrappers if present
      let cleaned = aiResponse.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
      }
      proposal = JSON.parse(cleaned)
    } catch {
      // If parsing fails, wrap the response as a single-section proposal
      proposal = {
        sections: [
          { title: 'AI Growth Strategy', content: aiResponse },
        ],
        totalValue: budgetRange,
        confidence: 70,
      }
    }

    const result = {
      id: crypto.randomUUID(),
      title: `AI Growth Strategy — ${companyName}`,
      createdAt: new Date().toISOString(),
      ...proposal,
    }

    // Optionally save to GeneratedAsset
    try {
      await db.generatedAsset.create({
        data: {
          type: 'proposal',
          title: result.title,
          content: JSON.stringify(result),
          metadata: JSON.stringify({ company: companyName, industry: industryName, budget: budgetRange }),
        },
      })
    } catch (saveErr) {
      console.warn('[AI Proposals] Could not save to GeneratedAsset:', saveErr)
    }

    return NextResponse.json({ success: true, proposal: result })
  } catch (err) {
    console.error('[AI Proposals]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate proposal' },
      { status: 500 },
    )
  }
}

// GET /api/ai/proposals — list saved proposals
export async function GET() {
  try {
    await getSession()

    const proposals = await db.generatedAsset.findMany({
      where: { type: { contains: 'proposal' } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const formatted = proposals.map((p) => {
      let parsed = {}
      try {
        parsed = JSON.parse(p.content)
      } catch {
        // content may not be valid JSON
      }

      return {
        id: p.id,
        title: p.title,
        createdAt: p.createdAt.toISOString(),
        ...(typeof parsed === 'object' ? parsed : {}),
      }
    })

    return NextResponse.json({ success: true, proposals: formatted })
  } catch (err) {
    console.error('[AI Proposals]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch proposals' },
      { status: 500 },
    )
  }
}