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
  Users, Globe, Target, Mail, TrendingUp, Sparkles, ArrowRight,
  Plus, BarChart3, Activity, Clock, Zap, Bot, Search, Shield,
  CheckCircle, PieChart as PieIcon, AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────

interface DashboardData {
  totalLeads: number
  stages: Record<string, number>
  outreach: Record<string, number>
  meetings: Record<string, number>
  replyRate: number
  recentActivities: ActivityItem[]
  leadsByIndustry: { industry: string; _count: { industry: number } }[]
  temperature: Record<string, number>
  wonCount: number
  meetingBooked: number
  outreachSent: number
  qualifiedCount: number
  activeCampaigns: number
}

interface ActivityItem {
  id: string; action: string; details: string; createdAt: string
  user: { name: string } | null
  lead: { business: { name: string } } | null
}

// ─── Animation Variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}
const kpiVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 20, delay: i * 0.06 },
  }),
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const STAGE_ORDER = ['DISCOVERED', 'AUDITED', 'QUALIFIED', 'OUTREACH_SENT', 'REPLIED', 'MEETING_BOOKED', 'WON']
const STAGE_LABELS: Record<string, string> = {
  DISCOVERED: 'Discovered', AUDITED: 'Audited', QUALIFIED: 'Qualified',
  OUTREACH_SENT: 'Outreach', REPLIED: 'Replied', MEETING_BOOKED: 'Meeting', WON: 'Won',
}
const STAGE_COLORS = ['#94A3B8', '#60A5FA', '#38BDF8', '#2563EB', '#1D4ED8', '#7C3AED', '#059669']

const PIPELINE_COLORS = ['#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#6366F1', '#059669']

const INDUSTRY_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE']

const TEMP_COLORS: Record<string, string> = { HOT: '#EF4444', WARM: '#F59E0B', COLD: '#3B82F6' }

const ACTION_CONFIG = [
  { label: 'Run Audit', icon: Globe, view: 'audit' as const, gradient: 'from-blue-500 to-blue-600' },
  { label: 'Find Leads', icon: Search, view: 'discovery' as const, gradient: 'from-emerald-500 to-emerald-600' },
  { label: 'Create Campaign', icon: Plus, view: 'campaigns' as const, gradient: 'from-violet-500 to-violet-600' },
  { label: 'AI Assistant', icon: Bot, view: 'ai-assistant' as const, gradient: 'from-amber-500 to-orange-500' },
]

const INSIGHTS = [
  'Schedule outreach during business hours (10 AM–12 PM) for the best response rates from decision makers.',
  'Leads with completed website audits convert at higher rates. Run audits before sending your first email.',
  'Follow up within 24 hours of a reply to maintain momentum and increase meeting-booking probability.',
  'Focus on leads marked as HOT — they have the highest likelihood of converting to booked meetings.',
]

// ─── Skeletons ─────────────────────────────────────────────────────────────

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

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 p-6 backdrop-blur-xl h-80 flex items-center justify-center">
      <div className="space-y-3 w-full max-w-xs">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-gray-900">{label}</p>
      <p className="text-sm font-bold text-blue-600">{payload[0].value} leads</p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

export function DashboardView({ userName }: { userName: string }) {
  const { setView } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to load dashboard')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  // Derived
  const firstName = (userName || '').trim().split(' ')[0] || 'there'
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  const pipelineData = STAGE_ORDER.map((stage, i) => ({
    name: STAGE_LABELS[stage] || stage,
    value: data?.stages[stage] || 0,
    fill: PIPELINE_COLORS[i],
  }))

  const industryData = (data?.leadsByIndustry || [])
    .filter(item => item.industry && item.industry !== 'null')
    .slice(0, 6)
    .map((item, i) => ({
      name: item.industry,
      value: item._count.industry,
      fill: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length],
    }))

  const tempData = Object.entries(data?.temperature || {}).map(([name, value]) => ({
    name, value, fill: TEMP_COLORS[name] || '#94A3B8',
  }))

  const kpis = [
    { label: 'Total Leads', value: data?.totalLeads ?? '—', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Qualified', value: data?.qualifiedCount ?? '—', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Campaigns', value: data?.activeCampaigns ?? '—', icon: Target, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Emails Sent', value: data?.outreachSent ?? '—', icon: Mail, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Reply Rate', value: data?.replyRate != null ? `${data.replyRate}%` : '—', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  const activities = data?.recentActivities || []

  return (
    <motion.div className="mx-auto max-w-7xl space-y-6 px-1 pb-12" variants={containerVariants} initial="hidden" animate="visible">

      {/* ─── Welcome ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {getGreeting()},{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">{today}</p>
        </div>
        <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border-blue-100">
          <Activity className="h-3 w-3" /> Dashboard
        </Badge>
      </motion.div>

      {/* ─── KPI Cards ───────────────────────────────────────────── */}
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <p className="text-xs text-red-600 mt-0.5">Check your connection and try again.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboard} className="shrink-0">Retry</Button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi, i) => (
              <motion.div key={kpi.label} custom={i} variants={kpiVariants}
                whileHover={{ y: -4, boxShadow: '0 12px 40px -12px rgba(37,99,235,0.15)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition-colors hover:border-blue-100">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', kpi.bg)}>
                      <kpi.icon className={cn('h-[18px] w-[18px]', kpi.color)} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-gray-900">{kpi.value}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{kpi.label}</p>
                </div>
              </motion.div>
            ))}
      </div>

      {/* ─── Lead Pipeline Chart ──────────────────────────────────── */}
      <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
        <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-900">Lead Pipeline</CardTitle>
            <span className="ml-auto text-xs text-gray-400">{data?.totalLeads ?? 0} total leads</span>
          </div>
          {loading ? <Skeleton className="h-56 w-full rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  {pipelineData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* ─── Distribution Charts Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                <PieIcon className="h-4 w-4 text-gray-600" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">Leads by Industry</CardTitle>
            </div>
            {loading ? <Skeleton className="h-52 w-full rounded-lg" /> : industryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={industryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                    {industryData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null
                    const d = payload[0].payload
                    return (
                      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 shadow-lg">
                        <p className="text-xs font-medium text-gray-900">{d.name}</p>
                        <p className="text-sm font-bold text-blue-600">{d.value} leads</p>
                      </div>
                    )
                  }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <PieIcon className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No industry data yet</p>
              </div>
            )}
            {!loading && industryData.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
                {industryData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Temperature Distribution */}
        <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                <Zap className="h-4 w-4 text-gray-600" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">Lead Temperature</CardTitle>
            </div>
            {loading ? <Skeleton className="h-52 w-full rounded-lg" /> : tempData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={tempData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {tempData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null
                    const d = payload[0].payload
                    return (
                      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 shadow-lg">
                        <p className="text-xs font-medium text-gray-900">{d.name}</p>
                        <p className="text-sm font-bold text-blue-600">{d.value} leads</p>
                      </div>
                    )
                  }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <Zap className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No temperature data yet</p>
              </div>
            )}
            {!loading && (
              <div className="flex justify-center gap-6 mt-3">
                {tempData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ─── AI Insights + Activity Row ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* AI Insights */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl h-full">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-base font-semibold text-gray-900">AI Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {INSIGHTS.map((insight, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }} className="flex items-start gap-2.5">
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
                  <CardTitle className="text-base font-semibold text-gray-900">Recent Activity</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-blue-600 gap-1" onClick={() => setView('leads')}>
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 flex-1 min-h-0">
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                  </div>
                ))}</div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 mb-3"><Activity className="h-5 w-5 text-blue-400" /></div>
                  <p className="text-sm font-medium text-gray-500">No activity yet</p>
                  <p className="mt-1 text-xs text-gray-400">Start by finding leads or running an audit</p>
                  <Button size="sm" className="mt-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm" onClick={() => setView('discovery')}>
                    <Plus className="h-3.5 w-3.5" /> Get Started
                  </Button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {activities.slice(0, 6).map((activity, i) => (
                    <motion.div key={activity.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.04, duration: 0.25 }}
                      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50/80">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-[10px] font-bold text-white shadow-sm">
                        {(activity.user?.name ?? 'S')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-gray-700 leading-snug">
                          <span className="font-semibold text-gray-900">{activity.user?.name ?? 'System'}</span>{' '}
                          <span className="text-gray-500">{activity.action}</span>
                          {activity.lead?.business?.name && <span className="font-medium text-gray-700"> {' '}{activity.lead.business.name}</span>}
                        </p>
                        {activity.details && <p className="mt-0.5 text-xs text-gray-400 truncate">{activity.details}</p>}
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

      {/* ─── Quick Actions ────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"><Zap className="h-4 w-4 text-gray-600" /></div>
            <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ACTION_CONFIG.map((action, i) => (
              <motion.button key={action.label} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05, type: 'spring' as const, stiffness: 300, damping: 22 }}
                onClick={() => setView(action.view)}
                className="group relative flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-100 hover:shadow-md">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm transition-transform group-hover:scale-110', action.gradient)}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                <ArrowRight className="absolute right-3 top-3 h-3.5 w-3.5 text-gray-300 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}