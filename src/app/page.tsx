'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/titan/sidebar'
import { SetupView } from '@/components/titan/setup-view'
import { LoginView } from '@/components/titan/login-view'
import { DashboardView } from '@/components/titan/dashboard-view'
import { LeadsView } from '@/components/titan/leads-view'
import { LeadDetailView } from '@/components/titan/lead-detail-view'
import { OutreachView } from '@/components/titan/outreach-view'
import { MeetingsView } from '@/components/titan/meetings-view'
import { TeamView } from '@/components/titan/team-view'
import { SettingsView } from '@/components/titan/settings-view'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import { Bell } from 'lucide-react'
import type { PermissionMap } from '@/lib/types'

interface UserData {
  id: string; email: string; name: string; role: string; avatar?: string; permissions: PermissionMap
}

export default function Home() {
  const { currentView, sidebarOpen } = useAppStore()
  const [state, setState] = useState<'loading' | 'setup' | 'login' | 'app'>('loading')
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        const [authRes, setupRes] = await Promise.all([fetch('/api/auth'), fetch('/api/setup')])
        if (cancelled) return
        const setupData = await setupRes.json()
        if (setupData.needsSetup) { setState('setup'); return }
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
    await fetch('/api/auth', { method: 'DELETE' })
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-sm text-slate-400">Loading...</span>
        </div>
      </div>
    )
  }

  if (state === 'setup') return <SetupView />
  if (state === 'login') return <LoginView />
  if (!user) return null

  const renderView = () => {
    if (!hasPermission(currentView, 'canView') && currentView !== 'dashboard') {
      return (
        <div className="flex items-center justify-center py-24">
          <p className="text-slate-400">You don&apos;t have access to this section</p>
        </div>
      )
    }
    switch (currentView) {
      case 'dashboard': return <DashboardView />
      case 'leads': return <LeadsView />
      case 'lead-detail': return <LeadDetailView />
      case 'outreach': return <OutreachView />
      case 'meetings': return <MeetingsView />
      case 'team': return <TeamView />
      case 'settings': return <SettingsView />
      default: return <DashboardView />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar userName={user.name} userRole={user.role} onLogout={handleLogout} />
      <main
        className={cn(
          'transition-all duration-200 ease-in-out min-h-screen',
          sidebarOpen ? 'ml-56' : 'ml-16'
        )}
      >
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="w-48" /> {/* spacer for sidebar alignment */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {renderView()}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  )
}