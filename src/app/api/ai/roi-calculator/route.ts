import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { aiChat } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { companyName, industry, currentRevenue, employeeCount, painPoints, proposedSolutions } = await req.json()

    const result = await aiChat([
      {
        role: 'system',
        content: `You are a business ROI calculator and financial analyst. Given company information and proposed AI solutions, calculate:
1. Estimated implementation cost (monthly and one-time)
2. Expected time savings per week
3. Expected revenue increase percentage
4. Expected cost reduction percentage
5. Payback period in months
6. 12-month ROI percentage
7. 24-month ROI percentage
8. Net present value estimate

Return valid JSON: {
  "implementationCost": {"oneTime": "$X", "monthly": "$Y"},
  "timeSavings": {"hoursPerWeek": 0, "annualValue": "$X"},
  "revenueImpact": {"increasePercent": 0, "annualValue": "$X"},
  "costReduction": {"percent": 0, "annualValue": "$X"},
  "paybackPeriod": "X months",
  "roi": {"twelveMonth": 0, "twentyFourMonth": 0},
  "netValue": {"year1": "$X", "year2": "$X"},
  "assumptions": ["assumption1", "assumption2"],
  "confidence": "High|Medium|Low",
  "summary": "A 2-3 sentence executive summary of the ROI"
}. Return ONLY valid JSON, no markdown.`,
      },
      {
        role: 'user',
        content: `Company: ${companyName || 'Unknown'}
Industry: ${industry || 'Unknown'}
Current Revenue: ${currentRevenue || 'Unknown'}
Employees: ${employeeCount || 'Unknown'}
Pain Points: ${painPoints || 'None specified'}
Proposed AI Solutions: ${proposedSolutions || 'General AI automation'}

Calculate the ROI for implementing these AI solutions.`,
      },
    ])

    // Parse JSON from result
    let parsed: Record<string, unknown> = {}
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/)
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result)
    } catch {
      const objMatch = result.match(/\{[\s\S]*\}/)
      if (objMatch) parsed = JSON.parse(objMatch[0])
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[ROI Calculator]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'ROI calculation failed' }, { status: 500 })
  }
}