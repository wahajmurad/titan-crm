import { create } from 'zustand'

export type AppView =
  | 'dashboard'
  | 'discovery'
  | 'audit'
  | 'leads'
  | 'lead-detail'
  | 'campaigns'
  | 'email-center'
  | 'inbox'
  | 'meetings'
  | 'ai-assistant'
  | 'industry-expert'
  | 'strategy-assistant'
  | 'lead-providers'
  | 'prompts'
  | 'team'
  | 'settings'
| 'workflows'
  | 'command-center'
  | 'ai-agents'
  | 'personalization'
  | 'knowledge-base'
  | 'ai-proposals'
  | 'meeting-prep'

interface AppState {
  currentView: AppView
  selectedLeadId: string | null
  selectedCampaignId: string | null
  selectedWorkflowId: string | null
  sidebarOpen: boolean
  pendingAiQuery: string | null
  commandCenterOpen: boolean
  // Live dashboard data
  liveStats: {
    leadsFound: number
    leadsQualified: number
    auditsCompleted: number
    emailsSent: number
    replyRate: number
    meetingsBooked: number
    revenuePotential: number
    activeCampaigns: number
  } | null
  setView: (view: AppView, leadId?: string | null, campaignId?: string | null, workflowId?: string | null) => void
  setSidebarOpen: (open: boolean) => void
  setPendingAiQuery: (query: string | null) => void
  setCommandCenterOpen: (open: boolean) => void
  updateLiveStats: (stats: Partial<AppState['liveStats']>) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedLeadId: null,
  selectedCampaignId: null,
  selectedWorkflowId: null,
  sidebarOpen: true,
  pendingAiQuery: null,
  commandCenterOpen: false,
  liveStats: null,
  setView: (view, leadId = null, campaignId = null, workflowId = null) =>
    set({ currentView: view, selectedLeadId: leadId, selectedCampaignId: campaignId, selectedWorkflowId: workflowId }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setPendingAiQuery: (query) => set({ pendingAiQuery: query }),
  setCommandCenterOpen: (open) => set({ commandCenterOpen: open }),
  updateLiveStats: (stats) => set((state) => ({
    liveStats: state.liveStats ? { ...state.liveStats, ...stats } : stats as AppState['liveStats']
  })),
}))