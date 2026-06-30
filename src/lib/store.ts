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
  | 'prompts'
  | 'team'
  | 'settings'

interface AppState {
  currentView: AppView
  selectedLeadId: string | null
  selectedCampaignId: string | null
  sidebarOpen: boolean
  setView: (view: AppView, leadId?: string | null, campaignId?: string | null) => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedLeadId: null,
  selectedCampaignId: null,
  sidebarOpen: true,
  setView: (view, leadId = null, campaignId = null) =>
    set({ currentView: view, selectedLeadId: leadId, selectedCampaignId: campaignId }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))