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

interface AppState {
  currentView: AppView
  selectedLeadId: string | null
  selectedCampaignId: string | null
  sidebarOpen: boolean
  pendingAiQuery: string | null
  setView: (view: AppView, leadId?: string | null, campaignId?: string | null) => void
  setSidebarOpen: (open: boolean) => void
  setPendingAiQuery: (query: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedLeadId: null,
  selectedCampaignId: null,
  sidebarOpen: true,
  pendingAiQuery: null,
  setView: (view, leadId = null, campaignId = null) =>
    set({ currentView: view, selectedLeadId: leadId, selectedCampaignId: campaignId }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setPendingAiQuery: (query) => set({ pendingAiQuery: query }),
}))