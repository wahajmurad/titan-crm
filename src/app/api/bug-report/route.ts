import { NextRequest, NextResponse } from 'next/server'
import { aiAutoFix, runHealthCheck } from '@/lib/auto-heal'

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || 'glm-4-flash'

// ── Known error patterns for instant fixes (no AI needed) ──
const QUICK_FIXES: { pattern: RegExp; error: string; cause: string; file: string; fix: string; severity: string; code: string }[] = [
  {
    pattern: /internal server error|500/i,
    error: 'Internal Server Error (500)',
    cause: 'Server threw unhandled exception. #1 cause on Vercel: Prisma schema says "sqlite" but Vercel needs "postgresql".',
    file: 'prisma/schema.prisma',
    fix: 'Auto-heal will push a fix to switch schema to PostgreSQL.',
    severity: 'critical',
    code: 'auto-heal: fix schema provider sqlite → postgresql',
  },
  {
    pattern: /database|prisma|sqlite|postgres/i,
    error: 'Database Error',
    cause: 'Prisma cannot connect. On Vercel, SQLite is read-only. Must use PostgreSQL with valid DATABASE_URL.',
    file: 'prisma/schema.prisma + DATABASE_URL env',
    fix: 'Auto-heal will fix the schema. You need to set DATABASE_URL in Vercel env vars.',
    severity: 'critical',
    code: 'auto-heal: fix schema provider sqlite → postgresql',
  },
  {
    pattern: /not found|404/i,
    error: '404 Not Found',
    cause: 'Route or API endpoint missing.',
    file: 'src/app/ directory',
    fix: 'Check that the file exists at the correct path.',
    severity: 'medium',
    code: '// Verify the route exists:\n// src/app/api/leads/[id]/route.ts  ✅\n// src/app/api/leads/:id/route.ts   ❌',
  },
  {
    pattern: /authentication|unauthorized|401|403/i,
    error: 'Auth Error',
    cause: 'Session expired or invalid token.',
    file: 'Browser cookie',
    fix: 'Clear cookies: document.cookie = "titan_token=; expires=..."; location.reload()',
    severity: 'high',
    code: '// In browser console:\ndocument.cookie = "titan_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";\nlocation.reload();',
  },
  {
    pattern: /hydration|mismatch/i,
    error: 'Hydration Mismatch',
    cause: 'Server/client HTML differs. Usually Date.now(), Math.random() in SSR.',
    file: 'Component file',
    fix: 'Wrap browser-only code in useEffect.',
    severity: 'medium',
    code: '// ❌ <p>{new Date().toLocaleString()}</p>\n// ✅ const [now, setNow] = useState("")\n//     useEffect(() => setNow(new Date().toLocaleString()), [])\n//     return <p>{now}</p>',
  },
  {
    pattern: /css|style|tailwind|glass|dark mode/i,
    error: 'CSS / Styling Issue',
    cause: 'Missing CSS classes, dark mode mismatch, or glass utilities broken.',
    file: 'src/app/globals.css',
    fix: 'Check CSS variables are defined. Dark mode needs .dark class on <html>.',
    severity: 'low',
    code: '// Check globals.css has:\n// :root { --primary: oklch(...); }\n// .dark { --primary: oklch(...); }\n// .glass-header { backdrop-filter: blur(12px); }',
  },
]

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

    const searchText = `${description || ''} ${currentView || ''}`.toLowerCase()

    // ── Step 1: Quick pattern match ──
    const matched = QUICK_FIXES.find(p => p.pattern.test(searchText))

    if (matched && (matched.code === 'auto-heal: fix schema provider sqlite → postgresql')) {
      // Known critical fix — run auto-heal rules directly
      logs.push(`Known issue detected: ${matched.error}`)
      logs.push('Running auto-heal rules...')

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
            errorFound: matched.error,
            rootCause: matched.cause,
            affectedFile: fixed.file || matched.file,
            fixDescription: `${fixed.fix}. Vercel is redeploying — check back in 1 minute.`,
            fixCode: 'Auto-fixed via GitHub commit. No manual action needed.',
            severity: matched.severity,
            confidence: 0.95,
            commitUrl: fixed.commitUrl,
            autoFixed: true,
          },
        })
      }
    }

    // ── Step 2: AI-powered auto-fix ──
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
      logs.push('Vercel redeploying...')

      return NextResponse.json({
        success: true,
        autoFixed: true,
        logs,
        result: {
          errorFound: aiAnalysis?.error || result.issue,
          rootCause: aiAnalysis?.cause || result.fix,
          affectedFile: result.file || aiAnalysis?.file || 'unknown',
          fixDescription: `Auto-fixed! Code pushed to GitHub. Vercel will redeploy in ~60 seconds.`,
          fixCode: aiAnalysis?.code || 'Fix applied via auto-heal engine.',
          severity: 'high',
          confidence: 0.9,
          commitUrl: result.commitUrl,
          autoFixed: true,
        },
      })
    }

    // ── Step 3: AI detected but couldn't auto-push ──
    if (aiAnalysis) {
      logs.push('AI generated fix but could not auto-push (GITHUB_TOKEN needed)')

      return NextResponse.json({
        success: true,
        autoFixed: false,
        logs,
        result: {
          errorFound: aiAnalysis.error,
          rootCause: aiAnalysis.cause,
          affectedFile: aiAnalysis.file,
          fixDescription: 'AI generated the fix. Set GITHUB_TOKEN in Vercel env vars for auto-push, or apply manually.',
          fixCode: aiAnalysis.code,
          severity: 'medium',
          confidence: 0.75,
          autoFixed: false,
        },
      })
    }

    // ── Step 4: Fallback — no AI available ──
    const fallback = matched || {
      error: description || 'Unknown issue',
      cause: 'Could not auto-diagnose. Set AI_API_KEY and GITHUB_TOKEN in Vercel env vars.',
      file: 'Unknown',
      fix: 'Check Vercel function logs, verify DATABASE_URL and AI_API_KEY env vars.',
      severity: 'medium',
      code: '',
    }

    return NextResponse.json({
      success: true,
      autoFixed: false,
      logs,
      result: {
        errorFound: fallback.error,
        rootCause: fallback.cause,
        affectedFile: fallback.file,
        fixDescription: fallback.fix,
        fixCode: fallback.code,
        severity: fallback.severity,
        confidence: 0.6,
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