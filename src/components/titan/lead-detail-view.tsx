'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LEAD_STAGES, STAGE_COLORS, STAGE_DOT_COLORS } from '@/lib/types'
import { ArrowLeft, ExternalLink, Phone, Mail, Globe, MapPin, Building2, Send, Calendar, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Activity {
  id: string; action: string; details: string; createdAt: string
  user: { name: string } | null
}

interface Outreach {
  id: string; subject: string; body: string; status: string; type: string
  sentAt: string | null; createdAt: string
}

interface Meeting {
  id: string; title: string; date: string; duration: number; status: string; meetingLink: string | null; notes: string | null
}

interface LeadDetail {
  id: string; stage: string; score: number; decisionMaker: string | null
  decisionMakerRole: string | null; decisionMakerEmail: string | null
  recommendedSolution: string | null; notes: string | null
  aiAnalysis: string | null; problems: string | null
  createdAt: string; updatedAt: string
  business: { id: string; name: string; website: string | null; industry: string | null
    city: string | null; country: string | null; phone: string | null; email: string | null
    socialProfiles: string | null; companySize: string | null; businessCategory: string | null; source: string | null }
  assignedTo: { id: string; name: string; email: string } | null
  outreaches: Outreach[]; meetings: Meeting[]; activities: Activity[]
}

export function LeadDetailView() {
  const { selectedLeadId, setView } = useAppStore()
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingStage, setEditingStage] = useState(false)
  const [newNote, setNewNote] = useState('')

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!selectedLeadId) return
    fetch(`/api/leads/${selectedLeadId}`)
      .then(r => r.json())
      .then(d => setLead(d.lead))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedLeadId, refreshKey])

  const refresh = () => setRefreshKey(k => k + 1)

  const updateStage = async (stage: string) => {
    if (!lead) return
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    setEditingStage(false)
    refresh()
  }

  const updateNotes = async () => {
    if (!lead || !newNote.trim()) return
    const updated = [lead.notes, newNote.trim()].filter(Boolean).join('\n---\n')
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: updated }),
    })
    setNewNote('')
    refresh()
  }

  const deleteLead = async () => {
    if (!lead) return
    if (!confirm('Delete this lead? This cannot be undone.')) return
    await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    setView('leads')
  }

  if (loading) return <Card><CardContent className="p-8"><div className="h-64 bg-slate-100 rounded-lg animate-pulse" /></CardContent></Card>
  if (!lead) return <p className="text-gray-500 py-8 text-center">Lead not found</p>

  const b = lead.business

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setView('leads')} className="text-gray-400">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{b.name}</h1>
            {b.industry && <Badge variant="outline" className="text-xs">{b.industry}</Badge>}
          </div>
          {b.city && <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{b.city}{b.country ? `, ${b.country}` : ''}</p>}
        </div>
        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={deleteLead}>
          <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Business Info</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              {b.website && <div className="flex items-center gap-2 text-gray-300 col-span-2"><Globe className="w-3.5 h-3.5 text-gray-500" /><a href={b.website} target="_blank" rel="noopener" className="text-blue-600 hover:underline truncate">{b.website}</a></div>}
              {b.phone && <div className="flex items-center gap-2 text-gray-300"><Phone className="w-3.5 h-3.5 text-gray-500" />{b.phone}</div>}
              {b.email && <div className="flex items-center gap-2 text-gray-300"><Mail className="w-3.5 h-3.5 text-gray-500" />{b.email}</div>}
              {b.companySize && <div className="flex items-center gap-2 text-gray-300"><Building2 className="w-3.5 h-3.5 text-gray-500" />{b.companySize}</div>}
              {b.source && <div className="flex items-center gap-2 text-gray-300"><ExternalLink className="w-3.5 h-3.5 text-gray-500" />Source: {b.source}</div>}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Decision Maker</CardTitle></CardHeader>
            <CardContent>
              {lead.decisionMaker ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-gray-300">
                      {lead.decisionMaker.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.decisionMaker}</p>
                      {lead.decisionMakerRole && <p className="text-xs text-gray-400">{lead.decisionMakerRole}</p>}
                    </div>
                  </div>
                  {lead.decisionMakerEmail && <p className="text-sm text-gray-300 flex items-center gap-2 mt-2"><Mail className="w-3.5 h-3.5" />{lead.decisionMakerEmail}</p>}
                </div>
              ) : <p className="text-sm text-gray-500">Not identified yet</p>}
            </CardContent>
          </Card>

          {lead.recommendedSolution && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Recommended Solution</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.recommendedSolution}</p></CardContent>
            </Card>
          )}

          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Send className="w-4 h-4" />Outreach History ({lead.outreaches.length})</CardTitle></CardHeader>
            <CardContent>
              {lead.outreaches.length === 0 ? <p className="text-sm text-gray-500">No outreach yet</p> : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {lead.outreaches.map(o => (
                    <div key={o.id} className="border-l-2 border-slate-200 pl-3 py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900">{o.subject}</span>
                        <Badge variant="outline" className="text-xs">{o.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{o.body}</p>
                      <p className="text-xs text-gray-500 mt-1">{o.sentAt ? format(new Date(o.sentAt), 'MMM d, h:mm a') : 'Draft'} · {o.type.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" />Meetings ({lead.meetings.length})</CardTitle></CardHeader>
            <CardContent>
              {lead.meetings.length === 0 ? <p className="text-sm text-gray-500">No meetings yet</p> : (
                <div className="space-y-2">
                  {lead.meetings.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.title}</p>
                        <p className="text-xs text-gray-400">{format(new Date(m.date), 'MMM d, yyyy')} · {m.duration}min</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{m.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Current Stage</p>
              {editingStage ? (
                <Select defaultValue={lead.stage} onValueChange={v => updateStage(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAD_STAGES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <div className="cursor-pointer" onClick={() => setEditingStage(true)}>
                  <Badge variant="outline" className={cn('text-sm', STAGE_COLORS[lead.stage])}>
                    <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', STAGE_DOT_COLORS[lead.stage])} />
                    {lead.stage.replace(/_/g, ' ')}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Score</p>
              <p className="text-2xl font-bold text-gray-900">{lead.score}<span className="text-sm text-gray-500 font-normal">/100</span></p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {lead.activities.map(a => (
                  <div key={a.id} className="text-xs">
                    <p className="text-gray-300">{a.details}</p>
                    <p className="text-gray-500 mt-0.5">{a.user?.name} · {format(new Date(a.createdAt), 'MMM d, h:mm a')}</p>
                  </div>
                ))}
                {lead.activities.length === 0 && <p className="text-xs text-gray-500">No activity</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Notes</CardTitle></CardHeader>
            <CardContent>
              {lead.notes && <p className="text-xs text-gray-300 whitespace-pre-wrap mb-3 max-h-32 overflow-y-auto">{lead.notes}</p>}
              <Textarea placeholder="Add a note..." value={newNote} onChange={e => setNewNote(e.target.value)} className="text-sm min-h-[60px]" />
              <Button size="sm" className="w-full mt-2 h-7" onClick={updateNotes} disabled={!newNote.trim()}>Add Note</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}