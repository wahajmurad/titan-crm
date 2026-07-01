'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { LEAD_STAGES, STAGE_DOT_COLORS, STAGE_COLORS } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import {
  Users,
  Mail,
  Calendar,
  TrendingUp,
  Target,
  Flame,
  Thermometer,
  ArrowUpRight,
  ArrowRight,
  Search,
  Globe2,
  Brain,
  Inbox,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  BarChart3,
  ChevronRight,
  Activity,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion'

// ─── Data Types ────────────────────────────────────────────────────────

interface DashboardData {
  totalLeads: number
  stages: Record<string, number>
  outreach: Record<string, number>
  meetings: Record<string, number>
  replyRate: number
  recentActivities: Array<{
    id: string
    action: string
    details: string
    createdAt: string
    user: { name: string } | null
    lead: { business: { name: string } } | null
  }>
  leadsByIndustry: Array<{
    industry: string | null
    _count: { industry: number }
  }>
  temperature: Record<string, number>
  wonCount: number
  meetingBooked: number
  outreachSent: number
  qualifiedCount: number
  activeCampaigns: number
}

interface CampaignData {
  id: string
  name: string
  industry: string | null
  status: string
  leadCount: number
  sentCount: number
  replyCount: number
  meetingCount: number
  wonCount: number
  createdAt: string
}

const defaultData: DashboardData = {
  totalLeads: 0,
  stages: {},
  outreach: {},
  meetings: {},
  replyRate: 0,
  recentActivities: [],
  leadsByIndustry: [],
  temperature: {},
  wonCount: 0,
  meetingBooked: 0,
  outreachSent: 0,
  qualifiedCount: 0,
  activeCampaigns: 0,
}

// ─── Pipeline stage order (exclude LOST) ─────────────────────────────

const PIPELINE_STAGES = LEAD_STAGES.filter((s) => s !== 'LOST')

// ─── Stage bar colors ────────────────────────────────────────────────

const STAGE_BAR_COLORS: Record<string, string> = {
  DISCOVERED: 'bg-slate-400',
  AUDITED: 'bg-sky-500',
  QUALIFIED: 'bg-emerald-500',
  OUTREACH_SENT: 'bg-amber-500',
  REPLIED: 'bg-blue-500',
  MEETING_BOOKED: 'bg-cyan-500',
  PROPOSAL_SENT: 'bg-orange-500',
  WON: 'bg-green-500',
  LOST: 'bg-red-400',
}

// ─── Activity action → icon mapping ────────────────────────────────────

const ACTION_ICONS: Record<string, React.ElementType> = {
  LEAD_CREATED: Users,
  LEAD_AUDITED: Search,
  LEAD_QUALIFIED: CheckCircle2,
  OUTREACH_SENT: Send,
  REPLY_RECEIVED: Mail,
  MEETING_BOOKED: Calendar,
  MEETING_COMPLETED: CheckCircle2,
  MEETING_CANCELLED: XCircle,
  CAMPAIGN_CREATED: Target,
  CAMPAIGN_UPDATED: BarChart3,
  PROPOSAL_SENT: Send,
  LEAD_WON: TrendingUp,
  LEAD_LOST: XCircle,
}

const ACTION_DOT_COLORS: Record<string, string> = {
  LEAD_CREATED: 'bg-blue-500',
  LEAD_AUDITED: 'bg-sky-500',
  LEAD_QUALIFIED: 'bg-emerald-500',
  OUTREACH_SENT: 'bg-amber-500',
  REPLY_RECEIVED: 'bg-blue-500',
  MEETING_BOOKED: 'bg-cyan-500',
  MEETING_COMPLETED: 'bg-green-500',
  MEETING_CANCELLED: 'bg-red-500',
  CAMPAIGN_CREATED: 'bg-purple-500',
  CAMPAIGN_UPDATED: 'bg-indigo-500',
  PROPOSAL_SENT: 'bg-orange-500',
  LEAD_WON: 'bg-green-500',
  LEAD_LOST: 'bg-red-500',
}

// ─── Industry bar colors ──────────────────────────────────────────────

const INDUSTRY_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-orange-500',
  'bg-teal-500',
]

// ─── Animated Number Component ────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (latest) => Math.round(latest))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return (
    <motion.span className="tabular-nums">
      {useTransform(display, (v) => v.toLocaleString())}
    </motion.span>
  )
}

// ─── SVG Circle Gauge ─────────────────────────────────────────────────

function CircleGauge({ value, size = 120, strokeWidth = 8, label }: { value: number; size?: number; strokeWidth?: number; label: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedValue = Math.min(Math.max(value, 0), 100)
  const offset = circumference - (clampedValue / 100) * circumference

  const color = clampedValue >= 60 ? '#10B981' : clampedValue >= 30 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-slate-900 tabular-nums">{clampedValue}%</span>
        <span className="text-[11px] text-slate-400 font-medium">{label}</span>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export function DashboardView({ userName }: { userName?: string }) {
  const [data, setData] = useState<DashboardData>(defaultData)
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setView } = useAppStore()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [dashRes, campRes] = await Promise.all([
          fetch('/api/dashboard', { credentials: 'same-origin' }),
          fetch('/api/campaigns?status=ACTIVE&limit=10', { credentials: 'same-origin' }),
        ])
        if (cancelled) return
        if (!dashRes.ok) throw new Error('Failed to load dashboard')
        if (!campRes.ok) throw new Error('Failed to load campaigns')

        const [dashData, campData] = await Promise.all([dashRes.json(), campRes.json()])
        if (cancelled) return
        setData(dashData)
        setCampaigns(campData.campaigns || [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // ─── KPI Cards Data ─────────────────────────────────────────────────

  const kpiCards = [
    {
      label: 'Total Leads',
      value: data.totalLeads,
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-[#2563EB]',
      trend: null,
    },
    {
      label: 'Qualified Leads',
      value: data.qualifiedCount,
      icon: Thermometer,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: 'hotwarmcold',
    },
    {
      label: 'Outreach Sent',
      value: data.outreachSent,
      icon: Mail,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      trend: data.replyRate > 0 ? `${data.replyRate}% replies` : null,
    },
    {
      label: 'Meetings Booked',
      value: data.meetingBooked,
      icon: Calendar,
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      trend: null,
    },
  ]

  // ─── Top campaigns by reply rate ─────────────────────────────────────

  const topCampaigns = [...campaigns]
    .map((c) => ({
      ...c,
      replyRate: c.sentCount > 0 ? Math.round((c.replyCount / c.sentCount) * 100) : 0,
    }))
    .sort((a, b) => b.replyRate - a.replyRate)
    .slice(0, 5)

  // ─── Quick Actions ──────────────────────────────────────────────────

  const quickActions = [
    {
      label: 'Discover Leads',
      icon: Search,
      view: 'discovery' as const,
      color: 'bg-[#2563EB] hover:bg-blue-700',
    },
    {
      label: 'Run Website Audit',
      icon: Globe2,
      view: 'audit' as const,
      color: 'bg-sky-600 hover:bg-sky-700',
    },
    {
      label: 'Ask AI',
      icon: Brain,
      view: 'ai-assistant' as const,
      color: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      label: 'View Inbox',
      icon: Inbox,
      view: 'inbox' as const,
      color: 'bg-amber-600 hover:bg-amber-700',
    },
  ]

  // ─── Loading State ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-slate-100 rounded-xl" />
            <Skeleton className="h-4 w-80 bg-slate-100 rounded-xl" />
          </div>
          <Skeleton className="h-10 w-24 bg-slate-100 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-44 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-80 bg-slate-100 rounded-2xl" />
          <Skeleton className="h-80 bg-slate-100 rounded-2xl" />
          <Skeleton className="h-80 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  // ─── Error State ────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <XCircle className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-slate-900 font-semibold text-lg">Failed to load dashboard</p>
        <p className="text-sm text-slate-400 mt-1">{error}</p>
        <Button
          variant="outline"
          className="mt-5 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ─── 1. Heading ────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#475569] mt-1">
            {getGreeting()}, {userName || 'there'} — here&apos;s your acquisition pipeline overview
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 rounded-full px-3.5 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-emerald-700 font-medium">Live</span>
        </div>
      </motion.div>

      {/* ─── 2. KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Card className="bg-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  {card.trend && card.trend !== 'hotwarmcold' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-0.5">
                      <TrendingUp className="w-3 h-3" />
                      {card.trend}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-[#0F172A] tabular-nums tracking-tight">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-sm text-[#94A3B8] mt-1 font-medium">{card.label}</p>

                {/* Hot/Warm/Cold breakdown for Qualified card */}
                {card.trend === 'hotwarmcold' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[#94A3B8]">Hot</span>
                        <span className="text-slate-900 font-semibold tabular-nums">
                          {data.temperature['HOT'] || 0}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[#94A3B8]">Warm</span>
                        <span className="text-slate-900 font-semibold tabular-nums">
                          {data.temperature['WARM'] || 0}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        <span className="text-[#94A3B8]">Cold</span>
                        <span className="text-slate-900 font-semibold tabular-nums">
                          {data.temperature['COLD'] || 0}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ─── 3. Lead Pipeline ──────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#2563EB]" />
              </div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Lead Pipeline</h3>
            </div>
            <span className="text-xs text-[#94A3B8] font-medium tabular-nums">
              {data.totalLeads} total leads
            </span>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2 min-w-max">
              {PIPELINE_STAGES.map((stage, idx) => {
                const count = data.stages[stage] || 0
                const pct =
                  data.totalLeads > 0
                    ? (count / data.totalLeads) * 100
                    : 0
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-40 rounded-2xl bg-slate-50/80 px-5 py-4 transition-all duration-200 hover:bg-slate-100/80 cursor-default">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${STAGE_DOT_COLORS[stage]}`}
                        />
                        <span className="text-xs font-medium text-[#475569] truncate">
                          {stage.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-end justify-between mb-3">
                        <span className="text-2xl font-bold text-[#0F172A] tabular-nums tracking-tight">
                          {count}
                        </span>
                        <span className="text-xs text-[#94A3B8] font-medium tabular-nums">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${STAGE_BAR_COLORS[stage]}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(pct, 0)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + idx * 0.08 }}
                        />
                      </div>
                    </div>
                    {idx < PIPELINE_STAGES.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </Card>
      </motion.div>

      {/* ─── 4. Three-Column Section ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Quick Stats with Reply Rate Gauge */}
        <motion.div variants={fadeUp}>
          <Card className="bg-white rounded-2xl border-0 shadow-sm p-6 h-full">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Quick Stats</h3>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative">
                <CircleGauge value={data.replyRate} size={120} strokeWidth={10} label="Reply Rate" />
              </div>
              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50">
                  <span className="text-xs font-medium text-[#475569]">Won Deals</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{data.wonCount}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50">
                  <span className="text-xs font-medium text-[#475569]">Active Campaigns</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{data.activeCampaigns}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50">
                  <span className="text-xs font-medium text-[#475569]">Total Outreach</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{data.outreachSent}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Center: Recent Activity Feed */}
        <motion.div variants={fadeUp}>
          <Card className="bg-white rounded-2xl border-0 shadow-sm p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#2563EB]" />
                </div>
                <h3 className="text-sm font-semibold text-[#0F172A]">Recent Activity</h3>
              </div>
              <span className="text-xs text-[#94A3B8] font-medium bg-slate-50 rounded-full px-2.5 py-0.5">
                Last 10
              </span>
            </div>
            {data.recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm text-[#475569] font-medium">No activity yet</p>
                <p className="text-xs text-[#94A3B8] mt-1">Start by discovering leads</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[320px]">
                <div className="relative pl-5">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-100" />
                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-0.5"
                  >
                    {data.recentActivities.slice(0, 10).map((a) => {
                      const ActionIcon = ACTION_ICONS[a.action] || ArrowUpRight
                      const dotColor = ACTION_DOT_COLORS[a.action] || 'bg-slate-400'
                      return (
                        <motion.div
                          key={a.id}
                          variants={fadeUp}
                          className="relative py-2.5 group"
                        >
                          {/* Timeline dot */}
                          <div className={`absolute -left-5 top-4 w-3.5 h-3.5 rounded-full ${dotColor} ring-4 ring-white z-10`} />
                          <div className="ml-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <ActionIcon className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                              <p className="text-xs text-[#0F172A] font-medium leading-relaxed truncate">
                                {a.details || a.action.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 ml-5.5">
                              <span className="text-[11px] text-[#94A3B8]">
                                {a.user?.name || 'System'}
                              </span>
                              {a.lead?.business?.name && (
                                <>
                                  <span className="text-[11px] text-slate-300">·</span>
                                  <span className="text-[11px] text-[#475569] truncate">
                                    {a.lead.business.name}
                                  </span>
                                </>
                              )}
                              <span className="text-[11px] text-slate-300">·</span>
                              <span className="text-[11px] text-[#94A3B8]">
                                {formatDistanceToNow(new Date(a.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </div>
              </ScrollArea>
            )}
          </Card>
        </motion.div>

        {/* Right: Industry Breakdown */}
        <motion.div variants={fadeUp}>
          <Card className="bg-white rounded-2xl border-0 shadow-sm p-6 h-full">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Flame className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Leads by Industry</h3>
            </div>
            {data.leadsByIndustry.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm text-[#475569] font-medium">No industry data</p>
                <p className="text-xs text-[#94A3B8] mt-1">Add leads to see breakdown</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {data.leadsByIndustry
                  .sort((a, b) => b._count.industry - a._count.industry)
                  .slice(0, 8)
                  .map((item, idx) => {
                    const maxCount = data.leadsByIndustry[0]?._count.industry || 1
                    const barPct = (item._count.industry / maxCount) * 100
                    const color = INDUSTRY_COLORS[idx % INDUSTRY_COLORS.length]
                    return (
                      <div key={item.industry || 'unknown'}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-[#475569] truncate max-w-[160px]">
                            {item.industry || 'Unknown'}
                          </span>
                          <span className="text-xs font-bold text-[#0F172A] tabular-nums">
                            {item._count.industry}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${barPct}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 + idx * 0.06 }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ─── 5. Campaign Performance ────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Target className="w-4 h-4 text-[#2563EB]" />
              </div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Campaign Performance</h3>
            </div>
            <span className="text-xs text-[#94A3B8] font-medium bg-blue-50 text-blue-600 rounded-full px-2.5 py-0.5">
              Top 5 by reply rate
            </span>
          </div>
          {topCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-sm text-[#475569] font-medium">No active campaigns yet</p>
              <p className="text-xs text-[#94A3B8] mt-1">Create a campaign to start tracking performance</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <ScrollArea className="max-h-[280px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Campaign</th>
                      <th className="text-right pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Sent</th>
                      <th className="text-right pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Replies</th>
                      <th className="text-right pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Reply Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCampaigns.map((c, i) => (
                      <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/40 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-[#475569]">
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#0F172A] truncate max-w-[160px]">
                                {c.name}
                              </p>
                              {c.industry && (
                                <p className="text-[11px] text-[#94A3B8] truncate">
                                  {c.industry}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right text-xs text-[#475569] tabular-nums font-medium">
                          {c.sentCount}
                        </td>
                        <td className="py-3 text-right text-xs text-[#475569] tabular-nums font-medium">
                          {c.replyCount}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress
                              value={c.replyRate}
                              className="w-14 h-1.5 bg-slate-100"
                            />
                            <span className="text-xs font-bold text-emerald-600 tabular-nums w-9 text-right">
                              {c.replyRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ─── 6. Quick Actions ─────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.view}
                onClick={() => setView(action.view)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-white ${action.color} shadow-sm hover:shadow-md transition-shadow text-left`}
              >
                <Icon className="w-5 h-5 opacity-90" />
                <span className="text-sm font-semibold">{action.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}