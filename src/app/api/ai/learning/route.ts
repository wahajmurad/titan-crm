import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { executeAgent } from '@/lib/ai-agents'

// GET — Retrieve learning insights
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const memories = await prisma.aIMemory.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    // Group by category
    const grouped: Record<string, any[]> = {}
    for (const m of memories) {
      const cat = m.category
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push({ ...m, value: JSON.parse(m.value || '{}') })
    }

    return NextResponse.json({ memories: grouped, total: memories.length })
  } catch (err) {
    console.error('[Learning GET]', err)
    return NextResponse.json({ error: 'Failed to fetch learning data' }, { status: 500 })
  }
}

// POST — Run learning analysis and store insights
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type } = await req.json()

    if (type === 'analyze_performance') {
      // Gather performance data
      const [outreachStats, campaignStats, leadStats] = await Promise.all([
        prisma.outreach.groupBy({ by: ['status'], _count: true }),
        prisma.campaign.findMany({ select: { sentCount: true, replyCount: true, meetingCount: true, wonCount: true, industry: true } }),
        prisma.lead.groupBy({ by: ['stage'], _count: true }),
      ])

      const performanceData = JSON.stringify({
        outreachByStatus: outreachStats,
        campaigns: campaignStats,
        leadsByStage: leadStats,
      })

      const result = await executeAgent('learning', {
        performanceData,
        industry: 'mixed',
        campaignHistory: performanceData,
      })

      // Try to parse and store insights
      try {
        let parsed = JSON.parse(result)
        if (!Array.isArray(parsed) && parsed.patterns) {
          // Store patterns as memories
          if (Array.isArray(parsed.patterns)) {
            for (const pattern of parsed.patterns.slice(0, 10)) {
              const memKey = `pattern_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
              await prisma.aIMemory.upsert({
                where: { category_key: { category: 'system_learning', key: memKey } },
                create: {
                  category: 'system_learning',
                  key: memKey,
                  value: JSON.stringify(pattern),
                  confidence: pattern.confidence || 0.5,
                  source: 'auto',
                },
                update: { value: JSON.stringify(pattern) },
              })
            }
          }
        }
      } catch {
        // Store raw result if not parseable
      }

      return NextResponse.json({ insights: result, success: true })
    }

    if (type === 'store_memory') {
      const { category, key, value, confidence, source } = await req.json()
      if (!category || !key || !value) {
        return NextResponse.json({ error: 'category, key, and value required' }, { status: 400 })
      }

      const memory = await prisma.aIMemory.upsert({
        where: { category_key: { category, key } },
        create: {
          category,
          key,
          value: JSON.stringify(value),
          confidence: confidence || 0.5,
          source: source || 'manual',
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
        update: {
          value: JSON.stringify(value),
          confidence: confidence || undefined,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({ memory, success: true })
    }

    return NextResponse.json({ error: 'Invalid type. Use analyze_performance or store_memory' }, { status: 400 })
  } catch (e) {
    console.error('[AI LEARNING POST ERROR]', e)
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 })
  }
}