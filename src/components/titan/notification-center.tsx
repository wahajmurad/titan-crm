'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Users, Mail, Calendar, Workflow, Sparkles, Settings, Bell, Check, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Notification {
  id: string
  type: 'campaign' | 'lead' | 'reply' | 'meeting' | 'workflow' | 'ai' | 'system'
  title: string
  description: string
  time: string
  read: boolean
  action?: { label: string; view: string }
}

interface NotificationCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  campaign: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
  lead: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
  reply: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10',
  meeting: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
  workflow: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10',
  ai: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
  system: 'text-gray-500 bg-gray-50 dark:bg-gray-500/10',
}

const TYPE_BAR_COLORS: Record<string, string> = {
  campaign: 'bg-emerald-500',
  lead: 'bg-blue-500',
  reply: 'bg-violet-500',
  meeting: 'bg-amber-500',
  workflow: 'bg-orange-500',
  ai: 'bg-blue-600',
  system: 'bg-gray-400',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  campaign: Target,
  lead: Users,
  reply: Mail,
  meeting: Calendar,
  workflow: Workflow,
  ai: Sparkles,
  system: Settings,
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'ai', title: 'AI Analysis Complete', description: 'Website audit for Acme Corp is ready', time: '2m ago', read: false, action: { label: 'View', view: 'audit' } },
  { id: '2', type: 'reply', title: 'New Reply Received', description: 'John Smith replied to your outreach email', time: '15m ago', read: false, action: { label: 'Read', view: 'inbox' } },
  { id: '3', type: 'campaign', title: 'Campaign Paused', description: '"Q4 Law Firms" paused due to sending limit', time: '1h ago', read: true },
  { id: '4', type: 'meeting', title: 'Meeting Reminder', description: 'Demo call with Sarah Johnson in 30 minutes', time: '2h ago', read: false, action: { label: 'Join', view: 'meetings' } },
  { id: '5', type: 'lead', title: 'New Lead Qualified', description: 'TechStart Inc. scored 92/100 on AI qualification', time: '3h ago', read: true },
  { id: '6', type: 'workflow', title: 'Workflow Completed', description: 'Cold Email sequence finished for 50 leads', time: '5h ago', read: true },
  { id: '7', type: 'ai', title: 'Smart Follow-up Ready', description: 'AI generated 12 unique follow-up emails', time: '6h ago', read: false, action: { label: 'Review', view: 'email-center' } },
  { id: '8', type: 'system', title: 'System Update', description: 'TITAN v2.5 — New workflow templates added', time: '1d ago', read: true },
]

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread' | 'ai'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'ai', label: 'AI' },
]

// ─── Notification Item ───────────────────────────────────────────────────────

function NotificationItem({ notification, index }: { notification: Notification; index: number }) {
  const [hovered, setHovered] = useState(false)
  const Icon = TYPE_ICONS[notification.type] || Settings
  const colors = TYPE_COLORS[notification.type] || TYPE_COLORS.system
  const barColor = TYPE_BAR_COLORS[notification.type] || TYPE_BAR_COLORS.system

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-[12px] p-3 mx-2 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer group"
    >
      {/* Left color bar */}
      <div className={cn('absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full', barColor)} />

      <div className="flex items-start gap-3 pl-2">
        {/* Type icon */}
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5', colors)}>
          <Icon className="h-3.5 w-3.5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(
              'text-[13px] truncate',
              notification.read ? 'font-medium text-foreground/80' : 'font-semibold text-foreground'
            )}>
              {notification.title}
            </p>
            {!notification.read && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {notification.description}
          </p>
        </div>

        {/* Right side: time + action */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">
            {notification.time}
          </span>
          <AnimatePresence>
            {hovered && notification.action && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {notification.action.label} →
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-14 px-4"
    >
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mb-4">
        <Bell className="w-6 h-6 text-muted-foreground/30" />
      </div>
      <p className="text-sm font-medium text-muted-foreground/60">No notifications yet</p>
      <p className="text-[12px] text-muted-foreground/40 mt-1">New updates will appear here</p>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState<Tab>('all')

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read
    if (activeTab === 'ai') return n.type === 'ai'
    return true
  })

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-white/[0.08] transition-colors duration-150 text-white/60 hover:text-white">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#1a1a2e]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-[380px] rounded-[18px] bg-white dark:bg-[#1a1a2e] p-0 shadow-xl shadow-black/[0.08] border border-gray-200/50 dark:border-white/[0.06] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-foreground tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-[12px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-150"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pb-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150',
                activeTab === tab.key
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-white/[0.05]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200/60 dark:bg-white/[0.06]" />

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto py-1.5 scrollbar-thin">
          {filteredNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                onClick={() => handleMarkRead(notification.id)}
              >
                <NotificationItem notification={notification} index={index} />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="h-px bg-gray-200/60 dark:bg-white/[0.06]" />
        )}
      </PopoverContent>
    </Popover>
  )
}