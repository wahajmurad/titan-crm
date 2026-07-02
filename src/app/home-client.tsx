'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/titan/sidebar'
import { SetupView } from '@/components/titan/setup-view'
import { LoginView } from '@/components/titan/login-view'
import { CommandPalette } from '@/components/titan/command-palette'
import { NotificationCenter } from '@/components/titan/notification-center'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import { Search, Sun, Moon, Zap, Menu, Brain, Target, Settings } from 'lucide-react'
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
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-7 w-48 skeleton-shimmer rounded-[10px]" />
        <div className="h-7 w-32 skeleton-shimmer rounded-[10px]" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 skeleton-shimmer rounded-[18px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-72 skeleton-shimmer rounded-[18px]" />
        <div className="h-72 skeleton-shimmer rounded-[18px]" />
      </div>
    </div>
  )
}

export interface UserData {
  id: string; email: string; name: string; role: string; avatar?: string; permissions: PermissionMap
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function HomeClient() {
  const { currentView, sidebarOpen, setSidebarOpen } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [state, setState] = useState<'loading' | 'setup' | 'login' | 'app'>('loading')
  const [user, setUser] = useState<UserData | null>(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

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
          <p className="text-muted-foreground">You don&apos;t have access to this section</p>
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
  const isWorkflow = currentView === 'workflows' || currentView === 'workflow-builder'

  return (
    <div className="min-h-screen bg-[var(--background)] text-foreground font-sans antialiased">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        {!isWorkflow && <Sidebar userName={user.name} userRole={user.role} onLogout={handleLogout} />}
        <main
          className={cn(
            'min-h-screen transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            isWorkflow ? 'ml-0' : sidebarOpen ? 'ml-[284px]' : 'ml-[96px]',
          )}
        >
          {!isWorkflow && (
            <header className="sticky top-0 z-30 glass-header h-14 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-[13px] font-semibold text-foreground">{viewLabel}</h1>
                {currentView === 'dashboard' && (
                  <span className="text-[13px] text-muted-foreground">Welcome back, {user.name.split(' ')[0]}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCommandOpen(true)}
                  className="h-8 px-3 rounded-[10px] bg-muted/50 hover:bg-muted text-muted-foreground text-[12px] font-medium flex items-center gap-2 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Search</span>
                  <kbd className="hidden sm:inline-flex h-5 px-1.5 rounded-[6px] bg-background border border-border text-[10px] font-medium text-muted-foreground">
                    ⌘K
                  </kbd>
                </button>
                <NotificationCenter open={notifOpen} onOpenChange={setNotifOpen} />
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="h-8 w-8 rounded-[10px] hover:bg-muted/50 flex items-center justify-center transition-colors"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <Avatar className="h-8 w-8 ring-2 ring-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </header>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={isWorkflow ? '' : 'p-6'}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden" role="main">
        <Sidebar userName={user.name} userRole={user.role} onLogout={handleLogout} />
        <header className="h-14 glass-header flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-[10px] hover:bg-muted/50 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-[13px] font-semibold">{viewLabel}</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCommandOpen(true)} className="p-2 rounded-[10px] hover:bg-muted/50 transition-colors" aria-label="Search">
              <Search className="w-[18px] h-[18px] text-muted-foreground" />
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-[10px] hover:bg-muted/50 transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <Sun className="w-[18px] h-[18px] hidden dark:block" />
              <Moon className="w-[18px] h-[18px] block dark:hidden" />
            </button>
            <NotificationCenter open={notifOpen} onOpenChange={setNotifOpen} />
          </div>
        </header>
        <div className="p-4 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
        <nav className="fixed bottom-0 left-0 right-0 h-16 glass-header border-t border-border/50 z-30 flex items-center justify-around px-2" aria-label="Mobile navigation">
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
                  active ? 'text-foreground' : 'text-muted-foreground'
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