'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type AppView } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Search, Globe2, Users, Target, Mail, Inbox,
  Calendar, Brain, BookOpen, UserCog, Settings, LogOut,
  ChevronLeft, ChevronRight, Zap, GraduationCap, Plug, Lightbulb,
  Sparkles, Workflow, BookMarked, FileText, CalendarCheck, Send,
  Command, Bot, Rocket, Cpu
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { view: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
      { view: 'automation' as AppView, label: 'Automation Center', icon: Rocket, badge: 'AI' },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { view: 'discovery' as AppView, label: 'Lead Discovery', icon: Search },
      { view: 'audit' as AppView, label: 'Website Audit', icon: Globe2 },
      { view: 'leads' as AppView, label: 'Leads', icon: Users },
    ],
  },
  {
    label: 'Outreach',
    items: [
      { view: 'campaigns' as AppView, label: 'Campaigns', icon: Target },
      { view: 'workflows' as AppView, label: 'Workflow Builder', icon: Workflow },
      { view: 'outreach' as AppView, label: 'Outreach', icon: Send },
      { view: 'email-center' as AppView, label: 'Email Center', icon: Mail },
      { view: 'inbox' as AppView, label: 'Inbox', icon: Inbox },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { view: 'personalization' as AppView, label: 'AI Pipeline', icon: Sparkles },
      { view: 'ai-assistant' as AppView, label: 'AI Assistant', icon: Brain },
      { view: 'ai-agents' as AppView, label: 'AI Agents', icon: Bot },
      { view: 'command-center' as AppView, label: 'Command Center', icon: Command },
      { view: 'industry-expert' as AppView, label: 'Industry Expert', icon: GraduationCap },
      { view: 'strategy-assistant' as AppView, label: 'Strategy AI', icon: Lightbulb },
    ],
  },
  {
    label: 'Growth',
    items: [
      { view: 'knowledge-base' as AppView, label: 'Knowledge Base', icon: BookMarked },
      { view: 'ai-proposals' as AppView, label: 'AI Proposals', icon: FileText },
      { view: 'meeting-prep' as AppView, label: 'Meeting Prep', icon: CalendarCheck },
      { view: 'meetings' as AppView, label: 'Meetings', icon: Calendar },
    ],
  },
  {
    label: 'System',
    items: [
      { view: 'lead-providers' as AppView, label: 'Lead Providers', icon: Plug },
      { view: 'prompts' as AppView, label: 'Prompt Library', icon: BookOpen },
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
    x: -6,
    transition: { duration: 0.12, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

const sectionVariants = {
  show: {
    opacity: 1,
    transition: { duration: 0.2, delay: 0.03, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  hide: {
    opacity: 0,
    transition: { duration: 0.08, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

export function Sidebar({ userName, userRole, onLogout }: SidebarProps) {
  const { currentView, setView, sidebarOpen, setSidebarOpen } = useAppStore()
  const initials = userName.slice(0, 2).toUpperCase()

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 56 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
        className={cn(
          'glass-sidebar fixed left-0 top-0 z-40 flex flex-col overflow-hidden',
          'border-r border-gray-200/60 dark:border-white/[0.06]',
          'h-screen'
        )}
      >
        {/* ── Logo ── */}
        <div className="flex items-center shrink-0 h-14 px-4">
          {sidebarOpen ? (
            <motion.div
              key="logo-expanded"
              initial="hide"
              animate="show"
              exit="hide"
              variants={textVariants}
              className="flex items-center gap-2.5"
            >
              <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-white" fill="white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  TITAN
                </span>
                <span className="text-[9px] gradient-blue text-white font-bold rounded px-1.5 py-0.5 leading-none">
                  AI
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-white" fill="white" />
              </div>
            </div>
          )}
        </div>

        <Separator className="opacity-60" />

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2.5 space-y-4 scrollbar-none">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.p
                    initial="hide"
                    animate="show"
                    exit="hide"
                    variants={sectionVariants}
                    className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500 px-2.5 mb-1 select-none"
                  >
                    {section.label}
                  </motion.p>
                )}
              </AnimatePresence>

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
                        if (window.innerWidth < 1024) setSidebarOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium',
                        'transition-all duration-150 relative',
                        'px-2.5 py-[7px]',
                        active
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-white/[0.04]'
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full bg-blue-500"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}

                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          active
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 dark:text-gray-500'
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
                            className="truncate flex-1 text-left"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {sidebarOpen && item.badge && (
                        <motion.span
                          initial="hide"
                          animate="show"
                          exit="hide"
                          variants={sectionVariants}
                          className="text-[9px] font-bold gradient-blue text-white rounded px-1.5 py-0.5 leading-none"
                        >
                          {item.badge}
                        </motion.span>
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
                          className="rounded-lg shadow-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-[12px] font-medium px-3 py-1.5 border border-gray-200 dark:border-white/10"
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

        {/* ── Bottom Section ── */}
        <div className="shrink-0">
          <Separator className="opacity-60" />

          {/* Collapse Toggle */}
          <div className="px-2.5 py-1.5">
            {sidebarOpen ? (
              <button
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-[7px]',
                  'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-white/[0.04]',
                  'transition-all duration-150 text-[13px] font-medium'
                )}
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <AnimatePresence mode="wait">
                  <motion.span key="collapse" initial="hide" animate="show" exit="hide" variants={textVariants}>
                    Collapse
                  </motion.span>
                </AnimatePresence>
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="w-full flex items-center justify-center rounded-lg py-[7px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-white/[0.04] transition-all duration-150"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={8}
                  className="rounded-lg shadow-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-[12px] font-medium px-3 py-1.5 border border-gray-200 dark:border-white/10"
                >
                  Expand
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* User Section */}
          <div className="p-2.5 pt-0">
            {sidebarOpen ? (
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/[0.04] transition-colors cursor-default group">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                    {userName}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight">
                    {userRole}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-300 hover:text-red-500 transition-all"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-2 py-1">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={8}
                  className="rounded-lg shadow-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-[12px] font-medium px-3 py-1.5 border border-gray-200 dark:border-white/10"
                >
                  <div>
                    <p className="font-semibold">{userName}</p>
                    <p className="text-[11px] text-gray-400 font-normal">{userRole}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}