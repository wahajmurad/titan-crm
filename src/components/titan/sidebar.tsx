'use client'

import { useAppStore, type AppView } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Search, Globe2, Users, Target, Mail, Inbox,
  Calendar, Brain, BookOpen, UserCog, Settings, LogOut,
  ChevronLeft, ChevronRight, Zap, GraduationCap, Plug, Lightbulb
} from 'lucide-react'
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
      { view: 'email-center' as AppView, label: 'Email Center', icon: Mail },
      { view: 'inbox' as AppView, label: 'Inbox', icon: Inbox },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { view: 'ai-assistant' as AppView, label: 'AI Assistant', icon: Brain },
      { view: 'industry-expert' as AppView, label: 'Industry Expert', icon: GraduationCap },
      { view: 'strategy-assistant' as AppView, label: 'Strategy AI', icon: Lightbulb },
      { view: 'prompts' as AppView, label: 'Prompt Library', icon: BookOpen },
    ],
  },
  {
    label: 'Operations',
    items: [
      { view: 'meetings' as AppView, label: 'Meetings', icon: Calendar },
      { view: 'lead-providers' as AppView, label: 'Lead Providers', icon: Plug },
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
          'fixed left-0 top-0 h-screen bg-white border-r border-gray-200/60 z-40 flex flex-col transition-all duration-200 ease-in-out',
          sidebarOpen ? 'w-60' : 'w-[68px]'
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 text-sm tracking-tight">TITAN</span>
                <span className="text-[10px] bg-blue-500 text-white font-semibold rounded px-1 py-px leading-none">AI</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2.5 space-y-6 overflow-y-auto">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              {sidebarOpen && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2.5 mb-2">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon
                  const active = currentView === item.view ||
                    (item.view === 'leads' && currentView === 'lead-detail')

                  const btn = (
                    <button
                      key={item.view}
                      onClick={() => setView(item.view)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative',
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <Icon className={cn('w-[18px] h-[18px] shrink-0 transition-colors duration-150', active && 'text-blue-600')} />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                      {active && sidebarOpen && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </button>
                  )

                  if (!sidebarOpen) {
                    return (
                      <Tooltip key={item.view}>
                        <TooltipTrigger asChild>{btn}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium text-sm">
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

        {/* User section */}
        <div className="border-t border-gray-200/60 p-2.5 shrink-0">
          {sidebarOpen && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 mb-1"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          )}
          <div className={cn('flex items-center gap-2.5 px-2 py-2', !sidebarOpen && 'justify-center')}>
            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-blue-200">
              <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-[11px] text-gray-400 truncate">{userRole}</p>
              </div>
            )}
          </div>
          {!sidebarOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center px-2 py-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium text-sm">Sign Out</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-16 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
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