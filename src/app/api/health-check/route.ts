import { NextResponse } from 'next/server'
import { runHealthCheck } from '@/lib/auto-heal'

// ═══════════════════════════════════════════════════════════════
//  GET /api/health-check
//  Called by Vercel Cron every 5 minutes
//  Silently checks & auto-fixes known issues
// ═══════════════════════════════════════════════════════════════

export const maxDuration = 30 // seconds

export async function GET() {
  const timestamp = new Date().toISOString()
  console.log(`[HEALTH CHECK] ${timestamp} — starting...`)

  try {
    const results = await runHealthCheck()

    const healthy = results.filter(r => r.action === 'healthy').length
    const fixed = results.filter(r => r.action === 'fixed').length
    const detected = results.filter(r => r.action === 'detected').length
    const failed = results.filter(r => r.action === 'failed').length

    // Log summary
    console.log(`[HEALTH CHECK] ${timestamp} — healthy:${healthy} fixed:${fixed} detected:${detected} failed:${failed}`)

    // Log each fixed issue
    for (const r of results) {
      if (r.action === 'fixed') {
        console.log(`[AUTO-HEAL] Fixed: ${r.issue} → ${r.fix} ${r.commitUrl ? `(${r.commitUrl})` : ''}`)
      }
    }

    // Return status for Vercel monitoring
    return NextResponse.json({
      status: healthy === results.length ? 'healthy' : fixed > 0 ? 'auto_fixed' : 'issues_detected',
      timestamp,
      summary: { healthy, fixed, detected, failed, total: results.length },
      results: results.map(r => ({
        action: r.action,
        issue: r.issue,
        fix: r.action === 'fixed' ? r.fix : undefined,
        commitUrl: r.commitUrl,
      })),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[HEALTH CHECK] ${timestamp} — FAILED:`, msg)
    return NextResponse.json({ status: 'error', timestamp, error: msg }, { status: 503 })
  }
}