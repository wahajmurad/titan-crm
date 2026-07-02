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
  } catch (e) {
    console.error('[AI COMMAND CENTER POST ERROR]', e)
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 })
  }
}