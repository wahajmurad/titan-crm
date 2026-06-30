'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

// ─── Dark-mode stage dot colors for backgrounds ────────────────────────

const STAGE_BG: Record<string, string> = {
  DISCOVERED: 'bg-slate-700/40 border-gray-300/50',
  AUDITED: 'bg-sky-500/10 border-sky-500/30',
  QUALIFIED: 'bg-emerald-500/10 border-emerald-500/30',
  OUTREACH_SENT: 'bg-amber-500/10 border-amber-500/30',
  REPLIED: 'bg-violet-500/10 border-violet-500/30',
  MEETING_BOOKED: 'bg-blue-500/10 border-blue-500/30',
  PROPOSAL_SENT: 'bg-orange-500/10 border-orange-500/30',
  WON: 'bg-green-500/10 border-green-500/30',
  LOST: 'bg-red-500/10 border-red-500/30',
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

const ACTION_COLORS: Record<string, string> = {
  LEAD_CREATED: 'bg-violet-500/20 text-violet-400',
  LEAD_AUDITED: 'bg-sky-500/20 text-sky-400',
  LEAD_QUALIFIED: 'bg-emerald-500/20 text-emerald-400',
  OUTREACH_SENT: 'bg-amber-500/20 text-amber-400',
  REPLY_RECEIVED: 'bg-blue-500/20 text-blue-400',
  MEETING_BOOKED: 'bg-cyan-500/20 text-cyan-400',
  MEETING_COMPLETED: 'bg-green-500/20 text-green-400',
  MEETING_CANCELLED: 'bg-red-500/20 text-red-400',
  CAMPAIGN_CREATED: 'bg-purple-500/20 text-purple-400',
  CAMPAIGN_UPDATED: 'bg-indigo-500/20 text-indigo-400',
  PROPOSAL_SENT: 'bg-orange-500/20 text-orange-400',
  LEAD_WON: 'bg-green-500/20 text-green-400',
  LEAD_LOST: 'bg-red-500/20 text-red-400',
}

// ─── Component ────────────────────────────────────────────────────────

export function DashboardView() {
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
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-400',
      accent: 'from-violet-500/5 to-transparent',
      trend: null,
    },
    {
      label: 'Qualified Leads',
      value: data.qualifiedCount,
      icon: Thermometer,
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      accent: 'from-emerald-500/5 to-transparent',
      trend: 'hotwarmcold',
    },
    {
      label: 'Outreach Sent',
      value: data.outreachSent,
      icon: Mail,
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      accent: 'from-amber-500/5 to-transparent',
      trend: data.replyRate > 0 ? `${data.replyRate}% replies` : null,
    },
    {
      label: 'Meetings Booked',
      value: data.meetingBooked,
      icon: Calendar,
      iconBg: 'bg-cyan-500/15',
      iconColor: 'text-cyan-400',
      accent: 'from-cyan-500/5 to-transparent',
      trend: null,
    },
    {
      label: 'Won Deals',
      value: data.wonCount,
      icon: TrendingUp,
      iconBg: 'bg-green-500/15',
      iconColor: 'text-green-400',
      accent: 'from-green-500/5 to-transparent',
      trend: null,
    },
    {
      label: 'Active Campaigns',
      value: data.activeCampaigns,
      icon: Target,
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-400',
      accent: 'from-purple-500/5 to-transparent',
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
      gradient: 'from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600',
    },
    {
      label: 'Run Website Audit',
      icon: Globe2,
      view: 'audit' as const,
      gradient: 'from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600',
    },
    {
      label: 'Ask AI',
      icon: Brain,
      view: 'ai-assistant' as const,
      gradient: 'from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600',
    },
    {
      label: 'View Inbox',
      icon: Inbox,
      view: 'inbox' as const,
      gradient: 'from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600',
    },
  ]

  // ─── Loading State ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Welcome skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64 bg-gray-100" />
            <Skeleton className="h-4 w-96 bg-gray-100" />
          </div>
          <Skeleton className="h-10 w-32 bg-gray-100 rounded-lg" />
        </div>

        {/* KPI skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 bg-gray-100 rounded-xl" />
          ))}
        </div>

        {/* Pipeline skeleton */}
        <Skeleton className="h-32 bg-gray-100 rounded-xl" />

        {/* Two-column skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 bg-gray-100 rounded-xl" />
          <Skeleton className="h-80 bg-gray-100 rounded-xl" />
        </div>

        {/* Quick actions skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Error State ────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-gray-600 font-medium">Failed to load dashboard</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
        <Button
          variant="outline"
          className="mt-4 border-gray-200 text-gray-600 hover:bg-gray-100"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ─── 1. Welcome Bar ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600/10 via-slate-900 to-emerald-600/10 border border-slate-800/60 px-6 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/5 via-transparent to-transparent" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Here&apos;s your acquisition pipeline overview
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-gray-100/80 rounded-lg px-3 py-1.5 border border-gray-200">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-gray-600 font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* ─── 2. KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.label}
              className="bg-white border-slate-800/60 hover:border-gray-300/60 transition-all duration-200 group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <CardContent className="p-4 relative">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center`}
                  >
                    <Icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                  {card.trend && card.trend !== 'hotwarmcold' && (
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] px-1.5 py-0"
                    >
                      {card.trend}
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>

                {/* Hot/Warm/Cold breakdown for Qualified card */}
                {card.trend === 'hotwarmcold' && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-gray-400">Hot</span>
                        <span className="text-red-400 font-medium">
                          {data.temperature['HOT'] || 0}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-gray-400">Warm</span>
                        <span className="text-amber-400 font-medium">
                          {data.temperature['WARM'] || 0}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        <span className="text-gray-400">Cold</span>
                        <span className="text-sky-400 font-medium">
                          {data.temperature['COLD'] || 0}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ─── 3. Lead Pipeline ──────────────────────────────────────── */}
      <Card className="bg-white border-slate-800/60">
        <CardHeader className="pb-3 px-5 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              Lead Pipeline
            </CardTitle>
            <span className="text-xs text-gray-400">
              {data.totalLeads} total leads
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <ScrollArea className="w-full">
            <div className="flex gap-2.5 pb-2 min-w-max">
              {PIPELINE_STAGES.map((stage, idx) => {
                const count = data.stages[stage] || 0
                const pct =
                  data.totalLeads > 0
                    ? (count / data.totalLeads) * 100
                    : 0
                return (
                  <div key={stage} className="flex items-center gap-2.5">
                    <div
                      className={`flex-shrink-0 w-36 rounded-xl border px-4 py-3.5 transition-all duration-200 hover:scale-[1.02] cursor-default ${STAGE_BG[stage] || 'bg-gray-100 border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${STAGE_DOT_COLORS[stage]}`}
                          />
                          <span className="text-xs font-medium text-gray-600 truncate">
                            {stage.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-lg font-bold text-gray-900 tabular-nums">
                          {count}
                        </span>
                        <span className="text-[10px] text-gray-400 tabular-nums">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${STAGE_DOT_COLORS[stage]}`}
                          style={{ width: `${Math.max(pct, 0)}%` }}
                        />
                      </div>
                    </div>
                    {idx < PIPELINE_STAGES.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ─── 4. Two-Column Section ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Campaign Performance Table */}
        <Card className="bg-white border-slate-800/60">
          <CardHeader className="pb-3 px-5 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500" />
                Campaign Performance
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]"
              >
                Top 5 by reply rate
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {topCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Target className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No active campaigns yet</p>
                <p className="text-xs text-gray-300 mt-1">
                  Create a campaign to start tracking performance
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <ScrollArea className="max-h-[340px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800/60 hover:bg-transparent">
                        <TableHead className="text-[10px] font-medium text-gray-400 uppercase tracking-wider h-8">
                          Campaign
                        </TableHead>
                        <TableHead className="text-[10px] font-medium text-gray-400 uppercase tracking-wider h-8 text-right">
                          Sent
                        </TableHead>
                        <TableHead className="text-[10px] font-medium text-gray-400 uppercase tracking-wider h-8 text-right">
                          Replies
                        </TableHead>
                        <TableHead className="text-[10px] font-medium text-gray-400 uppercase tracking-wider h-8 text-right">
                          Reply Rate
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCampaigns.map((c, i) => (
                        <TableRow
                          key={c.id}
                          className="border-slate-800/40 hover:bg-gray-100/40"
                        >
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
                                  {c.name}
                                </p>
                                {c.industry && (
                                  <p className="text-[10px] text-gray-300 truncate">
                                    {c.industry}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 text-right text-xs text-gray-500 tabular-nums">
                            {c.sentCount}
                          </TableCell>
                          <TableCell className="py-2.5 text-right text-xs text-gray-500 tabular-nums">
                            {c.replyCount}
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Progress
                                value={c.replyRate}
                                className="w-12 h-1.5 bg-gray-100"
                              />
                              <span className="text-xs font-medium text-emerald-400 tabular-nums w-8 text-right">
                                {c.replyRate}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Recent Activity Feed */}
        <Card className="bg-white border-slate-800/60">
          <CardHeader className="pb-3 px-5 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                Recent Activity
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-500 border-gray-200 text-[10px]"
              >
                Last 10
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {data.recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Clock className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No activity yet</p>
                <p className="text-xs text-gray-300 mt-1">
                  Start by discovering leads
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[340px]">
                <div className="space-y-1">
                  {data.recentActivities.map((a, i) => {
                    const ActionIcon =
                      ACTION_ICONS[a.action] || ArrowUpRight
                    const actionColor =
                      ACTION_COLORS[a.action] ||
                      'bg-slate-700/40 text-gray-500'
                    return (
                      <div
                        key={a.id}
                        className={`flex items-start gap-3 py-2.5 ${i < data.recentActivities.length - 1 ? 'border-b border-slate-800/40' : ''}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg ${actionColor} flex items-center justify-center shrink-0 mt-0.5`}
                        >
                          <ActionIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {a.details || a.action.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-300">
                              {a.user?.name || 'System'}
                            </span>
                            {a.lead?.business?.name && (
                              <>
                                <span className="text-[10px] text-slate-700">
                                  ·
                                </span>
                                <span className="text-[10px] text-gray-400 truncate">
                                  {a.lead.business.name}
                                </span>
                              </>
                            )}
                            <span className="text-[10px] text-slate-700">·</span>
                            <span className="text-[10px] text-gray-300">
                              {formatDistanceToNow(new Date(a.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── 5. Quick Actions ─────────────────────────────────────── */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.view}
                onClick={() => setView(action.view)}
                className={`h-auto py-3.5 px-4 bg-gradient-to-r ${action.gradient} border-0 shadow-lg text-gray-900 justify-start gap-2.5 rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
              >
                <Icon className="w-4 h-4 opacity-90" />
                <span className="text-sm font-medium">{action.label}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
