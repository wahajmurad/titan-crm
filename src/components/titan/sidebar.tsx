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
import { motion, AnimatePresence } from 'framer-motion'

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
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200/60 z-40 flex flex-col overflow-hidden"
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <motion.div
              className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#3B82F6] rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Zap className="w-4 h-4 text-white" fill="white" />
            </motion.div>
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="font-bold text-[#0F172A] text-sm tracking-tight">TITAN</span>
                  <span className="text-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-bold rounded-md px-1.5 py-0.5 leading-none shadow-sm shadow-blue-500/20">AI</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2.5 space-y-6 overflow-y-auto overflow-x-hidden">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2.5 mb-2 overflow-hidden"
                  >
                    {section.label}
                  </motion.p>
                )}
              </AnimatePresence>
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
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors duration-150 relative',
                        active
                          ? 'bg-[#EFF6FF] text-[#2563EB]'
                          : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#EFF6FF]/60'
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="nav-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#2563EB] rounded-r-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <Icon className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-colors duration-150',
                        active ? 'text-[#2563EB]' : ''
                      )} />
                      <AnimatePresence mode="wait">
                        {sidebarOpen && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.15 }}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <AnimatePresence mode="wait">
                        {active && sidebarOpen && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0"
                          />
                        )}
                      </AnimatePresence>
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
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-sm text-[#475569] hover:text-red-600 hover:bg-red-50/80 transition-colors duration-150 mb-1"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </motion.button>
            )}
          </AnimatePresence>
          <div className={cn('flex items-center gap-2.5 px-2 py-2', !sidebarOpen && 'justify-center')}>
            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-transparent bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] p-[2px]">
              <AvatarFallback className="bg-white text-[#2563EB] text-xs font-bold rounded-full">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-[#0F172A] truncate">{userName}</p>
                  <p className="text-[11px] text-[#94A3B8] truncate">{userRole}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!sidebarOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center px-2 py-1.5 rounded-xl text-[#94A3B8] hover:text-red-600 hover:bg-red-50/80 transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium text-sm">Sign Out</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Collapse toggle */}
        <motion.button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute -right-3.5 top-16 w-7 h-7 bg-white border border-gray-200/80 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <motion.div
            animate={{ rotate: sidebarOpen ? 0 : 180 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#475569]" />
          </motion.div>
        </motion.button>
      </motion.aside>
    </TooltipProvider>
  )
}