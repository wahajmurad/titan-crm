'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, type AppView } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Search, Globe2, Users, Target, Mail, Inbox,
  Calendar, Brain, BookOpen, UserCog, Settings, LogOut,
  ChevronLeft, Zap, GraduationCap, Plug, Lightbulb,
  Terminal, Workflow, Sparkles, Heart
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
      { view: 'command-center' as AppView, label: 'AI Command', icon: Terminal },
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
      { view: 'ai-agents' as AppView, label: 'AI Agents', icon: Sparkles },
      { view: 'industry-expert' as AppView, label: 'Industry Expert', icon: GraduationCap },
      { view: 'strategy-assistant' as AppView, label: 'Strategy AI', icon: Lightbulb },
      { view: 'prompts' as AppView, label: 'Prompt Library', icon: BookOpen },
    ],
  },
  {
    label: 'Operations',
    items: [
      { view: 'personalization' as AppView, label: 'Personalization', icon: Heart },
      { view: 'workflows' as AppView, label: 'Workflows', icon: Workflow },
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

  // Keyboard: Escape to close sidebar on mobile
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen && window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [sidebarOpen, setSidebarOpen])

  // Close sidebar on mobile when navigating
  const handleNav = (view: AppView) => {
    setView(view)
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'fixed left-0 top-0 h-screen bg-white dark:bg-[#0B0F1A] border-r border-[#E8ECF1]/80 dark:border-white/[0.06] z-40 flex flex-col overflow-hidden',
          'lg:relative lg:z-auto', // responsive: fixed on mobile, relative on desktop
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-3.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <motion.div
              className="w-8 h-8 bg-[#0F172A] dark:bg-white rounded-[10px] flex items-center justify-center shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Zap className="w-4 h-4 text-white dark:text-[#0F172A]" fill="currentColor" />
            </motion.div>
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="font-semibold text-[#0F172A] dark:text-white text-[13px] tracking-tight">TITAN</span>
                  <span className="text-[9px] bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] font-bold rounded-[5px] px-1.5 py-[2px] leading-none">AI</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2.5 space-y-5 overflow-y-auto overflow-x-hidden" role="menubar">
          {NAV_SECTIONS.map(section => (
            <div key={section.label} role="none">
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                    className="text-[10px] font-semibold text-[#94A3B8] dark:text-white/30 uppercase tracking-[0.08em] px-2.5 mb-1.5 overflow-hidden"
                    role="none"
                  >
                    {section.label}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5" role="group" aria-label={section.label}>
                {section.items.map(item => {
                  const Icon = item.icon
                  const active = currentView === item.view ||
                    (item.view === 'leads' && currentView === 'lead-detail')

                  const btn = (
                    <button
                      key={item.view}
                      onClick={() => handleNav(item.view)}
                      role="menuitem"
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px] text-[13px] font-medium transition-all duration-150 relative outline-none',
                        'focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 focus-visible:ring-offset-1',
                        active
                          ? 'bg-[#EFF6FF] dark:bg-white/[0.08] text-[#0F172A] dark:text-white'
                          : 'text-[#475569] dark:text-white/50 hover:text-[#0F172A] dark:hover:text-white/80 hover:bg-[#F1F5F9] dark:hover:bg-white/[0.04]'
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="nav-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#0F172A] dark:bg-white rounded-r-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <Icon className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-colors duration-150',
                        active ? 'text-[#0F172A] dark:text-white' : ''
                      )} />
                      <AnimatePresence mode="wait">
                        {sidebarOpen && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.12 }}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  )

                  if (!sidebarOpen) {
                    return (
                      <Tooltip key={item.view}>
                        <TooltipTrigger asChild>{btn}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium text-sm">{item.label}</TooltipContent>
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
        <div className="border-t border-[#E8ECF1]/80 dark:border-white/[0.06] p-2.5 shrink-0">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.12 }}
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] text-[13px] text-[#475569] dark:text-white/50 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 mb-1 outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </motion.button>
            )}
          </AnimatePresence>
          <div className={cn('flex items-center gap-2.5 px-2 py-2', !sidebarOpen && 'justify-center')}>
            <Avatar className="h-8 w-8 shrink-0 bg-[#0F172A] dark:bg-white p-[2px]">
              <AvatarFallback className="bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white text-[11px] font-bold rounded-full">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.12 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-[13px] font-medium text-[#0F172A] dark:text-white truncate">{userName}</p>
                  <p className="text-[11px] text-[#94A3B8] dark:text-white/30 truncate">{userRole}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!sidebarOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center px-2 py-1.5 rounded-[10px] text-[#94A3B8] hover:text-red-600 hover:bg-red-50/80 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium text-sm">Sign Out</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Collapse toggle — desktop only */}
        <motion.button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute -right-3.5 top-16 w-7 h-7 bg-white dark:bg-[#0B0F1A] border border-[#E8ECF1] dark:border-white/[0.06] rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-200 hidden lg:flex outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <motion.div
            animate={{ rotate: sidebarOpen ? 0 : 180 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#475569] dark:text-white/50" />
          </motion.div>
        </motion.button>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[-1] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </motion.aside>
    </TooltipProvider>
  )
}