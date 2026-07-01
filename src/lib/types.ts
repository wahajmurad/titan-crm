import { createHash, randomBytes } from 'crypto'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export const MODULES = ['dashboard', 'discovery', 'audit', 'leads', 'campaigns', 'email-center', 'inbox', 'meetings', 'ai-assistant', 'prompts', 'team', 'settings'] as const
export type Module = typeof MODULES[number]

export interface UserSession {
  id: string
  email: string
  name: string
  role: 'OWNER' | 'TEAM'
  avatar?: string
}

export interface PermissionMap {
  [module: string]: {
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
  }
}

export const LEAD_STAGES = ['DISCOVERED', 'AUDITED', 'QUALIFIED', 'OUTREACH_SENT', 'REPLIED', 'MEETING_BOOKED', 'PROPOSAL_SENT', 'WON', 'LOST'] as const
export type LeadStage = typeof LEAD_STAGES[number]

export const LEAD_TEMPERATURE = ['HOT', 'WARM', 'COLD'] as const
export type LeadTemperature = typeof LEAD_TEMPERATURE[number]

export const OUTREACH_STATUS = ['DRAFT', 'SENT', 'OPENED', 'REPLIED', 'BOUNCED', 'FAILED'] as const
export type OutreachStatus = typeof OUTREACH_STATUS[number]

export const OUTREACH_TYPE = ['INITIAL', 'FOLLOW_UP', 'REPLY'] as const
export type OutreachType = typeof OUTREACH_TYPE[number]

export const MEETING_STATUS = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const
export type MeetingStatus = typeof MEETING_STATUS[number]

export const CAMPAIGN_STATUS = ['ACTIVE', 'PAUSED', 'COMPLETED'] as const
export type CampaignStatus = typeof CAMPAIGN_STATUS[number]

export const STAGE_COLORS: Record<string, string> = {
  DISCOVERED: 'bg-gray-100 text-gray-600 border-gray-200',
  AUDITED: 'bg-blue-50 text-blue-700 border-blue-200',
  QUALIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OUTREACH_SENT: 'bg-amber-50 text-amber-700 border-amber-200',
  REPLIED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MEETING_BOOKED: 'bg-blue-50 text-blue-700 border-blue-200',
  PROPOSAL_SENT: 'bg-orange-50 text-orange-700 border-orange-200',
  WON: 'bg-green-100 text-green-800 border-green-200',
  LOST: 'bg-red-50 text-red-700 border-red-200',
}

export const STAGE_DOT_COLORS: Record<string, string> = {
  DISCOVERED: 'bg-slate-400',
  AUDITED: 'bg-blue-500',
  QUALIFIED: 'bg-emerald-500',
  OUTREACH_SENT: 'bg-amber-500',
  REPLIED: 'bg-indigo-500',
  MEETING_BOOKED: 'bg-blue-500',
  PROPOSAL_SENT: 'bg-orange-500',
  WON: 'bg-green-600',
  LOST: 'bg-red-500',
}

export const TEMP_COLORS: Record<string, string> = {
  HOT: 'bg-red-50 text-red-700 border-red-200',
  WARM: 'bg-amber-50 text-amber-700 border-amber-200',
  COLD: 'bg-blue-50 text-blue-600 border-blue-200',
}

export interface AuditScores {
  ui: number
  ux: number
  seo: number
  performance: number
  accessibility: number
  mobile: number
  security: number
  aiReadiness: number
  automation: number
  conversion: number
  overall: number
}

export interface AuditDetails {
  ui: string
  ux: string
  seo: string
  performance: string
  accessibility: string
  mobile: string
  security: string
  aiReadiness: string
  automation: string
  conversion: string
}

export const PROMPT_CATEGORIES = [
  'website_audit',
  'industry_research',
  'lead_qualification',
  'email_generation',
  'sales_strategy',
  'proposal_writing',
  'campaign_analysis',
] as const
export type PromptCategory = typeof PROMPT_CATEGORIES[number]

// ── Workflow Types ──
export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
export type WorkflowRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type TriggerType = 'manual' | 'schedule' | 'webhook' | 'event'

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

// ── AI Agent Types ──
export type AgentType = 
  | 'lead_discovery'
  | 'research'
  | 'website_intel'
  | 'business_intel'
  | 'industry_expert'
  | 'solution_architect'
  | 'offer_generator'
  | 'personalization'
  | 'campaign_strategy'
  | 'outreach'
  | 'learning'

export interface AgentConfig {
  id: string
  name: string
  description: string
  systemPrompt: string
  inputSchema: string[]
  outputFormat: string
  temperature: number
  maxTokens: number
}

// ── Company Intel ──
export interface CompanyIntelReport {
  businessOverview: string
  coreServices: string
  idealCustomers: string
  uniqueSellingProp: string
  strengths: string[]
  weaknesses: string[]
  painPoints: string[]
  growthOpportunities: string[]
  automationOpportunities: string[]
  aiOpportunities: string[]
  trustSignals: string[]
  websiteQuality: string
  estimatedRevenue: string
  recommendedOutreachStyle: string
  personalizationNotes: string
  techStack?: string[]
  competitors?: string[]
  socialProfiles?: Record<string, string>
  teamInfo?: { name: string; role: string; email?: string }[]
}

// ── Personalization Types ──
export interface PersonalizationMetrics {
  overallScore: number
  specificityScore: number
  relevanceScore: number
  valueScore: number
  toneScore: number
  ctaScore: number
}

// ── AI Memory Types ──
export type MemoryCategory = 'lead_behavior' | 'email_performance' | 'industry_insight' | 'user_preference' | 'system_learning'

// ── Command Center Types ──
export type CommandAction = 
  | 'discover_leads'
  | 'audit_website'
  | 'qualify_lead'
  | 'generate_email'
  | 'create_campaign'
  | 'run_analysis'
  | 'generate_intel'
  | 'create_workflow'
  | 'generate_report'
  | 'custom'

export interface CommandResult {
  success: boolean
  message: string
  action: CommandAction
  data?: Record<string, unknown>
  steps?: string[]
}

// ── Asset Types ──
export type AssetType = 'pdf_audit_report' | 'html_demo' | 'growth_blueprint' | 'roi_calculation' | 'sales_pitch'

// ── Sales Angle Types ──
export interface SalesAngle {
  angleName: string
  hook: string
  subjectLine: string
  openingLine: string
  valueProposition: string
  emotionalTrigger: string
  bestFor: 'cold' | 'warm' | 'follow_up'
  estimatedEffectiveness: 'High' | 'Medium' | 'Low'
  effectivenessScore?: number // 0-100
}

// ── ROI Data Types ──
export interface ROIData {
  implementationCost: { oneTime: string; monthly: string }
  timeSavings: { hoursPerWeek: number; annualValue: string }
  revenueImpact: { increasePercent: number; annualValue: string }
  costReduction: { percent: number; annualValue: string }
  paybackPeriod: string
  roi: { twelveMonth: number; twentyFourMonth: number }
  netValue: { year1: string; year2: string }
  assumptions: string[]
  confidence: 'High' | 'Medium' | 'Low'
  summary: string
}

// ── Outreach Package Types ──
export type PackageTier = 'platinum' | 'gold' | 'silver'

export interface OutreachPackage {
  companyName: string
  estimatedDealValue: string
  tier: PackageTier
  assets: {
    personalizedEmail: boolean
    linkedinOutreach: boolean
    auditPDF: boolean
    htmlDemoPage: boolean
    growthBlueprint: boolean
    roiReport: boolean
    bookingLink: boolean
    annotatedScreenshots: boolean
  }
  rationale: string
  recommendedSequence: Array<{ step: number; action: string; asset: string; timing: string; reason: string }>
  estimatedResponseRate?: string
  estimatedMeetingRate?: string
  personalizationRequirements?: string[]
  totalAssetsToGenerate?: number
  estimatedPrepTime?: string
}

// ── Quality Score Types (Extended) ──
export interface QualityScoreDetail {
  researchQuality?: number
  businessUnderstanding?: number
  personalizationDepth?: number
  offerRelevance?: number
  emailQuality?: number
  professionalism?: number
  confidence?: number
  overall?: number
  issues?: string[]
  improvements?: string[]
}

// ── Pipeline Step Types ──
export interface PipelineStepResult {
  step: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  duration?: number
  output?: Record<string, unknown>
  error?: string
}

// ── Personalization Context (Full Pipeline Output) ──
export interface PersonalizationContext {
  research?: Record<string, unknown>
  audit?: Record<string, unknown>
  industry?: Record<string, unknown>
  competitors?: Record<string, unknown>
  problems?: Record<string, unknown>
  opportunities?: Record<string, unknown>
  solutions?: Record<string, unknown>
  salesAngles?: SalesAngle[]
  outreach?: Record<string, unknown>
  qualityScores?: QualityScoreDetail
  qualityPassed?: boolean
  revisionCount?: number
  finalOutreach?: Record<string, unknown>
  assets?: Record<string, unknown>
}