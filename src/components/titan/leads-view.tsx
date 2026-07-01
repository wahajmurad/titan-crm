'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LEAD_STAGES, STAGE_COLORS, STAGE_DOT_COLORS, type LeadStage } from '@/lib/types'
import { Plus, Search, ChevronRight, ExternalLink, Phone, Mail, Globe, Globe2, Target, Loader2, CheckCircle2, LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Keep local CalendarIcon SVG to avoid name collision ──────────────

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
    </svg>
  )
}

// ─── Data Types ────────────────────────────────────────────────────────

interface Lead {
  id: string
  stage: LeadStage
  score: number
  decisionMaker: string | null
  decisionMakerRole: string | null
  decisionMakerEmail: string | null
  recommendedSolution: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  business: {
    id: string; name: string; website: string | null; industry: string | null
    city: string | null; country: string | null; phone: string | null; email: string | null
  }
  assignedTo: { id: string; name: string; email: string } | null
  _count: { outreaches: number; meetings: number }
}

// ─── Animation Variants ───────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

const staggerCard = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

// ─── Score Badge Color ────────────────────────────────────────────────

function getScoreColor(score: number) {
  if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

// ─── Component ────────────────────────────────────────────────────────

export function LeadsView() {
  const { setView } = useAppStore()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('ALL')
  const [addOpen, setAddOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [processingLeads, setProcessingLeads] = useState<Set<string>>(new Set())
  const [completedLeads, setCompletedLeads] = useState<Set<string>>(new Set())

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (stageFilter !== 'ALL') params.set('stage', stageFilter)
    fetch(`/api/leads?${params}`)
      .then(r => r.json())
      .then(d => setLeads(d.leads || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, stageFilter, refreshKey])

  const refresh = () => setRefreshKey(k => k + 1)
  const stages = LEAD_STAGES.filter(s => s !== 'LOST')

  const handleAudit = useCallback(async (lead: Lead) => {
    if (!lead.business.website || processingLeads.has(lead.id)) return
    setProcessingLeads(prev => new Set(prev).add(lead.id))
    setCompletedLeads(prev => { const next = new Set(prev); next.delete(lead.id); return next })
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: lead.business.website }),
      })
      if (res.ok) {
        toast.success('Audit completed!', { description: `${lead.business.name} has been audited` })
        setCompletedLeads(prev => new Set(prev).add(lead.id))
        setTimeout(() => setCompletedLeads(prev => { const next = new Set(prev); next.delete(lead.id); return next }), 2000)
        refresh()
      } else {
        toast.error('Audit failed', { description: 'Could not complete the audit' })
      }
    } catch {
      toast.error('Audit failed', { description: 'Network error' })
    } finally {
      setProcessingLeads(prev => { const next = new Set(prev); next.delete(lead.id); return next })
    }
  }, [processingLeads, refresh])

  const handleQualify = useCallback(async (lead: Lead) => {
    if (processingLeads.has(lead.id)) return
    setProcessingLeads(prev => new Set(prev).add(lead.id))
    setCompletedLeads(prev => { const next = new Set(prev); next.delete(lead.id); return next })
    try {
      const res = await fetch('/api/ai/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: lead.business.name,
          website: lead.business.website,
          industry: lead.business.industry,
          auditScore: lead.score || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const temperature = data.temperature?.toUpperCase() || 'WARM'
        const score = data.score ?? data.qualificationScore ?? '—'
        toast.success(`Qualified as ${temperature} (score: ${score}/100)`, { description: `${lead.business.name} — ${data.summary || data.reason || ''}` })
        setCompletedLeads(prev => new Set(prev).add(lead.id))
        setTimeout(() => setCompletedLeads(prev => { const next = new Set(prev); next.delete(lead.id); return next }), 2000)
        refresh()
      } else {
        toast.error('Qualification failed', { description: data.error || 'Could not qualify lead' })
      }
    } catch {
      toast.error('Qualification failed', { description: 'Network error' })
    } finally {
      setProcessingLeads(prev => { const next = new Set(prev); next.delete(lead.id); return next })
    }
  }, [processingLeads, refresh])

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Leads</h1>
          <p className="text-sm text-[#475569] mt-1">{leads.length} leads in pipeline</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 w-56 h-10 rounded-xl bg-slate-50 border-0 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:ring-1 focus-visible:ring-[#2563EB]/30 shadow-none"
            />
          </div>

          {/* Stage filter pills */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setStageFilter('ALL')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200',
                stageFilter === 'ALL'
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#475569]'
              )}
            >
              All
            </button>
            {stages.slice(0, 5).map(s => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 whitespace-nowrap',
                  stageFilter === s
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#475569]'
                )}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 rounded-full transition-all duration-200',
                viewMode === 'table'
                  ? 'bg-white shadow-sm text-[#2563EB]'
                  : 'text-[#94A3B8] hover:text-[#475569]'
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                'p-2 rounded-full transition-all duration-200',
                viewMode === 'board'
                  ? 'bg-white shadow-sm text-[#2563EB]'
                  : 'text-[#94A3B8] hover:text-[#475569]'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} onCreated={refresh} />
        </div>
      </motion.div>

      {/* ─── Content ──────────────────────────────────────────────────── */}
      {loading ? (
        <Card className="bg-white rounded-2xl border-0 shadow-sm p-8">
          <div className="h-56 bg-slate-100 rounded-2xl animate-pulse" />
        </Card>
      ) : viewMode === 'table' ? (
        <motion.div variants={fadeUp}>
          <Card className="bg-white rounded-2xl border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm">
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Business</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Industry</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Stage</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Contact</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Score</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Actions</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Updated</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <motion.tbody variants={container} initial="hidden" animate="show">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                            <Search className="w-5 h-5 text-slate-300" />
                          </div>
                          <p className="text-sm text-[#475569] font-medium">No leads yet</p>
                          <p className="text-xs text-[#94A3B8] mt-1">Add your first lead to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : leads.map(lead => (
                    <motion.tr
                      key={lead.id}
                      variants={fadeUp}
                      className="border-b border-slate-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors group"
                      onClick={() => setView('lead-detail', lead.id)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{lead.business.name}</div>
                        {lead.business.city && (
                          <div className="text-xs text-[#94A3B8] mt-0.5">
                            {lead.business.city}{lead.business.country ? `, ${lead.business.country}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-[#475569] font-medium">{lead.business.industry || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] font-semibold rounded-full border px-2.5 py-0.5',
                            STAGE_COLORS[lead.stage]
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', STAGE_DOT_COLORS[lead.stage])} />
                          {lead.stage.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        {lead.decisionMaker ? (
                          <div>
                            <div className="text-sm font-medium text-[#0F172A]">{lead.decisionMaker}</div>
                            {lead.decisionMakerRole && <div className="text-xs text-[#94A3B8]">{lead.decisionMakerRole}</div>}
                          </div>
                        ) : <span className="text-[#94A3B8] text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {lead.score > 0 && (
                          <Badge
                            variant="outline"
                            className={cn('text-[11px] font-bold rounded-lg px-2 py-0.5 border', getScoreColor(lead.score))}
                          >
                            {lead.score}
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {processingLeads.has(lead.id) ? (
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                            <span className="text-xs text-[#94A3B8]">Analyzing...</span>
                          </div>
                        ) : completedLeads.has(lead.id) ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs text-emerald-600 font-medium">Done</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={e => { e.stopPropagation(); handleAudit(lead) }}
                              disabled={!lead.business.website || processingLeads.has(lead.id)}
                              className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-semibold rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                              title={!lead.business.website ? 'No website' : 'Audit website'}
                            >
                              <Globe2 className="w-3 h-3" />
                              Audit
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleQualify(lead) }}
                              disabled={processingLeads.has(lead.id)}
                              className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                              title="Qualify lead with AI"
                            >
                              <Target className="w-3 h-3" />
                              Qualify
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#94A3B8] text-xs font-medium">{format(new Date(lead.updatedAt), 'MMM d')}</td>
                      <td className="px-3 py-3.5">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] transition-colors" />
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      ) : (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage)
            return (
              <div key={stage} className="min-w-[280px] flex-1">
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <span className={cn('w-2.5 h-2.5 rounded-full', STAGE_DOT_COLORS[stage])} />
                  <span className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">{stage.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-[#94A3B8] bg-slate-100 rounded-full px-2 py-0.5 font-semibold tabular-nums">{stageLeads.length}</span>
                </div>
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-2.5"
                >
                  {stageLeads.map(lead => (
                    <motion.div
                      key={lead.id}
                      variants={staggerCard}
                      whileHover={{ y: -2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <Card
                        className="bg-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4"
                        onClick={() => setView('lead-detail', lead.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-semibold text-[#0F172A] truncate pr-2">{lead.business.name}</p>
                          {lead.score > 0 && (
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] font-bold rounded-lg px-1.5 py-0 border shrink-0', getScoreColor(lead.score))}
                            >
                              {lead.score}
                            </Badge>
                          )}
                        </div>
                        {lead.business.industry && (
                          <p className="text-xs text-[#94A3B8] mb-2">{lead.business.industry}</p>
                        )}
                        {lead.decisionMaker && (
                          <p className="text-xs text-[#475569] mb-3">{lead.decisionMaker}</p>
                        )}
                        <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                          <button
                            onClick={e => { e.stopPropagation(); handleAudit(lead) }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 transition-all duration-150"
                            title="Audit"
                            disabled={!lead.business.website || processingLeads.has(lead.id)}
                          >
                            {processingLeads.has(lead.id)
                              ? <Loader2 className="w-3.5 h-3.5 text-[#2563EB] animate-spin" />
                              : <Globe2 className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#2563EB] transition-colors" />}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleQualify(lead) }}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 transition-all duration-150"
                            title="Qualify"
                            disabled={processingLeads.has(lead.id)}
                          >
                            {processingLeads.has(lead.id)
                              ? <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                              : <Target className="w-3.5 h-3.5 text-[#94A3B8] hover:text-emerald-600 transition-colors" />}
                          </button>
                          {completedLeads.has(lead.id) && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-0.5" />}
                          <div className="flex-1" />
                          <div className="flex items-center gap-1 text-[#94A3B8]">
                            <Mail className="w-3 h-3" />
                            <span className="text-[11px] font-medium tabular-nums">{lead._count.outreaches}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#94A3B8] ml-2">
                            <CalendarIcon className="w-3 h-3" />
                            <span className="text-[11px] font-medium tabular-nums">{lead._count.meetings}</span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="bg-slate-50/80 rounded-2xl p-6 text-center border border-dashed border-slate-200">
                      <p className="text-xs text-[#94A3B8] font-medium">No leads</p>
                    </div>
                  )}
                </motion.div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ─── Add Lead Dialog ──────────────────────────────────────────────────

function AddLeadDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', website: '', industry: '', city: '', country: '',
    phone: '', email: '', decisionMaker: '', decisionMakerRole: '', decisionMakerEmail: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: {
            name: form.name, website: form.website, industry: form.industry,
            city: form.city, country: form.country, phone: form.phone, email: form.email
          },
          decisionMaker: form.decisionMaker, decisionMakerRole: form.decisionMakerRole,
          decisionMakerEmail: form.decisionMakerEmail,
        }),
      })
      if (res.ok) {
        setForm({ name: '', website: '', industry: '', city: '', country: '', phone: '', email: '', decisionMaker: '', decisionMakerRole: '', decisionMakerEmail: '' })
        onOpenChange(false)
        onCreated()
      }
    } catch {}
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow-md transition-all px-4">
          <Plus className="w-4 h-4 mr-1.5" />Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl border-0 shadow-xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-[#2563EB] to-blue-600 px-6 py-5">
          <DialogTitle className="text-lg font-bold text-white">Add New Lead</DialogTitle>
          <p className="text-sm text-blue-100 mt-1">Fill in the details below to add a new lead to your pipeline</p>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Business Information Section */}
          <div>
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Business Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs font-medium text-[#475569]">Company Name *</Label>
                <Input
                  className="mt-1.5 h-10 rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#475569]">Website</Label>
                <Input
                  className="mt-1.5 h-10 rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
                  value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#475569]">Industry</Label>
                <Input
                  className="mt-1.5 h-10 rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
                  value={form.industry}
                  onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                  placeholder="Law Firm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#475569]">City</Label>
                <Input
                  className="mt-1.5 h-10 rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#475569]">Country</Label>
                <Input
                  className="mt-1.5 h-10 rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  placeholder="USA"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#475569]">Phone</Label>
                <Input
                  className="mt-1.5 h-10 rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555-0123"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#475569]">Email</Label>
                <Input
                  className="mt-1.5 h-10 rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="info@company.com"
                />
              </div>
            </div>
          </div>

          {/* Decision Maker Section */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Decision Maker</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-[#475569]">Name</Label>
                <Input
                  className="mt-1.5 h-10 rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
                  value={form.decisionMaker}
                  onChange={e => setForm(f => ({ ...f, decisionMaker: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#475569]">Role</Label>
                <Input
                  className="mt-1.5 h-10 rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
                  value={form.decisionMakerRole}
                  onChange={e => setForm(f => ({ ...f, decisionMakerRole: e.target.value }))}
                  placeholder="CEO"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-medium text-[#475569]">Email</Label>
                <Input
                  className="mt-1.5 h-10 rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
                  type="email"
                  value={form.decisionMakerEmail}
                  onChange={e => setForm(f => ({ ...f, decisionMakerEmail: e.target.value }))}
                  placeholder="john@company.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2.5">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-200 text-[#475569] hover:bg-slate-100 font-semibold h-10 px-5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !form.name}
            className="rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold h-10 px-6 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Saving...</>
            ) : (
              'Add Lead'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}