import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { executeAgent, parseAgentJSON } from '@/lib/ai-agents'

// POST /api/ai/agent/run — Run a single agent with structured input
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { agent, input } = await req.json()
    if (!agent || !input) {
      return NextResponse.json({ error: 'agent and input are required' }, { status: 400 })
    }

    const startTime = Date.now()
    const rawOutput = await executeAgent(agent, input)
    const parsed = parseAgentJSON(rawOutput)
    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      agent,
      duration,
      raw: rawOutput,
      parsed,
    })
  } catch (err) {
    console.error('[Agent Run]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Agent execution failed' }, { status: 500 })
  }
}