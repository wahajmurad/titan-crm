'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus, Search, Users, Send, Reply, Calendar, Trophy, Pause, Play,
  MoreHorizontal, Eye, Pencil, UsersRound, ArrowRight, Target,
  Zap, TrendingUp, Mail, ChevronDown, FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────

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

// ─── Config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
  PAUSED: { label: 'Paused', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', color: 'bg-slate-500/15 text-slate-400 border-slate-500/25', dot: 'bg-slate-400' },
}

const STAT_ITEMS = [
  { key: 'leadCount' as const, label: 'Leads', icon: Users, color: 'text-blue-400' },
  { key: 'sentCount' as const, label: 'Sent', icon: Send, color: 'text-violet-400' },
  { key: 'replyCount' as const, label: 'Replies', icon: Reply, color: 'text-amber-400' },
  { key: 'meetingCount' as const, label: 'Meetings', icon: Calendar, color: 'text-cyan-400' },
  { key: 'wonCount' as const, label: 'Won', icon: Trophy, color: 'text-emerald-400' },
]

const AI_MODELS = [
  { value: 'default', label: 'Default' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
]

// ─── Main Component ──────────────────────────────────────────────────

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

  const [campaignLeads, setCampaignLeads] = useState<CampaignLead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)

  const fetchCampaignLeads = (campaignId: string) => {
    setLeadsLoading(true)
    fetch(`/api/campaigns/${campaignId}/leads`, { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => setCampaignLeads(d.leads || []))
      .catch(() => setCampaignLeads([]))
      .finally(() => setLeadsLoading(false))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-400" />
            Campaigns
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} campaign{filtered.length !== 1 ? 's' : ''} in pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 w-52 h-8 text-sm bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30"
            />
          </div>
          <CreateCampaignDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refresh} />
        </div>
      </div>

      {/* Aggregate Stats Row */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAT_ITEMS.map(s => (
            <Card key={s.key} className="bg-slate-900 border-slate-800">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn('p-2 rounded-lg bg-slate-800/60', s.color)}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-lg font-semibold text-white">{totals[s.key]}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status Tabs */}
      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="ALL" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 text-xs">
            All
            <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-[10px] bg-slate-800 text-slate-400">
              {campaigns.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ACTIVE" className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-slate-400 text-xs">
            Active
            <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-[10px] bg-slate-800 text-slate-400">
              {campaigns.filter(c => c.status === 'ACTIVE').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="PAUSED" className="data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 text-slate-400 text-xs">
            Paused
            <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-[10px] bg-slate-800 text-slate-400">
              {campaigns.filter(c => c.status === 'PAUSED').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="COMPLETED" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-300 text-slate-400 text-xs">
            Completed
            <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-[10px] bg-slate-800 text-slate-400">
              {campaigns.filter(c => c.status === 'COMPLETED').length}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Campaign List */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-48 bg-slate-800" />
                    <Skeleton className="h-3 w-32 bg-slate-800" />
                  </div>
                  <Skeleton className="h-8 w-24 bg-slate-800" />
                </div>
                <div className="flex gap-4 mt-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-10 flex-1 bg-slate-800" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 border-dashed">
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No campaigns found</p>
            <p className="text-sm text-slate-500 mt-1">Create your first campaign to start outbound outreach at scale.</p>
            <Button
              variant="outline"
              className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />New Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(campaign => {
            const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.ACTIVE
            const replyRate = campaign.sentCount > 0 ? ((campaign.replyCount / campaign.sentCount) * 100).toFixed(1) : '0.0'

            return (
              <Card
                key={campaign.id}
                className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
                onClick={() => openDetail(campaign)}
              >
                <CardContent className="p-5">
                  {/* Row 1: Name + Status + Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-semibold text-white truncate">{campaign.name}</h3>
                        <Badge variant="outline" className={cn('text-[10px] font-medium shrink-0', statusCfg.color)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', statusCfg.dot)} />
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        {campaign.industry && <span>{campaign.industry}</span>}
                        {campaign.targetCity && (
                          <>
                            <span className="text-slate-700">•</span>
                            <span>{campaign.targetCity}</span>
                          </>
                        )}
                        {campaign.serviceOffering && (
                          <>
                            <span className="text-slate-700">•</span>
                            <span className="text-slate-400">{campaign.serviceOffering}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Pause/Resume button */}
                      {campaign.status !== 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(campaign) }}
                          title={campaign.status === 'ACTIVE' ? 'Pause campaign' : 'Resume campaign'}
                        >
                          {campaign.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </Button>
                      )}

                      {/* Dropdown actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                          <DropdownMenuItem onClick={() => openDetail(campaign)} className="text-slate-300 focus:bg-slate-800 focus:text-white">
                            <Eye className="w-3.5 h-3.5 mr-2" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => openEdit(campaign, e)}
                            className="text-slate-300 focus:bg-slate-800 focus:text-white"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setView('leads') }}
                            className="text-slate-300 focus:bg-slate-800 focus:text-white"
                          >
                            <UsersRound className="w-3.5 h-3.5 mr-2" />View Leads
                          </DropdownMenuItem>
                          {campaign.status !== 'COMPLETED' && (
                            <>
                              <DropdownMenuSeparator className="bg-slate-800" />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(campaign) }}
                                className="text-slate-300 focus:bg-slate-800 focus:text-white"
                              >
                                {campaign.status === 'ACTIVE' ? (
                                  <><Pause className="w-3.5 h-3.5 mr-2" />Pause</>
                                ) : (
                                  <><Play className="w-3.5 h-3.5 mr-2" />Resume</>
                                )}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>

                  {/* Row 2: Stats */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800/60">
                    {STAT_ITEMS.map(s => (
                      <div key={s.key} className="flex items-center gap-1.5">
                        <s.icon className={cn('w-3 h-3', s.color)} />
                        <span className="text-xs text-slate-400">{campaign[s.key]}</span>
                      </div>
                    ))}
                    <div className="ml-auto flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">{replyRate}% reply rate</span>
                    </div>
                  </div>

                  {/* Row 3: Footer */}
                  <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-600">
                    <span>Created {format(new Date(campaign.createdAt), 'MMM d, yyyy')}</span>
                    <span>Daily limit: {campaign.dailyLimit}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Campaign Dialog */}
      {selectedCampaign && (
        <EditCampaignDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          campaign={selectedCampaign}
          onUpdated={() => { refresh(); setEditOpen(false) }}
        />
      )}

      {/* Campaign Detail Dialog */}
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

// ─── Create Campaign Dialog ──────────────────────────────────────────

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
        <Button size="sm" className="h-8 bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="w-3.5 h-3.5 mr-1.5" />New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Name */}
          <div>
            <Label className="text-slate-300 text-xs font-medium">Campaign Name *</Label>
            <Input
              className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. NYC Law Firms Q4 Outreach"
            />
          </div>

          {/* Industry + Service Offering */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs font-medium">Target Industry</Label>
              <Input
                className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30"
                value={form.industry}
                onChange={e => update('industry', e.target.value)}
                placeholder="e.g. Legal, Healthcare"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs font-medium">Service Offering</Label>
              <Input
                className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30"
                value={form.serviceOffering}
                onChange={e => update('serviceOffering', e.target.value)}
                placeholder="e.g. Web Design, SEO"
              />
            </div>
          </div>

          {/* Location + City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs font-medium">Target Location</Label>
              <Input
                className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30"
                value={form.targetLocation}
                onChange={e => update('targetLocation', e.target.value)}
                placeholder="e.g. United States"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs font-medium">Target City</Label>
              <Input
                className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30"
                value={form.targetCity}
                onChange={e => update('targetCity', e.target.value)}
                placeholder="e.g. New York"
              />
            </div>
          </div>

          {/* Target Size + Daily Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs font-medium">Target Company Size</Label>
              <Select value={form.targetSize} onValueChange={v => update('targetSize', v)}>
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Any size" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
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
              <Label className="text-slate-300 text-xs font-medium">Daily Limit</Label>
              <Input
                type="number"
                min={1}
                max={200}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30"
                value={form.dailyLimit}
                onChange={e => update('dailyLimit', e.target.value)}
              />
            </div>
          </div>

          {/* AI Model */}
          <div>
            <Label className="text-slate-300 text-xs font-medium">AI Model</Label>
            <Select value={form.aiModel} onValueChange={v => update('aiModel', v)}>
              <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {AI_MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-slate-300 text-xs font-medium">Notes</Label>
            <Textarea
              className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30 min-h-[80px]"
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Additional notes about this campaign..."
            />
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !form.name.trim()}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Campaign Dialog ────────────────────────────────────────────

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
      <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-slate-300 text-xs font-medium">Campaign Name *</Label>
            <Input
              className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30"
              value={form.name}
              onChange={e => update('name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs font-medium">Target Industry</Label>
              <Input className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30" value={form.industry} onChange={e => update('industry', e.target.value)} />
            </div>
            <div>
              <Label className="text-slate-300 text-xs font-medium">Service Offering</Label>
              <Input className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30" value={form.serviceOffering} onChange={e => update('serviceOffering', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs font-medium">Target Location</Label>
              <Input className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30" value={form.targetLocation} onChange={e => update('targetLocation', e.target.value)} />
            </div>
            <div>
              <Label className="text-slate-300 text-xs font-medium">Target City</Label>
              <Input className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30" value={form.targetCity} onChange={e => update('targetCity', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs font-medium">Company Size</Label>
              <Select value={form.targetSize} onValueChange={v => update('targetSize', v)}>
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Any size" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="">Any size</SelectItem>
                  <SelectItem value="1-10">1-10</SelectItem>
                  <SelectItem value="11-50">11-50</SelectItem>
                  <SelectItem value="51-200">51-200</SelectItem>
                  <SelectItem value="201-500">201-500</SelectItem>
                  <SelectItem value="500+">500+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs font-medium">Daily Limit</Label>
              <Input type="number" min={1} max={200} className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30" value={form.dailyLimit} onChange={e => update('dailyLimit', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-slate-300 text-xs font-medium">AI Model</Label>
            <Select value={form.aiModel} onValueChange={v => update('aiModel', v)}>
              <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {AI_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-300 text-xs font-medium">Notes</Label>
            <Textarea className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/30 min-h-[80px]" value={form.notes} onChange={e => update('notes', e.target.value)} />
          </div>
        </div>
        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
          <Button onClick={handleUpdate} disabled={loading || !form.name.trim()} className="bg-violet-600 hover:bg-violet-700 text-white">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Campaign Detail Dialog ──────────────────────────────────────────

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
      <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-lg">{campaign.name}</DialogTitle>
            <Badge variant="outline" className={cn('text-xs font-medium', statusCfg.color)}>
              <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', statusCfg.dot)} />
              {statusCfg.label}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* Campaign Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            {campaign.industry && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Industry</p>
                <p className="text-sm text-white">{campaign.industry}</p>
              </div>
            )}
            {campaign.targetCity && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Location</p>
                <p className="text-sm text-white">{campaign.targetCity}{campaign.targetLocation ? `, ${campaign.targetLocation}` : ''}</p>
              </div>
            )}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Daily Limit</p>
              <p className="text-sm text-white">{campaign.dailyLimit}</p>
            </div>
            {campaign.serviceOffering && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Service</p>
                <p className="text-sm text-white">{campaign.serviceOffering}</p>
              </div>
            )}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">AI Model</p>
              <p className="text-sm text-white">{AI_MODELS.find(m => m.value === campaign.aiModel)?.label || campaign.aiModel}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Reply Rate</p>
              <p className="text-sm text-emerald-400 font-medium">{replyRate}%</p>
            </div>
          </div>

          {campaign.notes && (
            <div className="bg-slate-800/30 rounded-lg p-3 mb-5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-300">{campaign.notes}</p>
            </div>
          )}

          {/* Outreach Stats */}
          <div className="mb-5">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Outreach Performance</h4>
            <div className="grid grid-cols-5 gap-2">
              {STAT_ITEMS.map(s => (
                <div key={s.key} className="bg-slate-800/40 rounded-lg p-3 text-center">
                  <s.icon className={cn('w-4 h-4 mx-auto mb-1.5', s.color)} />
                  <p className="text-lg font-bold text-white">{campaign[s.key]}</p>
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          {campaign.status !== 'COMPLETED' && (
            <div className="flex gap-2 mb-5">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'border-slate-700 text-slate-300 hover:bg-slate-800',
                  campaign.status === 'ACTIVE' && 'hover:text-amber-400'
                )}
                onClick={() => onToggleStatus(campaign)}
              >
                {campaign.status === 'ACTIVE' ? <><Pause className="w-3.5 h-3.5 mr-1.5" />Pause</> : <><Play className="w-3.5 h-3.5 mr-1.5" />Resume</>}
              </Button>
            </div>
          )}

          <Separator className="bg-slate-800 mb-5" />

          {/* Campaign Leads */}
          <div>
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Campaign Leads ({leads.length})
            </h4>
            {leadsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-slate-800" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No leads in this campaign yet.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {leads.map(lead => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800 cursor-pointer transition-colors group"
                    onClick={() => { onNavigateLead(lead.id); onOpenChange(false) }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{lead.business.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        {lead.business.industry && <span>{lead.business.industry}</span>}
                        {lead.business.city && (
                          <>
                            <span className="text-slate-700">•</span>
                            <span>{lead.business.city}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">{lead.stage.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-slate-600">{lead._count.outreaches} emails</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}