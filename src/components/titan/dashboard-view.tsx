'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAppStore, type AppView } from '@/lib/store'
import {
  Users, Target, Mail, Sparkles, ArrowRight,
  Search, Clock, PieChart as PieIcon,
  BarChart3, Bot, CalendarDays, Building2, TrendingUp,
  MessageSquare, Zap, Globe, CheckCircle2, XCircle,
  Video, Phone, MapPin, RefreshCw,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────

interface CampaignRow {
  id: string
  name: string
  status: string
  sent: number
  opened: number
  replied: number
  meetings: number
}

interface MeetingRow {
  id: string
  company: string
  contact: string
  time: string
  type: string
  date: string
}

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
  campaigns: CampaignRow[]
  upcomingMeetings: MeetingRow[]
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
    transition: { staggerChildren: 0.04, delayChildren: 0.03 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
}

// ─── Constants & Helpers ─────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getTodayFormatted() {
  return format(new Date(), 'EEEE, MMMM d, yyyy')
}

const STAGE_ORDER = ['DISCOVERED', 'AUDITED', 'QUALIFIED', 'OUTREACH_SENT', 'REPLIED', 'MEETING_BOOKED', 'WON']

const STAGE_LABELS: Record<string, string> = {
  DISCOVERED: 'New',
  AUDITED: 'Contacted',
  QUALIFIED: 'Qualified',
  OUTREACH_SENT: 'Proposal',
  REPLIED: 'Negotiation',
  MEETING_BOOKED: 'Closing',
  WON: 'Won',
}

const PIPELINE_COLORS = ['#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF']

const INDUSTRY_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE']

// ─── Tooltips ────────────────────────────────────────────────────────────

function BarTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-white border border-gray-200/60 px-3 py-2 shadow-lg shadow-black/[0.06]">
      <p className="text-[11px] font-medium text-gray-400">{label}</p>
      <p className="text-[13px] font-bold text-gray-900">{payload[0].value} leads</p>
    </div>
  )
}

function PieTooltipContent({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: { name: string; value: number } }>
}) {
  if (!active || !payload?.[0]?.payload) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg bg-white border border-gray-200/60 px-3 py-2 shadow-lg shadow-black/[0.06]">
      <p className="text-[11px] font-medium text-gray-400">{d.name}</p>
      <p className="text-[13px] font-bold text-gray-900">{d.value} leads</p>
    </div>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Skeleton className="lg:col-span-7 h-[380px] rounded-xl" />
        <Skeleton className="lg:col-span-5 h-[380px] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Skeleton className="lg:col-span-5 h-[320px] rounded-xl" />
        <Skeleton className="lg:col-span-7 h-[320px] rounded-xl" />
      </div>
    </div>
  )
}

// ─── Status Badge Helper ─────────────────────────────────────────────────

function CampaignStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
    Active: { variant: 'default', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    ACTIVE: { variant: 'default', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    Paused: { variant: 'default', className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    PAUSED: { variant: 'default', className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    Draft: { variant: 'default', className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' },
    DRAFT: { variant: 'default', className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' },
    Completed: { variant: 'default', className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    COMPLETED: { variant: 'default', className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  }
  const c = config[status] || config.Draft
  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  return <Badge variant={c.variant} className={cn('text-[11px] font-medium px-2 py-0.5 rounded-md', c.className)}>{displayStatus}</Badge>
}

function MeetingTypeBadge({ type }: { type: string }) {
  const config: Record<string, { icon: typeof Video; color: string; bg: string }> = {
    'Video Call': { icon: Video, color: 'text-blue-600', bg: 'bg-blue-50' },
    'Phone': { icon: Phone, color: 'text-violet-600', bg: 'bg-violet-50' },
    'In Person': { icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50' },
  }
  const c = config[type] || config['Video Call']
  const Icon = c.icon
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md', c.bg, c.color)}>
      <Icon className="w-3 h-3" />
      {type}
    </span>
  )
}

// ─── Activity Icon Helper ────────────────────────────────────────────────

function ActivityIcon({ action }: { action: string }) {
  const iconMap: Record<string, typeof Sparkles> = {
    discovered: Globe,
    discovery: Globe,
    audit: Search,
    email: Mail,
    meeting: CalendarDays,
    outreach: Target,
    created: Sparkles,
    qualified: CheckCircle2,
    updated: RefreshCw,
  }
  const Icon = iconMap[action.toLowerCase()] || Sparkles
  return <Icon className="w-3.5 h-3.5 text-blue-500" />
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
      // silent — skeleton already showing
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // ─── Loading ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <DashboardSkeleton />
      </div>
    )
  }

  // ─── Empty State ─────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="space-y-6 p-1">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BarChart3 className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-1">Unable to load dashboard</h3>
          <p className="text-sm text-gray-300 mb-4">Check your connection and try again.</p>
          <Button variant="outline" size="sm" onClick={fetchDashboard}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const d = data

  // ─── Derived Data ────────────────────────────────────────────────
  const pipelineData = STAGE_ORDER.map((stage, i) => ({
    name: STAGE_LABELS[stage] || stage,
    value: d.stages[stage] || 0,
    fill: PIPELINE_COLORS[i],
  }))

  const industryData = (d.leadsByIndustry || [])
    .filter((item) => item.industry && item.industry !== 'null')
    .slice(0, 6)
    .map((item, i) => ({
      name: item.industry,
      value: item._count.industry,
      fill: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length],
    }))

  const industryTotal = industryData.reduce((sum, item) => sum + item.value, 0)

  const displayActivities = d.recentActivities || []

  // KPI cards data
  const kpis = [
    {
      label: 'Active Campaigns',
      value: d.activeCampaigns,
      icon: Target,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'New Qualified Leads',
      value: d.qualifiedCount,
      sublabel: 'today',
      icon: Users,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Emails Sent',
      value: d.outreachSent,
      sublabel: 'today',
      icon: Mail,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      label: 'Reply Rate',
      value: `${d.replyRate}%`,
      icon: TrendingUp,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]

  const firstName = userName.split(' ')[0] || 'User'

  return (
    <motion.div
      className="space-y-5 p-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ════════════════════════════════════════════════════════════════
          1. WELCOME BAR
          ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{getTodayFormatted()}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs font-medium rounded-lg border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => setView('campaigns')}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            New Campaign
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs font-medium rounded-lg border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => setView('discovery')}
          >
            <Search className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            Find Leads
          </Button>
          <Button
            size="sm"
            className="h-9 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
            onClick={() => setView('ai-assistant')}
          >
            <Bot className="w-3.5 h-3.5 mr-1.5" />
            AI Assistant
          </Button>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          2. KPI ROW
          ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            custom={i}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: (i: number) => ({
                opacity: 1,
                y: 0,
                transition: { duration: 0.3, ease: 'easeOut' as const, delay: i * 0.06 },
              }),
            }}
            className="bg-white rounded-xl border border-gray-200/60 p-5 hover:shadow-md hover:shadow-black/[0.04] transition-shadow duration-200 cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', kpi.iconBg)}>
                <kpi.icon className={cn('w-4 h-4', kpi.iconColor)} />
              </div>
            </div>
            <div className="flex items-end gap-1.5">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              {kpi.label}
              {kpi.sublabel && <span className="ml-1 text-gray-300">· {kpi.sublabel}</span>}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          3. MAIN CONTENT GRID
          ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ─── LEFT COLUMN: Revenue Pipeline ───────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-7 bg-white rounded-xl border border-gray-200/60 p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue Pipeline</h3>
              <p className="text-xs text-gray-400 mt-0.5">{d.totalLeads.toLocaleString()} leads across all stages</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={pipelineData}
              margin={{ left: -10, right: 8, top: 4, bottom: 4 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<BarTooltipContent />} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                {pipelineData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ─── RIGHT COLUMN: AI Activity + Upcoming Meetings ──────── */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* AI Activity Feed */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl border border-gray-200/60 p-5 flex-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Activity</h3>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Live</span>
            </div>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {displayActivities.length > 0 ? displayActivities.map((item, i) => (
                <motion.div
                  key={item.id || i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.25, ease: 'easeOut' as const }}
                  className="flex items-start gap-3 group"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <ActivityIcon action={item.action} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-snug">{item.details || item.action}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-8 text-sm text-gray-400">No recent activity</div>
              )}
            </div>
          </motion.div>

          {/* Upcoming Meetings */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl border border-gray-200/60 p-5 flex-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                  <CalendarDays className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Upcoming Meetings</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[11px] text-gray-400 hover:text-gray-700 h-6 px-2"
                onClick={() => setView('meetings')}
              >
                View all
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2.5">
              {d.upcomingMeetings && d.upcomingMeetings.length > 0 ? d.upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-default group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
                        {meeting.company}
                      </p>
                      <MeetingTypeBadge type={meeting.type} />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {meeting.contact} · {meeting.date} at {meeting.time}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-sm text-gray-400">No upcoming meetings</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          4. CAMPAIGN PERFORMANCE TABLE
          ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl border border-gray-200/60 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Campaign Performance</h3>
              <p className="text-xs text-gray-400 mt-0.5">Top performing outreach campaigns</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[11px] text-gray-400 hover:text-gray-700 h-6 px-2"
            onClick={() => setView('campaigns')}
          >
            View all
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Campaign', 'Status', 'Sent', 'Opened', 'Replied', 'Meetings'].map((header) => (
                  <th
                    key={header}
                    className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-left pb-3 pr-4 last:pr-0"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.campaigns && d.campaigns.length > 0 ? d.campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-colors cursor-default group"
                >
                  <td className="py-3 pr-4">
                    <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                      {campaign.name}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <CampaignStatusBadge status={campaign.status} />
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-[13px] text-gray-600 tabular-nums">{campaign.sent.toLocaleString()}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] text-gray-600 tabular-nums">{campaign.opened.toLocaleString()}</span>
                      {campaign.sent > 0 && (
                        <span className="text-[10px] text-gray-400">
                          ({Math.round((campaign.opened / campaign.sent) * 100)}%)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] text-gray-600 tabular-nums">{campaign.replied.toLocaleString()}</span>
                      {campaign.sent > 0 && (
                        <span className="text-[10px] text-gray-400">
                          ({Math.round((campaign.replied / campaign.sent) * 100)}%)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-[13px] text-gray-600 tabular-nums">
                      {campaign.meetings > 0 ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-gray-300" />
                      )}
                      {campaign.meetings}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-400">No campaigns yet. Create your first campaign to see performance data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          5. BOTTOM ROW: Lead Distribution + Recent Activity
          ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Lead Distribution — Donut Chart */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-5 bg-white rounded-xl border border-gray-200/60 p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <PieIcon className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Lead Distribution</h3>
                <p className="text-xs text-gray-400 mt-0.5">By industry vertical</p>
              </div>
            </div>
          </div>
          {industryData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="relative w-[160px] h-[160px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={industryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {industryData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">
                      {industryTotal}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Total</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {industryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-[12px] text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[12px] font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <PieIcon className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No industry data yet</p>
            </div>
          )}
        </motion.div>

        {/* Recent Activity Timeline */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-7 bg-white rounded-xl border border-gray-200/60 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
                <p className="text-xs text-gray-400 mt-0.5">{displayActivities.length} events this week</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] text-gray-400 hover:text-gray-700 h-6 px-2"
              onClick={() => setView('leads')}
            >
              View all
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          {displayActivities.length > 0 ? (
            <div className="space-y-0">
              {displayActivities.slice(0, 5).map((activity, i) => {
                const actionIcon = getActivityIcon(activity.action)
                const actionColor = getActivityColor(activity.action)
                return (
                  <motion.div
                    key={activity.id || i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.04, duration: 0.2, ease: 'easeOut' as const }}
                    className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 group"
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                      actionColor
                    )}>
                      {actionIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-snug">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {activity.user?.name || 'System'}
                        </span>
                        {' '}
                        {activity.action}
                        {activity.lead?.business?.name && (
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {' '}{activity.lead.business.name}
                          </span>
                        )}
                      </p>
                      {activity.details && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{activity.details}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5 shrink-0">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Clock className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No recent activity</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── Activity Icon & Color Helpers ───────────────────────────────────────

function getActivityIcon(action: string) {
  const upper = action.toUpperCase()
  if (upper.includes('DISCOVER') || upper.includes('LEAD')) {
    return <Globe className="w-3.5 h-3.5 text-emerald-500" />
  }
  if (upper.includes('AUDIT')) {
    return <Search className="w-3.5 h-3.5 text-blue-500" />
  }
  if (upper.includes('EMAIL') || upper.includes('OUTREACH')) {
    return <Mail className="w-3.5 h-3.5 text-violet-500" />
  }
  if (upper.includes('REPLY') || upper.includes('REPLIED')) {
    return <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
  }
  if (upper.includes('MEETING') || upper.includes('BOOK')) {
    return <CalendarDays className="w-3.5 h-3.5 text-rose-500" />
  }
  if (upper.includes('WON')) {
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
  }
  return <ActivityIconFallback />
}

function ActivityIconFallback() {
  return <Sparkles className="w-3.5 h-3.5 text-gray-400" />
}

function getActivityColor(action: string) {
  const upper = action.toUpperCase()
  if (upper.includes('DISCOVER') || upper.includes('LEAD')) return 'bg-emerald-50'
  if (upper.includes('AUDIT')) return 'bg-blue-50'
  if (upper.includes('EMAIL') || upper.includes('OUTREACH')) return 'bg-violet-50'
  if (upper.includes('REPLY') || upper.includes('REPLIED')) return 'bg-amber-50'
  if (upper.includes('MEETING') || upper.includes('BOOK')) return 'bg-rose-50'
  if (upper.includes('WON')) return 'bg-emerald-50'
  return 'bg-gray-50'
}