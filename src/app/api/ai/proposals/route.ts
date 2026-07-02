import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

function generateId(): string {
  return crypto.randomUUID()
}

// POST /api/ai/proposals — generate an AI proposal
export async function POST(req: NextRequest) {
  try {
    // Demo mode: allow even without session
    await getSession()

    const { company, industry, services, budget, challenges } = await req.json()

    const mockProposal = {
      id: generateId(),
      title: `AI Growth Strategy — ${company || 'Your Company'}`,
      createdAt: new Date().toISOString(),
      sections: [
        {
          title: 'Executive Summary',
          content: `Based on our comprehensive analysis of ${company || 'your business'}, we have identified significant opportunities to leverage AI technology for revenue growth, operational efficiency, and competitive advantage. Our approach focuses on implementing targeted AI solutions that deliver measurable ROI within 90 days.`,
        },
        {
          title: 'Business Challenges',
          content: `Through our AI-powered audit and industry analysis, we identified the following key challenges:\n\n1. **Limited Online Visibility**: Your current digital presence doesn't fully capture your market potential\n2. **Manual Lead Generation**: Time-intensive prospecting processes limit scalability\n3. **No AI-Powered Follow-up**: Missing opportunities through lack of automated nurturing\n4. **Underutilized Data**: Customer insights not being leveraged for growth decisions`,
        },
        {
          title: 'Recommended AI Solutions',
          content: `**Phase 1 — Foundation (Weeks 1-4)**\n- AI-Powered Website Optimization\n- Intelligent Lead Discovery System\n- Automated Website Audit Reports\n- CRM Integration & Data Pipeline\n\n**Phase 2 — Growth (Weeks 5-8)**\n- Personalized AI Outreach Campaigns\n- Smart Follow-up Sequences\n- Meeting Scheduling Automation\n- Performance Analytics Dashboard\n\n**Phase 3 — Scale (Weeks 9-12)**\n- AI Proposal Generation\n- Competitive Intelligence System\n- Predictive Lead Scoring\n- Multi-Channel Campaign Automation`,
        },
        {
          title: 'Project Scope & Deliverables',
          content: `• Comprehensive AI audit of current systems\n• Custom AI agent configuration for your industry\n• 500+ qualified leads generated monthly\n• Personalized outreach campaigns\n• Real-time analytics dashboard\n• Weekly performance reports\n• Dedicated AI training sessions\n• 90-day growth roadmap\n• Ongoing optimization & support`,
        },
        {
          title: 'Estimated ROI',
          content: `Based on industry benchmarks and your business profile:\n\n| Metric | Current | With TITAN AI | Improvement |\n|--------|---------|---------------|-------------|\n| Monthly Leads | ~20 | 200-500 | 10-25x |\n| Reply Rate | 2-3% | 15-25% | 8-10x |\n| Meetings/Month | 2-3 | 15-30 | 10x |\n| Deal Close Rate | 5% | 15-20% | 3-4x |\n| Revenue Impact | Baseline | +300-500% | 3-5x |`,
        },
        {
          title: 'Investment',
          content: `**Starter Package**: $2,500/month — AI lead discovery + basic outreach\n**Growth Package**: $5,000/month — Full AI sales automation (Recommended)\n**Enterprise Package**: $10,000/month — Custom AI agents + dedicated support\n\nAll packages include: Setup, training, 24/7 AI operation, weekly reports, and continuous optimization.`,
        },
        {
          title: 'Implementation Roadmap',
          content: `Week 1-2: Discovery & Setup\nWeek 3-4: AI Configuration & Testing\nWeek 5-6: Campaign Launch & Optimization\nWeek 7-8: Scale & Expand\nWeek 9-10: Advanced Features\nWeek 11-12: Review & Plan Next Quarter\n\nMilestone reviews at each phase with performance reports.`,
        },
      ],
      totalValue: '$5,000/month',
      confidence: 87,
    }

    return NextResponse.json({ success: true, proposal: mockProposal })
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

    return NextResponse.json({ success: true, proposals: [] })
  } catch (err) {
    console.error('[AI Proposals]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch proposals' },
      { status: 500 },
    )
  }
}