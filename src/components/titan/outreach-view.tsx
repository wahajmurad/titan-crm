'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Send, Eye, Reply, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface OutreachItem {
  id: string; subject: string; body: string; status: string; type: string
  sentAt: string | null; openedAt: string | null; repliedAt: string | null; createdAt: string
  followUpNumber: number
  lead: { business: { name: string; website: string | null } }
}

const STATUS_ICON: Record<string, React.ElementType> = {
  DRAFT: AlertCircle, SENT: Send, OPENED: Eye, REPLIED: Reply, BOUNCED: AlertCircle, FAILED: AlertCircle,
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600', SENT: 'bg-blue-50 text-blue-700',
  OPENED: 'bg-amber-50 text-amber-700', REPLIED: 'bg-emerald-50 text-emerald-700',
  BOUNCED: 'bg-red-50 text-red-700', FAILED: 'bg-red-50 text-red-700',
}

export function OutreachView() {
  const [outreaches, setOutreaches] = useState<OutreachItem[]>([])
  const [leads, setLeads] = useState<Array<{ id: string; business: { name: string } }>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [composeOpen, setComposeOpen] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    Promise.all([fetch(`/api/outreach?${params}`), fetch('/api/leads?limit=200')])
      .then(([oRes, lRes]) => Promise.all([oRes.json(), lRes.json()]))
      .then(([oData, lData]) => {
        setOutreaches(oData.outreaches || [])
        setLeads(lData.leads || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, statusFilter, refreshKey])

  const refresh = () => setRefreshKey(k => k + 1)

  const stats = [
    { label: 'Total', value: outreaches.length },
    { label: 'Sent', value: outreaches.filter(o => o.status === 'SENT').length },
    { label: 'Opened', value: outreaches.filter(o => o.status === 'OPENED').length },
    { label: 'Replied', value: outreaches.filter(o => o.status === 'REPLIED').length },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Outreach</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage your email campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-48 h-8 text-sm" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="OPENED">Opened</SelectItem>
              <SelectItem value="REPLIED">Replied</SelectItem>
              <SelectItem value="BOUNCED">Bounced</SelectItem>
            </SelectContent>
          </Select>
          <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} leads={leads} onSent={refresh} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-xl font-semibold text-slate-900 mt-0.5">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <Card><CardContent className="p-8"><div className="h-48 bg-slate-100 rounded-lg animate-pulse" /></CardContent></Card>
      ) : (
        <Card className="border-slate-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Subject</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Business</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {outreaches.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No outreach emails yet. Compose your first one.</td></tr>
                  ) : outreaches.map(o => (
                    <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 truncate max-w-xs">{o.subject}</p>
                        <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{o.body.slice(0, 80)}...</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{o.lead?.business?.name || '—'}</td>
                      <td className="px-4 py-3"><span className="text-xs text-slate-500">{o.type.replace(/_/g, ' ')}</span></td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLOR[o.status] || 'bg-slate-100 text-slate-600')}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {o.sentAt ? format(new Date(o.sentAt), 'MMM d, h:mm a') : format(new Date(o.createdAt), 'MMM d')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function ComposeDialog({ open, onOpenChange, leads, onSent }: {
  open: boolean; onOpenChange: (o: boolean) => void
  leads: Array<{ id: string; business: { name: string } }>
  onSent: () => void
}) {
  const [leadId, setLeadId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('INITIAL')
  const [sendNow, setSendNow] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!leadId || !subject || !body) return
    setLoading(true)
    try {
      await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, subject, body, type, status: sendNow ? 'SENT' : 'DRAFT' }),
      })
      setLeadId(''); setSubject(''); setBody(''); setType('INITIAL'); setSendNow(true)
      onOpenChange(false)
      onSent()
    } catch {}
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8"><Plus className="w-3.5 h-3.5 mr-1.5" />Compose</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Compose Outreach</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div><Label>Lead *</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a lead..." /></SelectTrigger>
              <SelectContent>
                {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.business.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INITIAL">Initial</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  <SelectItem value="REPLY">Reply</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Subject *</Label><Input className="mt-1" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" /></div>
          </div>
          <div><Label>Message *</Label><Textarea className="mt-1 min-h-[150px]" value={body} onChange={e => setBody(e.target.value)} placeholder="Write your personalized message..." /></div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sendNow} onChange={e => setSendNow(e.target.checked)} className="rounded" />
              Send immediately
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={loading || !leadId || !subject || !body}>
            {loading ? 'Saving...' : sendNow ? 'Send Now' : 'Save Draft'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}