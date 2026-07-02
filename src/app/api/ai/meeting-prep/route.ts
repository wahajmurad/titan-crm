import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { aiChat } from '@/lib/ai'

// POST /api/ai/meeting-prep — generate an AI meeting brief
export async function POST(req: NextRequest) {
  try {
    // Demo mode: allow even without session
    await getSession()

    const { company, contactName, industry } = await req.json()

    const companyName = company || 'Prospect Company'
    const contact = contactName || 'Contact Name'
    const industryName = industry || 'Technology'

    // 1. Gather real data about the company from the DB
    let dbContext = ''

    const [businesses, companyIntels] = await Promise.all([
      db.business.findMany({
        where: { name: { contains: companyName, mode: 'insensitive' } },
        include: {
          lead: true,
          audit: true,
        },
        take: 3,
      }),
      db.companyIntel.findMany({
        where: { business: { name: { contains: companyName, mode: 'insensitive' } } },
        include: { business: true },
        take: 3,
      }),
    ])

    if (businesses.length > 0) {
      const biz = businesses[0]
      dbContext += `## Known Business Data\n`
      dbContext += `- Name: ${biz.name}\n`
      if (biz.website) dbContext += `- Website: ${biz.website}\n`
      if (biz.industry) dbContext += `- Industry: ${biz.industry}\n`
      if (biz.city || biz.country) dbContext += `- Location: ${[biz.city, biz.country].filter(Boolean).join(', ')}\n`
      if (biz.companySize) dbContext += `- Size: ${biz.companySize}\n`

      const lead = biz.lead
      if (lead) {
        if (lead.decisionMaker) dbContext += `- Decision Maker: ${lead.decisionMaker} (${lead.decisionMakerRole || 'Unknown role'})\n`
        if (lead.temperature) dbContext += `- Lead Temperature: ${lead.temperature}\n`
        if (lead.score) dbContext += `- Lead Score: ${lead.score}/100\n`
        if (lead.problems) dbContext += `- Known Problems: ${lead.problems}\n`
        if (lead.recommendedSolution) dbContext += `- Recommended Solution: ${lead.recommendedSolution}\n`
        if (lead.aiAnalysis) dbContext += `- AI Analysis: ${lead.aiAnalysis}\n`
      }

      const audit = biz.audit
      if (audit) {
        dbContext += `\n## Website Audit (Score: ${audit.overallScore}/100)\n`
        if (audit.executiveSummary) dbContext += `- Summary: ${audit.executiveSummary}\n`
        if (audit.problemsFound) dbContext += `- Problems Found: ${audit.problemsFound}\n`
        if (audit.opportunities) dbContext += `- Opportunities: ${audit.opportunities}\n`
        if (audit.recommendations) dbContext += `- Recommendations: ${audit.recommendations}\n`
        if (audit.talkingPoints) dbContext += `- Talking Points: ${audit.talkingPoints}\n`
      }
    }

    if (companyIntels.length > 0) {
      const intel = companyIntels[0]
      dbContext += `\n## Company Intelligence\n`
      if (intel.businessOverview) dbContext += `- Overview: ${intel.businessOverview}\n`
      if (intel.coreServices) dbContext += `- Core Services: ${intel.coreServices}\n`
      if (intel.painPoints) dbContext += `- Pain Points: ${intel.painPoints}\n`
      if (intel.growthOpportunities) dbContext += `- Growth Opportunities: ${intel.growthOpportunities}\n`
      if (intel.strengths) dbContext += `- Strengths: ${intel.strengths}\n`
      if (intel.weaknesses) dbContext += `- Weaknesses: ${intel.weaknesses}\n`
      if (intel.estimatedRevenue) dbContext += `- Estimated Revenue: ${intel.estimatedRevenue}\n`
    }

    // 2. Build the prompt
    const systemPrompt = `You are an expert sales meeting preparation assistant for TITAN CRM, a B2B AI-powered client acquisition platform. You prepare detailed, actionable meeting briefs that help sales representatives close deals. Always be specific, data-driven, and provide real value. Format responses in valid JSON. Return JSON with exactly these keys: {"companyOverview": "...", "keyDecisionMakers": "...", "websiteAuditSummary": "...", "businessProblems": "...", "recommendedSolutions": "...", "estimatedROI": "...", "potentialObjections": "...", "suggestedAgenda": "...", "talkingPoints": "...", "closingStrategy": "..."}. Each value should be a detailed string with line breaks. Use markdown formatting for emphasis. Return ONLY valid JSON, no markdown code blocks.`

    const userPrompt = `Prepare a meeting brief for the following:\n\nCompany: ${companyName}\nContact: ${contact}\nIndustry: ${industryName}\n${dbContext ? `\nHere is what we already know about this company from our database:\n${dbContext}` : '\nNo existing data found in our database. Use general industry knowledge.'}\n\nGenerate a comprehensive, specific meeting brief that the sales rep can use immediately.`

    const aiResponse = await aiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    // 3. Parse the AI response into sections
    let sections: Record<string, string>
    try {
      // Strip markdown code block wrappers if present
      let cleaned = aiResponse.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
      }
      sections = JSON.parse(cleaned)
    } catch {
      // If parsing fails, put the entire response in companyOverview
      sections = {
        companyOverview: aiResponse,
        keyDecisionMakers: `• **${contact}** — Primary contact for this meeting`,
        websiteAuditSummary: 'No audit data available for this company.',
        businessProblems: 'Not yet identified. Use the meeting to discover pain points.',
        recommendedSolutions: 'To be determined based on discovery in the meeting.',
        estimatedROI: 'To be discussed based on scope identified in the meeting.',
        potentialObjections: 'Common objections to address: budget, timing, existing tools.',
        suggestedAgenda: '1. Opening (2 min)\n2. Discovery (10 min)\n3. Demo (15 min)\n4. Next Steps (5 min)',
        talkingPoints: aiResponse.substring(0, 500),
        closingStrategy: 'Propose a pilot program to reduce risk and demonstrate value.',
      }
    }

    const brief = {
      id: crypto.randomUUID(),
      company: companyName,
      contactName: contact,
      industry: industryName,
      createdAt: new Date().toISOString(),
      sections,
    }

    return NextResponse.json({ success: true, brief })
  } catch (err) {
    console.error('[AI Meeting Prep]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate meeting brief' },
      { status: 500 },
    )
  }
}