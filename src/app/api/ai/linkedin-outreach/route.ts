import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiChat } from '@/lib/ai'

// ═══════════════════════════════════════════════════════════════════
// LINKEDIN OUTREACH — Relationship-First, NOT a Pitch
// Completely different from email. Focus on building familiarity.
// ═══════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { leadId, companyName, website, industry, decisionMaker, decisionMakerRole, personalizationNotes, researchData } = body

    // Resolve lead data
    let resolvedCompany = companyName
    let resolvedWebsite = website
    let resolvedIndustry = industry
    let resolvedDM = decisionMaker
    let resolvedRole = decisionMakerRole
    let resolvedNotes = personalizationNotes
    let businessId: string | null = null

    if (leadId) {
      const lead = await db.lead.findUnique({
        where: { id: leadId },
        include: { business: true },
      })
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      businessId = lead.businessId
      resolvedCompany = resolvedCompany || lead.business.name
      resolvedWebsite = resolvedWebsite || lead.business.website || undefined
      resolvedIndustry = resolvedIndustry || lead.business.industry || undefined
      resolvedDM = resolvedDM || lead.decisionMaker || undefined
      resolvedRole = resolvedRole || lead.decisionMakerRole || undefined
    }

    // Fetch CompanyIntel if available
    let intelNotes = resolvedNotes || ''
    if (businessId) {
      const intel = await db.companyIntel.findUnique({ where: { businessId } })
      if (intel) {
        intelNotes = intelNotes || intel.personalizationNotes || ''
        if (!resolvedNotes && intel.personalizationNotes) {
          resolvedNotes = intel.personalizationNotes
        }
      }
    }

    if (!resolvedCompany?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const prompt = `You are a master relationship builder on LinkedIn. You NEVER pitch immediately. You build genuine connections first.

Company: ${resolvedCompany}
Industry: ${resolvedIndustry || 'Unknown'}
Website: ${resolvedWebsite || 'N/A'}
Decision Maker: ${resolvedDM || 'Unknown'} (${resolvedRole || 'Unknown'})
Research Notes: ${resolvedNotes || researchData || 'No specific notes'}

Generate a LinkedIn engagement strategy. CRITICAL RULES:
1. NEVER pitch in the first message
2. Be genuinely interested in their work
3. Reference something specific about their company/industry
4. Sound like a real person, not a sales bot
5. Keep messages SHORT (under 150 words each)
6. Relationship-first = long-term value

Return JSON:
{
  "recommendedApproach": {
    "firstAction": "engage_post|view_profile|connect_first|wait",
    "reasoning": "why this approach for THIS specific person/company",
    "timeline": "suggested timeline for engagement",
    "warmUpSteps": ["step 1 before outreach", "step 2", "step 3"]
  },
  "connectionRequest": {
    "text": "under 300 characters, NO pitch, personalized to their company",
    "keyElement": "what makes this connection request feel personal"
  },
  "firstMessage": {
    "text": "first message after they accept — relationship focused, NOT a pitch",
    "goal": "what this message aims to achieve",
    "timing": "when to send (e.g. '1-2 days after connection')"
  },
  "followUpSequence": [
    {
      "day": "Day 3-5",
      "action": "like_post|comment|share_resource|send_message",
      "content": "what to do/say",
      "purpose": "why this action"
    },
    {
      "day": "Day 7-10",
      "action": "share_resource|ask_question|send_message",
      "content": "what to do/say",
      "purpose": "why this action"
    },
    {
      "day": "Day 14",
      "action": "value_message|ask_meeting|share_case_study",
      "content": "what to do/say",
      "purpose": "why this action"
    }
  ],
  "personalizationPoints": ["specific point 1 about their company to reference", "point 2", "point 3"],
  "redFlags": ["things to AVOID saying/doing with this specific company/person"],
  "conversationStarters": ["genuine question 1 about their work", "question 2", "question 3"]
}

Return valid JSON only. No markdown.`

    const rawResult = await aiChat(prompt, 0.6, 3000)

    // Parse JSON
    let parsed: Record<string, unknown>
    try {
      const cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : { raw: rawResult }
    } catch {
      parsed = { raw: rawResult }
    }

    return NextResponse.json({
      success: true,
      companyName: resolvedCompany,
      ...parsed,
    })
  } catch (e) {
    console.error('[AI LINKEDIN OUTREACH POST ERROR]', e)
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 })
  }
}