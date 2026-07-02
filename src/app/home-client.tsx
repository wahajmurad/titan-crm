'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/titan/sidebar'
import { SetupView } from '@/components/titan/setup-view'
import { LoginView } from '@/components/titan/login-view'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import { Zap, Search, Command, Menu, Brain, Target, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { CommandPalette } from '@/components/titan/command-palette'
import { NotificationBell } from '@/components/titan/notification-bell'
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
const CommandCenterView = dynamic(() => import('@/components/titan/command-center-view').then(m => ({ default: m.CommandCenterView })), { loading: () => <PageSkeleton /> })
const WorkflowBuilderView = dynamic(() => import('@/components/titan/workflow-builder-view').then(m => ({ default: m.WorkflowBuilderView })), { loading: () => <PageSkeleton /> })
const AIAgentsView = dynamic(() => import('@/components/titan/ai-agents-view').then(m => ({ default: m.AIAgentsView })), { loading: () => <PageSkeleton /> })
const PersonalizationView = dynamic(() => import('@/components/titan/personalization-view').then(m => ({ default: m.PersonalizationView })), { loading: () => <PageSkeleton /> })

function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Loading page content">
      <div className="h-7 w-48 bg-[#F1F5F9] dark:bg-white/[0.04] rounded-xl" />
      <div className="h-4 w-72 bg-[#F1F5F9]/70 dark:bg-white/[0.03] rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-[#F1F5F9] dark:bg-white/[0.03] rounded-2xl" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="h-72 bg-[#F1F5F9] dark:bg-white/[0.03] rounded-2xl mt-3" />
    </div>
  )
}

export interface UserData {
  id: string; email: string; name: string; role: string; avatar?: string; permissions: PermissionMap
}

export default function HomeClient() {
  const { currentView, sidebarOpen, setSidebarOpen } = useAppStore()
  const [state, setState] = useState<'loading' | 'setup' | 'login' | 'app'>('loading')
  const [user, setUser] = useState<UserData | null>(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const { theme, setTheme } = useTheme()

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

  // Keyboard shortcut: Cmd/Ctrl + K for command palette
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#070A13]" role="status" aria-label="Loading TITAN">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center gap-5"
        >
          <motion.div
            className="w-14 h-14 bg-[#0F172A] dark:bg-white rounded-2xl flex items-center justify-center shadow-lg"
            animate={{ boxShadow: ['0 4px 20px rgba(15,23,42,0.15)', '0 4px 30px rgba(15,23,42,0.25)', '0 4px 20px rgba(15,23,42,0.15)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Zap className="w-7 h-7 text-white dark:text-[#0F172A]" fill="currentColor" />
          </motion.div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#0F172A] dark:text-white tracking-tight">TITAN</span>
            <span className="text-[10px] bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] font-bold rounded-md px-1.5 py-0.5 leading-none">AI</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {[0, 150, 300].map((delay, i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: delay / 1000, ease: 'easeInOut' }}
                className="w-1.5 h-1.5 rounded-full bg-[#0F172A] dark:bg-white"
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
        <div className="flex items-center justify-center py-24" role="alert">
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
      case 'command-center': return <CommandCenterView />
      case 'workflows': return <WorkflowBuilderView />
      case 'ai-agents': return <AIAgentsView />
      case 'personalization': return <PersonalizationView />
      case 'prompts': return <PromptsView />
      case 'team': return <TeamView />
      case 'settings': return <SettingsView />
      default: return <DashboardView userName={user.name} />
    }
  }

  const viewLabel = currentView.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#070A13] text-[#0F172A] dark:text-gray-100 font-sans antialiased">
      <Sidebar userName={user.name} userRole={user.role} onLogout={handleLogout} />
      <motion.main
        animate={{ marginLeft: sidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="min-h-screen lg:block hidden"
        role="main"
      >
        {/* Premium Header */}
        <header className="h-14 bg-white/80 dark:bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-[#E8ECF1]/60 dark:border-white/[0.04] flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-[13px] font-semibold text-[#0F172A] dark:text-white">{viewLabel}</h1>
            {currentView === 'dashboard' && (
              <span className="text-[13px] text-[#94A3B8] hidden sm:inline">Welcome back, {user.name.split(' ')[0]}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Cmd+K hint */}
            <button
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-[#E2E8F0] dark:border-white/[0.08] text-[#94A3B8] dark:text-white/30 text-[12px] hover:border-[#CBD5E1] hover:text-[#475569] dark:hover:text-white/50 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
              onClick={() => setCommandOpen(true)}
              aria-label="Open command palette (Ctrl+K)"
            >
              <Command className="w-3 h-3" />
              <span>K</span>
            </button>
            <button onClick={() => setCommandOpen(true)} className="p-2 rounded-[8px] hover:bg-[#F1F5F9] dark:hover:bg-white/[0.04] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30" aria-label="Search">
              <Search className="w-[18px] h-[18px] text-[#475569] dark:text-white/50" />
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-[8px] hover:bg-[#F1F5F9] dark:hover:bg-white/[0.04] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <Sun className="w-[18px] h-[18px] text-[#475569] dark:text-white/50 hidden dark:block" />
              <Moon className="w-[18px] h-[18px] text-[#475569] dark:text-white/50 block dark:hidden" />
            </button>
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Mobile Layout — sidebar overlay + bottom header */}
      <div className="lg:hidden" role="main">
        {/* Mobile header bar */}
        <header className="h-14 bg-white/80 dark:bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-[#E8ECF1]/60 dark:border-white/[0.04] flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-[8px] hover:bg-[#F1F5F9] dark:hover:bg-white/[0.04] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-[#0F172A] dark:text-white" />
            </button>
            <h1 className="text-[13px] font-semibold text-[#0F172A] dark:text-white">{viewLabel}</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCommandOpen(true)} className="p-2 rounded-[8px] hover:bg-[#F1F5F9] dark:hover:bg-white/[0.04] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30" aria-label="Search">
              <Search className="w-[18px] h-[18px] text-[#475569] dark:text-white/50" />
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-[8px] hover:bg-[#F1F5F9] dark:hover:bg-white/[0.04] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <Sun className="w-[18px] h-[18px] text-[#475569] dark:text-white/50 hidden dark:block" />
              <Moon className="w-[18px] h-[18px] text-[#475569] dark:text-white/50 block dark:hidden" />
            </button>
            <NotificationBell />
          </div>
        </header>

        {/* Mobile page content */}
        <div className="p-4 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-[#0B0F1A]/90 backdrop-blur-xl border-t border-[#E8ECF1]/60 dark:border-white/[0.04] z-30 flex items-center justify-around px-2" aria-label="Mobile navigation">
          {[
            { view: 'dashboard' as const, icon: Zap, label: 'Home' },
            { view: 'discovery' as const, icon: Search, label: 'Leads' },
            { view: 'ai-assistant' as const, icon: Brain, label: 'AI' },
            { view: 'campaigns' as const, icon: Target, label: 'Campaigns' },
            { view: 'settings' as const, icon: Settings, label: 'More' },
          ].map(item => {
            const active = currentView === item.view
            return (
              <button
                key={item.view}
                onClick={() => { useAppStore.getState().setView(item.view) }}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[48px]',
                  active ? 'text-[#0F172A] dark:text-white' : 'text-[#94A3B8] dark:text-white/30'
                )}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <Toaster position="top-right" />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}