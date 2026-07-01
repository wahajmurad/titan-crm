import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const workflows = await prisma.workflow.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(workflows)
  } catch (err) {
    console.error('[Workflows GET]', err)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, description, nodesJson, edgesJson, triggerType, status } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description: description || null,
        nodesJson: nodesJson || null,
        edgesJson: edgesJson || null,
        triggerType: triggerType || 'manual',
        status: status || 'DRAFT',
      },
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch (err) {
    console.error('[Workflows POST]', err)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}