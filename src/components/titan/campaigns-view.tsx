'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Plus, Search, Users, Send, Reply, Calendar, Trophy, Pause, Play,
  MoreHorizontal, Eye, Pencil, UsersRound, ArrowRight, Target,
  TrendingUp, Mail, Zap, Megaphone, CircleDot, BarChart3,
  CheckCircle2, Sparkles, ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Animation Variants ───────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

// ─── Types ────────────────────────────────────────────────────────

interface Campaign {
  id: string
  name: string
  industry: string | null
  targetLocation: string | null
  targetCity: string | null
  targetSize: string | null
  serviceOffering: string | null
  dailyLimit: number
  aiModel: string
  notes: string | null
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  leadCount: number
  sentCount: number
  replyCount: number
  meetingCount: number
  wonCount: number
  createdAt: string
  updatedAt: string
  owner: { id: string; name: string; email: string }
  leads?: CampaignLead[]
}

interface CampaignLead {
  id: string
  stage: string
  temperature: string
  business: { id: string; name: string; industry: string | null; city: string | null }
  decisionMaker: string | null
  decisionMakerRole: string | null
  _count: { outreaches: number; meetings: number }
}

type CampaignForm = {
  name: string
  industry: string
  targetLocation: string
  targetCity: string
  targetSize: string
  serviceOffering: string
  dailyLimit: string
  aiModel: string
  notes: string
}

const EMPTY_FORM: CampaignForm = {
  name: '', industry: '', targetLocation: '', targetCity: '',
  targetSize: '', serviceOffering: '', dailyLimit: '20', aiModel: 'default', notes: '',
}

// ─── Config ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  ACTIVE: {
    label: 'Active',
    color: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
  },
  PAUSED: {
    label: 'Paused',
    color: 'text-amber-700 border-amber-200 bg-amber-50',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-blue-700 border-blue-200 bg-blue-50',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
  },
}

const STAT_ITEMS = [
  { key: 'leadCount' as const, label: 'Leads', icon: Users, color: 'text-slate-500', accent: 'bg-slate-50' },
  { key: 'sentCount' as const, label: 'Sent', icon: Send, color: 'text-blue-600', accent: 'bg-blue-50' },
  { key: 'replyCount' as const, label: 'Replies', icon: Reply, color: 'text-amber-600', accent: 'bg-amber-50' },
  { key: 'meetingCount' as const, label: 'Meetings', icon: Calendar, color: 'text-violet-600', accent: 'bg-violet-50' },
  { key: 'wonCount' as const, label: 'Won', icon: Trophy, color: 'text-emerald-600', accent: 'bg-emerald-50' },
]

const AI_MODELS = [
  { value: 'default', label: 'Default' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
]

const AI_SUGGESTIONS = [
  'Focus on decision-makers with "VP" or "Director" titles for higher engagement.',
  'Personalize first line with recent company news or achievements.',
  'Follow up 3-5 days after initial outreach for best reply rates.',
  'Keep subject lines under 50 characters for optimal open rates.',
  'Target mid-week sends (Tue-Thu) for higher open rates.',
]

// ─── Main Component ───────────────────────────────────────────────

export function CampaignsView() {
  const { setView } = useAppStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [campaignLeads, setCampaignLeads] = useState<CampaignLead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusTab !== 'ALL') params.set('status', statusTab)
    fetch(`/api/campaigns?${params}`, { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => setCampaigns(d.campaigns || []))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false))
  }, [search, statusTab, refreshKey])

  const refresh = () => setRefreshKey(k => k + 1)

  const filtered = campaigns.filter(c =>
    statusTab === 'ALL' || c.status === statusTab
  )

  // Aggregate stats
  const totals = filtered.reduce((acc, c) => ({
    leadCount: acc.leadCount + c.leadCount,
    sentCount: acc.sentCount + c.sentCount,
    replyCount: acc.replyCount + c.replyCount,
    meetingCount: acc.meetingCount + c.meetingCount,
    wonCount: acc.wonCount + c.wonCount,
  }), { leadCount: 0, sentCount: 0, replyCount: 0, meetingCount: 0, wonCount: 0 })

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length
  const overallReplyRate = totals.sentCount > 0
    ? ((totals.replyCount / totals.sentCount) * 100).toFixed(1)
    : '0.0'

  const handleToggleStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : campaign.status === 'PAUSED' ? 'ACTIVE' : campaign.status
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Campaign ${newStatus === 'ACTIVE' ? 'resumed' : 'paused'}`)
        refresh()
      }
    } catch {
      toast.error('Failed to update campaign status')
    }
  }

  const openEdit = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedCampaign(campaign)
    setEditOpen(true)
  }

  const openDetail = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setDetailOpen(true)
    fetchCampaignLeads(campaign.id)
  }

  const fetchCampaignLeads = (campaignId: string) => {
    setLeadsLoading(true)
    fetch(`/api/campaigns/${campaignId}/leads`, { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => setCampaignLeads(d.leads || []))
      .catch(() => setCampaignLeads([]))
      .finally(() => setLeadsLoading(false))
  }

  const getProgress = (campaign: Campaign) => {
    if (campaign.leadCount === 0) return 0
    return Math.min(100, Math.round((campaign.sentCount / campaign.leadCount) * 100))
  }

  return (
    <div className="min-h-full">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-5"
      >
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Campaigns
              {!loading && (
                <span className="ml-2.5 text-base font-normal text-gray-400">
                  {filtered.length}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and monitor your AI-powered outreach campaigns
            </p>
          </div>
          <CreateCampaignDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refresh} />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Tabs value={statusTab} onValueChange={setStatusTab}>
            <TabsList className="bg-gray-100/80 border-0 p-0.5 h-9">
              <TabsTrigger
                value="ALL"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm px-4 rounded-md"
              >
                All
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[11px] bg-gray-200/80 text-gray-600 border-0">
                  {campaigns.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="ACTIVE"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm px-4 rounded-md"
              >
                Active
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[11px] bg-gray-200/80 text-gray-600 border-0">
                  {campaigns.filter(c => c.status === 'ACTIVE').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="PAUSED"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm px-4 rounded-md"
              >
                Paused
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[11px] bg-gray-200/80 text-gray-600 border-0">
                  {campaigns.filter(c => c.status === 'PAUSED').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="COMPLETED"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm px-4 rounded-md"
              >
                Completed
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[11px] bg-gray-200/80 text-gray-600 border-0">
                  {campaigns.filter(c => c.status === 'COMPLETED').length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-64 h-9 text-sm bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300"
            />
          </div>
        </div>
      </motion.div>

      {/* ── Summary Stats (when campaigns exist) ────────────────── */}
      {!loading && filtered.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2"
        >
          {[
            {
              label: 'Active Campaigns',
              value: activeCampaigns,
              icon: CircleDot,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              border: 'border-emerald-100',
            },
            {
              label: 'Total Sent',
              value: totals.sentCount.toLocaleString(),
              icon: Send,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              border: 'border-blue-100',
            },
            {
              label: 'Reply Rate',
              value: `${overallReplyRate}%`,
              icon: TrendingUp,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
              border: 'border-amber-100',
            },
            {
              label: 'Meetings Booked',
              value: totals.meetingCount.toLocaleString(),
              icon: Calendar,
              color: 'text-violet-600',
              bg: 'bg-violet-50',
              border: 'border-violet-100',
            },
          ].map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <div className={cn(
                'bg-white rounded-xl border p-4 flex items-center gap-3.5',
                'border-gray-200/60 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]',
                'hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.06)] transition-shadow duration-200',
              )}>
                <div className={cn('p-2.5 rounded-lg', stat.bg)}>
                  <stat.icon className={cn('w-4.5 h-4.5', stat.color)} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-xl font-semibold text-gray-900 tracking-tight mt-0.5">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Loading State ───────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200/60 p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2.5 flex-1">
                  <Skeleton className="h-5 w-40 bg-gray-100" />
                  <Skeleton className="h-3.5 w-28 bg-gray-100" />
                </div>
                <Skeleton className="h-6 w-16 bg-gray-100 rounded-full" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-2 w-full bg-gray-100 rounded-full" />
              </div>
              <div className="flex gap-4 mt-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex-1">
                    <Skeleton className="h-6 w-8 bg-gray-100" />
                    <Skeleton className="h-3 w-10 bg-gray-100 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────── */}
      {!loading && filtered.length === 0 && (
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="show"
          className="mt-12"
        >
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] px-6 py-16 sm:px-16 sm:py-20 flex flex-col items-center text-center">
            {/* Illustration area */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/80 border border-blue-100 flex items-center justify-center mb-6">
              <Megaphone className="w-9 h-9 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
              No campaigns yet
            </h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
              Create your first AI-powered outreach campaign and start connecting with your ideal prospects at scale.
            </p>
            <Button
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 px-5"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
            <div className="flex items-center gap-2 mt-8 text-xs text-gray-400">
              <Zap className="w-3.5 h-3.5" />
              <span>AI-powered personalization • Smart follow-ups • Real-time analytics</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Campaign Cards Grid ─────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2"
        >
          {filtered.map(campaign => {
            const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.ACTIVE
            const replyRate = campaign.sentCount > 0
              ? ((campaign.replyCount / campaign.sentCount) * 100).toFixed(1)
              : '0.0'
            const progress = getProgress(campaign)

            return (
              <motion.div
                key={campaign.id}
                variants={item}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="bg-white rounded-xl border border-gray-200/60 p-5 cursor-pointer group transition-shadow duration-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)]"
                  onClick={() => openDetail(campaign)}
                >
                  {/* Card Header: Name + Status + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate leading-snug">
                        {campaign.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {campaign.industry && (
                          <Badge
                            variant="secondary"
                            className="h-5 px-2 text-[11px] font-medium bg-gray-100 text-gray-600 border-0 rounded-md"
                          >
                            {campaign.industry}
                          </Badge>
                        )}
                        {campaign.targetCity && (
                          <span className="text-xs text-gray-400">{campaign.targetCity}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Pause/Resume */}
                      {campaign.status !== 'COMPLETED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(campaign) }}
                          className={cn(
                            'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
                            'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
                          )}
                          title={campaign.status === 'ACTIVE' ? 'Pause campaign' : 'Resume campaign'}
                        >
                          {campaign.status === 'ACTIVE'
                            ? <Pause className="w-3.5 h-3.5" />
                            : <Play className="w-3.5 h-3.5" />
                          }
                        </button>
                      )}
                      {/* Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="h-7 w-7 rounded-md flex items-center justify-center transition-colors text-gray-400 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-white border-gray-200/80 shadow-lg">
                          <DropdownMenuItem
                            onClick={() => openDetail(campaign)}
                            className="text-gray-700 focus:bg-gray-50 focus:text-gray-900 text-sm py-2"
                          >
                            <Eye className="w-4 h-4 mr-2.5 text-gray-400" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => openEdit(campaign, e)}
                            className="text-gray-700 focus:bg-gray-50 focus:text-gray-900 text-sm py-2"
                          >
                            <Pencil className="w-4 h-4 mr-2.5 text-gray-400" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setView('leads') }}
                            className="text-gray-700 focus:bg-gray-50 focus:text-gray-900 text-sm py-2"
                          >
                            <UsersRound className="w-4 h-4 mr-2.5 text-gray-400" />
                            View Leads
                          </DropdownMenuItem>
                          {campaign.status !== 'COMPLETED' && (
                            <>
                              <DropdownMenuSeparator className="bg-gray-100" />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(campaign) }}
                                className="text-gray-700 focus:bg-gray-50 focus:text-gray-900 text-sm py-2"
                              >
                                {campaign.status === 'ACTIVE' ? (
                                  <><Pause className="w-4 h-4 mr-2.5 text-gray-400" />Pause</>
                                ) : (
                                  <><Play className="w-4 h-4 mr-2.5 text-gray-400" />Resume</>
                                )}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Status Badge + Date */}
                  <div className="flex items-center justify-between mt-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[11px] font-medium h-5 px-2 rounded-full border',
                        statusCfg.color,
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', statusCfg.dot)} />
                      {statusCfg.label}
                    </Badge>
                    <span className="text-[11px] text-gray-400">
                      {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-gray-500 font-medium">Completion</span>
                      <span className="text-[11px] text-gray-400">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          campaign.status === 'ACTIVE' ? 'bg-blue-500' :
                          campaign.status === 'PAUSED' ? 'bg-amber-400' :
                          'bg-blue-400',
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-5 gap-2 mt-4 pt-3.5 border-t border-gray-100">
                    {[
                      { val: campaign.leadCount, label: 'Leads', icon: Users },
                      { val: campaign.sentCount, label: 'Sent', icon: Send },
                      { val: campaign.replyCount, label: 'Replied', icon: Reply },
                      { val: campaign.meetingCount, label: 'Meetings', icon: Calendar },
                      { val: campaign.wonCount, label: 'Won', icon: Trophy },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <m.icon className="w-3 h-3 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-gray-900 leading-none">{m.val}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reply Rate Footer */}
                  <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">{replyRate}% reply rate</span>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      <Mail className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                      {campaign.dailyLimit}/day
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* ── Edit Campaign Dialog ─────────────────────────────────── */}
      {selectedCampaign && (
        <EditCampaignDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          campaign={selectedCampaign}
          onUpdated={() => { refresh(); setEditOpen(false) }}
        />
      )}

      {/* ── Campaign Detail Dialog ───────────────────────────────── */}
      {selectedCampaign && (
        <CampaignDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          campaign={selectedCampaign}
          leads={campaignLeads}
          leadsLoading={leadsLoading}
          onToggleStatus={handleToggleStatus}
          onNavigateLead={(leadId) => setView('lead-detail', leadId)}
        />
      )}
    </div>
  )
}

// ─── Create Campaign Dialog ─────────────────────────────────────────

function CreateCampaignDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void
}) {
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  const update = (key: keyof CampaignForm, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Campaign name is required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          ...form,
          dailyLimit: parseInt(form.dailyLimit) || 20,
        }),
      })
      if (res.ok) {
        toast.success('Campaign created successfully')
        setForm(EMPTY_FORM)
        onOpenChange(false)
        onCreated()
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Failed to create campaign')
      }
    } catch {
      toast.error('Failed to create campaign')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 px-4 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-gray-200/80 max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto shadow-xl rounded-2xl p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Create New Campaign
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Configure your AI-powered outreach campaign settings
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator className="bg-gray-100 mt-4" />

        <div className="p-6 space-y-5">
          {/* Name - Full width */}
          <div>
            <Label className="text-gray-700 text-sm font-medium">Campaign Name <span className="text-red-500">*</span></Label>
            <Input
              className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. NYC Law Firms Q4 Outreach"
            />
          </div>

          {/* Two-column row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 text-sm font-medium">Target Industry</Label>
              <Input
                className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm"
                value={form.industry}
                onChange={e => update('industry', e.target.value)}
                placeholder="e.g. Legal, Healthcare"
              />
            </div>
            <div>
              <Label className="text-gray-700 text-sm font-medium">Service Offering</Label>
              <Input
                className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm"
                value={form.serviceOffering}
                onChange={e => update('serviceOffering', e.target.value)}
                placeholder="e.g. Web Design, SEO"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 text-sm font-medium">Target Location</Label>
              <Input
                className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm"
                value={form.targetLocation}
                onChange={e => update('targetLocation', e.target.value)}
                placeholder="e.g. United States"
              />
            </div>
            <div>
              <Label className="text-gray-700 text-sm font-medium">Target City</Label>
              <Input
                className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm"
                value={form.targetCity}
                onChange={e => update('targetCity', e.target.value)}
                placeholder="e.g. New York"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 text-sm font-medium">Target Company Size</Label>
              <Select value={form.targetSize} onValueChange={v => update('targetSize', v)}>
                <SelectTrigger className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 text-sm">
                  <SelectValue placeholder="Any size" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200/80 shadow-lg">
                  <SelectItem value="">Any size</SelectItem>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="500+">500+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700 text-sm font-medium">Daily Limit</Label>
              <Input
                type="number"
                min={1}
                max={200}
                className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm"
                value={form.dailyLimit}
                onChange={e => update('dailyLimit', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-700 text-sm font-medium">AI Model</Label>
            <Select value={form.aiModel} onValueChange={v => update('aiModel', v)}>
              <SelectTrigger className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200/80 shadow-lg">
                {AI_MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Suggestions */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100/60 p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">AI-Powered Suggestions</span>
            </div>
            <ul className="space-y-1.5">
              {AI_SUGGESTIONS.slice(0, 3).map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-blue-800/70 leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-gray-700 text-sm font-medium">Notes</Label>
            <Textarea
              className="mt-1.5 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm min-h-[80px] resize-none"
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Additional notes about this campaign..."
            />
          </div>
        </div>

        <Separator className="bg-gray-100" />

        <div className="p-6 pt-4 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !form.name.trim()}
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 text-sm font-medium px-5"
          >
            {loading ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Creating...</>
            ) : (
              'Create Campaign'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Campaign Dialog ──────────────────────────────────────────

function EditCampaignDialog({ open, onOpenChange, campaign, onUpdated }: {
  open: boolean; onOpenChange: (o: boolean) => void; campaign: Campaign; onUpdated: () => void
}) {
  const [form, setForm] = useState<CampaignForm>({
    name: campaign.name,
    industry: campaign.industry || '',
    targetLocation: campaign.targetLocation || '',
    targetCity: campaign.targetCity || '',
    targetSize: campaign.targetSize || '',
    serviceOffering: campaign.serviceOffering || '',
    dailyLimit: String(campaign.dailyLimit),
    aiModel: campaign.aiModel,
    notes: campaign.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const update = (key: keyof CampaignForm, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleUpdate = async () => {
    if (!form.name.trim()) {
      toast.error('Campaign name is required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ...form, dailyLimit: parseInt(form.dailyLimit) || 20 }),
      })
      if (res.ok) {
        toast.success('Campaign updated')
        onUpdated()
      } else {
        toast.error('Failed to update campaign')
      }
    } catch {
      toast.error('Failed to update campaign')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200/80 max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto shadow-xl rounded-2xl p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Edit Campaign
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Update your campaign configuration and targeting
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator className="bg-gray-100 mt-4" />

        <div className="p-6 space-y-5">
          <div>
            <Label className="text-gray-700 text-sm font-medium">Campaign Name <span className="text-red-500">*</span></Label>
            <Input
              className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm"
              value={form.name}
              onChange={e => update('name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 text-sm font-medium">Target Industry</Label>
              <Input className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm" value={form.industry} onChange={e => update('industry', e.target.value)} />
            </div>
            <div>
              <Label className="text-gray-700 text-sm font-medium">Service Offering</Label>
              <Input className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm" value={form.serviceOffering} onChange={e => update('serviceOffering', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 text-sm font-medium">Target Location</Label>
              <Input className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm" value={form.targetLocation} onChange={e => update('targetLocation', e.target.value)} />
            </div>
            <div>
              <Label className="text-gray-700 text-sm font-medium">Target City</Label>
              <Input className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm" value={form.targetCity} onChange={e => update('targetCity', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 text-sm font-medium">Company Size</Label>
              <Select value={form.targetSize} onValueChange={v => update('targetSize', v)}>
                <SelectTrigger className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 text-sm">
                  <SelectValue placeholder="Any size" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200/80 shadow-lg">
                  <SelectItem value="">Any size</SelectItem>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="500+">500+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700 text-sm font-medium">Daily Limit</Label>
              <Input type="number" min={1} max={200} className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm" value={form.dailyLimit} onChange={e => update('dailyLimit', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-gray-700 text-sm font-medium">AI Model</Label>
            <Select value={form.aiModel} onValueChange={v => update('aiModel', v)}>
              <SelectTrigger className="mt-1.5 h-9 bg-white border-gray-200 text-gray-900 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white border-gray-200/80 shadow-lg">
                {AI_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* AI Suggestions */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100/60 p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">AI-Powered Suggestions</span>
            </div>
            <ul className="space-y-1.5">
              {AI_SUGGESTIONS.slice(0, 3).map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-blue-800/70 leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label className="text-gray-700 text-sm font-medium">Notes</Label>
            <Textarea className="mt-1.5 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 text-sm min-h-[80px] resize-none" value={form.notes} onChange={e => update('notes', e.target.value)} />
          </div>
        </div>

        <Separator className="bg-gray-100" />

        <div className="p-6 pt-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm">Cancel</Button>
          <Button onClick={handleUpdate} disabled={loading || !form.name.trim()} className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 text-sm font-medium px-5">
            {loading ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Saving...</>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Campaign Detail Dialog ────────────────────────────────────────

function CampaignDetailDialog({ open, onOpenChange, campaign, leads, leadsLoading, onToggleStatus, onNavigateLead }: {
  open: boolean; onOpenChange: (o: boolean) => void; campaign: Campaign
  leads: CampaignLead[]; leadsLoading: boolean
  onToggleStatus: (c: Campaign) => void
  onNavigateLead: (leadId: string) => void
}) {
  const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.ACTIVE
  const replyRate = campaign.sentCount > 0 ? ((campaign.replyCount / campaign.sentCount) * 100).toFixed(1) : '0.0'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200/80 max-w-2xl w-[95vw] sm:w-full max-h-[85vh] flex flex-col shadow-xl rounded-2xl p-0">
        {/* Header */}
        <div className="p-6 pb-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold text-gray-900 leading-snug">
                  {campaign.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  Campaign details and lead performance
                </DialogDescription>
              </div>
              <Badge
                variant="outline"
                className={cn('text-xs font-medium h-6 px-2.5 rounded-full border shrink-0', statusCfg.color)}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', statusCfg.dot)} />
                {statusCfg.label}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <Separator className="bg-gray-100" />

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-4 space-y-5">
            {/* Campaign Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Industry', value: campaign.industry },
                { label: 'Location', value: campaign.targetCity ? `${campaign.targetCity}${campaign.targetLocation ? `, ${campaign.targetLocation}` : ''}` : campaign.targetLocation || null },
                { label: 'Daily Limit', value: String(campaign.dailyLimit) },
                { label: 'Service', value: campaign.serviceOffering },
                { label: 'AI Model', value: AI_MODELS.find(m => m.value === campaign.aiModel)?.label || campaign.aiModel },
                { label: 'Reply Rate', value: `${replyRate}%`, highlight: true },
              ].filter(m => m.value).map((meta) => (
                <div key={meta.label} className="bg-gray-50/80 rounded-lg p-3">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-0.5">{meta.label}</p>
                  <p className={cn(
                    'text-sm font-medium',
                    meta.highlight ? 'text-emerald-600' : 'text-gray-900',
                  )}>{meta.value}</p>
                </div>
              ))}
            </div>

            {campaign.notes && (
              <div className="bg-gray-50/80 rounded-lg p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1.5">Notes</p>
                <p className="text-sm text-gray-600 leading-relaxed">{campaign.notes}</p>
              </div>
            )}

            {/* Outreach Stats */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Outreach Performance
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {STAT_ITEMS.map(s => (
                  <div key={s.key} className={cn('rounded-xl p-3 text-center border border-gray-100', s.accent)}>
                    <s.icon className={cn('w-4 h-4 mx-auto mb-1.5', s.color)} />
                    <p className="text-lg font-bold text-gray-900">{campaign[s.key]}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            {campaign.status !== 'COMPLETED' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm"
                  onClick={() => onToggleStatus(campaign)}
                >
                  {campaign.status === 'ACTIVE' ? (
                    <><Pause className="w-3.5 h-3.5 mr-1.5" />Pause Campaign</>
                  ) : (
                    <><Play className="w-3.5 h-3.5 mr-1.5" />Resume Campaign</>
                  )}
                </Button>
              </div>
            )}

            <Separator className="bg-gray-100" />

            {/* Campaign Leads */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Campaign Leads ({leads.length})
              </h4>
              {leadsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full bg-gray-50 rounded-lg" />
                  ))}
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No leads in this campaign yet.</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {leads.map(lead => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group border border-transparent hover:border-gray-100"
                      onClick={() => { onNavigateLead(lead.id); onOpenChange(false) }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{lead.business.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                          {lead.business.industry && <span>{lead.business.industry}</span>}
                          {lead.business.city && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span>{lead.business.city}</span>
                            </>
                          )}
                          {lead.decisionMaker && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span>{lead.decisionMaker}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-medium text-gray-600">{lead.stage.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] text-gray-400">{lead._count.outreaches} email{lead._count.outreaches !== 1 ? 's' : ''}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}