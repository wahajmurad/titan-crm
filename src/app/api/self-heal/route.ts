import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════════
//  GET /api/self-heal — Return auto-heal config status
// ═══════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tokenSetting = await db.appSetting.findUnique({ where: { key: 'autoheal_gh_token' } })
    const repoSetting = await db.appSetting.findUnique({ where: { key: 'autoheal_gh_repo' } })
    const lastCheck = await db.appSetting.findUnique({ where: { key: 'autoheal_last_check' } })
    const lastFix = await db.appSetting.findUnique({ where: { key: 'autoheal_last_fix' } })
    const totalFixes = await db.appSetting.findUnique({ where: { key: 'autoheal_total_fixes' } })

    const hasToken = !!tokenSetting?.value && tokenSetting.value.length > 10
    const hasRepo = !!repoSetting?.value

    return NextResponse.json({
      configured: hasToken && hasRepo,
      hasToken,
      hasRepo,
      tokenPreview: hasToken ? `${tokenSetting.value.slice(0, 7)}...` : null,
      repo: repoSetting?.value || null,
      lastCheck: lastCheck?.value || null,
      lastFix: lastFix?.value || null,
      totalFixes: totalFixes?.value ? parseInt(totalFixes.value, 10) : 0,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════
//  POST /api/self-heal — Save GitHub token + repo config
// ═══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'OWNER') return NextResponse.json({ error: 'Only the owner can configure auto-heal.' }, { status: 403 })

    const body = await req.json()
    const { github_token, github_repo } = body

    if (github_token !== undefined) {
      const token = String(github_token).trim()
      if (token.length > 0 && (!token.startsWith('ghp_') && !token.startsWith('github_pat_'))) {
        return NextResponse.json({ error: 'Invalid GitHub token format. Must start with ghp_ or github_pat_' }, { status: 400 })
      }
      await db.appSetting.upsert({
        where: { key: 'autoheal_gh_token' },
        update: { value: token },
        create: { key: 'autoheal_gh_token', value: token },
      })
    }

    if (github_repo !== undefined) {
      const repo = String(github_repo).trim()
      if (repo.length > 0 && !repo.includes('/')) {
        return NextResponse.json({ error: 'Invalid repo format. Use: owner/repo-name' }, { status: 400 })
      }
      await db.appSetting.upsert({
        where: { key: 'autoheal_gh_repo' },
        update: { value: repo },
        create: { key: 'autoheal_gh_repo', value: repo },
      })
    }

    return NextResponse.json({ success: true, message: 'Auto-heal configuration saved.' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════
//  DELETE /api/self-heal — Clear stored token
// ═══════════════════════════════════════════════════════════════

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'OWNER') return NextResponse.json({ error: 'Only the owner can modify auto-heal.' }, { status: 403 })

    await db.appSetting.deleteMany({ where: { key: { in: ['autoheal_gh_token', 'autoheal_gh_repo'] } } })

    return NextResponse.json({ success: true, message: 'Auto-heal configuration cleared.' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}