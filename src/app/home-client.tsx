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
import { BugReportButton } from '@/components/titan/bug-report-button'
import { Toaster, toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Search, Sun, Moon, Zap, Menu, Brain, Target, Settings, Plus, Mail } from 'lucide-react'
import type { PermissionMap } from '@/lib/types'

const DashboardView = dynamic(() => import('@/components/titan/dashboard-view').then(m => ({ default: m.DashboardView })), { loading: () => <PageSkeleton /> })
const AutomationCenterView = dynamic(() => import('@/components/titan/automation-center-view').then(m => ({ default: m.AutomationCenterView })), { loading: () => <PageSkeleton /> })
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
const KnowledgeBaseView = dynamic(() => import('@/components/titan/knowledge-base-view').then(m => ({ default: m.KnowledgeBaseView })), { loading: () => <PageSkeleton /> })
const AIProposalsView = dynamic(() => import('@/components/titan/ai-proposals-view').then(m => ({ default: m.AIProposalsView })), { loading: () => <PageSkeleton /> })
const MeetingPrepView = dynamic(() => import('@/components/titan/meeting-prep-view').then(m => ({ default: m.MeetingPrepView })), { loading: () => <PageSkeleton /> })
const OutreachView = dynamic(() => import('@/components/titan/outreach-view').then(m => ({ default: m.OutreachView })), { loading: () => <PageSkeleton /> })

function PageSkeleton() {
  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center gap-3">
        <div className="h-7 w-48 skeleton-shimmer rounded-lg" />
        <div className="h-7 w-32 skeleton-shimmer rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 skeleton-shimmer rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-72 skeleton-shimmer rounded-xl" />
        <div className="h-72 skeleton-shimmer rounded-xl" />
      </div>
    </div>
  )
}

export interface UserData {
  id: string; email: string; name: string; role: string; avatar?: string; permissions: PermissionMap
}

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function HomeClient() {
  const { currentView, sidebarOpen, setSidebarOpen } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [state, setState] = useState<'loading' | 'setup' | 'login' | 'app'>('loading')
  const [user, setUser] = useState<UserData | null>(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

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
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading TITAN">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-6 h-6 text-white" fill="white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">TITAN</span>
            <span className="text-[10px] gradient-blue text-white font-bold rounded-md px-1.5 py-0.5 leading-none">AI</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {[0, 150, 300].map((delay, i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: delay / 1000, ease: 'easeInOut' }}
                className="w-1.5 h-1.5 rounded-full bg-blue-500"
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
      case 'automation': return <AutomationCenterView />
      case 'discovery': return <DiscoveryView />
      case 'audit': return <AuditView />
      case 'leads': return <LeadsView />
      case 'lead-detail': return <LeadDetailView />
      case 'campaigns': return <CampaignsView />
      case 'email-center': return <EmailCenterView />
      case 'outreach': return <OutreachView />
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
      case 'knowledge-base': return <KnowledgeBaseView />
      case 'ai-proposals': return <AIProposalsView />
      case 'meeting-prep': return <MeetingPrepView />
      case 'prompts': return <PromptsView />
      case 'team': return <TeamView />
      case 'settings': return <SettingsView />
      default: return <DashboardView userName={user.name} />
    }
  }

  const viewLabel = currentView.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const isWorkflow = currentView === 'workflows'

  const headerContent = (
    <header className="sticky top-0 z-30 glass-header h-12 px-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{viewLabel}</h1>
        {currentView === 'dashboard' && (
          <span className="text-[12px] text-gray-400 dark:text-gray-500">Welcome back, {user.name.split(' ')[0]}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {currentView === 'automation' && (
          <button
            onClick={() => useAppStore.getState().setView('automation')}
            className="h-7 px-3 rounded-lg gradient-blue text-white text-[11px] font-medium flex items-center gap-1.5 hover:shadow-md hover:shadow-blue-500/20 transition-all"
          >
            <Plus className="w-3 h-3" />
            New Automation
          </button>
        )}
        <button
          onClick={() => setCommandOpen(true)}
          className="h-7 px-3 rounded-lg bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200/80 dark:hover:bg-white/[0.1] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-[11px] font-medium flex items-center gap-2 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-flex h-4.5 px-1.5 rounded bg-white dark:bg-white/[0.08] border border-gray-200 dark:border-white/10 text-[9px] font-medium text-gray-400 dark:text-gray-500">
            ⌘K
          </kbd>
        </button>
        <NotificationCenter open={notifOpen} onOpenChange={setNotifOpen} />
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-7 w-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
            {user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0D14] text-gray-900 dark:text-gray-100 font-sans antialiased">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        {!isWorkflow && <Sidebar userName={user.name} userRole={user.role} onLogout={handleLogout} />}
        <main
          className={cn(
            'min-h-screen transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]',
            isWorkflow ? 'ml-0' : sidebarOpen ? 'ml-[256px]' : 'ml-[56px]',
          )}
        >
          {!isWorkflow && headerContent}
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
        <AnimatePresence>
          {sidebarOpen && !isWorkflow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
        {!isWorkflow && (
          <div
            className={cn(
              'fixed inset-y-0 left-0 z-50 transform transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <Sidebar userName={user.name} userRole={user.role} onLogout={handleLogout} />
          </div>
        )}

        {!isWorkflow && (
          <header className="h-12 glass-header flex items-center justify-between px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors -ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{viewLabel}</h1>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setCommandOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors text-gray-400" aria-label="Search">
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors text-gray-400"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <Sun className="w-4 h-4 hidden dark:block" />
                <Moon className="w-4 h-4 block dark:hidden" />
              </button>
              <NotificationCenter open={notifOpen} onOpenChange={setNotifOpen} />
            </div>
          </header>
        )}
        <div className={isWorkflow ? '' : 'p-4 pb-20'}>
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
        {!isWorkflow && (
          <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white/90 dark:bg-[#0A0D14]/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-white/[0.06] z-30 flex items-center justify-around px-2 safe-area-bottom" aria-label="Mobile navigation">
            {[
              { view: 'dashboard' as const, icon: Zap, label: 'Home' },
              { view: 'automation' as const, icon: Brain, label: 'Automate' },
              { view: 'campaigns' as const, icon: Target, label: 'Campaigns' },
              { view: 'inbox' as const, icon: Mail, label: 'Inbox' },
              { view: 'settings' as const, icon: Settings, label: 'More' },
            ].map(item => {
              const active = currentView === item.view
              return (
                <button
                  key={item.view}
                  onClick={() => { useAppStore.getState().setView(item.view); setSidebarOpen(false) }}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[48px]',
                    active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
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
        )}
      </div>

      <Toaster position="top-right" />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      {state === 'app' && <BugReportButton />}
      {state === 'app' && <SilentHealthWatcher />}
    </div>
  )
}

// ── Silent 5-minute health watcher ──
function SilentHealthWatcher() {
  useEffect(() => {
    let active = true
    const runCheck = async () => {
      if (!active) return
      try {
        const res = await fetch('/api/health-check')
        if (!res.ok || !active) return
        const data = await res.json()
        if (data.summary && data.summary.fixed > 0) {
          toast.success(`Auto-Heal: ${data.summary.fixed} issue(s) silently fixed`, {
            description: 'Vercel is redeploying with the fix...',
            duration: 8000,
          })
        }
      } catch {
        // Silently ignore — never disrupt the user
      }
    }
    // Initial check after 30s
    const initTimer = setTimeout(runCheck, 30_000)
    // Then every 5 minutes
    const interval = setInterval(runCheck, 5 * 60 * 1000)
    return () => { active = false; clearTimeout(initTimer); clearInterval(interval) }
  }, [])
  return null
}