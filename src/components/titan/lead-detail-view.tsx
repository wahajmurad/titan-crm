'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LEAD_STAGES, STAGE_COLORS, STAGE_DOT_COLORS } from '@/lib/types'
import { ArrowLeft, ExternalLink, Phone, Mail, Globe, MapPin, Building2, Send, Calendar, Trash2, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

// ─── Data Types ────────────────────────────────────────────────────────

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

// ─── Animation ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const stagger = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

// ─── Score Gauge Component ─────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const size = 110
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.min(Math.max(score, 0), 100)
  const offset = circumference - (clampedScore / 100) * circumference

  const color = clampedScore >= 70 ? '#10B981' : clampedScore >= 40 ? '#F59E0B' : '#EF4444'
  const bgColor = clampedScore >= 70 ? 'bg-emerald-50 text-emerald-700' : clampedScore >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'

  return (
    <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">Score</p>
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth}
            />
            <motion.circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={color} strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#0F172A] tabular-nums">{clampedScore}</span>
            <span className="text-[10px] text-[#94A3B8] font-medium">out of 100</span>
          </div>
        </div>
        <Badge className={cn('mt-3 text-[11px] font-semibold rounded-full px-3 py-0.5 border-0', bgColor)}>
          {clampedScore >= 70 ? 'High Quality' : clampedScore >= 40 ? 'Medium Quality' : 'Low Quality'}
        </Badge>
      </div>
    </Card>
  )
}

// ─── Meeting Status Badge ──────────────────────────────────────────────

function MeetingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <Badge variant="outline" className={cn('text-[11px] font-semibold rounded-lg px-2 py-0.5', styles[status] || 'bg-slate-50 text-slate-600 border-slate-200')}>
      {status}
    </Badge>
  )
}

// ─── Outreach Status Badge ─────────────────────────────────────────────

function OutreachStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SENT: 'bg-blue-50 text-blue-700 border-blue-200',
    REPLIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    BOUNCED: 'bg-red-50 text-red-700 border-red-200',
    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
    FAILED: 'bg-red-50 text-red-700 border-red-200',
    OPENED: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <Badge variant="outline" className={cn('text-[11px] font-semibold rounded-lg px-2 py-0.5', styles[status] || 'bg-slate-50 text-slate-600 border-slate-200')}>
      {status}
    </Badge>
  )
}

// ─── Component ────────────────────────────────────────────────────────

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
      .catch(() => toast.error('Failed to load lead'))
      .finally(() => setLoading(false))
  }, [selectedLeadId, refreshKey])

  const refresh = () => setRefreshKey(k => k + 1)

  const updateStage = async (stage: string) => {
    if (!lead) return
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    if (!res.ok) { toast.error('Failed to update stage'); return }
    setEditingStage(false)
    refresh()
  }

  const updateNotes = async () => {
    if (!lead || !newNote.trim()) return
    const updated = [lead.notes, newNote.trim()].filter(Boolean).join('\n---\n')
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: updated }),
    })
    if (!res.ok) { toast.error('Failed to save note'); return }
    setNewNote('')
    refresh()
  }

  const deleteLead = async () => {
    if (!lead) return
    if (!confirm('Delete this lead? This cannot be undone.')) return
    const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete lead'); return }
    setView('leads')
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-48 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-5">
            <div className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!lead) return <p className="text-[#475569] py-12 text-center font-medium">Lead not found</p>

  const b = lead.business

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('leads')}
            className="text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-100 rounded-xl h-9 w-9 p-0 flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight truncate">{b.name}</h1>
              {b.industry && (
                <Badge variant="outline" className="text-xs font-semibold rounded-lg px-2.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                  {b.industry}
                </Badge>
              )}
            </div>
            {b.city && (
              <p className="text-sm text-[#94A3B8] mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {b.city}{b.country ? `, ${b.country}` : ''}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 rounded-xl h-9 px-3 font-semibold shrink-0"
          onClick={deleteLead}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete
        </Button>
      </motion.div>

      {/* ─── Main Content ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Business Info */}
          <motion.div variants={fadeUp}>
            <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Business Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {b.website && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 sm:col-span-2 group">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <a href={b.website} target="_blank" rel="noopener" className="text-sm text-[#2563EB] hover:underline truncate font-medium">
                      {b.website}
                    </a>
                    <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 group-hover:text-[#2563EB] transition-colors" />
                  </div>
                )}
                {b.phone && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-[#0F172A] font-medium">{b.phone}</span>
                  </div>
                )}
                {b.email && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm text-[#0F172A] font-medium">{b.email}</span>
                  </div>
                )}
                {b.companySize && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm text-[#0F172A] font-medium">{b.companySize}</span>
                  </div>
                )}
                {b.source && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                      <ExternalLink className="w-4 h-4 text-cyan-600" />
                    </div>
                    <span className="text-sm text-[#475569]">Source: <span className="text-[#0F172A] font-medium">{b.source}</span></span>
                  </div>
                )}
                {b.businessCategory && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-sm text-[#0F172A] font-medium">{b.businessCategory}</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Decision Maker */}
          <motion.div variants={fadeUp}>
            <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Decision Maker</h3>
              {lead.decisionMaker ? (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-md ring-4 ring-blue-50">
                      {lead.decisionMaker.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#0F172A]">{lead.decisionMaker}</p>
                    {lead.decisionMakerRole && (
                      <p className="text-sm text-[#94A3B8] mt-0.5">{lead.decisionMakerRole}</p>
                    )}
                    {lead.decisionMakerEmail && (
                      <p className="text-sm text-[#2563EB] mt-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {lead.decisionMakerEmail}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-400 text-lg">?</span>
                  </div>
                  <div>
                    <p className="text-sm text-[#94A3B8] font-medium">Not identified yet</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">Use AI qualification to find decision makers</p>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Recommended Solution */}
          {lead.recommendedSolution && (
            <motion.div variants={fadeUp}>
              <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Recommended Solution</h3>
                <p className="text-sm text-[#475569] whitespace-pre-wrap leading-relaxed">{lead.recommendedSolution}</p>
              </Card>
            </motion.div>
          )}

          {/* Outreach History */}
          <motion.div variants={fadeUp}>
            <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Send className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">Outreach History</h3>
                </div>
                <span className="text-xs text-[#94A3B8] font-medium bg-slate-50 rounded-full px-2.5 py-0.5 tabular-nums">{lead.outreaches.length}</span>
              </div>
              {lead.outreaches.length === 0 ? (
                <div className="flex flex-col items-center py-10">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-2">
                    <Send className="w-4 h-4 text-slate-300" />
                  </div>
                  <p className="text-sm text-[#94A3B8]">No outreach yet</p>
                </div>
              ) : (
                <div className="space-y-0.5 max-h-72 overflow-y-auto">
                  <motion.div variants={container} initial="hidden" animate="show">
                    {lead.outreaches.map(o => {
                      const statusColors: Record<string, string> = {
                        SENT: 'border-l-blue-500', REPLIED: 'border-l-emerald-500',
                        BOUNCED: 'border-l-red-500', DRAFT: 'border-l-slate-300',
                        FAILED: 'border-l-red-500', OPENED: 'border-l-purple-500',
                      }
                      return (
                        <motion.div
                          key={o.id}
                          variants={stagger}
                          className={cn('border-l-[3px] pl-4 py-3 hover:bg-slate-50/80 rounded-r-xl transition-colors', statusColors[o.status] || 'border-l-slate-300')}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-[#0F172A]">{o.subject}</span>
                            <OutreachStatusBadge status={o.status} />
                          </div>
                          <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">{o.body}</p>
                          <p className="text-[11px] text-[#94A3B8] mt-1.5 font-medium">
                            {o.sentAt ? format(new Date(o.sentAt), 'MMM d, h:mm a') : 'Draft'} · {o.type.replace(/_/g, ' ')}
                          </p>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Meetings */}
          <motion.div variants={fadeUp}>
            <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-cyan-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">Meetings</h3>
                </div>
                <span className="text-xs text-[#94A3B8] font-medium bg-slate-50 rounded-full px-2.5 py-0.5 tabular-nums">{lead.meetings.length}</span>
              </div>
              {lead.meetings.length === 0 ? (
                <div className="flex flex-col items-center py-10">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-2">
                    <Calendar className="w-4 h-4 text-slate-300" />
                  </div>
                  <p className="text-sm text-[#94A3B8]">No meetings yet</p>
                </div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
                  {lead.meetings.map(m => (
                    <motion.div
                      key={m.id}
                      variants={stagger}
                      className="flex items-center justify-between bg-slate-50/80 rounded-xl px-4 py-3.5 hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                          <Calendar className="w-4 h-4 text-cyan-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0F172A] truncate">{m.title}</p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">
                            {format(new Date(m.date), 'MMM d, yyyy')} · {m.duration}min
                          </p>
                        </div>
                      </div>
                      <MeetingStatusBadge status={m.status} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* ─── Sidebar ──────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Current Stage */}
          <motion.div variants={fadeUp}>
            <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Current Stage</p>
              {editingStage ? (
                <Select defaultValue={lead.stage} onValueChange={v => updateStage(v)}>
                  <SelectTrigger className="rounded-xl border-0 bg-slate-50 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="cursor-pointer group" onClick={() => setEditingStage(true)}>
                  <Badge
                    variant="outline"
                    className={cn('text-sm font-semibold rounded-xl px-3.5 py-1.5 transition-all group-hover:shadow-sm', STAGE_COLORS[lead.stage])}
                  >
                    <span className={cn('w-2 h-2 rounded-full mr-2', STAGE_DOT_COLORS[lead.stage])} />
                    {lead.stage.replace(/_/g, ' ')}
                  </Badge>
                  <p className="text-[11px] text-[#94A3B8] mt-2">Click to change stage</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Score Gauge */}
          <motion.div variants={fadeUp}>
            <ScoreGauge score={lead.score} />
          </motion.div>

          {/* Quick Personalize Action */}
          <motion.div variants={fadeUp}>
            <Card
              className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border-0 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => setView('personalization')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-sm shadow-rose-500/20 group-hover:shadow-rose-500/40 transition-shadow">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Hyper-Personalize</div>
                  <div className="text-[11px] text-gray-500">Run full 10-step pipeline</div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          <motion.div variants={fadeUp}>
            <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Activity</h3>
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-3 max-h-56 overflow-y-auto">
                {lead.activities.length === 0 ? (
                  <p className="text-xs text-[#94A3B8]">No activity</p>
                ) : (
                  lead.activities.map(a => (
                    <motion.div key={a.id} variants={stagger} className="text-xs">
                      <p className="text-[#475569] font-medium leading-relaxed">{a.details}</p>
                      <p className="text-[#94A3B8] mt-0.5">
                        {a.user?.name || 'System'} · {format(new Date(a.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </Card>
          </motion.div>

          {/* Notes */}
          <motion.div variants={fadeUp}>
            <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Notes</h3>
              {lead.notes && (
                <div className="bg-slate-50 rounded-xl p-3.5 mb-4 max-h-40 overflow-y-auto">
                  <p className="text-xs text-[#475569] whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
                </div>
              )}
              <Textarea
                placeholder="Add a note..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                className="text-sm min-h-[80px] rounded-xl bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30 resize-none placeholder:text-[#94A3B8]"
              />
              <Button
                size="sm"
                className="w-full mt-3 h-10 rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                onClick={updateNotes}
                disabled={!newNote.trim()}
              >
                Add Note
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}