'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LEAD_STAGES, STAGE_COLORS, STAGE_DOT_COLORS, type LeadStage } from '@/lib/types'
import { Plus, Search, List, Columns3, ChevronRight, ExternalLink, Phone, Mail, Globe, Globe2, Target, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-400 mt-0.5">{leads.length} leads in pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 w-48 h-8 text-sm"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stages</SelectItem>
              {LEAD_STAGES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('table')} className={cn('p-1.5', viewMode === 'table' ? 'bg-gray-100' : 'hover:bg-gray-50')}>
              <List className="w-3.5 h-3.5 text-gray-300" />
            </button>
            <button onClick={() => setViewMode('board')} className={cn('p-1.5', viewMode === 'board' ? 'bg-gray-100' : 'hover:bg-gray-50')}>
              <Columns3 className="w-3.5 h-3.5 text-gray-300" />
            </button>
          </div>
          <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} onCreated={refresh} />
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="p-8"><div className="h-48 bg-gray-100 rounded-lg animate-pulse" /></CardContent></Card>
      ) : viewMode === 'table' ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Emails</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No leads yet. Add your first lead to get started.</td></tr>
                  ) : leads.map(lead => (
                    <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => setView('lead-detail', lead.id)}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{lead.business.name}</div>
                        {lead.business.city && <div className="text-xs text-gray-500 mt-0.5">{lead.business.city}{lead.business.country ? `, ${lead.business.country}` : ''}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{lead.business.industry || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('text-xs font-medium', STAGE_COLORS[lead.stage])}>{lead.stage.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {lead.decisionMaker ? (
                          <div>
                            <div className="text-gray-700">{lead.decisionMaker}</div>
                            {lead.decisionMakerRole && <div className="text-xs text-gray-500">{lead.decisionMakerRole}</div>}
                          </div>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{lead._count.outreaches}</td>
                      <td className="px-4 py-3">
                        {processingLeads.has(lead.id) ? (
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                            <span className="text-xs text-gray-500">Analyzing...</span>
                          </div>
                        ) : completedLeads.has(lead.id) ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs text-emerald-600">Done</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); handleAudit(lead) }}
                              disabled={!lead.business.website || processingLeads.has(lead.id)}
                              className="inline-flex items-center gap-1 h-7 px-2 text-xs font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                              title={!lead.business.website ? 'No website' : 'Audit website'}
                            >
                              {processingLeads.has(lead.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe2 className="w-3 h-3" />}
                              Audit
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleQualify(lead) }}
                              disabled={processingLeads.has(lead.id)}
                              className="inline-flex items-center gap-1 h-7 px-2 text-xs font-medium rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                              title="Qualify lead with AI"
                            >
                              {processingLeads.has(lead.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Target className="w-3 h-3" />}
                              Qualify
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(lead.updatedAt), 'MMM d')}</td>
                      <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-gray-600" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Kanban Board */
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage)
            return (
              <div key={stage} className="min-w-64 flex-1">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={cn('w-2 h-2 rounded-full', STAGE_DOT_COLORS[stage])} />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stage.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-600">{stageLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {stageLeads.map(lead => (
                    <Card
                      key={lead.id}
                      className="border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setView('lead-detail', lead.id)}
                    >
                      <CardContent className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{lead.business.name}</p>
                        {lead.business.industry && <p className="text-xs text-gray-500 mt-1">{lead.business.industry}</p>}
                        {lead.decisionMaker && <p className="text-xs text-gray-400 mt-1.5">{lead.decisionMaker}</p>}
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                          <button onClick={e => { e.stopPropagation(); handleAudit(lead) }} className="p-1 rounded hover:bg-blue-50 transition-all duration-150" title="Audit" disabled={!lead.business.website || processingLeads.has(lead.id)}>
                            {processingLeads.has(lead.id) ? <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" /> : <Globe2 className="w-3.5 h-3.5 text-blue-500" />}
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleQualify(lead) }} className="p-1 rounded hover:bg-emerald-50 transition-all duration-150" title="Qualify" disabled={processingLeads.has(lead.id)}>
                            {processingLeads.has(lead.id) ? <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" /> : <Target className="w-3.5 h-3.5 text-emerald-500" />}
                          </button>
                          {completedLeads.has(lead.id) && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          <div className="flex-1" />
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{lead._count.outreaches}</span>
                          <Calendar className="w-3 h-3 text-gray-400 ml-1" />
                          <span className="text-xs text-gray-500">{lead._count.meetings}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-600">No leads</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AddLeadDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', website: '', industry: '', city: '', country: '', phone: '', email: '', decisionMaker: '', decisionMakerRole: '', decisionMakerEmail: '' })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: { name: form.name, website: form.website, industry: form.industry, city: form.city, country: form.country, phone: form.phone, email: form.email },
          decisionMaker: form.decisionMaker, decisionMakerRole: form.decisionMakerRole, decisionMakerEmail: form.decisionMakerEmail,
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
        <Button size="sm" className="h-8"><Plus className="w-3.5 h-3.5 mr-1.5" />Add Lead</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2"><Label>Company Name *</Label><Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" /></div>
          <div><Label>Website</Label><Input className="mt-1" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." /></div>
          <div><Label>Industry</Label><Input className="mt-1" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="Law Firm" /></div>
          <div><Label>City</Label><Input className="mt-1" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="New York" /></div>
          <div><Label>Country</Label><Input className="mt-1" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="USA" /></div>
          <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555-0123" /></div>
          <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="info@company.com" /></div>
          <div className="col-span-2 border-t border-gray-100 pt-3 mt-1"><p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Decision Maker</p></div>
          <div><Label>Name</Label><Input className="mt-1" value={form.decisionMaker} onChange={e => setForm(f => ({ ...f, decisionMaker: e.target.value }))} placeholder="John Smith" /></div>
          <div><Label>Role</Label><Input className="mt-1" value={form.decisionMakerRole} onChange={e => setForm(f => ({ ...f, decisionMakerRole: e.target.value }))} placeholder="CEO" /></div>
          <div className="col-span-2"><Label>Email</Label><Input className="mt-1" type="email" value={form.decisionMakerEmail} onChange={e => setForm(f => ({ ...f, decisionMakerEmail: e.target.value }))} placeholder="john@company.com" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || !form.name}>{loading ? 'Saving...' : 'Add Lead'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Calendar({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
    </svg>
  )
}