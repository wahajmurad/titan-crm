'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { LEAD_STAGES, STAGE_COLORS, STAGE_DOT_COLORS, type LeadStage } from '@/lib/types'
import { Plus, Search, ChevronRight, Mail, Globe2, Target, Loader2, CheckCircle2, LayoutGrid, List } from 'lucide-react'
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
  if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-200/60'
  return 'bg-red-50 text-red-700 border-red-200/60'
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
    const timer = setTimeout(() => {
      fetch(`/api/leads?${params}`)
        .then(r => r.json())
        .then(d => setLeads(d.leads || []))
        .catch(() => toast.error('Failed to load leads'))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
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
      className="mx-auto max-w-6xl space-y-5"
    >
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-medium text-gray-700">{leads.length}</span> leads in pipeline
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-52 h-9 rounded-lg bg-gray-50 border-gray-200/60 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-600/20 focus-visible:border-blue-300"
            />
          </div>

          {/* Stage filter pills */}
          <div className="hidden lg:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setStageFilter('ALL')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                stageFilter === 'ALL'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              All
            </button>
            {stages.map(s => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap',
                  stageFilter === s
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-md transition-all duration-200',
                viewMode === 'table'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                'p-1.5 rounded-md transition-all duration-200',
                viewMode === 'board'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
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
        <motion.div variants={fadeUp} className="bg-white rounded-xl border border-gray-200/60 p-8">
          <div className="h-56 bg-gray-100 rounded-lg animate-pulse" />
        </motion.div>
      ) : viewMode === 'table' ? (
        <motion.div variants={fadeUp}>
          <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200/60 bg-gray-50/60">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Business</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Industry</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Stage</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Score</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Updated</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <motion.tbody variants={container} initial="hidden" animate="show">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-center mb-4">
                            <Search className="w-5 h-5 text-gray-300" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">No leads yet</p>
                          <p className="text-xs text-gray-400 mt-1">Add your first lead to get started</p>
                          <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} onCreated={refresh} />
                        </div>
                      </td>
                    </tr>
                  ) : leads.map(lead => (
                    <motion.tr
                      key={lead.id}
                      variants={fadeUp}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 cursor-pointer transition-colors group"
                      onClick={() => setView('lead-detail', lead.id)}
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm">{lead.business.name}</div>
                        {lead.business.city && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {lead.business.city}{lead.business.country ? `, ${lead.business.country}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-500 font-medium">{lead.business.industry || '—'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] font-medium rounded-md border px-2.5 py-0.5',
                            STAGE_COLORS[lead.stage]
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', STAGE_DOT_COLORS[lead.stage])} />
                          {lead.stage.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        {lead.decisionMaker ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lead.decisionMaker}</div>
                            {lead.decisionMakerRole && <div className="text-xs text-gray-400">{lead.decisionMakerRole}</div>}
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        {lead.score > 0 && (
                          <Badge
                            variant="outline"
                            className={cn('text-[11px] font-bold rounded-md px-2 py-0.5 border', getScoreColor(lead.score))}
                          >
                            {lead.score}
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {processingLeads.has(lead.id) ? (
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            <span className="text-xs text-gray-400">Analyzing...</span>
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
                              className="inline-flex items-center gap-1.5 h-7 min-w-[44px] justify-center px-2 text-[11px] font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              title={!lead.business.website ? 'No website' : 'Audit website'}
                            >
                              <Globe2 className="w-3 h-3" />
                              Audit
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleQualify(lead) }}
                              disabled={processingLeads.has(lead.id)}
                              className="inline-flex items-center gap-1.5 h-7 min-w-[44px] justify-center px-2 text-[11px] font-medium rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              title="Qualify lead with AI"
                            >
                              <Target className="w-3 h-3" />
                              Qualify
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs font-medium">{format(new Date(lead.updatedAt), 'MMM d')}</td>
                      <td className="px-3 py-3">
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage)
            return (
              <div key={stage} className="min-w-[280px] flex-1">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={cn('w-2 h-2 rounded-full', STAGE_DOT_COLORS[stage])} />
                  <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{stage.replace(/_/g, ' ')}</span>
                  <span className="text-[11px] text-gray-400 bg-gray-100 rounded-md px-1.5 py-0.5 font-medium tabular-nums">{stageLeads.length}</span>
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
                      whileHover={{ y: -1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <div
                        className="bg-white rounded-xl border border-gray-200/60 hover:border-blue-200/60 hover:shadow-sm transition-all cursor-pointer p-4"
                        onClick={() => setView('lead-detail', lead.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900 truncate pr-2">{lead.business.name}</p>
                          {lead.score > 0 && (
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] font-bold rounded-md px-1.5 py-0 border shrink-0', getScoreColor(lead.score))}
                            >
                              {lead.score}
                            </Badge>
                          )}
                        </div>
                        {lead.business.industry && (
                          <p className="text-xs text-gray-400 mb-2">{lead.business.industry}</p>
                        )}
                        {lead.decisionMaker && (
                          <p className="text-xs text-gray-500 mb-3">{lead.decisionMaker}</p>
                        )}
                        <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                          <button
                            onClick={e => { e.stopPropagation(); handleAudit(lead) }}
                            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-blue-50 transition-colors"
                            title="Audit"
                            disabled={!lead.business.website || processingLeads.has(lead.id)}
                          >
                            {processingLeads.has(lead.id)
                              ? <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                              : <Globe2 className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600 transition-colors" />}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleQualify(lead) }}
                            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-emerald-50 transition-colors"
                            title="Qualify"
                            disabled={processingLeads.has(lead.id)}
                          >
                            {processingLeads.has(lead.id)
                              ? <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                              : <Target className="w-3.5 h-3.5 text-gray-400 hover:text-emerald-600 transition-colors" />}
                          </button>
                          {completedLeads.has(lead.id) && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-0.5" />}
                          <div className="flex-1" />
                          <div className="flex items-center gap-1 text-gray-400">
                            <Mail className="w-3 h-3" />
                            <span className="text-[11px] font-medium tabular-nums">{lead._count.outreaches}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 ml-2">
                            <CalendarIcon className="w-3 h-3" />
                            <span className="text-[11px] font-medium tabular-nums">{lead._count.meetings}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="bg-gray-50/80 rounded-xl p-6 text-center border border-dashed border-gray-200/60">
                      <p className="text-xs text-gray-400 font-medium">No leads</p>
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
    } catch { toast.error('Failed to save lead') }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm px-4 text-sm">
          <Plus className="w-4 h-4 mr-1.5" />Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-[95vw] sm:w-full rounded-xl border-0 shadow-xl p-0 overflow-hidden">
        <div className="bg-blue-600 px-5 py-4">
          <DialogTitle className="text-base font-semibold text-white">Add New Lead</DialogTitle>
          <p className="text-xs text-blue-100 mt-1">Fill in the details below to add a new lead to your pipeline</p>
        </div>
        <div className="px-5 py-5 space-y-5">
          {/* Business Information Section */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Business Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-1 sm:col-span-2">
                <Label className="text-xs font-medium text-gray-500">Company Name *</Label>
                <Input
                  className="mt-1.5 h-9 rounded-lg bg-gray-50 border-gray-200/60 focus-visible:ring-1 focus-visible:ring-blue-600/20 text-sm"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Website</Label>
                <Input
                  className="mt-1.5 h-9 rounded-lg bg-gray-50 border-gray-200/60 focus-visible:ring-1 focus-visible:ring-blue-600/20 text-sm"
                  value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Industry</Label>
                <Input
                  className="mt-1.5 h-9 rounded-lg bg-gray-50 border-gray-200/60 focus-visible:ring-1 focus-visible:ring-blue-600/20 text-sm"
                  value={form.industry}
                  onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                  placeholder="Law Firm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">City</Label>
                <Input
                  className="mt-1.5 h-9 rounded-lg bg-gray-50 border-gray-200/60 focus-visible:ring-1 focus-visible:ring-blue-600/20 text-sm"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Country</Label>
                <Input
                  className="mt-1.5 h-9 rounded-lg bg-gray-50 border-gray-200/60 focus-visible:ring-1 focus-visible:ring-blue-600/20 text-sm"
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  placeholder="USA"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Phone</Label>
                <Input
                  className="mt-1.5 h-9 rounded-lg bg-gray-50 border-gray-200/60 focus-visible:ring-1 focus-visible:ring-blue-600/20 text-sm"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555-0123"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Email</Label>
                <Input
                  className="mt-1.5 h-9 rounded-lg bg-gray-50 border-gray-200/60 focus-visible:ring-1 focus-visible:ring-blue-600/20 text-sm"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="info@company.com"
                />
              </div>
            </div>
          </div>

          {/* Decision Maker Section */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Decision Maker</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-500">Name</Label>
                <Input
                  className="mt-1.5 h-9 rounded-lg bg-gray-50 border-gray-200/60 focus-visible:ring-1 focus-visible:ring-blue-600/20 text-sm"
                  value={form.decisionMaker}
                  onChange={e => setForm(f => ({ ...f, decisionMaker: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Role</Label>
                <Input
                  className="mt-1.5 h-9 rounded-lg bg-gray-50 border-gray-200/60 focus-visible:ring-1 focus-visible:ring-blue-600/20 text-sm"
                  value={form.decisionMakerRole}
                  onChange={e => setForm(f => ({ ...f, decisionMakerRole: e.target.value }))}
                  placeholder="CEO"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Label className="text-xs font-medium text-gray-500">Email</Label>
                <Input
                  className="mt-1.5 h-9 rounded-lg bg-gray-50 border-gray-200/60 focus-visible:ring-1 focus-visible:ring-blue-600/20 text-sm"
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
        <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-2.5">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border-gray-200/60 text-gray-500 hover:bg-gray-100 font-medium h-9 px-4 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !form.name}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-5 shadow-sm transition-all disabled:opacity-50 text-sm"
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