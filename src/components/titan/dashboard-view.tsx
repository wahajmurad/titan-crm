'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Users,
  Globe,
  Target,
  Mail,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Plus,
  BarChart3,
  Activity,
  Clock,
  Zap,
  Bot,
  Search,
  Shield,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string
  action: string
  details: string
  createdAt: string
  user: { name: string } | null
  lead: { business: { name: string } } | null
}

// ─── Animation Variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

const kpiCardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
      delay: i * 0.08,
    },
  }),
}

// ─── Helper ──────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFirstName(name: string) {
  return name?.trim().split(' ')[0] || 'there'
}

// ─── Shimmer Skeletons ──────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 py-3">
      <Skeleton className="h-8 w-8 rounded-full mt-0.5 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

export function DashboardView({ userName }: { userName: string }) {
  const { setView } = useAppStore()

  // ── State ───────────────────────────────────────────────────────────
  const [leadsCount, setLeadsCount] = useState<number | null>(null)
  const [auditCount, setAuditCount] = useState<number | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  // ── Data Fetching ──────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads?limit=1')
      if (res.ok) {
        const data = await res.json()
        setLeadsCount(data.total ?? data.count ?? 0)
      }
    } catch {
      setLeadsCount(0)
    }
  }, [])

  const fetchAudits = useCallback(async () => {
    try {
      const res = await fetch('/api/audit?limit=1')
      if (res.ok) {
        const data = await res.json()
        setAuditCount(data.total ?? data.count ?? 0)
      }
    } catch {
      setAuditCount(0)
    }
  }, [])

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/activities?limit=10')
      if (res.ok) {
        const data = await res.json()
        setActivities(Array.isArray(data) ? data : data.activities ?? [])
      }
    } catch {
      setActivities([])
    } finally {
      setActivitiesLoading(false)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchLeads(), fetchAudits(), fetchActivities()])
      setLoading(false)
    }
    load()
  }, [fetchLeads, fetchAudits, fetchActivities])

  // ── Derived Data ───────────────────────────────────────────────────
  const firstName = getFirstName(userName)
  const greeting = getGreeting()
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  const kpis = [
    {
      label: 'Total Leads',
      value: leadsCount ?? '—',
      icon: Users,
      trend: '+12%',
      trendUp: true,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Audited',
      value: auditCount ?? '—',
      icon: Shield,
      trend: '+8%',
      trendUp: true,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Campaigns Active',
      value: '3',
      icon: Target,
      trend: '+2',
      trendUp: true,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Emails Sent',
      value: '1,284',
      icon: Mail,
      trend: '+23%',
      trendUp: true,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Conversion Rate',
      value: '4.7%',
      icon: TrendingUp,
      trend: '+0.8%',
      trendUp: true,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ]

  const insights = [
    'Lead engagement peaks between 10 AM–12 PM — schedule outreach during this window for 34% higher reply rates.',
    '3 leads in your pipeline have been inactive for 7+ days. Consider a re-engagement sequence.',
    'Your audit conversion rate is 2x above industry average. Doubling down on the audit-first strategy is recommended.',
    'Businesses in the Healthcare sector show the highest close rate (18%). Consider targeting this vertical.',
  ]

  const quickActions = [
    {
      label: 'Run Audit',
      icon: Globe,
      view: 'audit' as const,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Find Leads',
      icon: Search,
      view: 'discovery' as const,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Create Campaign',
      icon: Plus,
      view: 'campaigns' as const,
      gradient: 'from-violet-500 to-violet-600',
    },
    {
      label: 'AI Assistant',
      icon: Bot,
      view: 'ai-assistant' as const,
      gradient: 'from-amber-500 to-orange-500',
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <motion.div
      className="mx-auto max-w-7xl space-y-8 px-1 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Welcome Section ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {greeting},{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">{today}</p>
        </div>
        <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border-blue-100">
          <Activity className="h-3 w-3" />
          Live Dashboard
        </Badge>
      </motion.div>

      {/* ─── KPI Cards Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                custom={i}
                variants={kpiCardVariants}
                whileHover={{ y: -4, boxShadow: '0 12px 40px -12px rgba(37,99,235,0.15)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition-colors hover:border-blue-100">
                  {/* Subtle gradient accent on top */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="flex items-center justify-between mb-4">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', kpi.bg)}>
                      <kpi.icon className={cn('h-[18px] w-[18px]', kpi.color)} />
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                        kpi.trendUp
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      )}
                    >
                      <TrendingUp className="h-3 w-3" />
                      {kpi.trend}
                    </span>
                  </div>

                  <p className="text-2xl font-bold tracking-tight text-gray-900">
                    {kpi.value}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{kpi.label}</p>
                </div>
              </motion.div>
            ))}
      </div>

      {/* ─── Middle Row: AI Insights + Activity ─────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* AI Insights */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl h-full">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  AI Insights
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                  className="flex items-start gap-2.5"
                >
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(37,99,235,0.4)]" />
                  <p className="text-[13px] leading-relaxed text-gray-600">{insight}</p>
                </motion.div>
              ))}
            </CardContent>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <div className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl h-full flex flex-col">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                    <Clock className="h-4 w-4 text-gray-600" />
                  </div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Recent Activity
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500 hover:text-blue-600 gap-1"
                  onClick={() => setView('leads')}
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 flex-1 min-h-0">
              {activitiesLoading ? (
                <div className="space-y-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <ActivitySkeleton key={i} />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 mb-3">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No activity yet</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Start by finding leads or running an audit
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    onClick={() => setView('discovery')}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Get Started
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {activities.slice(0, 6).map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
                      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50/80"
                    >
                      {/* Avatar dot */}
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-[10px] font-bold text-white shadow-sm">
                        {(activity.user?.name ?? 'T')[0].toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-gray-700 leading-snug">
                          <span className="font-semibold text-gray-900">
                            {activity.user?.name ?? 'System'}
                          </span>{' '}
                          <span className="text-gray-500">{activity.action}</span>
                          {activity.lead?.business?.name && (
                            <span className="font-medium text-gray-700">
                              {' '}{activity.lead.business.name}
                            </span>
                          )}
                        </p>
                        {activity.details && (
                          <p className="mt-0.5 text-xs text-gray-400 truncate">
                            {activity.details}
                          </p>
                        )}
                      </div>

                      <span className="mt-1 shrink-0 text-[11px] text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </motion.div>
      </div>

      {/* ─── Quick Actions Grid ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Zap className="h-4 w-4 text-gray-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
                onClick={() => setView(action.view)}
                className="group relative flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm transition-transform group-hover:scale-110',
                    action.gradient
                  )}
                >
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {action.label}
                </span>
                <ArrowRight className="absolute right-3 top-3 h-3.5 w-3.5 text-gray-300 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Charts Placeholder Section ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {[
          {
            title: 'Lead Pipeline',
            icon: BarChart3,
            description: 'Track leads across every stage of your funnel',
          },
          {
            title: 'Audit Trends',
            icon: TrendingUp,
            description: 'Monitor audit performance and scoring over time',
          },
        ].map((chart, i) => (
          <motion.div
            key={chart.title}
            variants={itemVariants}
            whileHover={{ y: -3, boxShadow: '0 8px 30px -8px rgba(37,99,235,0.12)' }}
          >
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm mb-4">
                <chart.icon className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">{chart.title}</h3>
              <p className="mt-1.5 text-xs text-gray-400 max-w-[240px]">
                {chart.description}
              </p>
              <p className="mt-3 text-xs font-medium text-blue-500">
                Connect your data to see charts
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}