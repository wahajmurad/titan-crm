'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Mail, MailOpen, ThumbsUp, Calendar, DollarSign, Clock,
  Send, Trophy, XCircle, ArrowRight,
  Inbox as InboxIcon, Sparkles, MessageSquare, User, Building2,
  ExternalLink, CalendarClock, CircleDot, Search, ArrowLeft,
  Copy, Check, TrendingUp, Target, Globe, Brain, Zap,
  ChevronRight, AlertCircle, Reply, Forward, Flag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────

type InboxItemType = 'REPLY' | 'POSITIVE' | 'MEETING_REQUEST' | 'PRICING' | 'OOO' | 'OTHER'

interface InboxItem {
  id: string
  type: InboxItemType
  sender: string | null
  senderEmail: string | null
  subject: string
  preview: string
  body: string
  receivedAt: string
  isRead: boolean
  outreachId: string
  lead: {
    id: string
    stage: string
    temperature: string
    decisionMaker: string | null
    decisionMakerRole: string | null
    decisionMakerEmail: string | null
    business: {
      id: string
      name: string
      industry: string | null
      city: string | null
      country: string | null
      website: string | null
      email: string | null
    }
  }
}

// ─── Config ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<InboxItemType, {
  label: string; color: string; bg: string; borderColor: string; icon: React.ElementType
}> = {
  REPLY: {
    label: 'Reply', color: 'text-blue-600', bg: 'bg-blue-50',
    borderColor: 'border-blue-500', icon: MessageSquare,
  },
  POSITIVE: {
    label: 'Positive', color: 'text-emerald-600', bg: 'bg-emerald-50',
    borderColor: 'border-emerald-500', icon: ThumbsUp,
  },
  MEETING_REQUEST: {
    label: 'Meeting', color: 'text-purple-600', bg: 'bg-purple-50',
    borderColor: 'border-purple-500', icon: Calendar,
  },
  PRICING: {
    label: 'Pricing', color: 'text-amber-600', bg: 'bg-amber-50',
    borderColor: 'border-amber-500', icon: DollarSign,
  },
  OOO: {
    label: 'Out of Office', color: 'text-gray-500', bg: 'bg-gray-50',
    borderColor: 'border-gray-400', icon: Clock,
  },
  OTHER: {
    label: 'Other', color: 'text-gray-500', bg: 'bg-gray-50',
    borderColor: 'border-gray-400', icon: Mail,
  },
}

const AVATAR_COLORS: Record<InboxItemType, string> = {
  REPLY: 'bg-blue-500 text-white',
  POSITIVE: 'bg-emerald-500 text-white',
  MEETING_REQUEST: 'bg-purple-500 text-white',
  PRICING: 'bg-amber-500 text-white',
  OOO: 'bg-gray-400 text-white',
  OTHER: 'bg-gray-400 text-white',
}

const FILTER_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'REPLY', label: 'Replies' },
  { value: 'POSITIVE', label: 'Positive' },
  { value: 'MEETING_REQUEST', label: 'Meetings' },
  { value: 'PRICING', label: 'Pricing' },
]

const AI_REPLY_SUGGESTIONS = [
  "Thank them and propose a demo call this week",
  "Send pricing details with a custom proposal",
  "Share a relevant case study and ask for next steps",
  "Ask about their current pain points and timeline",
  "Suggest a follow-up meeting with their team",
]

const BUYING_SIGNALS = [
  'Asked about implementation timeline',
  'Requested pricing information',
  'Mentioned budget approval',
  'Shared success criteria',
  'Inquired about integrations',
]

// ─── Helper Functions ────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getLeadScore(item: InboxItem): number {
  if (item.type === 'POSITIVE') return 92
  if (item.type === 'MEETING_REQUEST') return 85
  if (item.type === 'PRICING') return 78
  if (item.type === 'REPLY') return 65
  return 40
}

function getWebsiteAuditScore(item: InboxItem): number {
  const scores: Record<string, number> = {
    REPLY: 72, POSITIVE: 81, MEETING_REQUEST: 68, PRICING: 75, OOO: 55, OTHER: 60,
  }
  return scores[item.type] || 60
}

function getCompanySummary(item: InboxItem): string {
  const biz = item.lead.business
  const parts = [biz.name]
  if (biz.industry) parts.push(`a ${biz.industry} company`)
  if (biz.city) parts.push(`based in ${biz.city}`)
  if (biz.country) parts.push(`${biz.country}`)
  return `${parts.join(', ')}. ${biz.website ? `Their web presence can be reviewed at ${biz.website}.` : ''}`
}

function getNextAction(item: InboxItem): string {
  switch (item.type) {
    case 'POSITIVE':
      return 'Respond within 2 hours. Propose a discovery call to capitalize on interest.'
    case 'MEETING_REQUEST':
      return 'Confirm meeting time immediately. Prepare a tailored demo and success stories.'
    case 'PRICING':
      return 'Send customized pricing within 24 hours. Include ROI analysis for their industry.'
    case 'REPLY':
      return 'Acknowledge their response. Ask a qualifying question to gauge purchase intent.'
    case 'OOO':
      return 'Schedule a follow-up for when they return. Set a reminder for their expected return date.'
    default:
      return 'Review and categorize this conversation. Determine appropriate next step.'
  }
}

function getRandomSignals(count: number): string[] {
  const shuffled = [...BUYING_SIGNALS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// ─── Main Component ──────────────────────────────────────────────────

export function InboxView() {
  const { setView } = useAppStore()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [copiedSuggestion, setCopiedSuggestion] = useState(false)

  // Quick action dialogs
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null)

  useEffect(() => {
    fetch('/api/inbox', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => toast.error('Failed to load inbox'))
      .finally(() => setLoading(false))
  }, [refreshKey])
  const refresh = () => setRefreshKey(k => k + 1)

  // Filter and search items
  const filtered = useMemo(() => {
    let result = activeTab === 'ALL' ? items : items.filter(i => i.type === activeTab)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(i =>
        (i.sender || '').toLowerCase().includes(q) ||
        (i.subject || '').toLowerCase().includes(q) ||
        (i.preview || '').toLowerCase().includes(q) ||
        i.lead.business.name.toLowerCase().includes(q)
      )
    }
    return result
  }, [items, activeTab, searchQuery])

  // Count by type
  const counts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {})
  }, [items])

  // Unread count
  const unreadCount = useMemo(() => items.filter(i => !i.isRead).length, [items])

  // Selected item
  const selectedItemDetail = selectedId ? items.find(i => i.id === selectedId) : null

  // Derived AI data for selected item (memoized per selection)
  const aiData = useMemo(() => {
    if (!selectedItemDetail) return null
    return {
      leadScore: getLeadScore(selectedItemDetail),
      websiteScore: getWebsiteAuditScore(selectedItemDetail),
      companySummary: getCompanySummary(selectedItemDetail),
      nextAction: getNextAction(selectedItemDetail),
      buyingSignals: getRandomSignals(3),
      suggestedReply: generateSuggestedReply(selectedItemDetail),
    }
  }, [selectedItemDetail])

  const selectEmail = (id: string) => {
    setSelectedId(id)
    setMobileShowDetail(true)
    // Mark as read locally
    setItems(prev => prev.map(item =>
      item.id === id && !item.isRead ? { ...item, isRead: true } : item
    ))
  }

  const goBackToList = () => {
    setMobileShowDetail(false)
  }

  // Quick actions
  const handleMarkWon = async (item: InboxItem) => {
    try {
      const res = await fetch(`/api/leads/${item.lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ stage: 'WON' }),
      })
      if (res.ok) {
        toast.success(`Marked ${item.lead.business.name} as Won!`)
        refresh()
      }
    } catch {
      toast.error('Failed to update lead')
    }
  }

  const handleMarkLost = async (item: InboxItem) => {
    try {
      const res = await fetch(`/api/leads/${item.lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ stage: 'LOST' }),
      })
      if (res.ok) {
        toast.success(`Moved ${item.lead.business.name} to Lost`)
        refresh()
      }
    } catch {
      toast.error('Failed to update lead')
    }
  }

  const openReplyDialog = (item: InboxItem) => {
    setSelectedItem(item)
    setReplyDialogOpen(true)
  }

  const openMeetingDialog = (item: InboxItem) => {
    setSelectedItem(item)
    setMeetingDialogOpen(true)
  }

  const copySuggestion = () => {
    if (aiData?.suggestedReply) {
      navigator.clipboard.writeText(aiData.suggestedReply)
      setCopiedSuggestion(true)
      toast.success('Reply suggestion copied to clipboard')
      setTimeout(() => setCopiedSuggestion(false), 2000)
    }
  }

  const applySuggestion = (text: string) => {
    setSelectedItem(selectedItemDetail!)
    setReplyDialogOpen(true)
    // The suggestion will be used when the dialog opens
    setTimeout(() => {
      const textarea = document.querySelector('textarea[data-reply-textarea]') as HTMLTextAreaElement
      if (textarea) {
        textarea.value = text
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }, 100)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full bg-white">
        {/* ─── Top Bar ─── */}
        <div className="border-b border-gray-200 bg-white px-4 sm:px-6 pt-4 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <InboxIcon className="w-5 h-5 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900">Inbox</h1>
                {unreadCount > 0 && (
                  <Badge className="bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-xs shrink-0"
                onClick={() => { setSelectedId(null); refresh() }}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-gray-100/80 h-9 p-1 gap-0.5">
              {FILTER_TABS.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500 text-xs px-3 rounded-md transition-all"
                >
                  {tab.label}
                  {tab.value !== 'ALL' && (counts[tab.value] || 0) > 0 && (
                    <span className="ml-1.5 text-[10px] text-gray-400 data-[state=active]:text-blue-600">
                      {counts[tab.value]}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* ─── Split Panel Layout ─── */}
        <div className="flex-1 flex overflow-hidden">
          {/* ─── Left Panel: Email List ─── */}
          <div
            className={cn(
              'w-full md:w-[380px] md:min-w-[380px] md:max-w-[380px] border-r border-gray-200 flex flex-col bg-white',
              mobileShowDetail ? 'hidden md:flex' : 'flex'
            )}
          >
            {loading ? (
              <div className="flex-1 p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <Skeleton className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 bg-gray-100" />
                      <Skeleton className="h-3 w-full bg-gray-100" />
                      <Skeleton className="h-3 w-2/3 bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[220px] mx-auto">
                    Replies to your outreach will appear here
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="divide-y divide-gray-100">
                  {filtered.map(item => {
                    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.OTHER
                    const isSelected = selectedId === item.id

                    return (
                      <button
                        key={item.id}
                        onClick={() => selectEmail(item.id)}
                        className={cn(
                          'w-full text-left px-4 py-3.5 transition-colors border-l-[3px] flex items-start gap-3 group',
                          isSelected
                            ? 'bg-blue-50/70 border-l-blue-600'
                            : 'border-l-transparent hover:bg-gray-50'
                        )}
                      >
                        {/* Avatar */}
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                          AVATAR_COLORS[item.type] || AVATAR_COLORS.OTHER
                        )}>
                          {getInitials(item.sender)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className={cn(
                              'text-sm truncate',
                              item.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'
                            )}>
                              {item.sender || 'Unknown'}
                            </span>
                            <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                              {formatDistanceToNow(new Date(item.receivedAt), { addSuffix: false })}
                            </span>
                          </div>
                          <p className={cn(
                            'text-sm truncate',
                            item.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
                          )}>
                            {item.subject || '(No Subject)'}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {item.preview || item.body.slice(0, 100)}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] font-medium px-1.5 py-0 h-4 rounded-full border-0',
                                cfg.bg, cfg.color
                              )}
                            >
                              {cfg.label}
                            </Badge>
                            <span className="text-[11px] text-gray-400">
                              {item.lead.business.name}
                            </span>
                          </div>
                        </div>

                        {/* Unread dot */}
                        {!item.isRead && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* ─── Right Panel: Email Detail ─── */}
          <div
            className={cn(
              'flex-1 flex flex-col bg-gray-50/50 overflow-hidden',
              !mobileShowDetail ? 'hidden md:flex' : 'flex'
            )}
          >
            {loading ? (
              <div className="flex-1 p-6 space-y-4">
                <Skeleton className="h-6 w-64 bg-gray-200 rounded" />
                <Skeleton className="h-4 w-40 bg-gray-200 rounded" />
                <Skeleton className="h-48 w-full bg-gray-200 rounded-lg" />
                <Skeleton className="h-64 w-full bg-gray-200 rounded-lg" />
              </div>
            ) : !selectedItemDetail ? (
              /* ─── Empty State ─── */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <Mail className="w-9 h-9 text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Choose a message from the inbox to view its content and AI-powered insights.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-5 text-xs text-gray-400">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>AI insights appear alongside each conversation</span>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── Email Detail View ─── */
              <ScrollArea className="flex-1">
                <div className="p-4 sm:p-6 space-y-5">
                  {/* Mobile Back Button */}
                  <button
                    onClick={goBackToList}
                    className="md:hidden flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700 mb-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to inbox
                  </button>

                  {/* ─── Email Header ─── */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn(
                          'w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
                          AVATAR_COLORS[selectedItemDetail.type] || AVATAR_COLORS.OTHER
                        )}>
                          {getInitials(selectedItemDetail.sender)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-semibold text-gray-900 truncate">
                              {selectedItemDetail.subject || '(No Subject)'}
                            </h2>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] font-medium px-2 py-0 h-5 rounded-full border-0 shrink-0',
                                (TYPE_CONFIG[selectedItemDetail.type] || TYPE_CONFIG.OTHER).bg,
                                (TYPE_CONFIG[selectedItemDetail.type] || TYPE_CONFIG.OTHER).color
                              )}
                            >
                              {(TYPE_CONFIG[selectedItemDetail.type] || TYPE_CONFIG.OTHER).label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                            <span className="font-medium text-gray-700">{selectedItemDetail.sender || 'Unknown Sender'}</span>
                            {selectedItemDetail.senderEmail && (
                              <>
                                <span>&lt;{selectedItemDetail.senderEmail}&gt;</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {selectedItemDetail.lead.business.name}
                            </span>
                            <span>
                              {format(new Date(selectedItemDetail.receivedAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ─── AI Intelligence Panel ─── */}
                  {aiData && (
                    <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30 overflow-hidden">
                      <CardHeader className="pb-3 pt-4 px-5">
                        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Brain className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          AI Intelligence
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 pb-5 space-y-4">
                        {/* Scores Row */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Lead Score */}
                          <div className="bg-white rounded-lg border border-gray-100 p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Target className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Lead Score</span>
                            </div>
                            <div className="flex items-end gap-1.5">
                              <span className={cn(
                                'text-2xl font-bold',
                                aiData.leadScore >= 80 ? 'text-emerald-600' : aiData.leadScore >= 60 ? 'text-blue-600' : 'text-gray-600'
                              )}>
                                {aiData.leadScore}
                              </span>
                              <span className="text-xs text-gray-400 mb-1">/100</span>
                            </div>
                            <Progress
                              value={aiData.leadScore}
                              className="h-1.5 mt-2 bg-gray-100"
                            />
                          </div>

                          {/* Website Audit */}
                          <div className="bg-white rounded-lg border border-gray-100 p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Globe className="w-3.5 h-3.5 text-purple-500" />
                              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Website Audit</span>
                            </div>
                            <div className="flex items-end gap-1.5">
                              <span className={cn(
                                'text-2xl font-bold',
                                aiData.websiteScore >= 75 ? 'text-emerald-600' : aiData.websiteScore >= 60 ? 'text-amber-600' : 'text-gray-600'
                              )}>
                                {aiData.websiteScore}
                              </span>
                              <span className="text-xs text-gray-400 mb-1">/100</span>
                            </div>
                            <Progress
                              value={aiData.websiteScore}
                              className="h-1.5 mt-2 bg-gray-100"
                            />
                          </div>
                        </div>

                        {/* Company Summary */}
                        <div className="bg-white rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Company Summary</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{aiData.companySummary}</p>
                        </div>

                        {/* Buying Signals */}
                        <div className="bg-white rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Buying Signals Detected</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {aiData.buyingSignals.map((signal, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-[10px] font-medium border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full"
                              >
                                <Zap className="w-2.5 h-2.5 mr-1" />
                                {signal}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Recommended Next Action */}
                        <div className="bg-blue-50/80 rounded-lg border border-blue-100 p-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">Recommended Next Action</span>
                          </div>
                          <p className="text-xs text-blue-800 leading-relaxed">{aiData.nextAction}</p>
                        </div>

                        {/* AI Suggested Reply */}
                        <div className="bg-white rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">AI Suggested Reply</span>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                  onClick={copySuggestion}
                                >
                                  {copiedSuggestion ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {copiedSuggestion ? 'Copied!' : 'Copy to clipboard'}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-600 leading-relaxed italic">
                              &ldquo;{aiData.suggestedReply}&rdquo;
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => openReplyDialog(selectedItemDetail)}
                          >
                            <Send className="w-3 h-3 mr-1.5" />
                            Use this suggestion
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* ─── Email Body ─── */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MailOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Message</span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                        {selectedItemDetail.body}
                      </div>
                    </div>
                  </div>

                  {/* ─── AI Reply Suggestion Chips ─── */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quick Reply Suggestions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {AI_REPLY_SUGGESTIONS.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => applySuggestion(suggestion)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full hover:bg-blue-100 hover:border-blue-200 transition-colors"
                        >
                          <Reply className="w-3 h-3" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ─── Action Bar ─── */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4"
                        onClick={() => openReplyDialog(selectedItemDetail)}
                      >
                        <Reply className="w-3.5 h-3.5 mr-1.5" />
                        Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 text-xs font-medium px-4"
                        onClick={() => handleMarkWon(selectedItemDetail)}
                      >
                        <Flag className="w-3.5 h-3.5 mr-1.5" />
                        Mark Positive
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 text-xs font-medium px-4"
                        onClick={() => openMeetingDialog(selectedItemDetail)}
                      >
                        <CalendarClock className="w-3.5 h-3.5 mr-1.5" />
                        Schedule Meeting
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-xs font-medium px-4"
                        onClick={() => {
                          setView('lead-detail', selectedItemDetail.lead.id)
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        View in CRM
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 text-red-500 hover:bg-red-50 hover:text-red-600 text-xs font-medium px-4"
                        onClick={() => handleMarkLost(selectedItemDetail)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Mark Lost
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* ─── Dialogs ─── */}
        {selectedItem && (
          <ReplyDialog
            open={replyDialogOpen}
            onOpenChange={setReplyDialogOpen}
            item={selectedItem}
            onSent={() => { refresh(); setReplyDialogOpen(false) }}
          />
        )}

        {selectedItem && (
          <ScheduleMeetingDialog
            open={meetingDialogOpen}
            onOpenChange={setMeetingDialogOpen}
            item={selectedItem}
            onScheduled={() => { refresh(); setMeetingDialogOpen(false) }}
          />
        )}
      </div>
    </TooltipProvider>
  )
}

// ─── Generate Suggested Reply ────────────────────────────────────────

function generateSuggestedReply(item: InboxItem): string {
  const name = item.sender || item.lead.decisionMaker || 'there'
  const company = item.lead.business.name

  switch (item.type) {
    case 'POSITIVE':
      return `Hi ${name}, Thank you for the positive response! I'm thrilled to hear that ${company} is interested in our solution. I'd love to schedule a brief demo to show you exactly how we can help. Would you have 30 minutes this week or next to connect?`
    case 'MEETING_REQUEST':
      return `Hi ${name}, Absolutely — I'd be happy to set up a meeting. I have availability on Tuesday or Thursday afternoon. Please let me know what works best for you and I'll send over a calendar invite with a Zoom link.`
    case 'PRICING':
      return `Hi ${name}, Great question about pricing. I'd like to understand your specific needs at ${company} so I can put together the most relevant proposal. Could we hop on a quick 15-minute call to discuss your requirements? I'll prepare a customized quote.`
    case 'REPLY':
      return `Hi ${name}, Thanks for getting back to me! I appreciate you taking the time to respond. Based on what you've shared, I think there could be a great fit here. What's the best next step from your perspective?`
    case 'OOO':
      return `Hi ${name}, No worries at all — hope you're enjoying your time away. I'll follow up when you're back in the office. In the meantime, feel free to reach out whenever it's convenient.`
    default:
      return `Hi ${name}, Thanks for your message. I'd love to learn more about how we can help ${company} achieve its goals. Let me know a good time to connect.`
  }
}

// ─── Reply Dialog ────────────────────────────────────────────────────

function ReplyDialog({ open, onOpenChange, item, onSent }: {
  open: boolean; onOpenChange: (o: boolean) => void; item: InboxItem; onSent: () => void
}) {
  const [subject, setSubject] = useState(`Re: ${item.subject}`)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!body.trim()) {
      toast.error('Reply body is required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          leadId: item.lead.id,
          subject,
          body,
          type: 'REPLY',
          status: 'SENT',
        }),
      })
      if (res.ok) {
        toast.success('Reply sent successfully')
        onSent()
      } else {
        toast.error('Failed to send reply')
      }
    } catch {
      toast.error('Failed to send reply')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 max-w-lg w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Reply to {item.lead.business.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-medium">Original Message</p>
            <p className="text-xs text-gray-500 line-clamp-3">{item.body.slice(0, 200)}...</p>
          </div>
          <div>
            <Label className="text-gray-600 text-xs font-medium">Subject</Label>
            <Input
              className="mt-1.5 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-300"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-gray-600 text-xs font-medium">Reply *</Label>
            <Textarea
              data-reply-textarea
              className="mt-1.5 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-300 min-h-[120px]"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your reply..."
            />
          </div>
        </div>
        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || !body.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Sending...' : <><Send className="w-3.5 h-3.5 mr-1.5" />Send Reply</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Schedule Meeting Dialog ─────────────────────────────────────────

function ScheduleMeetingDialog({ open, onOpenChange, item, onScheduled }: {
  open: boolean; onOpenChange: (o: boolean) => void; item: InboxItem; onScheduled: () => void
}) {
  const [title, setTitle] = useState(`Meeting with ${item.lead.business.name}`)
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState('30')
  const [description, setDescription] = useState(`Scheduled from inbox: ${item.subject}`)
  const [loading, setLoading] = useState(false)

  const handleSchedule = async () => {
    if (!date) {
      toast.error('Please select a date and time')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          leadId: item.lead.id,
          title,
          date: new Date(date).toISOString(),
          duration: parseInt(duration) || 30,
          description,
        }),
      })
      if (res.ok) {
        toast.success('Meeting scheduled successfully')
        onScheduled()
      } else {
        toast.error('Failed to schedule meeting')
      }
    } catch {
      toast.error('Failed to schedule meeting')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 max-w-lg w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-blue-600" />
            Schedule Meeting
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-gray-600 text-xs font-medium">Title</Label>
            <Input
              className="mt-1.5 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-300"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-600 text-xs font-medium">Date & Time *</Label>
              <Input
                type="datetime-local"
                className="mt-1.5 bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-blue-500/30 focus-visible:border-blue-300 [color-scheme:dark]"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-gray-600 text-xs font-medium">Duration (min)</Label>
              <Input
                type="number"
                min={15}
                max={120}
                step={15}
                className="mt-1.5 bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-blue-500/30 focus-visible:border-blue-300"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-600 text-xs font-medium">Description</Label>
            <Textarea
              className="mt-1.5 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-300 min-h-[80px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Lead info summary */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-medium">Lead</p>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <Building2 className="w-3.5 h-3.5 text-gray-500" />
              {item.lead.business.name}
              {item.lead.decisionMaker && (
                <span className="text-gray-400">— {item.lead.decisionMaker}</span>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={loading || !date}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Scheduling...' : <><CalendarClock className="w-3.5 h-3.5 mr-1.5" />Schedule</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}