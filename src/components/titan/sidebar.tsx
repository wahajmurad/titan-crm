'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type AppView } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Search, Globe2, Users, Target, Mail, Inbox,
  Calendar, Brain, BookOpen, UserCog, Settings, LogOut,
  ChevronLeft, ChevronRight, Zap, GraduationCap, Plug, Lightbulb,
  Sparkles, Workflow, BookMarked, FileText, CalendarCheck, Send,
  Command, Bot
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
      { view: 'workflows' as AppView, label: 'Workflow Builder', icon: Workflow },
      { view: 'email-center' as AppView, label: 'Email Center', icon: Mail },
      { view: 'outreach' as AppView, label: 'Outreach', icon: Send },
      { view: 'inbox' as AppView, label: 'Inbox', icon: Inbox },
    ],
  },
  {
    label: 'Personalization',
    items: [
      { view: 'personalization' as AppView, label: 'AI Pipeline', icon: Sparkles },
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
    label: 'Growth AI',
    items: [
      { view: 'knowledge-base' as AppView, label: 'Knowledge Base', icon: BookMarked },
      { view: 'ai-proposals' as AppView, label: 'AI Proposals', icon: FileText },
      { view: 'meeting-prep' as AppView, label: 'Meeting Prep', icon: CalendarCheck },
      { view: 'ai-agents' as AppView, label: 'AI Agents', icon: Bot },
      { view: 'command-center' as AppView, label: 'Command Center', icon: Command },
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

const textVariants = {
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  hide: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

const sectionLabelVariants = {
  show: {
    opacity: 1,
    transition: { duration: 0.2, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  hide: {
    opacity: 0,
    transition: { duration: 0.1, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

export function Sidebar({ userName, userRole, onLogout }: SidebarProps) {
  const { currentView, setView, sidebarOpen, setSidebarOpen } = useAppStore()

  const initials = userName.slice(0, 2).toUpperCase()

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
        className={cn(
          'glass-sidebar fixed left-0 top-0 z-40 flex flex-col overflow-hidden',
          'ml-3 mt-3 mb-3 rounded-[22px]',
          'h-[calc(100vh-24px)]'
        )}
      >
        {/* ── Logo Section ── */}
        <div className="flex items-center shrink-0 h-14 px-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[12px] bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10 shadow-lg shadow-blue-500/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key="logo-text"
                  initial="hide"
                  animate="show"
                  exit="hide"
                  variants={textVariants}
                  className="flex items-center gap-1.5 overflow-hidden"
                >
                  <span className="text-[15px] font-bold tracking-tight text-white">
                    TITAN
                  </span>
                  <span className="text-[9px] bg-blue-500 text-white font-bold rounded-md px-1.5 py-0.5 leading-none tracking-wide">
                    AI
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <div className="w-8 h-8 rounded-[12px] bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 space-y-5 scrollbar-none">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {/* Section Label */}
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.p
                    initial="hide"
                    animate="show"
                    exit="hide"
                    variants={sectionLabelVariants}
                    className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/30 px-2.5 mb-1.5 select-none"
                  >
                    {section.label}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Nav Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active =
                    currentView === item.view ||
                    (item.view === 'leads' && currentView === 'lead-detail')

                  const button = (
                    <button
                      key={item.view}
                      onClick={() => {
                        setView(item.view)
                        // Close sidebar on mobile after navigation
                        if (window.innerWidth < 1024) setSidebarOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 rounded-[12px] text-[13px] font-medium',
                        'transition-all duration-200 relative',
                        'px-2.5 py-[9px]',
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:text-white/90 hover:bg-white/[0.06]'
                      )}
                    >
                      {/* Active indicator */}
                      {active && (
                        <motion.div
                          layoutId="sidebar-active-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-blue-400"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}

                      <Icon
                        className={cn(
                          'w-[18px] h-[18px] shrink-0 transition-colors duration-200',
                          active
                            ? 'text-blue-400'
                            : 'text-white/40'
                        )}
                      />

                      <AnimatePresence mode="wait">
                        {sidebarOpen && (
                          <motion.span
                            key={`label-${item.view}`}
                            initial="hide"
                            animate="show"
                            exit="hide"
                            variants={textVariants}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {active && sidebarOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"
                        />
                      )}
                    </button>
                  )

                  if (!sidebarOpen) {
                    return (
                      <Tooltip key={item.view}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent
                          side="right"
                          sideOffset={8}
                          className="rounded-[10px] shadow-lg shadow-black/30 bg-[#1a1a2e] text-white text-[13px] font-medium px-3 py-1.5 border border-white/10"
                        >
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return button
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Bottom Section: Collapse Toggle + User ── */}
        <div className="shrink-0 mt-auto">
          {/* Collapse Toggle */}
          <div className="px-2.5 mb-1">
            {sidebarOpen ? (
              <button
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-[12px] px-2.5 py-[9px]',
                  'text-white/30 hover:text-white/60 hover:bg-white/[0.06]',
                  'transition-all duration-200 text-[13px] font-medium'
                )}
              >
                <ChevronLeft className="w-[18px] h-[18px] shrink-0" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key="collapse-label"
                    initial="hide"
                    animate="show"
                    exit="hide"
                    variants={textVariants}
                  >
                    Collapse
                  </motion.span>
                </AnimatePresence>
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className={cn(
                      'w-full flex items-center justify-center rounded-[12px] py-[9px]',
                      'text-white/30 hover:text-white/60 hover:bg-white/[0.06]',
                      'transition-all duration-200'
                    )}
                  >
                    <ChevronRight className="w-[18px] h-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={8}
                  className="rounded-[10px] shadow-lg shadow-black/30 bg-[#1a1a2e] text-white text-[13px] font-medium px-3 py-1.5 border border-white/10"
                >
                  Expand
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-white/[0.08]" />

          {/* User Section */}
          <div className="p-2.5">
            {sidebarOpen ? (
              <>
                {/* Sign Out (above avatar when expanded) */}
                <button
                  onClick={onLogout}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-[12px] px-2.5 py-[7px] mb-1',
                    'text-[13px] font-medium text-white/30',
                    'hover:text-red-400 hover:bg-white/[0.06]',
                    'transition-all duration-200'
                  )}
                >
                  <LogOut className="w-[16px] h-[16px] shrink-0" />
                  <span>Sign Out</span>
                </button>

                {/* User Info */}
                <div className="flex items-center gap-2.5 px-2 py-2">
                  <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white/10">
                    <AvatarFallback className="bg-white/10 text-white text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="user-info"
                      initial="hide"
                      animate="show"
                      exit="hide"
                      variants={textVariants}
                      className="flex-1 min-w-0"
                    >
                      <p className="text-[13px] font-medium text-white truncate leading-tight">
                        {userName}
                      </p>
                      <p className="text-[11px] text-white/40 truncate leading-tight">
                        {userRole}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {/* Avatar */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 ring-2 ring-white/10 cursor-default">
                      <AvatarFallback className="bg-white/10 text-white text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="rounded-[10px] shadow-lg shadow-black/30 bg-[#1a1a2e] text-white text-[13px] font-medium px-3 py-1.5 border border-white/10"
                  >
                    <div>
                      <p className="font-semibold">{userName}</p>
                      <p className="text-[11px] text-white/40 font-normal">{userRole}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Sign Out Icon */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onLogout}
                      className={cn(
                        'flex items-center justify-center rounded-[10px] p-1.5',
                        'text-white/30 hover:text-red-400 hover:bg-white/[0.06]',
                        'transition-all duration-200'
                      )}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="rounded-[10px] shadow-lg shadow-black/30 bg-[#1a1a2e] text-white text-[13px] font-medium px-3 py-1.5 border border-white/10"
                  >
                    Sign Out
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}