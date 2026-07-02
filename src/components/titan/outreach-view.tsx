'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Send, Eye, Reply, AlertCircle, Mail, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface OutreachItem {
  id: string; subject: string; body: string; status: string; type: string
  sentAt: string | null; openedAt: string | null; repliedAt: string | null; createdAt: string
  followUpNumber: number
  lead: { business: { name: string; website: string | null } }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; dot: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: AlertCircle, dot: 'bg-gray-400' },
  SENT: { label: 'Sent', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Send, dot: 'bg-blue-500' },
  OPENED: { label: 'Opened', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Eye, dot: 'bg-amber-500' },
  REPLIED: { label: 'Replied', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: Reply, dot: 'bg-emerald-500' },
  BOUNCED: { label: 'Bounced', color: 'bg-red-50 text-red-600 border-red-100', icon: AlertCircle, dot: 'bg-red-500' },
  FAILED: { label: 'Failed', color: 'bg-red-50 text-red-600 border-red-100', icon: AlertCircle, dot: 'bg-red-500' },
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
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
  }, [refreshKey, search, statusFilter])

  const refresh = () => setRefreshKey(k => k + 1)

  const filtered = outreaches.filter(o =>
    (!search || o.subject.toLowerCase().includes(search.toLowerCase()) || o.lead?.business?.name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <motion.div className="mx-auto max-w-5xl space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Outreach</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-medium text-gray-700">{outreaches.length}</span> emails tracked
          </p>
        </div>
        <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} leads={leads} onSent={refresh} />
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9 h-9 rounded-xl bg-gray-50 border-0 text-sm focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
            placeholder="Search emails..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center bg-gray-100 rounded-xl p-1">
          {['ALL', 'SENT', 'OPENED', 'REPLIED', 'DRAFT'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                statusFilter === status
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No outreach emails yet</p>
          <p className="text-xs text-gray-400 mt-1">Compose your first outreach email</p>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-2">
          {filtered.map(o => {
            const config = STATUS_CONFIG[o.status] || STATUS_CONFIG.DRAFT
            const Icon = config.icon
            return (
              <motion.div
                key={o.id}
                variants={item}
                whileHover={{ y: -1, boxShadow: '0 6px 24px -6px rgba(0,0,0,0.06)' }}
                className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-4 hover:border-blue-100 transition-colors group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Status icon */}
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', config.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {o.subject || 'No subject'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {o.lead?.business?.name}
                        {o.followUpNumber > 0 && <span className="ml-2 text-blue-500">Follow-up #{o.followUpNumber}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {o.sentAt && (
                      <span className="text-[11px] text-gray-400">{format(new Date(o.sentAt), 'MMM d, h:mm a')}</span>
                    )}
                    <Badge variant="outline" className={cn('text-[11px] font-semibold rounded-lg px-2.5 py-0.5 border', config.color)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', config.dot)} />
                      {config.label}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}

function ComposeDialog({ open, onOpenChange, leads, onSent }: {
  open: boolean; onOpenChange: (o: boolean) => void
  leads: Array<{ id: string; business: { name: string } }>
  onSent: () => void
}) {
  const [leadId, setLeadId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!leadId || !subject || !body) return
    setLoading(true)
    try {
      await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, subject, body, type: 'INITIAL' }),
      })
      setLeadId(''); setSubject(''); setBody('')
      onOpenChange(false); onSent()
    } catch {}
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 text-white font-semibold text-sm shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Compose
        </motion.button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-[95vw] sm:w-full rounded-2xl border-0 shadow-xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-[#2563EB] to-blue-600 px-6 py-5">
          <DialogTitle className="text-lg font-bold text-white">Compose Email</DialogTitle>
          <p className="text-sm text-blue-100 mt-1">Write an outreach email to a lead</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <Label className="text-xs font-medium text-gray-500">Lead *</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30">
                <SelectValue placeholder="Select a lead..." />
              </SelectTrigger>
              <SelectContent>{leads.map(l => <SelectItem key={l.id} value={l.id}>{l.business.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500">Subject *</Label>
            <Input className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500">Body *</Label>
            <Textarea className="mt-1.5 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30 min-h-[180px]" value={body} onChange={e => setBody(e.target.value)} placeholder="Write your email..." />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-2.5">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-gray-200 text-gray-500 hover:bg-gray-100 font-semibold h-10 px-5">Cancel</Button>
          <Button
            onClick={handleSend}
            disabled={loading || !leadId || !subject || !body}
            className="rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 text-white font-semibold h-10 px-6 shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}