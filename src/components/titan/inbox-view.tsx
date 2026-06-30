'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Mail, MailOpen, ThumbsUp, Calendar, DollarSign, Clock,
  ChevronDown, ChevronUp, Send, Trophy, XCircle, ArrowRight,
  Inbox as InboxIcon, Sparkles, MessageSquare, User, Building2,
  ExternalLink, CalendarClock, CircleDot
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
    label: 'Reply', color: 'text-blue-400', bg: 'bg-blue-500/10',
    borderColor: 'border-l-blue-500', icon: MessageSquare,
  },
  POSITIVE: {
    label: 'Positive', color: 'text-emerald-400', bg: 'bg-emerald-500/10',
    borderColor: 'border-l-emerald-500', icon: ThumbsUp,
  },
  MEETING_REQUEST: {
    label: 'Meeting Request', color: 'text-blue-400', bg: 'bg-blue-500/10',
    borderColor: 'border-l-blue-500', icon: Calendar,
  },
  PRICING: {
    label: 'Pricing Question', color: 'text-amber-400', bg: 'bg-amber-500/10',
    borderColor: 'border-l-amber-500', icon: DollarSign,
  },
  OOO: {
    label: 'Out of Office', color: 'text-gray-500', bg: 'bg-slate-500/10',
    borderColor: 'border-l-slate-500', icon: Clock,
  },
  OTHER: {
    label: 'Other', color: 'text-gray-500', bg: 'bg-slate-500/10',
    borderColor: 'border-l-slate-600', icon: Mail,
  },
}

const COUNT_BADGES: Array<{ type: InboxItemType; label: string; color: string; bgColor: string }> = [
  { type: 'REPLY', label: 'New Replies', color: 'text-blue-400', bgColor: 'bg-blue-500/15' },
  { type: 'POSITIVE', label: 'Positive', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15' },
  { type: 'MEETING_REQUEST', label: 'Meeting Requests', color: 'text-blue-400', bgColor: 'bg-blue-500/15' },
  { type: 'PRICING', label: 'Pricing Questions', color: 'text-amber-400', bgColor: 'bg-amber-500/15' },
  { type: 'OOO', label: 'OOO', color: 'text-gray-500', bgColor: 'bg-slate-500/15' },
]

const FILTER_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'REPLY', label: 'Replies' },
  { value: 'POSITIVE', label: 'Positive' },
  { value: 'MEETING_REQUEST', label: 'Meeting Requests' },
  { value: 'OOO', label: 'OOO' },
]

// ─── Main Component ──────────────────────────────────────────────────

export function InboxView() {
  const { setView } = useAppStore()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

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

  // Filter items
  const filtered = activeTab === 'ALL' ? items : items.filter(i => i.type === activeTab)

  // Count by type
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1
    return acc
  }, {})

  // Expanded item
  const expandedItem = expandedId ? items.find(i => i.id === expandedId) : null

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
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
        setExpandedId(null)
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
        setExpandedId(null)
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <InboxIcon className="w-5 h-5 text-blue-400" />
            Unified Inbox
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} message{items.length !== 1 ? 's' : ''} &middot; {items.filter(i => !i.isRead).length} unread
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          onClick={() => { setExpandedId(null); refresh() }}
        >
          Refresh
        </Button>
      </div>

      {/* Count Badges Row */}
      {!loading && (
        <div className="flex flex-wrap gap-2">
          {COUNT_BADGES.map(b => (
            <button
              key={b.type}
              onClick={() => setActiveTab(activeTab === b.type ? 'ALL' : b.type)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                activeTab === b.type
                  ? cn(b.bgColor, b.color, 'border-current/30')
                  : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', TYPE_CONFIG[b.type].color.replace('text-', 'bg-'))} />
              {b.label}
              <span className={cn(
                'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                activeTab === b.type ? b.bgColor : 'bg-gray-100'
              )}>
                {counts[b.type] || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-gray-200 h-8">
          {FILTER_TABS.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-500 text-xs px-3"
            >
              {tab.label}
              {tab.value !== 'ALL' && (
                <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-[10px] bg-gray-100 text-gray-400">
                  {counts[tab.value] || 0}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Inbox Items */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white border-gray-200 border-dashed">
          <CardContent className="p-12 text-center">
            <InboxIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {activeTab === 'ALL' ? 'Inbox is empty' : `No ${activeTab.replace(/_/g, ' ').toLowerCase()} messages`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Replies from your outreach will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.OTHER
            const isExpanded = expandedId === item.id
            const isPositive = item.type === 'POSITIVE'
            const isOOO = item.type === 'OOO'
            const isMeeting = item.type === 'MEETING_REQUEST'

            return (
              <Card
                key={item.id}
                className={cn(
                  'bg-white border-gray-200 border-l-2 transition-all cursor-pointer',
                  'hover:border-gray-200',
                  cfg.borderColor,
                  isExpanded && 'ring-1 ring-slate-700/50',
                  !item.isRead && 'bg-blue-50',
                  // Visual distinction: positive gets a subtle emerald tint
                  isPositive && !isExpanded && 'bg-emerald-500/[0.03]',
                  // OOO gets a subtle desaturated look
                  isOOO && 'opacity-75',
                )}
                onClick={() => toggleExpand(item.id)}
              >
                <CardContent className="p-4">
                  {/* Collapsed View */}
                  <div className="flex items-start gap-3">
                    {/* Type icon */}
                    <div className={cn('p-2 rounded-lg mt-0.5 shrink-0', cfg.bg)}>
                      <cfg.icon className={cn('w-4 h-4', cfg.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn('text-[10px] font-medium shrink-0', cfg.bg, cfg.color, 'border-current/20')}>
                          {cfg.label}
                        </Badge>
                        {!item.isRead && (
                          <CircleDot className="w-2 h-2 text-blue-400" />
                        )}
                        <span className="text-[11px] text-gray-400 ml-auto shrink-0">
                          {formatDistanceToNow(new Date(item.receivedAt), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-gray-900 truncate">{item.subject || '(No Subject)'}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{item.preview || item.body.slice(0, 120)}</p>

                      {/* Sender / Company row */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        {item.sender && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.sender}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {item.lead.business.name}
                        </span>
                        {item.lead.business.industry && (
                          <span className="hidden sm:inline">{item.lead.business.industry}</span>
                        )}
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <div className="shrink-0 ml-2 mt-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded View */}
                  {isExpanded && (
                    <>
                      <Separator className="bg-gray-100 my-4" />
                      <div className="space-y-4">
                        {/* Full Email Body */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-2">Full Message</p>
                          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                            <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                              {item.body}
                            </pre>
                          </div>
                        </div>

                        {/* Lead Details */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-2">Lead Details</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-[10px] text-gray-400 uppercase">Company</p>
                              <p className="text-sm text-gray-900 mt-0.5 font-medium">{item.lead.business.name}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-[10px] text-gray-400 uppercase">Contact</p>
                              <p className="text-sm text-gray-900 mt-0.5">
                                {item.lead.decisionMaker || '—'}
                                {item.lead.decisionMakerRole && (
                                  <span className="text-gray-400 ml-1">{item.lead.decisionMakerRole}</span>
                                )}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-[10px] text-gray-400 uppercase">Stage</p>
                              <p className="text-sm text-gray-900 mt-0.5">{item.lead.stage.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-[10px] text-gray-400 uppercase">Temperature</p>
                              <p className={cn('text-sm mt-0.5 font-medium', {
                                'text-red-400': item.lead.temperature === 'HOT',
                                'text-amber-400': item.lead.temperature === 'WARM',
                                'text-gray-500': item.lead.temperature === 'COLD',
                              })}>
                                {item.lead.temperature}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-2">Quick Actions</p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-gray-900 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleMarkWon(item) }}
                            >
                              <Trophy className="w-3 h-3 mr-1.5" />Mark as Won
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 bg-blue-600 hover:bg-blue-700 text-gray-900 text-xs"
                              onClick={(e) => { e.stopPropagation(); openMeetingDialog(item) }}
                            >
                              <CalendarClock className="w-3 h-3 mr-1.5" />Schedule Meeting
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 text-xs"
                              onClick={(e) => { e.stopPropagation(); openReplyDialog(item) }}
                            >
                              <Send className="w-3 h-3 mr-1.5" />Send Reply
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-gray-200 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleMarkLost(item) }}
                            >
                              <XCircle className="w-3 h-3 mr-1.5" />Move to Lost
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setView('lead-detail', item.lead.id)
                              }}
                            >
                              <ExternalLink className="w-3 h-3 mr-1.5" />View Lead
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Send Reply Dialog */}
      {selectedItem && (
        <ReplyDialog
          open={replyDialogOpen}
          onOpenChange={setReplyDialogOpen}
          item={selectedItem}
          onSent={() => { refresh(); setReplyDialogOpen(false) }}
        />
      )}

      {/* Schedule Meeting Dialog */}
      {selectedItem && (
        <ScheduleMeetingDialog
          open={meetingDialogOpen}
          onOpenChange={setMeetingDialogOpen}
          item={selectedItem}
          onScheduled={() => { refresh(); setMeetingDialogOpen(false) }}
        />
      )}
    </div>
  )
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
      <DialogContent className="bg-white border-gray-200 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Reply to {item.lead.business.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Original Message</p>
            <p className="text-xs text-gray-500 line-clamp-3">{item.body.slice(0, 200)}...</p>
          </div>
          <div>
            <Label className="text-gray-600 text-xs font-medium">Subject</Label>
            <Input
              className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-gray-600 text-xs font-medium">Reply *</Label>
            <Textarea
              className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30 min-h-[120px]"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your reply..."
            />
          </div>
        </div>
        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200 text-gray-600 hover:bg-gray-100">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || !body.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-gray-900"
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
      <DialogContent className="bg-white border-gray-200 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-blue-400" />
            Schedule Meeting
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-gray-600 text-xs font-medium">Title</Label>
            <Input
              className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-600 text-xs font-medium">Date & Time *</Label>
              <Input
                type="datetime-local"
                className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900 focus-visible:ring-blue-500/30 [color-scheme:dark]"
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
                className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900 focus-visible:ring-blue-500/30"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-600 text-xs font-medium">Description</Label>
            <Textarea
              className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30 min-h-[80px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Lead info summary */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5">Lead</p>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200 text-gray-600 hover:bg-gray-100">
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={loading || !date}
            className="bg-blue-600 hover:bg-blue-700 text-gray-900"
          >
            {loading ? 'Scheduling...' : <><CalendarClock className="w-3.5 h-3.5 mr-1.5" />Schedule</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}