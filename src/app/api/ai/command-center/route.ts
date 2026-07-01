import { NextRequest, NextResponse } from 'next/server'
import { commandCenter } from '@/lib/ai-agents'

export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json()
    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 })
    }

    const result = commandCenter(command)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[Command Center]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Command failed' }, { status: 500 })
  }
}