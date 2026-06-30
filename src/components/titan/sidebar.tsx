'use client'

import { useAppStore, type AppView } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Search, Globe2, Users, Target, Mail, Inbox,
  Calendar, Brain, BookOpen, UserCog, Settings, LogOut,
  ChevronLeft, ChevronRight, Zap, TrendingUp, Send, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip'

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { view: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
      { view: 'discovery' as AppView, label: 'Lead Discovery', icon: Search },
      { view: 'audit' as AppView, label: 'Website Audit', icon: Globe2 },
      { view: 'leads' as AppView, label: 'Leads', icon: Users },
    ],
  },
  {
    label: 'Campaigns',
    items: [
      { view: 'campaigns' as AppView, label: 'Campaigns', icon: Target },
      { view: 'email-center' as AppView, label: 'Email Center', icon: Send },
      { view: 'inbox' as AppView, label: 'Inbox', icon: Inbox },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { view: 'ai-assistant' as AppView, label: 'AI Assistant', icon: Brain },
      { view: 'prompts' as AppView, label: 'Prompt Library', icon: BookOpen },
    ],
  },
  {
    label: 'Operations',
    items: [
      { view: 'meetings' as AppView, label: 'Meetings', icon: Calendar },
      { view: 'team' as AppView, label: 'Team', icon: UserCog },
      { view: 'settings' as AppView, label: 'Settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  userName: string
  userRole: string
  onLogout: () => void
}

export function Sidebar({ userName, userRole, onLogout }: SidebarProps) {
  const { currentView, setView, sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 flex flex-col transition-all duration-200 ease-in-out',
          sidebarOpen ? 'w-60' : 'w-[68px]'
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/10">
              <Zap className="w-4 h-4 text-gray-900" />
            </div>
            {sidebarOpen && (
              <div>
                <span className="font-bold text-gray-900 text-sm tracking-tight">TITAN</span>
                <span className="text-[10px] text-violet-400 ml-1.5 font-medium">AI</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2.5 space-y-5 overflow-y-auto">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              {sidebarOpen && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2.5 mb-1.5">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon
                  const active = currentView === item.view ||
                    (item.view === 'leads' && (currentView === 'lead-detail'))

                  const btn = (
                    <button
                      key={item.view}
                      onClick={() => setView(item.view)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                        active
                          ? 'bg-violet-50 text-violet-700'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 shrink-0', active && 'text-violet-600')} />
                      {sidebarOpen && <span>{item.label}</span>}
                      {active && sidebarOpen && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-600" />
                      )}
                    </button>
                  )

                  if (!sidebarOpen) {
                    return (
                      <Tooltip key={item.view}>
                        <TooltipTrigger asChild>{btn}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }
                  return btn
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-200 p-2.5">
          <div className={cn('flex items-center gap-2.5 px-2 py-2', !sidebarOpen && 'justify-center')}>
            <Avatar className="h-7 w-7 shrink-0 ring-2 ring-violet-200">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-[11px] text-gray-400">{userRole}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1 text-gray-500 hover:text-red-600 justify-start px-2.5 hover:bg-red-50"
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
          className="absolute -right-3 top-16 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen
            ? <ChevronLeft className="w-3 h-3 text-gray-500" />
            : <ChevronRight className="w-3 h-3 text-gray-500" />
          }
        </button>
      </aside>
    </TooltipProvider>
  )
}