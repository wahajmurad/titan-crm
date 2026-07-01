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
  campaign: { icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
  lead: { icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  reply: { icon: Mail, color: 'text-amber-500', bg: 'bg-amber-50' },
  meeting: { icon: Calendar, color: 'text-violet-500', bg: 'bg-violet-50' },
  ai: { icon: Sparkles, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  success: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  info: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50' },
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
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  // Fetch on mount + poll every 30s
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
    // Mark as read
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

    // Navigate
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
      {/* Bell Button */}
      <button
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors duration-150"
        onClick={() => setOpen(!open)}
      >
        <Bell className="w-4 h-4 text-[#475569]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200/60 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-gray-100 rounded" />
                      <div className="h-2.5 w-1/2 bg-gray-50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
                <p className="text-xs text-gray-400 mt-0.5">New updates will appear here</p>
              </div>
            ) : (
              notifications.map(notification => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info
                const Icon = config.icon
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0',
                      !notification.read && 'bg-blue-50/30'
                    )}
                  >
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5', config.bg)}>
                      <Icon className={cn('h-3.5 w-3.5', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-sm truncate', !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
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