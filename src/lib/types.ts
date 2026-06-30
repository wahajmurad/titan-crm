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