'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus, Search, Sparkles, Send, Eye, Reply, Mail, MailOpen,
  AlertTriangle, FileEdit, Loader2, Inbox, ArrowUpRight, MailCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────

interface EmailItem {
  id: string
  subject: string
  body: string
  status: string
  type: string
  sentAt: string | null
  openedAt: string | null
  repliedAt: string | null
  createdAt: string
  followUpNumber: number
  campaignId: string | null
  lead: {
    id: string
    decisionMaker: string | null
    decisionMakerRole: string | null
    business: { name: string; website: string | null }
  }
  campaign?: { id: string; name: string } | null
}

interface CampaignOption {
  id: string
  name: string
}

// ─── Config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-500/15 text-gray-500 border-slate-500/25', icon: FileEdit },
  SENT: { label: 'Sent', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25', icon: Send },
  OPENED: { label: 'Opened', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25', icon: MailOpen },
  REPLIED: { label: 'Replied', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', icon: Reply },
  BOUNCED: { label: 'Bounced', color: 'bg-red-500/15 text-red-400 border-red-500/25', icon: AlertTriangle },
  FAILED: { label: 'Failed', color: 'bg-red-500/15 text-red-400 border-red-500/25', icon: AlertTriangle },
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  INITIAL: { label: 'Initial', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  FOLLOW_UP: { label: 'Follow-up', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25' },
  REPLY: { label: 'Reply', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
}

const TOP_STATS = [
  { key: 'total', label: 'Total Sent', icon: Mail, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'opened', label: 'Opened', icon: MailOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'replied', label: 'Replied', icon: Reply, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'bounced', label: 'Bounced', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  { key: 'pending', label: 'Pending', icon: Inbox, color: 'text-gray-500', bg: 'bg-slate-500/10' },
]

// ─── Main Component ──────────────────────────────────────────────────

export function EmailCenterView() {
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([])
  const [leads, setLeads] = useState<Array<{ id: string; business: { name: string } }>>([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState('ALL')
  const [campaignFilter, setCampaignFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusTab !== 'ALL') params.set('status', statusTab)
    if (campaignFilter !== 'ALL') params.set('campaignId', campaignFilter)
    if (search) params.set('search', search)
    params.set('limit', '200')

    Promise.all([
      fetch(`/api/outreach?${params}`, { credentials: 'same-origin' }),
      fetch('/api/campaigns?limit=100', { credentials: 'same-origin' }),
      fetch('/api/leads?limit=200', { credentials: 'same-origin' }),
    ])
      .then(([eRes, cRes, lRes]) => Promise.all([eRes.json(), cRes.json(), lRes.json()]))
      .then(([eData, cData, lData]) => {
        setEmails(eData.outreaches || [])
        setCampaigns(cData.campaigns || [])
        setLeads(lData.leads || [])
      })
      .catch(() => toast.error('Failed to load email data'))
      .finally(() => setLoading(false))
  }, [statusTab, campaignFilter, search, refreshKey])
  const refresh = () => setRefreshKey(k => k + 1)

  // Compute stats from all emails (not filtered)
  const allEmails = emails
  const stats = {
    total: allEmails.filter(e => e.status === 'SENT' || e.status === 'OPENED' || e.status === 'REPLIED').length,
    opened: allEmails.filter(e => e.status === 'OPENED' || e.status === 'REPLIED').length,
    replied: allEmails.filter(e => e.status === 'REPLIED').length,
    bounced: allEmails.filter(e => e.status === 'BOUNCED' || e.status === 'FAILED').length,
    pending: allEmails.filter(e => e.status === 'DRAFT').length,
  }

  const openRate = stats.total > 0 ? ((stats.opened / stats.total) * 100).toFixed(1) : '0.0'
  const replyRate = stats.total > 0 ? ((stats.replied / stats.total) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            Email Center
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {emails.length} emails &middot; {openRate}% open rate &middot; {replyRate}% reply rate
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Search emails..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 w-48 h-8 text-sm bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30"
            />
          </div>
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-44 h-8 text-sm bg-white border-gray-200 text-gray-900">
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="ALL">All Campaigns</SelectItem>
              {campaigns.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {TOP_STATS.map(s => (
          <Card key={s.key} className="bg-white border-gray-200">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', s.bg, s.color)}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-semibold text-gray-900">{stats[s.key as keyof typeof stats]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Tabs + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <TabsList className="bg-white border border-gray-200 h-8">
            {[
              { value: 'ALL', label: 'All' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SENT', label: 'Sent' },
              { value: 'OPENED', label: 'Opened' },
              { value: 'REPLIED', label: 'Replied' },
              { value: 'BOUNCED', label: 'Bounced' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-500 text-xs px-3"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setAiGenerateOpen(true)}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate AI Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => setComposeOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />Compose
          </Button>
          <AiEmailDialog
            open={aiGenerateOpen}
            onOpenChange={setAiGenerateOpen}
            leads={leads}
            campaigns={campaigns}
            onSaved={refresh}
          />
          <ComposeEmailDialog
            open={composeOpen}
            onOpenChange={setComposeOpen}
            leads={leads}
            campaigns={campaigns}
            onSent={refresh}
          />
        </div>
      </div>

      {/* Email Table */}
      {loading ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full bg-gray-100" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : emails.length === 0 ? (
        <Card className="bg-white border-gray-200 border-dashed">
          <CardContent className="p-12 text-center">
            <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No emails found</p>
            <p className="text-sm text-gray-400 mt-1">
              {statusTab !== 'ALL' ? 'Try changing your filters.' : 'Generate an AI email or compose your first outreach.'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                className="border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setAiGenerateOpen(true)}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate AI Email
              </Button>
              <Button
                variant="outline"
                className="border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setComposeOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />Compose
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[600px]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-white border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Subject</th>
                      <th className="text-left px-4 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Lead / Company</th>
                      <th className="text-left px-4 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Type</th>
                      <th className="text-left px-4 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Sent Date</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {emails.map(email => {
                      const statusCfg = STATUS_CONFIG[email.status] || STATUS_CONFIG.DRAFT
                      const typeCfg = TYPE_CONFIG[email.type] || TYPE_CONFIG.INITIAL
                      return (
                        <tr
                          key={email.id}
                          className="border-b border-gray-200 hover:bg-gray-100/40 transition-colors group"
                        >
                          <td className="px-4 py-3 min-w-0 max-w-xs">
                            <p className="font-medium text-gray-900 truncate">{email.subject || '(No Subject)'}</p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{(email.body || '').slice(0, 100)}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-gray-600">{email.lead?.business?.name || '—'}</p>
                            {email.lead?.decisionMaker && (
                              <p className="text-xs text-gray-400">{email.lead.decisionMaker}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <Badge variant="outline" className={cn('text-[10px] font-medium', typeCfg.color)}>
                              {typeCfg.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn('text-[10px] font-medium', statusCfg.color)}>
                              {statusCfg.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                            {email.sentAt
                              ? format(new Date(email.sentAt), 'MMM d, h:mm a')
                              : format(new Date(email.createdAt), 'MMM d')
                            }
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                // Could open a detail view — for now show a toast
                                toast.info(`Email: "${email.subject}" — ${email.status}`)
                              }}
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── AI Email Generate Dialog ────────────────────────────────────────

function AiEmailDialog({ open, onOpenChange, leads, campaigns, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void
  leads: Array<{ id: string; business: { name: string } }>
  campaigns: Array<{ id: string; name: string }>
  onSaved: () => void
}) {
  const [leadId, setLeadId] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [generated, setGenerated] = useState(false)

  const handleGenerate = async () => {
    if (!leadId) {
      toast.error('Please select a lead')
      return
    }
    setGenerating(true)
    try {
      const params = new URLSearchParams({ leadId })
      if (campaignId && campaignId !== 'none') params.set('campaignId', campaignId)
      const res = await fetch(`/api/ai/email?${params}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setSubject(data.subject || '')
        setBody(data.body || '')
        setGenerated(true)
        toast.success('Email generated successfully')
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Failed to generate email')
      }
    } catch {
      toast.error('Failed to generate email')
    }
    setGenerating(false)
  }

  const handleSave = async () => {
    if (!leadId || !subject || !body) {
      toast.error('Subject and body are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          leadId,
          campaignId: campaignId || undefined,
          subject,
          body,
          type: 'INITIAL',
          status: 'DRAFT',
        }),
      })
      if (res.ok) {
        toast.success('Email saved as draft')
        reset()
        onOpenChange(false)
        onSaved()
      } else {
        toast.error('Failed to save email')
      }
    } catch {
      toast.error('Failed to save email')
    }
    setSaving(false)
  }

  const handleSend = async () => {
    if (!leadId || !subject || !body) {
      toast.error('Subject and body are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          leadId,
          campaignId: campaignId || undefined,
          subject,
          body,
          type: 'INITIAL',
          status: 'SENT',
        }),
      })
      if (res.ok) {
        toast.success('Email sent successfully')
        reset()
        onOpenChange(false)
        onSaved()
      } else {
        toast.error('Failed to send email')
      }
    } catch {
      toast.error('Failed to send email')
    }
    setSaving(false)
  }

  const reset = () => {
    setLeadId(''); setCampaignId(''); setSubject(''); setBody(''); setGenerated(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="bg-white border-gray-200 max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Generate AI Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2 flex-1 overflow-y-auto">
          {/* Lead Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-600 text-xs font-medium">Lead *</Label>
              <Select value={leadId} onValueChange={setLeadId} disabled={generated}>
                <SelectTrigger className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900">
                  <SelectValue placeholder="Select a lead..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 max-h-60">
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.business.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-600 text-xs font-medium">Campaign (optional)</Label>
              <Select value={campaignId} onValueChange={setCampaignId} disabled={generated}>
                <SelectTrigger className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900">
                  <SelectValue placeholder="No campaign" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="none">No campaign</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button (shown before generation) */}
          {!generated && (
            <Button
              onClick={handleGenerate}
              disabled={generating || !leadId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-gray-900"
            >
              {generating ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating with AI...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate Email</>
              )}
            </Button>
          )}

          {/* Generated Content (editable) */}
          {generated && (
            <>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-2">
                <MailCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-400">AI-generated email ready. You can edit the content below before saving or sending.</p>
              </div>

              <div>
                <Label className="text-gray-600 text-xs font-medium">Subject</Label>
                <Input
                  className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Email subject line"
                />
              </div>

              <div>
                <Label className="text-gray-600 text-xs font-medium">Body</Label>
                <Textarea
                  className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30 min-h-[200px] font-mono text-sm leading-relaxed"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Email body..."
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-900"
                onClick={() => { setGenerated(false); setSubject(''); setBody('') }}
              >
                Regenerate
              </Button>
            </>
          )}
        </div>

        {generated && (
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }} className="border-gray-200 text-gray-600 hover:bg-gray-100">
              Discard
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving || !subject || !body}
              className="border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              onClick={handleSend}
              disabled={saving || !subject || !body}
              className="bg-blue-600 hover:bg-blue-700 text-gray-900"
            >
              {saving ? 'Sending...' : <><Send className="w-3.5 h-3.5 mr-1.5" />Send Now</>}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Compose Email Dialog ────────────────────────────────────────────

function ComposeEmailDialog({ open, onOpenChange, leads, campaigns, onSent }: {
  open: boolean; onOpenChange: (o: boolean) => void
  leads: Array<{ id: string; business: { name: string } }>
  campaigns: Array<{ id: string; name: string }>
  onSent: () => void
}) {
  const [leadId, setLeadId] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('INITIAL')
  const [sendNow, setSendNow] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!leadId || !subject || !body) {
      toast.error('Lead, subject, and message are required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          leadId,
          campaignId: campaignId || undefined,
          subject,
          body,
          type,
          status: sendNow ? 'SENT' : 'DRAFT',
        }),
      })
      if (res.ok) {
        toast.success(sendNow ? 'Email sent' : 'Draft saved')
        reset()
        onOpenChange(false)
        onSent()
      } else {
        toast.error('Failed to save email')
      }
    } catch {
      toast.error('Failed to save email')
    }
    setLoading(false)
  }

  const reset = () => {
    setLeadId(''); setCampaignId(''); setSubject(''); setBody('')
    setType('INITIAL'); setSendNow(true)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="bg-white border-gray-200 max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Compose Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-600 text-xs font-medium">Lead *</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900">
                  <SelectValue placeholder="Select a lead..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 max-h-60">
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.business.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-600 text-xs font-medium">Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900">
                  <SelectValue placeholder="No campaign" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="none">No campaign</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-600 text-xs font-medium">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="INITIAL">Initial</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                  <SelectItem value="REPLY">Reply</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-600 text-xs font-medium">Subject *</Label>
              <Input
                className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-600 text-xs font-medium">Message *</Label>
            <Textarea
              className="mt-1.5 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30 min-h-[160px]"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your personalized message..."
            />
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }} className="border-gray-200 text-gray-600 hover:bg-gray-100">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !leadId || !subject || !body}
            className="bg-blue-600 hover:bg-blue-700 text-gray-900"
          >
            {loading ? 'Saving...' : sendNow ? <><Send className="w-3.5 h-3.5 mr-1.5" />Send Now</> : 'Save Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}