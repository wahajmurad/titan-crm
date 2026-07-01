import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { orchestratePipeline, runFullCompanyPipeline, parseAgentJSON, checkPersonalizationScore } from '@/lib/ai-agents'
import type { PipelineStep } from '@/lib/ai-agents'

// POST /api/ai/pipeline — Run a full multi-agent pipeline for a company
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { mode, params, steps: customSteps } = body

    let result

    if (mode === 'full_company' && params) {
      // Run the complete pipeline: Research → Audit → Business Intel → Solutions → Offer → Personalization
      result = await runFullCompanyPipeline(params)

      // Check personalization quality — if below 90%, flag it
      const personalizationStep = result.steps.find(s => s.agent === 'personalization')
      if (personalizationStep?.parsed) {
        const quality = checkPersonalizationScore(personalizationStep.parsed)
        if (!quality.passes) {
          // Append quality warning
          result.finalOutput['_personalizationWarning'] = 
            `Personalization score ${quality.score}/100 is below 90% threshold. Consider regenerating.`
        }
        result.finalOutput['_personalizationScore'] = quality.details
      }
    } else if (customSteps && Array.isArray(customSteps)) {
      // Run custom pipeline steps
      result = await orchestratePipeline(customSteps as PipelineStep[])
    } else {
      return NextResponse.json({ error: 'Provide mode=full_company with params, or custom steps array' }, { status: 400 })
    }

    return NextResponse.json({
      success: result.success,
      totalDuration: result.totalDuration,
      stepCount: result.steps.length,
      steps: result.steps.map(s => ({
        agent: s.agent,
        label: s.label,
        success: s.success,
        duration: s.duration,
        error: s.error,
        // Include parsed output for each step
        output: s.parsed,
      })),
      error: result.error,
    })
  } catch (err) {
    console.error('[Pipeline]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Pipeline execution failed' }, { status: 500 })
  }
}