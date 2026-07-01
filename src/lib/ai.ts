// AI Integration — uses GLM-4 Flash (ZhipuAI) via OpenAI-compatible API
// Configure in Vercel env vars:
//   AI_API_KEY = your ZhipuAI API key
//   AI_BASE_URL = https://open.bigmodel.cn/api/paas/v4 (default)
//   AI_MODEL = glm-4-flash (default)

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || 'glm-4-flash'

// Retry config — handles 429 (rate limit) and 5xx (server error)
const MAX_RETRIES = 3
const BASE_DELAY_MS = 2000 // 2s base, doubles each retry

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function aiChatCompletions(messages: { role: string; content: string }[], options?: { maxTokens?: number; temperature?: number }): Promise<string> {
  if (!AI_API_KEY) {
    throw new Error('AI not configured. Set AI_API_KEY in Vercel environment variables.')
  }

  const maxTokens = options?.maxTokens ?? 4000
  const temperature = options?.temperature ?? 0.7

  let lastError: string | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      })

      // Retry on 429 (rate limit) or 5xx (server error)
      if (res.status === 429 || res.status >= 500) {
        lastError = `AI API error ${res.status}`
        const errBody = await res.text().catch(() => 'Unknown error')

        // Don't retry if we've exhausted attempts
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000 // jitter
          console.warn(`[AI] Attempt ${attempt + 1} failed (${res.status}). Retrying in ${Math.round(delay / 1000)}s...`, errBody.substring(0, 200))
          await sleep(delay)
          continue
        }

        // Final attempt failed — give a friendly error message
        if (res.status === 429) {
          throw new Error('AI model is currently busy (rate limited). Please wait 30 seconds and try again.')
        }
        throw new Error(`AI API error ${res.status}: ${errBody}`)
      }

      if (!res.ok) {
        const err = await res.text().catch(() => 'Unknown error')
        throw new Error(`AI API error ${res.status}: ${err}`)
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('AI returned an empty response. Please try again.')
      }
      return content
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)

      // Don't retry on auth errors or configuration errors
      if (msg.includes('not configured') || msg.includes('401') || msg.includes('403')) {
        throw e
      }

      // Retry on network errors, 429, 5xx
      if (attempt < MAX_RETRIES && (msg.includes('rate limit') || msg.includes('busy') || msg.includes('fetch') || msg.includes('network') || msg.includes('429') || msg.includes('500'))) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000
        console.warn(`[AI] Attempt ${attempt + 1} error: ${msg}. Retrying in ${Math.round(delay / 1000)}s...`)
        await sleep(delay)
        continue
      }

      throw e
    }
  }

  throw new Error(lastError || 'AI request failed after multiple retries. Please try again later.')
}

export async function aiChat(messages: { role: string; content: string }[]): Promise<string> {
  return aiChatCompletions(messages)
}

export async function aiAnalyzeWebsite(url: string, prompt: string): Promise<string> {
  return aiChatCompletions([
    { role: 'system', content: 'You are an expert business and website analyst. Analyze websites thoroughly and provide detailed, actionable insights. Always respond in valid JSON format when asked for structured data.' },
    { role: 'user', content: `${prompt}\n\nWebsite URL: ${url}` },
  ], { maxTokens: 4000, temperature: 0.7 })
}

export async function aiGenerateEmail(context: {
  companyName: string
  website?: string
  industry?: string
  decisionMaker?: string
  auditFindings?: string
  opportunities?: string
  tone?: string
}): Promise<string> {
  const { companyName, website, industry, decisionMaker, auditFindings, opportunities, tone = 'professional' } = context
  return aiChatCompletions([
    {
      role: 'system',
      content: `You are an expert B2B sales email writer. Generate highly personalized, value-driven outreach emails. Each email must feel personally written for that specific company. Never use generic templates. Focus on providing real business value and solving real problems. Tone: ${tone}. The email should be concise (under 200 words), have a compelling subject line, and end with a clear call-to-action. Return JSON with: {"subject": "...", "body": "..."}`,
    },
    {
      role: 'user',
      content: `Generate a personalized outreach email for:\nCompany: ${companyName}\nWebsite: ${website || 'N/A'}\nIndustry: ${industry || 'N/A'}\nDecision Maker: ${decisionMaker || 'N/A'}\nAudit Findings: ${auditFindings || 'N/A'}\nOpportunities: ${opportunities || 'N/A'}`,
    },
  ])
}

export async function aiIndustryExpert(query: string): Promise<string> {
  return aiChatCompletions([
    {
      role: 'system',
      content: 'You are a senior business consultant and AI industry expert with deep knowledge of every industry. You understand market trends, customer behavior, operational challenges, and AI opportunities across all sectors. Provide detailed, actionable, and specific advice. Structure your responses clearly with headers and bullet points. Always include specific recommendations, not generic advice.',
    },
    { role: 'user', content: query },
  ])
}

export async function aiDiscoverLeads(params: {
  industry: string
  country: string
  city?: string
  businessSize?: string
}): Promise<string> {
  return aiChatCompletions([
    {
      role: 'system',
      content: 'You are a B2B lead research expert. Generate a realistic list of sample companies that match the given criteria. For each company provide: name, website (realistic URL), location, industry, description, and contact email (realistic). Return valid JSON array. Generate 10-20 companies. These are example leads for demonstration purposes.',
    },
    {
      role: 'user',
      content: `Find companies in: ${params.industry} industry, ${params.country}${params.city ? `, ${params.city}` : ''}${params.businessSize ? `, ${params.businessSize} size` : ''}`,
    },
  ])
}

export async function aiQualifyLead(context: {
  companyName: string
  industry?: string
  website?: string
  companySize?: string
  auditScore?: number
}): Promise<string> {
  return aiChatCompletions([
    {
      role: 'system',
      content: 'You are a lead qualification expert. Score leads on a scale of 0-100 based on: business quality (0-100), revenue potential (0-100), AI readiness (0-100), automation potential (0-100), website quality (0-100), conversion probability (0-100). Also estimate deal size in USD. Return JSON: {"businessQuality": 0, "revenuePotential": 0, "aiReadiness": 0, "automationPotential": 0, "websiteQuality": 0, "conversionProbability": 0, "overallScore": 0, "temperature": "HOT|WARM|COLD", "estimatedDealSize": "$X,XXX", "reasoning": "..."}',
    },
    {
      role: 'user',
      content: `Qualify this lead:\nCompany: ${context.companyName}\nIndustry: ${context.industry || 'N/A'}\nWebsite: ${context.website || 'N/A'}\nSize: ${context.companySize || 'N/A'}\nAudit Score: ${context.auditScore || 'N/A'}`,
    },
  ])
}