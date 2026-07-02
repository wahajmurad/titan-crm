import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sanitizeString } from '@/lib/types'

// GET /api/lead-providers — list all providers ordered by priority desc then createdAt desc
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const providers = await db.leadProvider.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ providers })
  } catch (e: unknown) {
    console.error('[LeadProviders GET ERROR]', e)
    return NextResponse.json({ error: 'Failed to fetch lead providers' }, { status: 500 })
  }
}

// POST /api/lead-providers — create new provider
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const {
      name,
      type,
      apiUrl,
      apiKey,
      authType,
      authHeader,
      authValue,
      headers,
      params,
      isActive,
      isDefault,
      priority,
      notes,
    } = data

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Provider name is required' }, { status: 400 })
    }

    // If setting as default, clear all other defaults first
    if (isDefault) {
      await db.leadProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const provider = await db.leadProvider.create({
      data: {
        name: sanitizeString(name),
        type: type || 'custom',
        apiUrl: apiUrl || null,
        apiKey: apiKey || null,
        authType: authType || 'none',
        authHeader: authHeader || null,
        authValue: authValue || null,
        headers: typeof headers === 'object' ? JSON.stringify(headers) : headers || null,
        params: typeof params === 'object' ? JSON.stringify(params) : params || null,
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        priority: priority ?? 0,
        notes: notes ? sanitizeString(notes) : null,
      },
    })

    return NextResponse.json({ success: true, provider }, { status: 201 })
  } catch (e: unknown) {
    console.error('[LeadProviders POST ERROR]', e)
    return NextResponse.json({ error: 'Failed to create lead provider' }, { status: 500 })
  }
}

// PUT /api/lead-providers — update provider by id (passed in body)
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const { id } = data

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 })
    }

    const existing = await db.leadProvider.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const {
      name,
      type,
      apiUrl,
      apiKey,
      authType,
      authHeader,
      authValue,
      headers,
      params,
      isActive,
      isDefault,
      priority,
      notes,
    } = data

    // If setting as default, clear all other defaults first
    if (isDefault) {
      await db.leadProvider.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = sanitizeString(name)
    if (type !== undefined) updateData.type = type
    if (apiUrl !== undefined) updateData.apiUrl = apiUrl || null
    if (apiKey !== undefined) updateData.apiKey = apiKey || null
    if (authType !== undefined) updateData.authType = authType
    if (authHeader !== undefined) updateData.authHeader = authHeader || null
    if (authValue !== undefined) updateData.authValue = authValue || null
    if (headers !== undefined) {
      updateData.headers = typeof headers === 'object' ? JSON.stringify(headers) : headers || null
    }
    if (params !== undefined) {
      updateData.params = typeof params === 'object' ? JSON.stringify(params) : params || null
    }
    if (isActive !== undefined) updateData.isActive = isActive
    if (isDefault !== undefined) updateData.isDefault = isDefault
    if (priority !== undefined) updateData.priority = priority
    if (notes !== undefined) updateData.notes = notes ? sanitizeString(notes) : null

    const provider = await db.leadProvider.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, provider })
  } catch (e: unknown) {
    console.error('[LeadProviders PUT ERROR]', e)
    return NextResponse.json({ error: 'Failed to update lead provider' }, { status: 500 })
  }
}

// DELETE /api/lead-providers — delete provider by id (passed in body)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const { id } = data

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 })
    }

    const existing = await db.leadProvider.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    await db.leadProvider.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('[LeadProviders DELETE ERROR]', e)
    return NextResponse.json({ error: 'Failed to delete lead provider' }, { status: 500 })
  }
}
