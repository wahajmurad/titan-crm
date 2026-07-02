// ═══════════════════════════════════════════════════════════════
//  TITAN Auto-Heal Engine
//  Detects, diagnoses, and auto-fixes issues via GitHub API
//  Triggers Vercel redeploy on every fix
// ═══════════════════════════════════════════════════════════════

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const GITHUB_REPO = process.env.GITHUB_REPO || 'wahajmurad/titan-crm'
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || 'glm-4-flash'

export interface HealResult {
  action: 'fixed' | 'detected' | 'healthy' | 'failed'
  issue: string
  fix: string
  file?: string
  commitUrl?: string
  details?: string
}

// ── GitHub API helpers ──────────────────────────────────────

async function githubGet(path: string): Promise<{ sha: string; content: string; encoding: string } | null> {
  if (!GITHUB_TOKEN) return null
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' },
    })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

async function githubPush(filePath: string, content: string, message: string): Promise<{ commitUrl: string } | null> {
  if (!GITHUB_TOKEN) {
    console.log('[AUTO-HEAL] No GITHUB_TOKEN set — cannot push fix')
    return null
  }

  try {
    // Get current file SHA
    const existing = await githubGet(filePath)
    const base64Content = Buffer.from(content, 'utf-8').toString('base64')

    const body: Record<string, unknown> = {
      message,
      content: base64Content,
      branch: 'main',
    }
    if (existing?.sha) {
      body.sha = existing.sha
    }

    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[AUTO-HEAL] GitHub push failed: ${res.status}`, err.substring(0, 200))
      return null
    }

    const data = await res.json()
    return {
      commitUrl: data.commit?.html_url || `https://github.com/${GITHUB_REPO}/commit/${data.commit?.sha}`,
    }
  } catch (e) {
    console.error('[AUTO-HEAL] GitHub push error:', e)
    return null
  }
}

// ── AI Helper ───────────────────────────────────────────────

async function aiChat(prompt: string, system?: string): Promise<string | null> {
  if (!AI_API_KEY) return null
  try {
    const messages: { role: string; content: string }[] = []
    if (system) messages.push({ role: 'system', content: system })
    messages.push({ role: 'user', content: prompt })

    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({ model: AI_MODEL, messages, max_tokens: 3000, temperature: 0.3 }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch { return null }
}

// ── Known Auto-Fixes ────────────────────────────────────────

interface AutoFixRule {
  name: string
  detect: () => Promise<boolean>
  fix: () => Promise<{ fixed: boolean; message: string; file?: string }>
}

const AUTO_FIX_RULES: AutoFixRule[] = [
  // Rule 1: Schema says sqlite but should be postgresql (Vercel can't use SQLite)
  {
    name: 'Schema provider check (sqlite → postgresql)',
    detect: async () => {
      const file = await githubGet('prisma/schema.prisma')
      if (!file) return false
      const content = Buffer.from(file.content, file.encoding === 'base64' ? 'base64' : 'utf-8').toString('utf-8')
      return content.includes('provider  = "sqlite"') || content.includes('provider = "sqlite"')
    },
    fix: async () => {
      const file = await githubGet('prisma/schema.prisma')
      if (!file) return { fixed: false, message: 'Could not read schema.prisma' }

      let content = Buffer.from(file.content, file.encoding === 'base64' ? 'base64' : 'utf-8').toString('utf-8')
      content = content.replace(/provider\s*=\s*"sqlite"/g, 'provider  = "postgresql"')

      const result = await githubPush('prisma/schema.prisma', content, 'auto-heal: fix schema provider sqlite → postgresql')
      return {
        fixed: !!result,
        message: result ? 'Schema fixed to PostgreSQL, Vercel will redeploy' : 'Failed to push fix',
        file: 'prisma/schema.prisma',
      }
    },
  },

  // Rule 2: Check db.ts has no leftover SQLite connection logic
  {
    name: 'db.ts connection check',
    detect: async () => {
      const file = await githubGet('src/lib/db.ts')
      if (!file) return false
      const content = Buffer.from(file.content, file.encoding === 'base64' ? 'base64' : 'utf-8').toString('utf-8')
      // If it has sqlite specific code, flag it
      return content.includes('better-sqlite3') || content.includes('.db')
    },
    fix: async () => {
      const fixedContent = `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: ['error'],
    ...(process.env.DATABASE_URL?.includes('pooler') ? {
      datasources: { db: { url: process.env.DATABASE_URL } },
    } : {}),
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
`
      const result = await githubPush('src/lib/db.ts', fixedContent, 'auto-heal: clean db.ts for PostgreSQL serverless')
      return { fixed: !!result, message: result ? 'db.ts fixed for PostgreSQL' : 'Failed to push db.ts fix', file: 'src/lib/db.ts' }
    },
  },

  // Rule 3: Check middleware.ts doesn't exist (Next.js 16 requires proxy.ts)
  {
    name: 'middleware.ts → proxy.ts check',
    detect: async () => {
      const middleware = await githubGet('src/middleware.ts')
      const proxy = await githubGet('src/proxy.ts')
      return !!middleware && !proxy
    },
    fix: async () => {
      const middleware = await githubGet('src/middleware.ts')
      if (!middleware) return { fixed: false, message: 'middleware.ts not found' }

      let content = Buffer.from(middleware.content, middleware.encoding === 'base64' ? 'base64' : 'utf-8').toString('utf-8')
      // Convert to proxy.ts format (remove NextResponse redirect logic if any)
      if (content.includes('NextResponse.redirect')) {
        content = content.replace(/import.*NextResponse.*\n/g, '')
        content = content.replace(/return NextResponse\.redirect\([^)]+\)/g, 'return')
      }

      // Push as proxy.ts
      const proxyResult = await githubPush('src/proxy.ts', content, 'auto-heal: rename middleware.ts → proxy.ts (Next.js 16)')
      if (!proxyResult) return { fixed: false, message: 'Failed to create proxy.ts' }

      // Delete middleware.ts by pushing empty content (GitHub doesn't have delete in contents API easily, 
      // but we can just leave it — proxy.ts takes precedence)
      return { fixed: true, message: 'Created proxy.ts (middleware.ts deprecated in Next.js 16)', file: 'src/proxy.ts' }
    },
  },
]

// ── Database Health Check ───────────────────────────────────

async function checkDatabase(): Promise<HealResult> {
  try {
    const { db } = await import('@/lib/db')
    const count = await db.user.count()
    return { action: 'healthy', issue: 'Database', fix: `Connected. ${count} users in DB.` }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      action: 'detected',
      issue: 'Database connection failed',
      fix: 'Check DATABASE_URL env var on Vercel. Must be PostgreSQL (not SQLite).',
      details: msg.substring(0, 300),
    }
  }
}

// ── AI-Powered Code Fix ─────────────────────────────────────

export async function aiAutoFix(params: {
  screenshot?: string
  description: string
  currentView: string
  logs: string[]
}): Promise<{
  result: HealResult
  aiAnalysis?: { error: string; cause: string; file: string; code: string }
}> {
  const { screenshot, description, currentView, logs } = params

  // Build context for AI
  const prompt = `You are an auto-heal system for a Next.js 16 + Prisma + PostgreSQL SaaS app called TITAN AI.

Current page: ${currentView}
Bug report: ${description}

Known issues to check for:
- Schema provider should be "postgresql" not "sqlite" (Vercel requirement)
- middleware.ts should be renamed to proxy.ts (Next.js 16)
- Dark/light theme CSS variables must be defined
- All imports must exist (components, utils, etc.)
- Prisma client must be generated after schema changes
- Environment variables: DATABASE_URL, AI_API_KEY must be set

Analyze this bug and return ONLY valid JSON:
{
  "error": "what's wrong",
  "cause": "why it happens",
  "file": "exact file path to fix, e.g. src/components/titan/dashboard-view.tsx",
  "currentContentIssues": "what specifically is broken in the file",
  "fixedCode": "the COMPLETE corrected file content — not a diff, the full file",
  "commitMessage": "short commit message"
}

IMPORTANT: Return the FULL file content in fixedCode, not just the changed lines. This will be pushed directly to the repository.`

  // If screenshot provided, use vision
  let aiResponse: string | null = null

  if (screenshot && AI_API_KEY) {
    try {
      const base64Match = screenshot.match(/^data:image\/(\w+);base64,(.+)$/)
      if (base64Match) {
        logs.push('Sending screenshot to AI for auto-fix...')
        const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_API_KEY}` },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: [
              { role: 'system', content: prompt },
              {
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: `data:image/${base64Match[1]};base64,${base64Match[2]}` } },
                  { type: 'text', text: `Analyze this screenshot and provide the COMPLETE fixed file content.` },
                ],
              },
            ],
            max_tokens: 8000,
            temperature: 0.2,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          aiResponse = data.choices?.[0]?.message?.content
          logs.push('AI vision analysis complete')
        }
      }
    } catch {
      logs.push('Vision analysis failed, trying text...')
    }
  }

  // Fallback to text analysis
  if (!aiResponse && AI_API_KEY) {
    aiResponse = await aiChat(prompt)
    if (aiResponse) logs.push('AI text analysis complete')
  }

  if (!aiResponse) {
    return {
      result: { action: 'failed', issue: description, fix: 'AI not available. Set AI_API_KEY env var.' },
    }
  }

  // Parse AI response
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return {
      result: { action: 'detected', issue: description, fix: 'AI could not generate structured fix.', details: aiResponse.substring(0, 200) },
      aiAnalysis: { error: description, cause: 'Unknown', file: 'Unknown', code: '' },
    }
  }

  let parsed: { error: string; cause: string; file: string; fixedCode: string; commitMessage: string }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return {
      result: { action: 'detected', issue: description, fix: 'AI response could not be parsed.', details: aiResponse.substring(0, 200) },
    }
  }

  // Validate the fix
  if (!parsed.file || !parsed.fixedCode || parsed.fixedCode.length < 50) {
    return {
      result: { action: 'detected', issue: parsed.error, fix: 'AI could not generate a complete fix.', details: parsed.cause },
      aiAnalysis: { error: parsed.error, cause: parsed.cause, file: parsed.file || 'unknown', code: parsed.fixedCode || '' },
    }
  }

  // ── Apply the fix via GitHub ──
  logs.push(`Applying fix to ${parsed.file}...`)
  const pushResult = await githubPush(
    parsed.file,
    parsed.fixedCode,
    parsed.commitMessage || `auto-heal: fix ${parsed.error.substring(0, 60)}`,
  )

  if (pushResult) {
    logs.push(`Fix pushed! ${pushResult.commitUrl}`)
    return {
      result: {
        action: 'fixed',
        issue: parsed.error,
        fix: parsed.cause,
        file: parsed.file,
        commitUrl: pushResult.commitUrl,
      },
      aiAnalysis: { error: parsed.error, cause: parsed.cause, file: parsed.file, code: parsed.fixedCode },
    }
  }

  // Push failed — return the fix for manual application
  logs.push('Auto-push failed. Returning fix for manual use.')
  return {
    result: {
      action: 'detected',
      issue: parsed.error,
      fix: `Could not auto-push (set GITHUB_TOKEN env var). Fix generated — apply manually.`,
      file: parsed.file,
    },
    aiAnalysis: { error: parsed.error, cause: parsed.cause, file: parsed.file, code: parsed.fixedCode },
  }
}

// ── Full Health Check (called by cron) ──────────────────────

export async function runHealthCheck(): Promise<HealResult[]> {
  const results: HealResult[] = []

  // Check database
  const dbResult = await checkDatabase()
  results.push(dbResult)

  // Run known fix rules
  for (const rule of AUTO_FIX_RULES) {
    try {
      const needsFix = await rule.detect()
      if (needsFix) {
        console.log(`[AUTO-HEAL] Detected: ${rule.name}`)
        const fixResult = await rule.fix()
        results.push({
          action: fixResult.fixed ? 'fixed' : 'detected',
          issue: rule.name,
          fix: fixResult.message,
          file: fixResult.file,
        })
      }
    } catch (e) {
      console.error(`[AUTO-HEAL] Rule "${rule.name}" error:`, e)
      results.push({ action: 'failed', issue: rule.name, fix: 'Rule execution failed' })
    }
  }

  return results
}