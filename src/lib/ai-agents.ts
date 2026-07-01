// Multi-Agent AI Architecture — 10 Specialized Agents
// Each agent has a focused role, system prompt, and output format

import { aiChat } from './ai'
import type { AgentType, AgentConfig, CommandResult, CommandAction } from './types'

// ─── Agent Configurations ───────────────────────────────────────

const AGENTS: Record<AgentType, AgentConfig> = {
  lead_discovery: {
    id: 'lead_discovery',
    name: 'Lead Discovery Agent',
    description: 'Finds and generates qualified business leads based on criteria',
    systemPrompt: `You are an expert B2B lead researcher. Given criteria (industry, location, size), generate a realistic list of companies that match. For each: name, website (realistic URL), city, country, industry, description (1 sentence), contact email (realistic), company size. Return valid JSON array. Generate exactly the number requested (default 10). Be specific to the industry and location.`,
    inputSchema: ['industry', 'country', 'city', 'businessSize', 'count'],
    outputFormat: 'JSON array of company objects',
    temperature: 0.7,
    maxTokens: 4000,
  },

  research: {
    id: 'research',
    name: 'AI Research Agent',
    description: 'Deep company research — the most important agent. Collects everything about a company.',
    systemPrompt: `You are a senior business intelligence analyst. Analyze the given company deeply. Collect and analyze: business overview, core services, ideal customers, unique selling proposition, strengths, weaknesses, pain points, growth opportunities, automation opportunities, AI opportunities, trust signals, website quality assessment, estimated revenue range, recommended outreach style, personalization notes. Be specific and insightful — never generic. Return valid JSON: {"businessOverview":"...","coreServices":"...","idealCustomers":"...","uniqueSellingProp":"...","strengths":["..."],"weaknesses":["..."],"painPoints":["..."],"growthOpportunities":["..."],"automationOpportunities":["..."],"aiOpportunities":["...","trustSignals":["..."],"websiteQuality":"...","estimatedRevenue":"...","recommendedOutreachStyle":"...","personalizationNotes":"..."}`,
    inputSchema: ['companyName', 'website', 'industry', 'location'],
    outputFormat: 'JSON object with company intelligence fields',
    temperature: 0.5,
    maxTokens: 4000,
  },

  website_intel: {
    id: 'website_intel',
    name: 'Website Intelligence Agent',
    description: 'Analyzes websites like a UX Consultant — homepage, navigation, CTA, performance, SEO, mobile, accessibility',
    systemPrompt: `You are an expert website analyst and UX consultant. Analyze the given website URL thoroughly. Score each category 0-100 and provide detailed findings. Categories: UI Design, UX Experience, SEO, Performance, Accessibility, Mobile, Security, AI Readiness, Automation Potential, Conversion Optimization. For each issue found, explain: Problem → Why it matters → Business Impact → How to fix → Potential ROI. Return JSON: {"scores":{"ui":0,"ux":0,"seo":0,"performance":0,"accessibility":0,"mobile":0,"security":0,"aiReadiness":0,"automation":0,"conversion":0,"overall":0},"details":{"ui":"...","ux":"...","seo":"...","performance":"...","accessibility":"...","mobile":"...","security":"...","aiReadiness":"...","automation":"...","conversion":"..."},"executiveSummary":"...","problemsFound":["..."],"opportunities":["..."],"recommendations":["..."],"pitchStrategy":"...","talkingPoints":["..."]}`,
    inputSchema: ['url', 'companyName', 'industry'],
    outputFormat: 'JSON with 10 scores, details, executive summary, problems, opportunities, recommendations',
    temperature: 0.5,
    maxTokens: 4000,
  },

  business_intel: {
    id: 'business_intel',
    name: 'Business Intelligence Agent',
    description: 'Analyzes business model, revenue potential, decision makers, competitive landscape',
    systemPrompt: `You are a business strategy consultant. Analyze the given business and provide intelligence: business model assessment, estimated revenue range, decision maker profile (likely role, concerns, priorities), competitive advantages, market position, growth trajectory, technology adoption level. Be specific. Return JSON: {"businessModel":"...","estimatedRevenue":"...","decisionMakerProfile":{"likelyRole":"...","concerns":["..."],"priorities":["..."]},"competitiveAdvantages":["..."],"marketPosition":"...","growthTrajectory":"...","techAdoptionLevel":"Low|Medium|High","dealReadiness":"Low|Medium|High"}`,
    inputSchema: ['companyName', 'industry', 'website', 'companySize', 'location'],
    outputFormat: 'JSON with business intelligence analysis',
    temperature: 0.5,
    maxTokens: 3000,
  },

  industry_expert: {
    id: 'industry_expert',
    name: 'Industry Expert Agent',
    description: 'Deep industry knowledge — trends, problems, AI opportunities specific to any industry',
    systemPrompt: `You are a senior business consultant and AI industry expert with deep knowledge of every industry. Provide a comprehensive 10-section analysis: 1) Industry Overview 2) Key Problems & Challenges 3) Market Trends 4) AI & Automation Opportunities 5) Recommended AI Services to Offer 6) Outreach Strategy 7) Best Email Angles 8) Common Objections & Responses 9) Closing Strategies 10) Offer & Pricing Recommendations. Be specific to the industry, not generic. Use real examples and data points where possible.`,
    inputSchema: ['industry', 'location', 'focus'],
    outputFormat: 'Markdown with 10 sections',
    temperature: 0.7,
    maxTokens: 4000,
  },

  solution_architect: {
    id: 'solution_architect',
    name: 'Solution Architect Agent',
    description: 'Converts business problems into specific AI solutions with implementation plans',
    systemPrompt: `You are an AI Solution Architect who converts business problems into AI solutions. For each problem, recommend a specific AI solution with: implementation approach, business value, estimated ROI, priority (High/Medium/Low), and category (AI Chatbot, AI Automation, AI Analytics, AI Lead Gen, Voice AI, AI Scheduling, Other). Provide 4-6 solutions. Return JSON array: [{"problem":"...","solution":"...","implementation":"...","businessValue":"...","estimatedROI":"...","priority":"High|Medium|Low","category":"AI Chatbot|AI Automation|AI Analytics|AI Lead Gen|Voice AI|AI Scheduling|Other"}]. Return ONLY valid JSON, no markdown.`,
    inputSchema: ['companyName', 'industry', 'problems', 'auditFindings', 'opportunities'],
    outputFormat: 'JSON array of solution objects',
    temperature: 0.7,
    maxTokens: 4000,
  },

  offer_generator: {
    id: 'offer_generator',
    name: 'Offer Generator Agent',
    description: 'Creates irresistible outcome-based offers, not technology pitches',
    systemPrompt: `You are an expert B2B sales strategist. Create irresistible offers that sell OUTCOMES not technology. Generate a complete offer package: primary offer (headline, description, value proposition), secondary offer, upsell offer, expected ROI, time savings, revenue increase, risk reduction, pricing recommendation, 5 talking points, and closing strategy. Return JSON: {"primaryOffer":{"headline":"...","description":"...","valueProposition":"..."},"secondaryOffer":{"headline":"...","description":"..."},"upsellOffer":{"headline":"...","description":"..."},"expectedROI":"...","timeSavings":"...","revenueIncrease":"...","riskReduction":"...","pricingRecommendation":"...","talkingPoints":["..."],"closingStrategy":"..."}. Return ONLY valid JSON, no markdown.`,
    inputSchema: ['companyName', 'industry', 'decisionMaker', 'solutions', 'auditFindings', 'estimatedDealSize'],
    outputFormat: 'JSON offer package',
    temperature: 0.7,
    maxTokens: 4000,
  },

  personalization: {
    id: 'personalization',
    name: 'Personalization Agent',
    description: 'Generates hyper-personalized outreach using all gathered intelligence',
    systemPrompt: `You are an expert B2B copywriter who creates hyper-personalized outreach. Use all available intelligence (company data, audit findings, pain points, solutions, industry insights) to craft outreach that feels personally written. Never use generic templates. Every sentence must reference something specific about this company. Sell outcomes, not technology. Return JSON: {"subject":"...","body":"...","personalizationScore":{"overall":0,"specificity":0,"relevance":0,"value":0,"tone":0,"cta":0},"personalizationNotes":"..."}. The email should be under 200 words with a clear CTA.`,
    inputSchema: ['companyName', 'decisionMaker', 'industry', 'auditFindings', 'opportunities', 'solutions', 'tone'],
    outputFormat: 'JSON with subject, body, and personalization quality scores',
    temperature: 0.7,
    maxTokens: 3000,
  },

  campaign_strategy: {
    id: 'campaign_strategy',
    name: 'Campaign Strategy Agent',
    description: 'Designs multi-step campaign sequences with AI decision nodes',
    systemPrompt: `You are a campaign strategy expert. Design a multi-step outreach campaign with: campaign name, sequence of steps (each step: type, timing, channel, content strategy, trigger conditions), AI decision points (when to escalate, when to follow up, when to change approach), success criteria, and optimization recommendations. Return JSON: {"name":"...","description":"...","steps":[{"step":1,"type":"initial_outreach|follow_up|value_add|breakup","channel":"email|linkedin|phone","timing":"...","contentStrategy":"...","triggerCondition":"...","aiDecision":"..."}],"successCriteria":"...","optimizationTips":["..."],"estimatedDuration":"..."}. Return ONLY valid JSON.`,
    inputSchema: ['industry', 'targetAudience', 'serviceOffering', 'goal'],
    outputFormat: 'JSON campaign strategy with steps',
    temperature: 0.7,
    maxTokens: 4000,
  },

  learning: {
    id: 'learning',
    name: 'Learning Agent',
    description: 'Self-learning system that analyzes patterns and improves future outputs',
    systemPrompt: `You are a self-learning AI system that analyzes performance data and generates insights. Given performance data (email reply rates, open rates, meeting booking rates, win rates), identify patterns, successful strategies, failed approaches, and generate specific recommendations for improvement. Also identify what types of companies respond best, what messaging works, what timing is optimal. Return JSON: {"patterns":[{"observation":"...","insight":"...","confidence":0.8}],"successfulStrategies":["..."],"failedApproaches":["..."],"recommendations":["..."],"bestPerformingSegments":{"industry":"...","size":"...","location":"..."},"messagingInsights":"...","timingInsights":"..."}. Return ONLY valid JSON.`,
    inputSchema: ['performanceData', 'campaignHistory', 'industry'],
    outputFormat: 'JSON with patterns, insights, and recommendations',
    temperature: 0.5,
    maxTokens: 3000,
  },
}

// ─── Execute Single Agent ──────────────────────────────────────

export async function executeAgent(
  agentType: AgentType,
  input: Record<string, string>
): Promise<string> {
  const agent = AGENTS[agentType]
  if (!agent) throw new Error(`Unknown agent type: ${agentType}`)

  const userContent = Object.entries(input)
    .filter(([_, v]) => v && v !== 'N/A' && v !== 'undefined')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  return aiChat([
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: userContent || `Process with available context.` },
  ])
}

// ─── Orchestrate Pipeline (multi-agent sequence) ───────────────

export interface PipelineStep {
  agent: AgentType
  input: Record<string, string>
  label: string
  dependsOn?: string[] // keys from previous step outputs
}

export interface PipelineResult {
  success: boolean
  steps: { agent: AgentType; label: string; output: string; duration: number }[]
  finalOutput: Record<string, string>
  totalDuration: number
  error?: string
}

export async function orchestratePipeline(steps: PipelineStep[]): Promise<PipelineResult> {
  const results: PipelineResult['steps'] = []
  const outputs: Record<string, string> = {}
  const startTime = Date.now()

  try {
    for (const step of steps) {
      const stepStart = Date.now()
      // Merge static input with outputs from dependency steps
      let enrichedInput = { ...step.input }
      if (step.dependsOn) {
        for (const depKey of step.dependsOn) {
          if (outputs[depKey]) {
            enrichedInput = { ...enrichedInput, [depKey]: outputs[depKey] }
          }
        }
      }

      const output = await executeAgent(step.agent, enrichedInput)
      const duration = Date.now() - stepStart

      results.push({ agent: step.agent, label: step.label, output, duration })
      outputs[step.agent] = output
      outputs[step.label] = output
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

// ─── AI Command Center ─────────────────────────────────────────

interface ParsedCommand {
  action: CommandAction
  params: Record<string, string>
  steps: string[]
}

function parseCommand(input: string): ParsedCommand {
  const lower = input.toLowerCase().trim()
  const steps: string[] = []

  // Discover leads
  const discoverMatch = lower.match(/find\s+(\d+)?\s*(.+?)\s+in\s+(.+?)(?:\s*,\s*(.+?))?$/)
  if (lower.includes('find') && (lower.includes('law') || lower.includes('dentist') || lower.includes('agency') || lower.includes('restaurant') || lower.includes('company') || lower.includes('business') || lower.includes('firm') || lower.includes('clinic') || lower.includes('hotel') || lower.includes('shop') || lower.includes('store') || discoverMatch)) {
    const countMatch = lower.match(/find\s+(\d+)/)
    const count = countMatch ? countMatch[1] : '10'
    // Try to extract industry, location
    const industryMatch = input.match(/(?:find|discover)\s+\d*\s*(.+?)\s+in\s+/i)
    const locationMatch = input.match(/in\s+([^.!\n]+)/i)
    const industry = industryMatch ? industryMatch[1].replace(/\d+\s*/, '').trim() : 'businesses'
    const location = locationMatch ? locationMatch[1].trim() : ''

    steps.push(`Finding ${count} ${industry} in ${location || 'target area'}`)
    steps.push('Creating lead records')

    return {
      action: 'discover_leads',
      params: { industry, location, count },
      steps,
    }
  }

  // Audit website
  if (lower.includes('audit') && (lower.includes('website') || lower.includes('site') || lower.includes('every'))) {
    steps.push('Starting website audit')
    steps.push('Analyzing 10 categories')
    steps.push('Generating executive summary')

    return {
      action: 'audit_website',
      params: { query: input },
      steps,
    }
  }

  // Generate email
  if (lower.includes('email') || lower.includes('outreach') || lower.includes('send')) {
    steps.push('Analyzing lead intelligence')
    steps.push('Generating personalized email')
    steps.push('Scoring personalization quality')

    return {
      action: 'generate_email',
      params: { query: input },
      steps,
    }
  }

  // Create campaign
  if (lower.includes('campaign') || lower.includes('sequence')) {
    steps.push('Designing campaign strategy')
    steps.push('Setting up AI decision nodes')
    steps.push('Preparing outreach sequence')

    return {
      action: 'create_campaign',
      params: { query: input },
      steps,
    }
  }

  // Qualify / analyze
  if (lower.includes('qualif') || lower.includes('analyz') || lower.includes('research')) {
    steps.push('Running deep analysis')
    steps.push('Scoring lead quality')
    steps.push('Generating recommendations')

    return {
      action: 'run_analysis',
      params: { query: input },
      steps,
    }
  }

  // Generate intel/report
  if (lower.includes('intel') || lower.includes('report') || lower.includes('blueprint')) {
    steps.push('Gathering company intelligence')
    steps.push('Generating comprehensive report')

    return {
      action: 'generate_intel',
      params: { query: input },
      steps,
    }
  }

  // Workflow
  if (lower.includes('workflow') || lower.includes('automat') || lower.includes('pipeline')) {
    steps.push('Creating workflow')
    steps.push('Configuring nodes and connections')

    return {
      action: 'create_workflow',
      params: { query: input },
      steps,
    }
  }

  // Default: custom command
  steps.push('Processing your request')
  steps.push('Executing AI analysis')

  return {
    action: 'custom',
    params: { query: input },
    steps,
  }
}

export async function commandCenter(input: string): Promise<CommandResult> {
  const parsed = parseCommand(input)

  return {
    success: true,
    message: `Command parsed: ${parsed.action.replace(/_/g, ' ').toUpperCase()}`,
    action: parsed.action,
    data: parsed.params,
    steps: parsed.steps,
  }
}

// ─── Get Agent List ────────────────────────────────────────────

export function getAgentList(): AgentConfig[] {
  return Object.values(AGENTS)
}

export function getAgent(type: AgentType): AgentConfig {
  return AGENTS[type]
}