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
  DISCOVERED: 'bg-slate-800 text-slate-300 border-slate-700',
  AUDITED: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  QUALIFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  OUTREACH_SENT: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  REPLIED: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  MEETING_BOOKED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  PROPOSAL_SENT: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  WON: 'bg-green-500/15 text-green-400 border-green-500/30',
  LOST: 'bg-red-500/10 text-red-400 border-red-500/30',
}

export const STAGE_DOT_COLORS: Record<string, string> = {
  DISCOVERED: 'bg-slate-400',
  AUDITED: 'bg-sky-500',
  QUALIFIED: 'bg-emerald-500',
  OUTREACH_SENT: 'bg-amber-500',
  REPLIED: 'bg-violet-500',
  MEETING_BOOKED: 'bg-blue-500',
  PROPOSAL_SENT: 'bg-orange-500',
  WON: 'bg-green-600',
  LOST: 'bg-red-500',
}

export const TEMP_COLORS: Record<string, string> = {
  HOT: 'bg-red-500/15 text-red-400 border-red-500/30',
  WARM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  COLD: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
}

export interface AuditScores {
  design: number
  technical: number
  business: number
  automation: number
  overall: number
}

export interface AuditDetails {
  design: string
  technical: string
  business: string
  automation: string
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