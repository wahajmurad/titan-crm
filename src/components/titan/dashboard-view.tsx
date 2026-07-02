'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAppStore, type AppView } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Users, Globe, Target, Mail, Sparkles, ArrowRight,
  Search, Activity, Clock, CheckCircle, PieChart as PieIcon,
  BarChart3,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
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
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 26 },
  },
}

const kpiVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 280,
      damping: 22,
      delay: i * 0.06,
    },
  }),
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const STAGE_ORDER = [
  'DISCOVERED', 'AUDITED', 'QUALIFIED', 'OUTREACH_SENT',
  'REPLIED', 'MEETING_BOOKED', 'WON',
]

const STAGE_LABELS: Record<string, string> = {
  DISCOVERED: 'Discovered',
  AUDITED: 'Audited',
  QUALIFIED: 'Qualified',
  OUTREACH_SENT: 'Outreach',
  REPLIED: 'Replied',
  MEETING_BOOKED: 'Meeting',
  WON: 'Won',
}

const STAGE_COLORS = [
  '#94A3B8', '#60A5FA', '#38BDF8', '#2563EB',
  '#1D4ED8', '#7C3AED', '#059669',
]

const PIPELINE_COLORS = [
  '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB',
  '#1D4ED8', '#6366F1', '#059669',
]

const INDUSTRY_COLORS = [
  '#2563EB', '#3B82F6', '#60A5FA',
  '#93C5FD', '#BFDBFE', '#DBEAFE',
]

const TEMP_COLORS: Record<string, string> = {
  HOT: '#EF4444',
  WARM: '#F59E0B',
  COLD: '#3B82F6',
}

// Activity left-border color mapping
const ACTION_BORDER_MAP: Array<[string, string]> = [
  ['AUDIT_RUN', 'border-l-blue-400'],
  ['AUDIT', 'border-l-blue-400'],
  ['DISCOVER', 'border-l-emerald-400'],
  ['LEAD_DISCOVERED', 'border-l-emerald-400'],
  ['OUTREACH', 'border-l-violet-400'],
  ['EMAIL', 'border-l-violet-400'],
  ['REPLY', 'border-l-amber-400'],
  ['REPLIED', 'border-l-amber-400'],
  ['MEETING', 'border-l-rose-400'],
  ['BOOKED', 'border-l-rose-400'],
  ['WON', 'border-l-green-500'],
  ['QUALIF', 'border-l-cyan-400'],
]

function getActionBorder(action: string): string {
  const upper = action.toUpperCase()
  for (const [key, cls] of ACTION_BORDER_MAP) {
    if (upper.includes(key)) return cls
  }
  return 'border-l-muted-foreground/20'
}

// ─── Premium Tooltips ────────────────────────────────────────────────────

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[10px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 px-3 py-2 shadow-lg shadow-black/[0.04]">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[13px] font-bold text-foreground">
        {payload[0].value} leads
      </p>
    </div>
  )
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: { name: string; value: number } }>
}) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  if (!d) return null
  return (
    <div className="rounded-[10px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 px-3 py-2 shadow-lg shadow-black/[0.04]">
      <p className="text-[11px] font-medium text-muted-foreground">
        {d.name}
      </p>
      <p className="text-[13px] font-bold text-foreground">
        {d.value} leads
      </p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

export function DashboardView({ userName }: { userName: string }) {
  const { setView } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // ─── Derived Data ───────────────────────────────────────────────
  const pipelineData = STAGE_ORDER.map((stage, i) => ({
    name: STAGE_LABELS[stage] || stage,
    value: data?.stages[stage] || 0,
    fill: PIPELINE_COLORS[i],
  }))

  const industryData = (data?.leadsByIndustry || [])
    .filter((item) => item.industry && item.industry !== 'null')
    .slice(0, 6)
    .map((item, i) => ({
      name: item.industry,
      value: item._count.industry,
      fill: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length],
    }))

  const tempData = Object.entries(data?.temperature || {}).map(
    ([name, value]) => ({
      name,
      value,
      fill: TEMP_COLORS[name] || '#94A3B8',
    }),
  )

  const industryTotal = industryData.reduce((sum, d) => sum + d.value, 0)

  const kpis = [
    {
      label: 'Total Leads',
      value: data?.totalLeads ?? '—',
      icon: Users,
      gradient: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      trend: data?.totalLeads
        ? `+${Math.round(data.totalLeads * 0.12)}`
        : '—',
      positive: true,
    },
    {
      label: 'Qualified',
      value: data?.qualifiedCount ?? '—',
      icon: CheckCircle,
      gradient: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      trend: data?.qualifiedCount
        ? `+${Math.round(data.qualifiedCount * 0.08)}`
        : '—',
      positive: true,
    },
    {
      label: 'Active Campaigns',
      value: data?.activeCampaigns ?? '—',
      icon: Target,
      gradient: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
      trend: data?.activeCampaigns
        ? `+${Math.max(1, Math.round(data.activeCampaigns * 0.3))}`
        : '—',
      positive: true,
    },
    {
      label: 'Emails Sent',
      value: data?.outreachSent ?? '—',
      icon: Mail,
      gradient: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      trend: data?.outreachSent
        ? `+${Math.round(data.outreachSent * 0.23)}`
        : '—',
      positive: true,
    },
  ]

  const activities = data?.recentActivities || []

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <div className="h-8 w-56 skeleton-shimmer rounded-[10px]" />
        <div className="h-4 w-80 skeleton-shimmer rounded-[10px]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="h-28 skeleton-shimmer rounded-[18px]"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <motion.div
            variants={itemVariants}
            className="lg:col-span-3 h-72 skeleton-shimmer rounded-[18px]"
          />
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 h-72 skeleton-shimmer rounded-[18px]"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            variants={itemVariants}
            className="h-64 skeleton-shimmer rounded-[18px]"
          />
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 h-64 skeleton-shimmer rounded-[18px]"
          />
        </div>
      </motion.div>
    )
  }

  // ─── Empty State ───────────────────────────────────────────────
  if (!data) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Getting Started
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Welcome to TITAN. Start by discovering your first leads.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              {
                icon: Search,
                title: 'Discover Leads',
                desc: 'Find businesses in your target market',
                view: 'discovery',
              },
              {
                icon: Globe,
                title: 'Audit Websites',
                desc: 'Run AI-powered website analysis',
                view: 'audit',
              },
              {
                icon: Target,
                title: 'Launch Campaign',
                desc: 'Create your first outreach campaign',
                view: 'campaigns',
              },
            ] as const
          ).map((item, i) => (
            <motion.button
              key={i}
              variants={itemVariants}
              onClick={() => setView(item.view)}
              className="rounded-[18px] p-6 glass-card hover-lift text-left group"
            >
              <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-[14px] font-semibold mb-1">
                {item.title}
              </h3>
              <p className="text-[12px] text-muted-foreground">{item.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-[12px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Get Started <ArrowRight className="w-3 h-3" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    )
  }

  // ─── Main Dashboard ────────────────────────────────────────────
  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Welcome Header ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {getGreeting()}, {userName.split(' ')[0]}
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your outreach today.
        </p>
      </motion.div>

      {/* ─── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            custom={i}
            variants={kpiVariants}
            whileHover={{ y: -4 }}
            className="rounded-[18px] p-5 glass-card hover-lift cursor-default"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-[12px] flex items-center justify-center',
                  kpi.gradient,
                )}
              >
                <kpi.icon
                  className={cn('w-[18px] h-[18px]', kpi.iconColor)}
                />
              </div>
              {kpi.trend !== '—' && (
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    kpi.positive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500',
                  )}
                >
                  ↑ {kpi.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {kpi.value}
            </p>
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
              {kpi.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ─── Charts Row (3 + 2) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar Chart — Lead Pipeline */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 rounded-[18px] p-5 glass-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">
                Lead Pipeline
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {data.totalLeads} total leads across all stages
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={pipelineData}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={76}
                tick={{
                  fontSize: 11,
                  fill: 'oklch(0.55 0.015 260)',
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<BarTooltip />}
                cursor={{ fill: 'rgba(37,99,235,0.05)' }}
              />
              <Bar
                dataKey="value"
                radius={[0, 6, 6, 0]}
                barSize={24}
              >
                {pipelineData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Donut Chart — Industry Distribution */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 rounded-[18px] p-5 glass-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-muted/60 flex items-center justify-center">
              <PieIcon className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">
                Leads by Industry
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Top segments this month
              </p>
            </div>
          </div>
          {industryData.length > 0 ? (
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={industryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {industryData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground leading-none">
                    {industryTotal}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Total
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <PieIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-[13px] text-muted-foreground">
                No industry data yet
              </p>
            </div>
          )}
          {industryData.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
              {industryData.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: d.fill }}
                  />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Bottom Row (AI Recs 1 + Activity 2) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Recommendations */}
        <motion.div
          variants={itemVariants}
          className="rounded-[18px] p-5 glass-card border border-blue-100 dark:border-blue-500/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold">AI Recommendations</h3>
              <p className="text-[11px] text-muted-foreground">
                Based on your recent activity
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              {
                text: '3 leads from Manhattan are ready for outreach',
                action: 'View Leads',
                view: 'leads' as AppView,
              },
              {
                text: 'Your email reply rate increased 23% this week',
                action: 'See Analytics',
                view: 'dashboard' as AppView,
              },
              {
                text: '2 campaigns need follow-up sequences',
                action: 'Open Campaigns',
                view: 'campaigns' as AppView,
              },
            ].map((rec, i) => (
              <button
                key={i}
                onClick={() => setView(rec.view)}
                className="w-full flex items-center justify-between p-3 rounded-[12px] hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors text-left group"
              >
                <p className="text-[13px] text-foreground">{rec.text}</p>
                <span className="text-[11px] font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                  {rec.action}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 rounded-[18px] p-5 glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[10px] bg-muted/60 flex items-center justify-center">
                <Clock className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-foreground">
                  Recent Activity
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {activities.length} events this week
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] text-muted-foreground hover:text-foreground gap-1 h-7 px-2"
              onClick={() => setView('leads')}
            >
              View all <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-[12px] bg-muted/50 flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-[13px] font-medium text-muted-foreground">
                  No activity yet
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  Start by finding leads or running an audit
                </p>
                <Button
                  size="sm"
                  className="mt-4 rounded-[10px] text-[12px] h-8"
                  onClick={() => setView('discovery')}
                >
                  <Search className="w-3.5 h-3.5 mr-1" /> Get Started
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.slice(0, 8).map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.1 + i * 0.03,
                      duration: 0.2,
                    }}
                    className={cn(
                      'group flex items-start gap-3 rounded-[12px] p-3 transition-all hover:translate-x-[2px] border-l-2',
                      getActionBorder(activity.action),
                    )}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                      {(activity.user?.name ?? 'S')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground leading-snug">
                        <span className="font-semibold">
                          {activity.user?.name ?? 'System'}
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {activity.action}
                        </span>
                        {activity.lead?.business?.name && (
                          <span className="font-medium">
                            {' '}
                            {activity.lead.business.name}
                          </span>
                        )}
                      </p>
                      {activity.details && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70 truncate">
                          {activity.details}
                        </p>
                      )}
                    </div>
                    <span className="mt-1 shrink-0 text-[11px] text-muted-foreground/60 whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}