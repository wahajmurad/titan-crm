import { NextRequest, NextResponse } from 'next/server'

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || 'glm-4-flash'

// ── Known error patterns for quick matching ──
const ERROR_PATTERNS: { pattern: RegExp; error: string; cause: string; file: string; fix: string; severity: string; code: string }[] = [
  {
    pattern: /internal server error/i,
    error: 'Internal Server Error (500)',
    cause: 'Server-side code threw an unhandled exception. Most common in API routes when database queries fail, missing env vars, or type errors.',
    file: 'API Route or Database',
    fix: 'Check server logs in Vercel Dashboard > Functions tab. Common causes: missing DATABASE_URL, Prisma schema mismatch (e.g. sqlite vs postgresql), or missing AI_API_KEY.',
    severity: 'critical',
    code: `// Common fix: Ensure prisma schema matches your database provider
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"  // NOT "sqlite" on Vercel!
  url       = env("DATABASE_URL")
}

// Also check Vercel env vars are set:
// DATABASE_URL=postgresql://user:pass@host:5432/db
// AI_API_KEY=your-key`,
  },
  {
    pattern: /database|prisma|sqlite|postgres/i,
    error: 'Database Connection Error',
    cause: 'Prisma cannot connect to database. On Vercel, SQLite does not work (read-only filesystem). Must use PostgreSQL.',
    file: 'prisma/schema.prisma + DATABASE_URL env',
    fix: 'Switch Prisma provider to postgresql and set a valid DATABASE_URL in Vercel environment variables.',
    severity: 'critical',
    code: `// Fix: prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
}

// Then run:
// npx prisma generate
// And set DATABASE_URL in Vercel Dashboard > Settings > Env Vars`,
  },
  {
    pattern: /not found|404/i,
    error: '404 Not Found',
    cause: 'The requested page or API endpoint does not exist. Could be a routing issue or wrong URL.',
    file: 'src/app/ directory structure',
    fix: 'Verify the route exists in the src/app/ directory. For dynamic routes, check the folder naming (e.g. [id] not :id).',
    severity: 'medium',
    code: `// Correct Next.js 16 routing:
// src/app/api/leads/[id]/route.ts  ✅
// src/app/api/leads/:id/route.ts   ❌

// Also check the fetch URL matches exactly:
// fetch('/api/leads/123')  ✅
// fetch('/api/lead/123')   ❌ (wrong path)`,
  },
  {
    pattern: /authentication|unauthorized|401|403/i,
    error: 'Authentication / Permission Error',
    cause: 'Session expired, token invalid, or user lacks permission for the requested action.',
    file: 'src/lib/auth.ts + src/app/api/auth/route.ts',
    fix: 'Clear browser cookies and log in again. If persistent, check the session logic and token handling.',
    severity: 'high',
    code: `// Quick fix: Clear the session cookie
// In browser console:
document.cookie = 'titan_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
location.reload();

// This forces a fresh login.`,
  },
  {
    pattern: /hydration|mismatch|server.*client/i,
    error: 'React Hydration Mismatch',
    cause: 'Server-rendered HTML does not match what React expects on the client. Usually caused by using Date.now(), Math.random(), or browser-only APIs during SSR.',
    file: 'Component causing mismatch',
    fix: 'Wrap browser-dependent code in useEffect or use suppressHydrationWarning. Ensure server and client render identical output.',
    severity: 'medium',
    code: `// ❌ Wrong: Date renders differently on server vs client
<p>{new Date().toLocaleString()}</p>

// ✅ Fix: Use useEffect for client-only values
const [now, setNow] = useState('');
useEffect(() => {
  setNow(new Date().toLocaleString());
}, []);
return <p>{now}</p>`,
  },
  {
    pattern: /css|style|tailwind|class/i,
    error: 'Styling / CSS Issue',
    cause: 'Tailwind classes not applied, missing CSS variables, or dark mode mismatch.',
    file: 'src/app/globals.css or component file',
    fix: 'Check that the CSS class exists in globals.css. For Tailwind, ensure the class is not purged. For dark mode, verify the .dark class is applied to the HTML element.',
    severity: 'low',
    code: `// Check these common issues:
// 1. Glass utilities need proper background:
.glass-header {
  background: rgba(255, 255, 255, 0.8);  // Must have alpha
  backdrop-filter: blur(12px);
}

// 2. Dark mode needs the class on <html>:
// <html class="dark">  (handled by next-themes)

// 3. Custom colors need CSS variable definitions:
:root {
  --primary: oklch(0.546 0.245 262.881);
}`,
  },
  {
    pattern: /timeout|too long|slow/i,
    error: 'Request Timeout / Slow Loading',
    cause: 'API call taking too long. Could be AI model response delay, slow database query, or large data fetch.',
    file: 'API Route or AI call',
    fix: 'Increase timeout, optimize database queries, or add loading states for better UX.',
    severity: 'medium',
    code: `// Fix: Add proper timeout handling
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s

try {
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);
} catch (e) {
  if (e.name === 'AbortError') {
    // Show friendly timeout message
  }
}`,
  },
  {
    pattern: /invalid email|password|required/i,
    error: 'Form Validation Error',
    cause: 'Input validation failing on the frontend or backend.',
    file: 'Form component or API route',
    fix: 'Check validation rules match between frontend and backend. Common issue: password requirements (8+ chars, uppercase, number).',
    severity: 'low',
    code: `// Password requirements in src/lib/types.ts:
// - At least 8 characters
// - One uppercase letter
// - One lowercase letter  
// - One number

// Valid: "MyPass123"  ✅
// Invalid: "pass"  ❌
// Invalid: "password"  ❌ (no uppercase, no number)
// Invalid: "PASSWORD1"  ❌ (no lowercase)`,
  },
]

export async function POST(req: NextRequest) {
  const logs: string[] = []

  try {
    const body = await req.json()
    const { screenshot, description, currentView } = body

    logs.push(`Received bug report from ${currentView || 'unknown page'}`)
    logs.push(`Screenshot: ${screenshot ? 'attached (' + Math.round((screenshot.length * 3) / 4 / 1024) + 'KB)' : 'not provided'}`)
    logs.push(`Description: ${description ? '"' + description.substring(0, 80) + '"' : 'not provided'}`)

    // ── Step 1: Quick pattern match for known errors ──
    const searchText = `${description || ''} ${currentView || ''}`.toLowerCase()
    let matched = ERROR_PATTERNS.find(p => p.pattern.test(searchText))

    // If we have a screenshot, try AI vision analysis
    if (screenshot && AI_API_KEY) {
      logs.push('Sending screenshot to AI vision model...')

      try {
        // Extract base64 data from data URL
        const base64Match = screenshot.match(/^data:image\/(\w+);base64,(.+)$/)
        if (base64Match) {
          const mediaType = base64Match[1]
          const base64Data = base64Match[2]

          const visionRes = await fetch(`${AI_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AI_API_KEY}`,
            },
            body: JSON.stringify({
              model: AI_MODEL,
              messages: [
                {
                  role: 'system',
                  content: `You are an expert UI/UX bug analyzer for a Next.js SaaS application called TITAN AI. Analyze the screenshot and identify any visible errors, broken layouts, missing elements, or UI issues.

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "errorFound": "short description of what's wrong",
  "rootCause": "why this error occurs - technical explanation",
  "affectedFile": "most likely file path e.g. src/components/titan/dashboard-view.tsx",
  "fixDescription": "step-by-step fix in simple terms",
  "fixCode": "the exact code fix as a string",
  "severity": "low|medium|high|critical",
  "confidence": 0.0-1.0
}

If no error is visible, describe what you see and suggest what might be wrong based on context. If the user provided a description, use that to guide your analysis.`,
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:image/${mediaType};base64,${base64Data}`,
                      },
                    },
                    {
                      type: 'text',
                      text: description
                        ? `The user reports this issue: "${description}"\n\nAnalyze the screenshot and confirm/diagnose the bug.`
                        : 'Analyze this screenshot for any UI errors, broken layouts, or issues.',
                    },
                  ],
                },
              ],
              max_tokens: 2000,
              temperature: 0.3,
            }),
          })

          if (visionRes.ok) {
            const visionData = await visionRes.json()
            const visionContent = visionData.choices?.[0]?.message?.content

            if (visionContent) {
              logs.push('AI vision analysis complete')

              // Try to parse JSON from response
              const jsonMatch = visionContent.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                try {
                  const parsed = JSON.parse(jsonMatch[0])
                  matched = {
                    pattern: /ai/,
                    error: parsed.errorFound || 'Unknown error detected by AI',
                    cause: parsed.rootCause || 'AI could not determine root cause',
                    file: parsed.affectedFile || 'Unknown file',
                    fix: parsed.fixDescription || 'No fix suggestion available',
                    severity: parsed.severity || 'medium',
                    code: parsed.fixCode || '// No code fix available',
                  }
                  logs.push(`AI identified: "${parsed.errorFound}" (${parsed.severity})`)
                } catch {
                  logs.push('AI returned non-JSON, using text analysis')
                }
              }
            }
          } else {
            logs.push(`Vision API returned ${visionRes.status}, falling back to pattern match`)
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown vision error'
        logs.push(`Vision analysis failed: ${msg}`)
      }
    }

    // ── Step 2: If no AI match, try text-based AI analysis ──
    if (!matched && description && AI_API_KEY) {
      logs.push('No pattern match, using AI text analysis...')

      try {
        const textRes = await fetch(`${AI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_API_KEY}`,
          },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: [
              {
                role: 'system',
                content: `You are an expert debugging assistant for a Next.js 16 + Prisma + PostgreSQL SaaS application called TITAN AI.

Common issues in this app:
- SQLite vs PostgreSQL schema mismatch (Vercel needs PostgreSQL)
- Missing environment variables (DATABASE_URL, AI_API_KEY)
- Session/auth token issues
- Dark/light theme CSS problems
- Component import errors
- API route 500 errors from Prisma queries

Analyze the user's bug report and provide a fix. Return ONLY valid JSON:
{
  "errorFound": "...",
  "rootCause": "...",
  "affectedFile": "...",
  "fixDescription": "...",
  "fixCode": "...",
  "severity": "low|medium|high|critical",
  "confidence": 0.0-1.0
}`,
              },
              {
                role: 'user',
                content: `Bug report from page "${currentView || 'unknown'}":\n\n${description}`,
              },
            ],
            max_tokens: 2000,
            temperature: 0.3,
          }),
        })

        if (textRes.ok) {
          const textData = await textRes.json()
          const textContent = textData.choices?.[0]?.message?.content
          if (textContent) {
            const jsonMatch = textContent.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0])
                matched = {
                  pattern: /ai-text/,
                  error: parsed.errorFound || 'Error detected by AI',
                  cause: parsed.rootCause || 'Unknown cause',
                  file: parsed.affectedFile || 'Unknown',
                  fix: parsed.fixDescription || 'No fix available',
                  severity: parsed.severity || 'medium',
                  code: parsed.fixCode || '',
                }
                logs.push(`AI text analysis: "${parsed.errorFound}"`)
              } catch {
                logs.push('AI text response could not be parsed')
              }
            }
          }
        }
      } catch (e) {
        logs.push('Text analysis failed')
      }
    }

    // ── Step 3: Return result ──
    if (matched) {
      logs.push('Generating fix recommendation...')

      return NextResponse.json({
        success: true,
        logs,
        result: {
          errorFound: matched.error,
          rootCause: matched.cause,
          affectedFile: matched.file,
          fixDescription: matched.fix,
          fixCode: matched.code,
          severity: matched.severity,
          confidence: matched.severity === 'critical' ? 0.95 : 0.8,
        },
      })
    }

    // No match found
    logs.push('No specific error identified')
    return NextResponse.json({
      success: true,
      logs,
      result: {
        errorFound: description || 'Unidentified issue',
        rootCause: 'Could not automatically determine the root cause. The screenshot or description did not match any known error patterns.',
        affectedFile: 'Please check Vercel function logs for details',
        fixDescription: 'Try these steps:\n1. Open Vercel Dashboard > your project > Functions tab\n2. Check recent function logs for errors\n3. Verify all environment variables are set (DATABASE_URL, AI_API_KEY)\n4. Try clearing browser cache and cookies\n5. Check if the page works in incognito mode',
        fixCode: `// Debugging checklist:
// 1. Vercel env vars set? (DATABASE_URL, AI_API_KEY)
// 2. Prisma schema provider = "postgresql"? (NOT sqlite)
// 3. npx prisma generate ran after schema changes?
// 4. Check Vercel deployment logs for build errors
// 5. Browser console (F12) for client-side errors
// 6. Network tab (F12) for failed API calls`,
        severity: 'medium',
        confidence: 0.5,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[BUG REPORT ERROR]', e)
    return NextResponse.json(
      { error: `Bug analysis failed: ${msg}` },
      { status: 500 }
    )
  }
}