'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Bell, Mail, Target, Calendar, Sparkles, Check, AlertTriangle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore, type AppView } from '@/lib/store'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string; title: string; message: string; type: string
  read: boolean; link?: string | null; linkId?: string | null; createdAt: string
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  campaign: { icon: Target, color: 'text-[#475569] dark:text-white/50', bg: 'bg-[#F1F5F9] dark:bg-white/[0.04]' },
  lead: { icon: Sparkles, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  reply: { icon: Mail, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  meeting: { icon: Calendar, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  ai: { icon: Sparkles, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
  success: { icon: Check, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  error: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
  info: { icon: Info, color: 'text-[#475569] dark:text-white/50', bg: 'bg-[#F1F5F9] dark:bg-white/[0.04]' },
}

export function NotificationBell() {
  const { setView } = useAppStore()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
        credentials: 'same-origin',
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch { /* silent */ }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notification.id }),
          credentials: 'same-origin',
        })
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch { /* silent */ }
    }

    if (notification.link) {
      const viewName = notification.link as AppView
      if (notification.linkId) {
        setView(viewName, notification.linkId)
      } else {
        setView(viewName)
      }
    }
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        className="relative p-2 rounded-[8px] hover:bg-[#F1F5F9] dark:hover:bg-white/[0.04] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="w-[18px] h-[18px] text-[#475569] dark:text-white/50" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0F172A] dark:bg-white px-1 text-[9px] font-bold text-white dark:text-[#0F172A]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#0B0F1A] border border-[#E8ECF1]/80 dark:border-white/[0.06] rounded-2xl shadow-lg z-50 overflow-hidden"
          role="dialog"
          aria-label="Notifications panel"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9] dark:border-white/[0.04]">
            <h3 className="text-[13px] font-semibold text-[#0F172A] dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[12px] text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto" role="list" aria-label="Notification list">
            {loading ? (
              <div className="p-4 space-y-3" aria-busy="true">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-lg bg-[#F1F5F9] dark:bg-white/[0.04] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-[#F1F5F9] dark:bg-white/[0.04] rounded" />
                      <div className="h-2.5 w-1/2 bg-[#F1F5F9]/70 dark:bg-white/[0.03] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-[#CBD5E1] dark:text-white/10 mx-auto mb-2" />
                <p className="text-sm text-[#64748B] dark:text-white/30">No notifications</p>
                <p className="text-xs text-[#94A3B8] dark:text-white/20 mt-0.5">New updates will appear here</p>
              </div>
            ) : (
              notifications.map(notification => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info
                const Icon = config.icon
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    role="listitem"
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-[#F8FAFC] dark:border-white/[0.02] last:border-0 outline-none',
                      !notification.read
                        ? 'bg-[#F8FAFC]/80 dark:bg-white/[0.02] hover:bg-[#F1F5F9] dark:hover:bg-white/[0.04]'
                        : 'hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02]'
                    )}
                  >
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5', config.bg)}>
                      <Icon className={cn('h-3.5 w-3.5', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-[13px] truncate', !notification.read ? 'font-semibold text-[#0F172A] dark:text-white' : 'font-medium text-[#334155] dark:text-white/60')}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#0F172A] dark:bg-white" />
                        )}
                      </div>
                      <p className="text-[12px] text-[#64748B] dark:text-white/30 mt-0.5 line-clamp-2">{notification.message}</p>
                      <p className="text-[10px] text-[#94A3B8] dark:text-white/20 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}