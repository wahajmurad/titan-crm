'use client'

import { useAppStore, type AppView } from '@/lib/store'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Mail, Calendar, UserCog, Settings, LogOut, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const NAV_ITEMS: { view: AppView; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'leads', label: 'Leads', icon: Users },
  { view: 'outreach', label: 'Outreach', icon: Mail },
  { view: 'meetings', label: 'Meetings', icon: Calendar },
  { view: 'team', label: 'Team', icon: UserCog },
  { view: 'settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  userName: string
  userRole: string
  onLogout: () => void
}

export function Sidebar({ userName, userRole, onLogout }: SidebarProps) {
  const { currentView, setView, sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-40 flex flex-col transition-all duration-200 ease-in-out',
        sidebarOpen ? 'w-56' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-slate-900 text-sm tracking-tight">TITAN</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = currentView === item.view || (item.view === 'leads' && currentView === 'lead-detail')
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 p-2">
        <div className={cn('flex items-center gap-2.5 px-2.5 py-2', !sidebarOpen && 'justify-center')}>
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-medium">
              {userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-400">{userRole}</p>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 text-slate-500 hover:text-red-600 justify-start px-2.5"
            onClick={onLogout}
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </Button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-16 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
      </button>
    </aside>
  )
}