import { create } from 'zustand'

export type AppView = 'dashboard' | 'leads' | 'lead-detail' | 'outreach' | 'meetings' | 'team' | 'settings'

interface AppState {
  currentView: AppView
  selectedLeadId: string | null
  sidebarOpen: boolean
  setView: (view: AppView, leadId?: string | null) => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedLeadId: null,
  sidebarOpen: true,
  setView: (view, leadId = null) => set({ currentView: view, selectedLeadId: leadId }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))