'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/titan/sidebar'
import { SetupView } from '@/components/titan/setup-view'
import { LoginView } from '@/components/titan/login-view'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import { Bell, Zap } from 'lucide-react'
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

function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-40 bg-gray-100 rounded" />
      <div className="h-4 w-64 bg-gray-100 rounded" />
      <div className="grid grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl mt-4" />
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
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 animate-pulse opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 tracking-tight">TITAN</span>
            <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-semibold">AI</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
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
          <p className="text-gray-400">You don&apos;t have access to this section</p>
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
      case 'prompts': return <PromptsView />
      case 'team': return <TeamView />
      case 'settings': return <SettingsView />
      case 'industry-expert': return <IndustryExpertView />
      default: return <DashboardView />
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-gray-900">
      <Sidebar userName={user.name} userRole={user.role} onLogout={handleLogout} />
      <main
        className={cn(
          'transition-all duration-200 ease-in-out min-h-screen',
          sidebarOpen ? 'ml-60' : 'ml-[68px]'
        )}
      >
        <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-medium text-gray-900 capitalize">{currentView.replace(/-/g, ' ')}</h1>
            {currentView === 'dashboard' && (
              <span className="text-sm text-gray-400 hidden sm:inline">Welcome back, {user.name.split(' ')[0]}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </header>

        <div className="p-6">
          {renderView()}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  )
}