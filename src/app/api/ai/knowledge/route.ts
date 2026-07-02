import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const mockKnowledge = [
  {
    id: '1',
    type: 'audit',
    title: 'Acme Corp — Website Audit',
    company: 'Acme Corp',
    industry: 'Technology',
    score: 72,
    createdAt: '2 days ago',
    summary:
      'Identified 8 optimization opportunities including missing AI chatbot, slow load times, and weak lead capture.',
  },
  {
    id: '2',
    type: 'email',
    title: 'Cold Email — Law Firms NYC',
    company: 'Multiple',
    industry: 'Legal',
    score: 85,
    createdAt: '3 days ago',
    summary:
      'ROI-focused email sequence achieved 23% reply rate for Manhattan law firms.',
  },
  {
    id: '3',
    type: 'campaign',
    title: 'Q4 Healthcare Outreach',
    company: 'Multiple',
    industry: 'Healthcare',
    score: 91,
    createdAt: '1 week ago',
    summary:
      'Multi-channel campaign generated 47 meetings from 500 leads. Best performing campaign this quarter.',
  },
  {
    id: '4',
    type: 'proposal',
    title: 'AI Strategy — TechStart Inc',
    company: 'TechStart Inc',
    industry: 'SaaS',
    score: 78,
    createdAt: '1 week ago',
    summary:
      'Comprehensive AI growth proposal with 12-month roadmap. Client interested in Phase 2.',
  },
  {
    id: '5',
    type: 'research',
    title: 'Dental Industry Analysis',
    company: 'Multiple',
    industry: 'Dental',
    score: 88,
    createdAt: '2 weeks ago',
    summary:
      'Deep analysis of 200+ dental practices. Key insight: practices with 5+ reviews respond 3x better.',
  },
  {
    id: '6',
    type: 'workflow',
    title: 'Automated Qualification Pipeline',
    company: 'Internal',
    industry: 'All',
    score: 95,
    createdAt: '2 weeks ago',
    summary:
      'Custom workflow that discovers → audits → qualifies → scores leads automatically. Processes 100 leads/hour.',
  },
  {
    id: '7',
    type: 'email',
    title: 'Follow-up Sequence — Real Estate',
    company: 'Multiple',
    industry: 'Real Estate',
    score: 82,
    createdAt: '3 weeks ago',
    summary:
      '5-step follow-up sequence with case study attachments. 18% conversion to meetings.',
  },
  {
    id: '8',
    type: 'audit',
    title: 'Growth Blueprint — Nexus Digital',
    company: 'Nexus Digital',
    industry: 'Marketing',
    score: 76,
    createdAt: '3 weeks ago',
    summary:
      'Complete growth blueprint identifying $150K+ in untapped revenue opportunities.',
  },
]

// GET /api/ai/knowledge — return AI knowledge base entries
export async function GET(req: NextRequest) {
  try {
    // Demo mode: allow even without session
    await getSession()

    const { searchParams } = req.nextUrl
    const search = searchParams.get('search')?.toLowerCase().trim() || ''
    const type = searchParams.get('type')?.trim() || ''

    let filtered = mockKnowledge

    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          item.company.toLowerCase().includes(search) ||
          item.industry.toLowerCase().includes(search),
      )
    }

    if (type) {
      filtered = filtered.filter((item) => item.type === type)
    }

    return NextResponse.json({ success: true, items: filtered, total: filtered.length })
  } catch (err) {
    console.error('[AI Knowledge]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch knowledge base' },
      { status: 500 },
    )
  }
}