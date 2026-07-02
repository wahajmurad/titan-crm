import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

function generateId(): string {
  return crypto.randomUUID()
}

// POST /api/ai/meeting-prep — generate an AI meeting brief
export async function POST(req: NextRequest) {
  try {
    // Demo mode: allow even without session
    await getSession()

    const { company, contactName, industry } = await req.json()

    const mockBrief = {
      id: generateId(),
      company: company || 'Prospect Company',
      contactName: contactName || 'Contact Name',
      industry: industry || 'Technology',
      createdAt: new Date().toISOString(),
      sections: {
        companyOverview: `${company || 'This company'} operates in the ${industry || 'technology'} sector. Our AI analysis indicates they have significant growth potential and are actively seeking solutions to improve their operational efficiency and market reach.`,
        keyDecisionMakers: `• **${contactName || 'Primary Contact'}** — Likely decision maker based on role and engagement pattern\n• Additional stakeholders may include CTO/CMO for technical decisions`,
        websiteAuditSummary: `• Website speed: Moderate (opportunity for improvement)\n• Mobile experience: Needs optimization\n• Lead capture: Basic form, no AI chatbot detected\n• Content quality: Good foundation, needs AI enhancement\n• Trust signals: Could be strengthened with testimonials and case studies`,
        businessProblems: `1. Inefficient lead generation processes\n2. Limited AI adoption in sales/marketing\n3. Manual follow-up workflows\n4. Underperforming website conversion rates\n5. No data-driven decision making`,
        recommendedSolutions: `1. AI-powered lead discovery targeting their ideal customer profile\n2. Automated personalized outreach campaigns\n3. Intelligent website chatbot for 24/7 lead capture\n4. Real-time analytics and performance dashboard\n5. Smart follow-up sequences based on prospect behavior`,
        estimatedROI: `Based on similar companies in the ${industry || 'technology'} sector:\n• Expected lead increase: 300-500%\n• Revenue impact: +$50K-200K annually\n• Time saved: 20+ hours/week on manual tasks\n• Payback period: 30-60 days`,
        potentialObjections: `1. "We already have a CRM" → Emphasize AI automation layer, not replacement\n2. "Budget concerns" → ROI-focused conversation, flexible pricing\n3. "We need to think about it" → Offer a 14-day pilot program\n4. "We tried AI before" → Show specific TITAN differentiators and case studies`,
        suggestedAgenda: `1. **Opening** (2 min) — Rapport building, confirm objectives\n2. **Discovery** (8 min) — Understand current challenges and goals\n3. **Demo** (15 min) — Show TITAN AI capabilities relevant to their needs\n4. **ROI Discussion** (5 min) — Present expected outcomes and timeline\n5. **Next Steps** (5 min) — Agree on pilot program or proposal`,
        talkingPoints: `• "Our AI has already analyzed your website and identified 3 key growth opportunities"\n• "Companies in your industry see 15-25% reply rates with our approach"\n• "You could start seeing results within the first 30 days"\n• "We offer a risk-free pilot — no long-term commitment required"`,
        closingStrategy: `Offer a **14-day pilot program** at reduced investment. This removes risk and lets them experience the value firsthand. If they see results (which they will), the decision to continue becomes obvious. Always end with a clear next step and specific date/time.`,
      },
    }

    return NextResponse.json({ success: true, brief: mockBrief })
  } catch (err) {
    console.error('[AI Meeting Prep]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate meeting brief' },
      { status: 500 },
    )
  }
}