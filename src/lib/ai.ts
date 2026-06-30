// AI Integration — uses OpenAI-compatible API
// Configure: OPENAI_API_KEY, OPENAI_BASE_URL (optional, defaults to https://api.openai.com/v1)
// Falls back to mock responses if not configured

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

async function aiChatCompletions(messages: { role: string; content: string }[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    return JSON.stringify({ error: 'AI not configured. Set OPENAI_API_KEY and optionally OPENAI_BASE_URL in Vercel environment variables.', note: 'This is a demo response. Configure your AI API to enable full AI features.' })
  }

  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error')
    throw new Error(`AI API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'No response generated'
}

export async function aiChat(messages: { role: string; content: string }[]): Promise<string> {
  return aiChatCompletions(messages)
}

export async function aiAnalyzeWebsite(url: string, prompt: string): Promise<string> {
  return aiChatCompletions([
    { role: 'system', content: 'You are an expert business and website analyst. Analyze websites thoroughly and provide detailed, actionable insights. Always respond in valid JSON format when asked for structured data.' },
    { role: 'user', content: `${prompt}\n\nWebsite URL: ${url}` },
  ])
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