'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/titan/sidebar'
import { SetupView } from '@/components/titan/setup-view'
import { LoginView } from '@/components/titan/login-view'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import { Bell, Zap, Search, Command } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PermissionMap } from '@/lib/types'

const DashboardView = dynamic(() => import('@/components/titan/dashboard-view').then(m => ({ default: m.DashboardView })), { loading: () => <PageSkeleton /> })
const DiscoveryView = dynamic(() => import('@/components/titan/discovery-view').then(m => ({ default: m.DiscoveryView })), { loading: () => <PageSkeleton /> })
const AuditView = dynamic(() => import('@/components/titan/audit-view').then(m => ({ default: m.AuditView })), { loading: () => <PageSkeleton /> })
const LeadsView = dynamic(() => import('@/components/titan/leads-view').then(m => ({ default: m.LeadsView })), { loading: () => <PageSkeleton /> })
const LeadDetailView = dynamic(() => import('@/components/titan/lead-detail-view').then(m => ({ default: m.LeadDetailView })), { loading: () => <PageSkeleton /> })
const CampaignsView = dynamic(() => import('@/components/titan/campaigns-view').then(m => ({ default: m.CampaignsView })), { loading: () => <PageSkeleton /> })
const EmailCenterView = dynamic(() => import('@/components/titan/email-center-view').then(m => ({ default: m.EmailCenterView })), { loading: () => <PageSkeleton /> })
const InboxView = dynamic(() => import('@/components/titan/inbox-view').then(m => ({ default: m.InboxView })), { loading: () => <PageSkeleton /> })
const MeetingsView = dynamic(() => import('@/components/titan/meetings-view').then(m => ({ default: m.MeetingsView })), { loading: () => <PageSkeleton /> })
const AIAssistantView = dynamic(() => import('@/components/titan/ai-assistant-view').then(m => ({ default: m.AIAssistantView })), { loading: () => <PageSkeleton /> })
const PromptsView = dynamic(() => import('@/components/titan/prompts-view').then(m => ({ default: m.PromptsView })), { loading: () => <PageSkeleton /> })
const TeamView = dynamic(() => import('@/components/titan/team-view').then(m => ({ default: m.TeamView })), { loading: () => <PageSkeleton /> })
const SettingsView = dynamic(() => import('@/components/titan/settings-view').then(m => ({ default: m.SettingsView })), { loading: () => <PageSkeleton /> })
const IndustryExpertView = dynamic(() => import('@/components/titan/industry-expert-view').then(m => ({ default: m.IndustryExpertView })), { loading: () => <PageSkeleton /> })
const StrategyAssistantView = dynamic(() => import('@/components/titan/strategy-assistant-view').then(m => ({ default: m.StrategyAssistantView })), { loading: () => <PageSkeleton /> })
const LeadProvidersView = dynamic(() => import('@/components/titan/lead-providers-view').then(m => ({ default: m.LeadProvidersView })), { loading: () => <PageSkeleton /> })

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-48 bg-gray-100 rounded-2xl" />
      <div className="h-4 w-72 bg-gray-100/70 rounded-2xl" />
      <div className="grid grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-2xl" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="h-72 bg-gray-100 rounded-2xl mt-4" />
    </div>
  )
}

export interface UserData {
  id: string; email: string; name: string; role: string; avatar?: string; permissions: PermissionMap
}

export default function HomeClient() {
  const { currentView, sidebarOpen } = useAppStore()
  const [state, setState] = useState<'loading' | 'setup' | 'login' | 'app'>('loading')
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        const setupRes = await fetch('/api/setup', { credentials: 'same-origin' })
        if (cancelled) return
        const setupData = await setupRes.json()
        if (setupData.needsSetup) { setState('setup'); return }

        const authRes = await fetch('/api/auth', { credentials: 'same-origin' })
        if (cancelled) return
        const authData = await authRes.json()
        if (authData.user) {
          setUser(authData.user)
          setState('app')
        } else {
          setState('login')
        }
      } catch { if (!cancelled) setState('login') }
    }
    init()
    return () => { cancelled = true }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE', credentials: 'same-origin' })
    setState('login')
    setUser(null)
  }

  const hasPermission = (mod: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    if (!user) return false
    if (user.role === 'OWNER') return true
    return user.permissions[mod]?.[action] ?? false
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center gap-5"
        >
          <motion.div
            animate={{
              background: [
                'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
                'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <Zap className="w-7 h-7 text-white" fill="white" />
          </motion.div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#0F172A] tracking-tight">TITAN</span>
            <span className="text-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-bold rounded-md px-1.5 py-0.5 leading-none">AI</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {[0, 150, 300].map((delay, i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: delay / 1000, ease: 'easeInOut' }}
                className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  if (state === 'setup') return <SetupView />
  if (state === 'login') return <LoginView onLogin={(u) => { setUser(u as UserData); setState('app') }} />
  if (!user) return null

  const renderView = () => {
    if (!hasPermission(currentView, 'canView') && currentView !== 'dashboard' && currentView !== 'ai-assistant') {
      return (
        <div className="flex items-center justify-center py-24">
          <p className="text-[#94A3B8]">You don&apos;t have access to this section</p>
        </div>
      )
    }
    switch (currentView) {
      case 'dashboard': return <DashboardView userName={user.name} />
      case 'discovery': return <DiscoveryView />
      case 'audit': return <AuditView />
      case 'leads': return <LeadsView />
      case 'lead-detail': return <LeadDetailView />
      case 'campaigns': return <CampaignsView />
      case 'email-center': return <EmailCenterView />
      case 'inbox': return <InboxView />
      case 'meetings': return <MeetingsView />
      case 'ai-assistant': return <AIAssistantView />
      case 'industry-expert': return <IndustryExpertView />
      case 'strategy-assistant': return <StrategyAssistantView />
      case 'lead-providers': return <LeadProvidersView />
      case 'prompts': return <PromptsView />
      case 'team': return <TeamView />
      case 'settings': return <SettingsView />
      default: return <DashboardView />
    }
  }

  const viewLabel = currentView.replace(/-/g, ' ')

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased">
      <Sidebar userName={user.name} userRole={user.role} onLogout={handleLogout} />
      <motion.main
        animate={{ marginLeft: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="min-h-screen"
      >
        {/* Premium Header */}
        <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-[#0F172A] capitalize">{viewLabel}</h1>
            {currentView === 'dashboard' && (
              <span className="text-sm text-[#94A3B8] hidden sm:inline">Welcome back, {user.name.split(' ')[0]}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Command-K hint pill */}
            <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200/80 text-[#94A3B8] text-xs hover:border-gray-300 hover:text-[#475569] transition-colors duration-150">
              <Command className="w-3 h-3" />
              <span>K</span>
            </button>
            {/* Search button */}
            <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-150">
              <Search className="w-4 h-4 text-[#475569]" />
            </button>
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors duration-150">
              <Bell className="w-4 h-4 text-[#475569]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2563EB] rounded-full ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Page content with transitions */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
      <Toaster position="top-right" />
    </div>
  )
}