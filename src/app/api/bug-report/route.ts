import { NextRequest, NextResponse } from 'next/server'
import { aiAutoFix, runHealthCheck } from '@/lib/auto-heal'

// ═══════════════════════════════════════════════════════════════
//  POST /api/bug-report — User reports bug, system auto-fixes
// ═══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const logs: string[] = []
  logs.push(`[${new Date().toISOString()}] Bug report received`)

  try {
    const body = await req.json()
    const { screenshot, description, currentView } = body

    logs.push(`Page: ${currentView || 'unknown'}`)
    logs.push(`Screenshot: ${screenshot ? 'yes' : 'no'}`)
    logs.push(`Description: ${description || 'none'}`)

    // ── Quick pattern match for known issues ──
    const searchText = `${description || ''} ${currentView || ''}`.toLowerCase()

    if (/internal server error|500|database|prisma|sqlite|postgres/i.test(searchText)) {
      logs.push('Known database/schema issue detected, running auto-heal rules...')
      const healthResults = await runHealthCheck()
      const fixed = healthResults.find(r => r.action === 'fixed')

      if (fixed) {
        logs.push(`AUTO-FIXED: ${fixed.issue}`)
        logs.push(`Commit: ${fixed.commitUrl || 'pushed'}`)
        logs.push('Vercel will redeploy in ~60 seconds...')

        return NextResponse.json({
          success: true,
          autoFixed: true,
          logs,
          result: {
            errorFound: fixed.issue,
            rootCause: fixed.fix,
            affectedFile: fixed.file || 'auto-heal engine',
            fixDescription: 'Auto-fixed! Code pushed to GitHub. Vercel will redeploy in ~60 seconds.',
            fixCode: 'Fix applied via auto-heal engine. No manual action needed.',
            severity: 'high',
            confidence: 0.95,
            commitUrl: fixed.commitUrl,
            autoFixed: true,
          },
        })
      }
    }

    // ── AI-powered auto-fix ──
    logs.push('Running AI auto-fix analysis...')

    const { result, aiAnalysis } = await aiAutoFix({
      screenshot,
      description: description || searchText,
      currentView: currentView || 'unknown',
      logs,
    })

    if (result.action === 'fixed') {
      logs.push(`AUTO-FIXED: ${result.issue}`)
      logs.push(`Commit: ${result.commitUrl}`)
      logs.push('Vercel is redeploying...')

      return NextResponse.json({
        success: true,
        autoFixed: true,
        logs,
        result: {
          errorFound: aiAnalysis?.error || result.issue,
          rootCause: aiAnalysis?.cause || result.fix,
          affectedFile: result.file || aiAnalysis?.file || 'unknown',
          fixDescription: 'Auto-fixed! Code pushed to GitHub. Vercel will redeploy in ~60 seconds.',
          fixCode: aiAnalysis?.code || 'Fix applied via auto-heal engine.',
          severity: 'high',
          confidence: 0.9,
          commitUrl: result.commitUrl,
          autoFixed: true,
        },
      })
    }

    // ── AI detected but couldn't auto-push (no token) ──
    if (aiAnalysis) {
      logs.push('AI generated fix but could not auto-push')

      return NextResponse.json({
        success: true,
        autoFixed: false,
        logs,
        result: {
          errorFound: aiAnalysis.error,
          rootCause: aiAnalysis.cause,
          affectedFile: aiAnalysis.file,
          fixDescription: 'AI generated the fix. Go to Settings → Auto-Heal and add your GitHub token to enable automatic push.',
          fixCode: aiAnalysis.code,
          severity: 'medium',
          confidence: 0.75,
          autoFixed: false,
        },
      })
    }

    // ── Fallback ──
    return NextResponse.json({
      success: true,
      autoFixed: false,
      logs,
      result: {
        errorFound: description || 'Unknown issue',
        rootCause: 'Could not auto-diagnose.',
        affectedFile: 'Unknown',
        fixDescription: 'Could not analyze this issue. Try providing a screenshot or more details.',
        fixCode: '',
        severity: 'medium',
        confidence: 0.5,
        autoFixed: false,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logs.push(`Fatal error: ${msg}`)
    console.error('[BUG REPORT]', e)
    return NextResponse.json({ error: msg, logs }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET /api/bug-report — Manual health check trigger
// ═══════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const results = await runHealthCheck()
    const issues = results.filter(r => r.action !== 'healthy')
    const fixed = results.filter(r => r.action === 'fixed')

    return NextResponse.json({
      status: issues.length === 0 ? 'all_clear' : 'issues_found',
      results,
      summary: {
        healthy: results.filter(r => r.action === 'healthy').length,
        detected: results.filter(r => r.action === 'detected').length,
        fixed: fixed.length,
        failed: results.filter(r => r.action === 'failed').length,
      },
      lastChecked: new Date().toISOString(),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg, status: 'error' }, { status: 500 })
  }
}