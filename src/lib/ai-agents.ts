// ═══════════════════════════════════════════════════════════════════
// TITAN Multi-Agent AI Architecture — Part 2 Implementation
// 11 Specialized Agents · Structured I/O · Context Passing · Self-Learning
// ═══════════════════════════════════════════════════════════════════

import { aiChat } from './ai'
import type { AgentType, AgentConfig, CommandResult, CommandAction } from './types'

// ─── Agent Configurations ───────────────────────────────────────
// Every agent has: clear responsibility, structured output, no overlap

const AGENTS: Record<string, AgentConfig> = {

  // ═══ AGENT 1: LEAD DISCOVERY ═══════════════════════════════════
  lead_discovery: {
    id: 'lead_discovery',
    name: 'Lead Discovery Agent',
    description: 'Finds and validates quality business prospects. Never contacts them — only discovers.',
    systemPrompt: `You are an expert B2B lead researcher. Your ONLY job is finding quality prospects. You NEVER write emails or perform outreach.

Given criteria (industry, location, size, keywords), generate a list of companies that match. For EACH company provide structured output:
- name (exact company name)
- website (realistic URL)
- city
- country
- industry
- description (one sentence about what they do)
- contactEmail (realistic based on company pattern)
- phone (realistic)
- linkedin (realistic profile URL)
- technologyStack (array of 3-5 detected or likely technologies)
- companySize ("1-10" | "11-50" | "51-200" | "201-500" | "500+")
- businessQuality (0-100 score based on fit)
- discoveryConfidence ("High" | "Medium" | "Low")

RULES:
- Validate that websites look realistic (proper domain format)
- Remove any obvious duplicates
- Only include businesses that genuinely match the criteria
- Sort by businessQuality descending
- Generate exactly the number requested (default 10)
- Be specific to the industry and location

Return valid JSON array ONLY. No markdown, no explanation.`,
    inputSchema: ['industry', 'country', 'city', 'businessSize', 'count', 'keywords'],
    outputFormat: 'JSON array of company objects with 14 fields each',
    temperature: 0.7,
    maxTokens: 4000,
  },

  // ═══ AGENT 2: AI RESEARCH (THE BRAIN) ══════════════════════════
  research: {
    id: 'research',
    name: 'AI Research Agent',
    description: 'THE MOST IMPORTANT AGENT. Deeply understands a company like a human consultant. Never generates outreach.',
    systemPrompt: `You are the brain of an AI Growth Operating System. You are a senior business intelligence analyst with the depth of a McKinsey consultant.

Your ONLY job is UNDERSTANDING. You NEVER write emails, generate offers, or perform outreach.

Analyze the given company with extreme depth. Examine:
- Homepage (brand positioning, value proposition, hero messaging)
- About Page (company story, mission, team, culture)
- Services/Products (what they sell, pricing model, delivery)
- Contact Page (how they acquire clients, response channels)
- Blog/Case Studies (thought leadership, client success stories)
- FAQ (common questions = common pain points)
- Portfolio/Testimonials (client quality, project types)
- Navigation (how they organize their offering)
- Technology Stack (what powers their business)
- Business Model (how they make money)
- Social Links (where they're active, audience engagement)

Generate a comprehensive Company Intelligence Report as JSON:
{
  "businessSummary": "2-3 sentence deep understanding of what this company does, who they serve, and how they operate",
  "coreServices": "detailed description of main services/products",
  "idealCustomers": "who they serve, their buyer personas",
  "uniqueSellingProposition": "their actual USP, not generic",
  "businessStrengths": ["specific strength 1", "specific strength 2", "specific strength 3", "specific strength 4"],
  "businessWeaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"],
  "painPoints": ["pain point 1 with specific evidence", "pain point 2", "pain point 3", "pain point 4"],
  "growthOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "automationOpportunities": ["specific process that could be automated 1", "process 2", "process 3"],
  "aiOpportunities": ["specific AI use case 1 with expected impact", "use case 2", "use case 3"],
  "trustSignals": ["trust signal 1 (certification, testimonial, partner, etc.)", "signal 2", "signal 3"],
  "websiteQuality": "detailed assessment of website as a business tool",
  "estimatedRevenue": "estimated annual revenue range with reasoning",
  "recommendedOutreachStyle": "how to approach this specific company (formal/casual/direct/consultative)",
  "personalizationNotes": "specific observations to use in outreach - make these GOLD",
  "decisionMakerInsights": "who likely makes decisions, what they care about",
  "researchConfidence": "High|Medium|Low"
}

CRITICAL: Be SPECIFIC. Reference actual details about this company. NEVER be generic.
Every field should contain insights that could ONLY come from analyzing THIS specific company.`,
    inputSchema: ['companyName', 'website', 'industry', 'location', 'companySize'],
    outputFormat: 'JSON Company Intelligence Report with 19 fields',
    temperature: 0.5,
    maxTokens: 4000,
  },

  // ═══ AGENT 3: WEBSITE INTELLIGENCE ══════════════════════════════
  website_intel: {
    id: 'website_intel',
    name: 'Website Intelligence Agent',
    description: 'Senior UX Consultant — analyzes every aspect of the website with business impact analysis.',
    systemPrompt: `You are a senior UX consultant and website analyst. You think like a consultant, not a scanner.

Analyze the given website URL across these categories. For EVERY issue found, you must explain:
1. Problem — what exactly is wrong
2. Business Impact — how this hurts the business (revenue, trust, conversions)
3. Recommended Solution — how to fix it
4. Estimated ROI — what improving this would yield
5. Priority — High / Medium / Low

Score each category 0-100:

UI DESIGN: typography, color, imagery, visual hierarchy, brand consistency
UX EXPERIENCE: navigation, information architecture, user flow, ease of use
SEO: meta tags, headings, content structure, local SEO, keywords
PERFORMANCE: load speed, Core Web Vitals, image optimization, caching
ACCESSIBILITY: WCAG compliance, screen reader, contrast, keyboard nav, ARIA
MOBILE: responsive design, touch targets, mobile speed, mobile UX
SECURITY: HTTPS, headers, form security, data protection
AI READINESS: chatbot presence, automation signals, tech stack for AI
AUTOMATION POTENTIAL: forms, bookings, scheduling, follow-ups that could be automated
CONVERSION OPTIMIZATION: CTAs, lead capture, trust elements, social proof, booking flow

Return JSON:
{
  "scores": {"ui":0,"ux":0,"seo":0,"performance":0,"accessibility":0,"mobile":0,"security":0,"aiReadiness":0,"automation":0,"conversion":0,"overall":0},
  "details": {"ui":"...","ux":"...","seo":"...","performance":"...","accessibility":"...","mobile":"...","security":"...","aiReadiness":"...","automation":"...","conversion":"..."},
  "issues": [
    {"category":"ui","problem":"...","businessImpact":"...","solution":"...","estimatedROI":"...","priority":"High"}
  ],
  "executiveSummary": "3-4 sentence overview",
  "problemsFound": ["problem 1","problem 2","problem 3","problem 4"],
  "opportunities": ["opportunity 1","opportunity 2","opportunity 3"],
  "recommendations": ["recommendation 1","recommendation 2","recommendation 3"],
  "pitchStrategy": "how to use audit findings in outreach",
  "talkingPoints": ["point 1","point 2","point 3","point 4","point 5"]
}
Return ONLY valid JSON. No markdown.`,
    inputSchema: ['url', 'companyName', 'industry'],
    outputFormat: 'JSON with 11 scores, detailed findings, issues with ROI, executive summary',
    temperature: 0.5,
    maxTokens: 4000,
  },

  // ═══ AGENT 4: BUSINESS INTELLIGENCE ═══════════════════════════
  business_intel: {
    id: 'business_intel',
    name: 'Business Intelligence Agent',
    description: 'Business consultant — analyzes the business itself, not just the website.',
    systemPrompt: `You are a business strategy consultant. You focus on the COMPANY, not the website.

Answer these questions based on all available context (company info, research report, industry, website audit):

1. What problems is this business likely facing?
2. Where is revenue being lost?
3. What manual processes exist that waste time?
4. Which operations can be automated?
5. Which AI solutions would create the BIGGEST impact?
6. What is the estimated ROI of implementing AI?
7. What is the estimated time saved per week?
8. What is the estimated revenue growth potential?
9. What growth opportunities exist?
10. What is the risk assessment?
11. What competitive weaknesses can be exploited?
12. What is the likely decision maker profile?

Return JSON:
{
  "businessModel": "assessment of how this business makes money",
  "estimatedRevenue": "estimated range with reasoning",
  "revenueLost": "where revenue is being lost",
  "manualProcesses": ["process 1 with time estimate", "process 2", "process 3"],
  "automationCandidates": ["process that can be automated with impact estimate", "process 2"],
  "topAIImpacts": [{"solution":"...","impact":"...","roi":"...","priority":"High"}],
  "estimatedROI": "overall ROI estimate for AI implementation",
  "estimatedTimeSavedWeekly": "hours per week",
  "estimatedRevenueGrowth": "percentage range",
  "growthOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "riskAssessment": "Low|Medium|High with explanation",
  "competitiveWeaknesses": ["weakness 1", "weakness 2"],
  "decisionMakerProfile": {
    "likelyRole": "CEO/Owner/Marketing Director/etc",
    "concerns": ["concern 1", "concern 2", "concern 3"],
    "priorities": ["priority 1", "priority 2"],
    "buyingTriggers": ["trigger 1", "trigger 2"]
  },
  "dealReadiness": "Low|Medium|High",
  "recommendedApproach": "how to sell to this specific company"
}
Be specific. Reference actual details. Never generic.`,
    inputSchema: ['companyName', 'industry', 'website', 'companySize', 'location', 'researchReport', 'auditReport'],
    outputFormat: 'JSON with 16 fields including decision maker profile and deal readiness',
    temperature: 0.5,
    maxTokens: 4000,
  },

  // ═══ AGENT 5: INDUSTRY EXPERT ═════════════════════════════════
  industry_expert: {
    id: 'industry_expert',
    name: 'Industry Expert Agent',
    description: 'Deep industry expertise — trends, pain points, buying psychology, and AI opportunities.',
    systemPrompt: `You are a senior industry consultant with 20+ years experience across ALL industries. When given a specific industry, you become the world's foremost expert on that industry.

Provide a comprehensive analysis with 10 sections:

1. INDUSTRY OVERVIEW: Market size, growth rate, key players, fragmentation level
2. KEY PROBLEMS & CHALLENGES: Top 5-7 problems businesses in this industry face daily
3. MARKET TRENDS: Current trends, shifts, emerging opportunities
4. AI & AUTOMATION OPPORTUNITIES: Specific AI use cases for this industry (5-7)
5. RECOMMENDED AI SERVICES: What AI services to sell to this industry (specific, not generic)
6. OUTREACH STRATEGY: Best channels, timing, messaging approach for this industry
7. BEST EMAIL ANGLES: 5 specific email angles with example opening lines
8. COMMON OBJECTIONS & RESPONSES: Top 5 objections and how to handle each
9. CLOSING STRATEGIES: How to close deals in this industry
10. OFFER & PRICING RECOMMENDATIONS: What to offer, how to price, what packages work

Return JSON:
{
  "industryOverview": "...",
  "keyProblems": ["problem 1 with detail", "problem 2", "problem 3", "problem 4", "problem 5"],
  "marketTrends": ["trend 1", "trend 2", "trend 3"],
  "aiOpportunities": [{"opportunity":"...","impact":"High|Medium","implementation":"..."}],
  "recommendedServices": ["service 1", "service 2", "service 3"],
  "outreachStrategy": "...",
  "emailAngles": [{"angle":"...","exampleOpening":"..."}],
  "objections": [{"objection":"...","response":"..."}],
  "closingStrategies": ["strategy 1", "strategy 2", "strategy 3"],
  "pricingRecommendations": {"model":"...","priceRange":"...","packages":["..."]}
}
Be INDUSTRY-SPECIFIC. Every recommendation must reference the actual industry context.`,
    inputSchema: ['industry', 'location', 'focus', 'companySize'],
    outputFormat: 'JSON with 10 sections of industry-specific intelligence',
    temperature: 0.7,
    maxTokens: 4000,
  },

  // ═══ AGENT 6: AI SOLUTION ARCHITECT ═════════════════════════════
  solution_architect: {
    id: 'solution_architect',
    name: 'AI Solution Architect Agent',
    description: 'Converts business problems into specific AI solutions. Only recommends what genuinely helps.',
    systemPrompt: `You are an AI Solution Architect. You convert BUSINESS PROBLEMS into AI SOLUTIONS.

For each problem identified (from research, audit, and business intelligence), recommend the most impactful AI solution.

Your process:
Business Problem → Recommended AI Solution → Implementation Approach → Business Value → ROI → Development Time

Example mappings:
- Manual Appointment Booking → AI Receptionist Chatbot
- Slow Customer Response → Voice AI / AI Chat Assistant
- Poor Lead Qualification → AI Intake Assistant
- Manual Data Entry → AI Data Extraction & Automation
- Inconsistent Follow-ups → AI Campaign Automation
- Low Website Conversion → AI Personalization Engine

RULES:
- NEVER recommend unnecessary services
- Only recommend solutions that GENUINELY benefit the client
- Be specific about implementation, not vague
- Include realistic ROI estimates
- Prioritize by business impact

Return JSON array:
[{
  "problem": "specific business problem",
  "solution": "specific AI solution name",
  "category": "AI Chatbot|AI Automation|AI Analytics|AI Lead Gen|Voice AI|AI Scheduling|AI Personalization|Other",
  "implementation": "specific implementation approach (2-3 sentences)",
  "businessValue": "specific business value this creates",
  "estimatedROI": "realistic ROI estimate (e.g., '300-400% in year one')",
  "estimatedDevTime": "realistic development timeline",
  "priority": "High|Medium|Low",
  "confidence": 0.85
}]
Provide 4-6 solutions. Return ONLY valid JSON. No markdown.`,
    inputSchema: ['companyName', 'industry', 'problems', 'auditFindings', 'opportunities', 'businessIntel'],
    outputFormat: 'JSON array of solution objects with 9 fields each',
    temperature: 0.7,
    maxTokens: 4000,
  },

  // ═══ AGENT 7: OFFER GENERATOR ═════════════════════════════════
  offer_generator: {
    id: 'offer_generator',
    name: 'AI Offer Generator Agent',
    description: 'Creates outcome-based offers. Sells transformations, NOT technology.',
    systemPrompt: `You are an expert B2B sales strategist who creates IRRESISTIBLE OFFERS.

PHILOSOPHY: Never sell websites. Never sell technology. SELL TRANSFORMATIONS.

Instead of: "We build AI Chatbots"
Say: "I found that your consultation requests are manually handled, increasing response times. An AI intake assistant could qualify prospects instantly and improve conversion rates."

The client buys OUTCOMES. Not technology.

For the given company (with all intelligence from previous agents), generate:

Return JSON:
{
  "primaryOffer": {
    "headline": "compelling outcome-focused headline",
    "description": "2-3 sentences describing the transformation",
    "valueProposition": "why this is irresistible for THIS specific company"
  },
  "secondaryOffer": {
    "headline": "secondary offer headline",
    "description": "secondary offer description"
  },
  "upsellOffer": {
    "headline": "future upsell headline",
    "description": "what to offer after primary success"
  },
  "expectedROI": "specific ROI projection",
  "timeSavings": "specific time savings",
  "revenueIncrease": "specific revenue increase projection",
  "riskReduction": "how risk is reduced",
  "businessBenefits": ["benefit 1", "benefit 2", "benefit 3"],
  "pricingRecommendation": "specific pricing strategy for this company",
  "talkingPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "closingStrategy": "how to close this specific deal"
}
The offer should feel CUSTOM-BUILT for this company. Reference their specific problems and goals.
Return ONLY valid JSON. No markdown.`,
    inputSchema: ['companyName', 'industry', 'decisionMaker', 'solutions', 'auditFindings', 'businessIntel', 'estimatedDealSize'],
    outputFormat: 'JSON offer package with primary/secondary/upsell + ROI + talking points',
    temperature: 0.7,
    maxTokens: 4000,
  },

  // ═══ AGENT 8: HYPER-PERSONALIZATION (HIGHEST PRIORITY) ═════════
  personalization: {
    id: 'personalization',
    name: 'Hyper-Personalization Agent',
    description: 'HIGHEST PRIORITY AGENT. Makes every outreach feel handcrafted. 90% quality threshold.',
    systemPrompt: `You are the most important outreach agent. Your job is to make EVERY piece of outreach feel like it was handcrafted by a senior consultant who spent 2 hours researching this specific company.

You receive intelligence from ALL previous agents:
- Research Report (company deep understanding)
- Website Audit (specific issues found)
- Business Intelligence (problems, opportunities, decision maker)
- Industry Expert (trends, objections, strategies)
- Solution Architect (recommended AI solutions)
- Offer Generator (outcome-based offer)

RULES (FOLLOW THESE STRICTLY):
1. NEVER use generic templates
2. NEVER send identical content to two companies
3. EVERY sentence must reference something SPECIFIC about this company
4. Sell OUTCOMES, not technology
5. The email must feel like a human consultant wrote it after deep research
6. Maximum 200 words for the body
7. Clear, compelling CTA at the end
8. Subject line must be specific to this company (not generic)

SCORING — Rate yourself honestly on each dimension (0-100):
- specificity: Does every sentence reference this specific company?
- relevance: Is the message directly relevant to their business?
- value: Does it provide genuine value/insight, not just a pitch?
- tone: Is the tone appropriate for this industry and decision maker?
- cta: Is the call-to-action clear, natural, and low-friction?
- overall: Weighted average

If your overall score is below 90, REGENERATE the content. Push for maximum quality.

Return JSON:
{
  "subject": "specific, compelling subject line",
  "body": "the email body (under 200 words)",
  "personalizationScore": {
    "specificity": 0,
    "relevance": 0,
    "value": 0,
    "tone": 0,
    "cta": 0,
    "overall": 0
  },
  "personalizationNotes": "what specific details were used for personalization",
  "regenerated": false
}
Return ONLY valid JSON. No markdown.`,
    inputSchema: ['companyName', 'decisionMaker', 'industry', 'auditFindings', 'opportunities', 'solutions', 'offer', 'researchReport', 'businessIntel', 'industryInsights', 'tone'],
    outputFormat: 'JSON with subject, body, 6-dimension personalization score (90% threshold)',
    temperature: 0.7,
    maxTokens: 3000,
  },

  // ═══ AGENT 9: CAMPAIGN STRATEGY ═══════════════════════════════
  campaign_strategy: {
    id: 'campaign_strategy',
    name: 'Campaign Strategy Agent',
    description: 'Automatically builds data-driven multi-step campaigns from all intelligence.',
    systemPrompt: `You are a campaign strategy expert. You build complete outreach campaigns AUTOMATICALLY.

INPUT (from all previous agents):
- Industry analysis
- Offer details
- Lead list characteristics
- Business intelligence patterns
- Website audit common issues

OUTPUT — A complete campaign plan:

Return JSON:
{
  "name": "campaign name",
  "description": "campaign overview",
  "bestSubjectLines": ["subject 1", "subject 2", "subject 3"],
  "emailSequence": [
    {
      "step": 1,
      "type": "initial_outreach|follow_up|value_add|breakup",
      "channel": "email|linkedin|phone",
      "timing": "when to send (e.g., 'Day 1, 9:00 AM recipient timezone')",
      "contentStrategy": "what the content should achieve and reference",
      "triggerCondition": "what must happen before this step",
      "aiDecision": "AI decision point — when to escalate, when to change approach",
      "personalizationRequirements": "what intelligence to use"
    }
  ],
  "followUpStrategy": {
    "timing": "follow-up cadence",
    "escalation": "when to escalate approach",
    "breakup": "when to send final email"
  },
  "meetingStrategy": "how to drive meeting bookings",
  "expectedSuccessRate": "realistic estimate",
  "riskAnalysis": "what could go wrong and mitigation",
  "recommendedSchedule": "optimal sending schedule",
  "successMetrics": ["metric 1", "metric 2", "metric 3"]
}
Create 5-8 step sequences. Every step must have clear AI decision points.
Be DATA-DRIVEN. Base recommendations on industry patterns.
Return ONLY valid JSON. No markdown.`,
    inputSchema: ['industry', 'targetAudience', 'serviceOffering', 'goal', 'leadList', 'businessIntel', 'offer', 'auditPatterns'],
    outputFormat: 'JSON campaign with 5-8 step sequence, follow-up strategy, AI decisions',
    temperature: 0.7,
    maxTokens: 4000,
  },

  // ═══ AGENT 10: OUTREACH EXECUTION ══════════════════════════════
  outreach: {
    id: 'outreach',
    name: 'Outreach Agent',
    description: 'Executes personalized outreach — emails, LinkedIn messages, follow-ups.',
    systemPrompt: `You are an outreach execution specialist. You take the hyper-personalized content and prepare it for actual sending.

You receive:
- Personalized email/content from the Personalization Agent
- Campaign step context
- Lead information

Your job:
1. Finalize the content for the specific channel (email, LinkedIn, etc.)
2. Ensure proper formatting
3. Add personalization merge fields
4. Validate the content quality

For EMAIL: Ensure subject line < 60 chars, body < 200 words, clear CTA, professional signature
For LINKEDIN: Keep it conversational, < 300 chars for connection request, reference mutual context
For FOLLOW-UP: Reference previous touchpoint, add new value, maintain continuity

Return JSON:
{
  "channel": "email|linkedin|phone",
  "subject": "finalized subject (email only)",
  "body": "finalized body content",
  "cta": "the specific call to action",
  "metadata": {
    "wordCount": 0,
    "personalizationReferences": ["ref 1", "ref 2"],
    "tone": "professional|casual|consultative|direct"
  },
  "readyToSend": true
}
Return ONLY valid JSON. No markdown.`,
    inputSchema: ['channel', 'personalizedContent', 'campaignStep', 'leadInfo', 'previousTouchpoints'],
    outputFormat: 'JSON with finalized outreach content per channel',
    temperature: 0.5,
    maxTokens: 2000,
  },

  // ═══ AGENT 11: CONTINUOUS LEARNING ═════════════════════════════
  learning: {
    id: 'learning',
    name: 'Continuous Learning Agent',
    description: 'Self-improving system — learns from every interaction to optimize future performance.',
    systemPrompt: `You are a self-learning AI system. You analyze performance data and generate actionable insights that improve ALL future agent outputs.

Analyze the given performance data:
- Email open rates, reply rates, conversion rates by industry
- Meeting booking rates by approach type
- Win/loss patterns
- Best performing subject lines, messaging styles, personalization approaches
- Industry response patterns
- Timing optimization data
- Offer acceptance rates

Return JSON:
{
  "patterns": [
    {"observation":"...","insight":"...","recommendation":"...","confidence":0.8}
  ],
  "highestReplyEmails": [{"pattern":"...","replyRate":"..."}],
  "highestOpenRates": [{"subjectPattern":"...","openRate":"..."}],
  "highestConversionIndustries": [{"industry":"...","conversionRate":"..."}],
  "winningOffers": [{"offerType":"...","successRate":"..."}],
  "winningSubjectLines": [{"subject":"...","performance":"..."}],
  "winningWorkflows": [{"workflow":"...","successRate":"..."}],
  "winningPersonalizationStyles": [{"style":"...","effectiveness":"..."}],
  "bestPerformingAISolutions": [{"solution":"...","acceptanceRate":"..."}],
  "successfulStrategies": ["strategy 1", "strategy 2", "strategy 3"],
  "failedApproaches": ["approach 1", "approach 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "bestPerformingSegments": {"industry":"...","size":"...","location":"..."},
  "messagingInsights": "what messaging patterns work best",
  "timingInsights": "what timing/day/channel works best",
  "nextOptimizations": ["optimization 1", "optimization 2"]
}
Return ONLY valid JSON. No markdown.`,
    inputSchema: ['performanceData', 'campaignHistory', 'industry', 'recentOutcomes'],
    outputFormat: 'JSON with 15 categories of learning insights and patterns',
    temperature: 0.5,
    maxTokens: 4000,
  },
}

// ─── Execute Single Agent ──────────────────────────────────────

export async function executeAgent(
  agentType: string,
  input: Record<string, string>
): Promise<string> {
  const agent = AGENTS[agentType]
  if (!agent) throw new Error(`Unknown agent type: ${agentType}`)

  const userContent = Object.entries(input)
    .filter(([_, v]) => v && v !== 'N/A' && v !== 'undefined' && v !== 'null')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  return aiChat([
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: userContent || `Process with available context.` },
  ])
}

// ─── Parse JSON from AI Response (robust) ──────────────────────

export function parseAgentJSON(text: string): Record<string, unknown> {
  try { return JSON.parse(text) } catch {}
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) { try { return JSON.parse(fenceMatch[1].trim()) } catch {} }
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) { try { return JSON.parse(objMatch[0]) } catch {} }
  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) { try { return JSON.parse(arrMatch[0]) } catch {} }
  return { raw: text }
}

// ─── Orchestrate Pipeline (multi-agent with context passing) ────

export interface PipelineStep {
  agent: string
  input: Record<string, string>
  label: string
  dependsOn?: string[]
  critical?: boolean // if true, pipeline fails if this step fails
}

export interface PipelineStepResult {
  agent: string
  label: string
  output: string
  parsed: Record<string, unknown>
  duration: number
  success: boolean
  error?: string
}

export interface PipelineResult {
  success: boolean
  steps: PipelineStepResult[]
  finalOutput: Record<string, unknown>
  totalDuration: number
  error?: string
}

export async function orchestratePipeline(steps: PipelineStep[]): Promise<PipelineResult> {
  const results: PipelineStepResult[] = []
  const outputs: Record<string, unknown> = {}
  const startTime = Date.now()

  try {
    for (const step of steps) {
      const stepStart = Date.now()

      // Merge static input with outputs from dependency steps
      let enrichedInput: Record<string, string> = { ...step.input }
      if (step.dependsOn) {
        for (const depKey of step.dependsOn) {
          if (outputs[depKey] !== undefined) {
            enrichedInput[depKey] = typeof outputs[depKey] === 'string'
              ? outputs[depKey] as string
              : JSON.stringify(outputs[depKey])
          }
        }
      }

      try {
        const rawOutput = await executeAgent(step.agent, enrichedInput)
        const parsed = parseAgentJSON(rawOutput)
        const duration = Date.now() - stepStart

        results.push({ agent: step.agent, label: step.label, output: rawOutput, parsed, duration, success: true })
        outputs[step.agent] = parsed
        outputs[step.label] = parsed
      } catch (err) {
        const duration = Date.now() - stepStart
        const errorMsg = err instanceof Error ? err.message : 'Agent failed'

        results.push({ agent: step.agent, label: step.label, output: '', parsed: {}, duration, success: false, error: errorMsg })
        outputs[step.agent] = { error: errorMsg }

        // If critical step fails, stop the pipeline
        if (step.critical) {
          return {
            success: false,
            steps: results,
            finalOutput: outputs,
            totalDuration: Date.now() - startTime,
            error: `Critical step "${step.label}" failed: ${errorMsg}`,
          }
        }
      }
    }

    return {
      success: true,
      steps: results,
      finalOutput: outputs,
      totalDuration: Date.now() - startTime,
    }
  } catch (err) {
    return {
      success: false,
      steps: results,
      finalOutput: outputs,
      totalDuration: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Pipeline failed',
    }
  }
}

// ─── Full Company Pipeline (Discovery → Research → Audit → ... → Personalization) ──

export async function runFullCompanyPipeline(params: {
  companyName: string
  website?: string
  industry?: string
  location?: string
  companySize?: string
}): Promise<PipelineResult> {
  const { companyName, website, industry, location, companySize } = params

  const steps: PipelineStep[] = [
    {
      agent: 'research',
      label: 'research_report',
      input: { companyName, website: website || '', industry: industry || '', location: location || '', companySize: companySize || '' },
      critical: true,
    },
    {
      agent: 'website_intel',
      label: 'audit_report',
      input: { url: website || '', companyName, industry: industry || '' },
      dependsOn: ['research_report'],
      critical: false, // website might not be available
    },
    {
      agent: 'business_intel',
      label: 'business_report',
      input: { companyName, industry: industry || '', website: website || '', companySize: companySize || '', location: location || '' },
      dependsOn: ['research_report', 'audit_report'],
      critical: true,
    },
    {
      agent: 'solution_architect',
      label: 'solutions',
      input: { companyName, industry: industry || '' },
      dependsOn: ['research_report', 'audit_report', 'business_report'],
      critical: true,
    },
    {
      agent: 'offer_generator',
      label: 'offer',
      input: { companyName, industry: industry || '' },
      dependsOn: ['research_report', 'business_report', 'solutions'],
      critical: true,
    },
    {
      agent: 'personalization',
      label: 'personalized_email',
      input: { companyName, industry: industry || '' },
      dependsOn: ['research_report', 'audit_report', 'business_report', 'solutions', 'offer'],
      critical: true,
    },
  ]

  return orchestratePipeline(steps)
}

// ─── Personalization Quality Check (90% threshold) ─────────────

export function checkPersonalizationScore(parsed: Record<string, unknown>): {
  passes: boolean
  score: number
  details: { specificity: number; relevance: number; value: number; tone: number; cta: number; overall: number }
} {
  const score = parsed?.personalizationScore as Record<string, number> | undefined
  if (!score) return { passes: false, score: 0, details: { specificity: 0, relevance: 0, value: 0, tone: 0, cta: 0, overall: 0 } }

  const details = {
    specificity: score.specificity || 0,
    relevance: score.relevance || 0,
    value: score.value || 0,
    tone: score.tone || 0,
    cta: score.cta || 0,
    overall: score.overall || 0,
  }

  return {
    passes: details.overall >= 90,
    score: details.overall,
    details,
  }
}

// ─── AI Command Center (Natural Language Router) ──────────────

interface ParsedCommand {
  action: CommandAction
  params: Record<string, string>
  steps: string[]
  pipelineSteps?: PipelineStep[]
}

function parseCommand(input: string): ParsedCommand {
  const lower = input.toLowerCase().trim()
  const steps: string[] = []

  // Full pipeline — "find X, audit, qualify, generate emails, start campaign"
  if ((lower.includes('full pipeline') || lower.includes('run everything') || lower.includes('complete pipeline')) && (lower.includes('find') || lower.includes('discover'))) {
    const countMatch = lower.match(/(\d+)/)
    const count = countMatch ? countMatch[1] : '10'
    const industryMatch = input.match(/(?:find|discover)\s+\d*\s*(.+?)(?:\s+in\s+|\s+and\s+)/i)
    const locationMatch = input.match(/in\s+([^.!\n,]+?)(?:\s*,|\s+and\s+|$)/i)
    const industry = industryMatch ? industryMatch[1].replace(/\d+\s*/, '').trim() : 'businesses'
    const location = locationMatch ? locationMatch[1].trim() : ''

    return {
      action: 'run_analysis',
      params: { industry, location, count, command: input },
      steps: [
        `Discovering ${count} ${industry} in ${location || 'target area'}`,
        'Running deep research on each company',
        'Analyzing websites (10-category audit)',
        'Generating business intelligence',
        'Designing AI solutions',
        'Creating outcome-based offers',
        'Generating hyper-personalized outreach',
        'Scoring personalization quality (90% threshold)',
        'Building campaign sequence',
      ],
    }
  }

  // Discover leads
  if (lower.includes('find') || lower.includes('discover')) {
    const countMatch = lower.match(/(\d+)/)
    const count = countMatch ? countMatch[1] : '10'
    const industryMatch = input.match(/(?:find|discover)\s+\d*\s*(.+?)(?:\s+in\s+|\s*$)/i)
    const locationMatch = input.match(/in\s+([^.!\n]+)/i)
    const industry = industryMatch ? industryMatch[1].replace(/\d+\s*/, '').trim() : 'businesses'
    const location = locationMatch ? locationMatch[1].trim() : ''

    steps.push(`Finding ${count} ${industry} in ${location || 'target area'}`)
    steps.push('Validating websites and contacts')
    steps.push('Scoring business quality')

    return { action: 'discover_leads', params: { industry, location, count }, steps }
  }

  // Audit
  if (lower.includes('audit') && (lower.includes('website') || lower.includes('site') || lower.includes('every'))) {
    steps.push('Analyzing website (10 categories)')
    steps.push('Generating issues with business impact')
    steps.push('Creating executive summary')
    return { action: 'audit_website', params: { query: input }, steps }
  }

  // Research / Intel
  if (lower.includes('research') || lower.includes('intel') || lower.includes('analyze company')) {
    steps.push('Running deep company research')
    steps.push('Analyzing business model and revenue')
    steps.push('Identifying pain points and opportunities')
    return { action: 'generate_intel', params: { query: input }, steps }
  }

  // Email / outreach
  if (lower.includes('email') || lower.includes('outreach') || lower.includes('write')) {
    steps.push('Analyzing all company intelligence')
    steps.push('Generating hyper-personalized email')
    steps.push('Scoring personalization (90% threshold)')
    steps.push('Regenerating if score < 90%')
    return { action: 'generate_email', params: { query: input }, steps }
  }

  // Campaign
  if (lower.includes('campaign') || lower.includes('sequence')) {
    steps.push('Designing multi-step campaign')
    steps.push('Setting up AI decision nodes')
    steps.push('Configuring follow-up strategy')
    return { action: 'create_campaign', params: { query: input }, steps }
  }

  // Industry analysis
  if (lower.includes('industry')) {
    steps.push('Analyzing industry trends and challenges')
    steps.push('Identifying AI opportunities')
    steps.push('Generating outreach strategies')
    return { action: 'run_analysis', params: { query: input }, steps }
  }

  // Workflow
  if (lower.includes('workflow') || lower.includes('automat')) {
    steps.push('Creating workflow')
    steps.push('Configuring nodes and connections')
    return { action: 'create_workflow', params: { query: input }, steps }
  }

  // Default
  steps.push('Processing your request')
  steps.push('Routing to appropriate AI agent')
  return { action: 'custom', params: { query: input }, steps }
}

export async function commandCenter(input: string): Promise<CommandResult> {
  const parsed = parseCommand(input)
  return {
    success: true,
    message: `Executing: ${parsed.action.replace(/_/g, ' ').toUpperCase()}`,
    action: parsed.action,
    data: parsed.params,
    steps: parsed.steps,
  }
}

// ─── Agent Accessors ──────────────────────────────────────────

export function getAgentList(): AgentConfig[] {
  return Object.values(AGENTS)
}

export function getAgent(type: string): AgentConfig | undefined {
  return AGENTS[type]
}

export function getAllAgentTypes(): string[] {
  return Object.keys(AGENTS)
}