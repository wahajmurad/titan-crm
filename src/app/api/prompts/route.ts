import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sanitizeString } from '@/lib/types'

// GET /api/prompts — list prompt templates, filter by category
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.prompts?.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (category) where.category = sanitizeString(category)

    const prompts = await db.promptTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ prompts })
  } catch (e: unknown) {
    console.error('[Prompts GET ERROR]', e)
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
  }
}

// POST /api/prompts — create new prompt template
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.prompts?.canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, category, prompt, isDefault } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Prompt name is required' }, { status: 400 })
    }
    if (!category?.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt content is required' }, { status: 400 })
    }

    // If setting as default, unset other defaults in same category
    if (isDefault) {
      await db.promptTemplate.updateMany({
        where: { category: category.trim() },
        data: { isDefault: false },
      })
    }

    const created = await db.promptTemplate.create({
      data: {
        name: sanitizeString(name),
        category: sanitizeString(category),
        prompt: sanitizeString(prompt),
        isDefault: !!isDefault,
      },
    })

    return NextResponse.json({ prompt: created }, { status: 201 })
  } catch (e: unknown) {
    console.error('[Prompts POST ERROR]', e)
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 })
  }
}

// PATCH /api/prompts — update prompt template
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.prompts?.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, name, category, prompt, isDefault } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    const existing = await db.promptTemplate.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Prompt template not found' }, { status: 404 })

    // If setting as default in a category, unset others
    if (isDefault) {
      const targetCategory = category?.trim() || existing.category
      await db.promptTemplate.updateMany({
        where: { category: targetCategory, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = sanitizeString(name)
    if (category !== undefined) updateData.category = sanitizeString(category)
    if (prompt !== undefined) updateData.prompt = sanitizeString(prompt)
    if (isDefault !== undefined) updateData.isDefault = !!isDefault

    const updated = await db.promptTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ prompt: updated })
  } catch (e: unknown) {
    console.error('[Prompts PATCH ERROR]', e)
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
  }
}

// DELETE /api/prompts — delete prompt template
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.permissions.prompts?.canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Prompt ID query parameter is required' }, { status: 400 })
    }

    const existing = await db.promptTemplate.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Prompt template not found' }, { status: 404 })

    await db.promptTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('[Prompts DELETE ERROR]', e)
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 })
  }
}