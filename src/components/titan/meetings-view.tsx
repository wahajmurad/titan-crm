'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Calendar, Video, MapPin, Clock, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface MeetingItem {
 id: string; title: string; description: string | null; date: string
 duration: number; status: string; location: string | null; meetingLink: string | null; notes: string | null
 lead: { business: { name: string; website: string | null; email: string | null; phone: string | null } }
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
 SCHEDULED: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100', icon: Calendar },
 COMPLETED: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
 CANCELLED: { color: 'text-gray-400', bg: 'bg-gray-50 border-gray-100', icon: XCircle },
 NO_SHOW: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100', icon: AlertTriangle },
}

const container = {
 hidden: { opacity: 0 },
 show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
 hidden: { opacity: 0, y: 12 },
 show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function MeetingsView() {
 const [meetings, setMeetings] = useState<MeetingItem[]>([])
 const [leads, setLeads] = useState<Array<{ id: string; business: { name: string } }>>([])
 const [loading, setLoading] = useState(true)
 const [addOpen, setAddOpen] = useState(false)
 const [refreshKey, setRefreshKey] = useState(0)

 useEffect(() => {
  Promise.all([fetch('/api/meetings'), fetch('/api/leads?limit=200')])
   .then(([mRes, lRes]) => Promise.all([mRes.json(), lRes.json()]))
   .then(([mData, lData]) => {
    setMeetings(mData.meetings || [])
    setLeads(lData.leads || [])
   })
   .catch(() => {})
   .finally(() => setLoading(false))
 }, [refreshKey])

 const refresh = () => setRefreshKey(k => k + 1)
 const upcoming = meetings.filter(m => m.status === 'SCHEDULED' && new Date(m.date) >= new Date())
 const past = meetings.filter(m => m.status !== 'SCHEDULED' || new Date(m.date) < new Date())

 return (
  <motion.div className="mx-auto max-w-5xl space-y-6" variants={container} initial="hidden" animate="show">
   {/* Header */}
   <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
     <h1 className="text-2xl font-bold tracking-tight text-gray-900">Meetings</h1>
     <p className="text-sm text-gray-500 mt-0.5">
      <span className="font-medium text-blue-600">{upcoming.length}</span> upcoming
      <span className="mx-1.5 text-gray-300">·</span>
      <span className="font-medium text-gray-600">{past.length}</span> past
     </p>
    </div>
    <BookMeetingDialog open={addOpen} onOpenChange={setAddOpen} leads={leads} onCreated={refresh} />
   </motion.div>

   {/* Content */}
   {loading ? (
    <div className="grid gap-3">
     {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
     ))}
    </div>
   ) : meetings.length === 0 ? (
    <motion.div
     variants={item}
 className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50"
    >
     <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
      <Calendar className="w-6 h-6 text-blue-400" />
     </div>
     <p className="text-sm font-semibold text-gray-700">No meetings yet</p>
     <p className="text-xs text-gray-400 mt-1">Book your first meeting from a lead detail page</p>
    </motion.div>
   ) : (
    <div className="space-y-6">
     {upcoming.length > 0 && (
      <motion.div variants={item}>
       <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Upcoming</p>
       <div className="grid gap-3">
        {upcoming.map(m => <MeetingCard key={m.id} meeting={m} onUpdate={refresh} />)}
       </div>
      </motion.div>
     )}
     {past.length > 0 && (
      <motion.div variants={item}>
       <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Past</p>
       <div className="grid gap-3">
        {past.map(m => <MeetingCard key={m.id} meeting={m} onUpdate={refresh} />)}
       </div>
      </motion.div>
     )}
    </div>
   )}
  </motion.div>
 )
}

function MeetingCard({ meeting, onUpdate }: { meeting: MeetingItem; onUpdate: () => void }) {
 const config = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.SCHEDULED
 const Icon = config.icon
 const d = new Date(meeting.date)

 const markComplete = async () => {
  await fetch(`/api/meetings`, {
   method: 'PUT',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ id: meeting.id, status: 'COMPLETED' }),
  }).catch(() => {})
  onUpdate()
 }

 return (
  <motion.div
   whileHover={{ y: -2, boxShadow: '0 8px 30px -8px rgba(0,0,0,0.08)' }}
   transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  >
   <div className={cn(
    'rounded-xl border bg-white/80 p-4 transition-colors',
    meeting.status === 'SCHEDULED' ? 'border-blue-100/80 hover:border-blue-200' : 'border-gray-100 hover:border-gray-200'
   )}>
    <div className="flex items-start justify-between gap-4">
     <div className="flex items-start gap-3.5">
      {/* Date block */}
      <div className={cn(
       'w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border',
       meeting.status === 'SCHEDULED'
        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500 shadow-sm'
        : config.bg
      )}>
       <span className={cn('text-[10px] font-semibold uppercase leading-none', meeting.status === 'SCHEDULED' ? 'text-blue-100' : 'text-gray-400')}>
        {format(d, 'MMM')}
       </span>
       <span className={cn('text-xl font-bold leading-tight', meeting.status === 'SCHEDULED' ? 'text-white' : 'text-gray-900')}>
        {format(d, 'd')}
       </span>
      </div>

      {/* Info */}
      <div className="min-w-0">
       <h3 className="text-sm font-semibold text-gray-900 truncate">{meeting.title}</h3>
       <p className="text-xs text-gray-500 mt-0.5">{meeting.lead?.business?.name}</p>
       <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1">
         <Clock className="w-3 h-3" />
         {format(d, 'h:mm a')} · {meeting.duration}min
        </span>
        {meeting.meetingLink && (
         <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors">
          <Video className="w-3 h-3" />
          Virtual
          <ExternalLink className="w-2.5 h-2.5" />
         </a>
        )}
        {meeting.location && (
         <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {meeting.location}
         </span>
        )}
       </div>
      </div>
     </div>

     {/* Actions */}
     <div className="flex items-center gap-2 shrink-0">
      {meeting.status === 'SCHEDULED' && (
       <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={markComplete}
 className="h-8 px-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-100"
       >
        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
        Complete
       </motion.button>
      )}
      <Badge variant="outline" className={cn('text-[11px] font-semibold rounded-lg px-2.5 py-0.5 border', config.bg, config.color)}>
       <Icon className="w-3 h-3 mr-1" />
       {meeting.status.replace(/_/g, ' ')}
      </Badge>
     </div>
    </div>
   </div>
  </motion.div>
 )
}

function BookMeetingDialog({ open, onOpenChange, leads, onCreated }: {
 open: boolean; onOpenChange: (o: boolean) => void
 leads: Array<{ id: string; business: { name: string } }>
 onCreated: () => void
}) {
 const [form, setForm] = useState({
  leadId: '', title: '', date: '', time: '', duration: '30',
  location: '', meetingLink: '', description: '',
 })
 const [loading, setLoading] = useState(false)

 const handleSave = async () => {
  if (!form.leadId || !form.title || !form.date || !form.time) return
  setLoading(true)
  try {
   const dateStr = `${form.date}T${form.time}:00`
   await fetch('/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     leadId: form.leadId, title: form.title, date: new Date(dateStr).toISOString(),
     duration: parseInt(form.duration), location: form.location || null,
     meetingLink: form.meetingLink || null, description: form.description || null,
    }),
   })
   setForm({ leadId: '', title: '', date: '', time: '', duration: '30', location: '', meetingLink: '', description: '' })
   onOpenChange(false)
   onCreated()
  } catch {}
  setLoading(false)
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogTrigger asChild>
    <motion.button
     whileHover={{ scale: 1.02 }}
     whileTap={{ scale: 0.98 }}
 className="h-10 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-sm hover:shadow-md hover: transition-all flex items-center gap-2"
    >
     <Plus className="w-4 h-4" />
     Book Meeting
    </motion.button>
   </DialogTrigger>
   <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-xl border-0 shadow-xl p-0 overflow-hidden">
    <div className="bg-blue-600 px-6 py-5">
     <DialogTitle className="text-lg font-bold text-white">Book Meeting</DialogTitle>
     <p className="text-sm text-blue-100 mt-1">Schedule a meeting with a lead</p>
    </div>
    <div className="px-6 py-5 space-y-4">
     <div>
      <Label className="text-xs font-medium text-gray-500">Lead *</Label>
      <Select value={form.leadId} onValueChange={v => setForm(f => ({ ...f, leadId: v }))}>
       <SelectTrigger className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30">
        <SelectValue placeholder="Select a lead..." />
       </SelectTrigger>
       <SelectContent>{leads.map(l => <SelectItem key={l.id} value={l.id}>{l.business.name}</SelectItem>)}</SelectContent>
      </Select>
     </div>
     <div>
      <Label className="text-xs font-medium text-gray-500">Title *</Label>
      <Input
 className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
       value={form.title}
       onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
       placeholder="Discovery Call"
      />
     </div>
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
       <Label className="text-xs font-medium text-gray-500">Date *</Label>
       <Input type="date" className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      </div>
      <div>
       <Label className="text-xs font-medium text-gray-500">Time *</Label>
       <Input type="time" className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
      </div>
      <div>
       <Label className="text-xs font-medium text-gray-500">Duration</Label>
       <Select value={form.duration} onValueChange={v => setForm(f => ({ ...f, duration: v }))}>
        <SelectTrigger className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30">
         <SelectValue />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="15">15 min</SelectItem>
         <SelectItem value="30">30 min</SelectItem>
         <SelectItem value="45">45 min</SelectItem>
         <SelectItem value="60">60 min</SelectItem>
        </SelectContent>
       </Select>
      </div>
     </div>
     <div>
      <Label className="text-xs font-medium text-gray-500">Meeting Link</Label>
      <Input className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30" value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} placeholder="Zoom/Meet link" />
     </div>
     <div>
      <Label className="text-xs font-medium text-gray-500">Location</Label>
      <Input className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Office address" />
     </div>
     <div>
      <Label className="text-xs font-medium text-gray-500">Notes</Label>
      <Textarea className="mt-1.5 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Meeting agenda or notes" />
     </div>
    </div>
    <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-2.5">
     <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-gray-200 text-gray-500 hover:bg-gray-100 font-semibold h-10 px-5">Cancel</Button>
     <Button
      onClick={handleSave}
      disabled={loading || !form.leadId || !form.title || !form.date || !form.time}
 className="rounded-xl bg-blue-600 text-white font-semibold h-10 px-6 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
     >
      {loading ? 'Booking...' : 'Book Meeting'}
     </Button>
    </div>
   </DialogContent>
  </Dialog>
 )
}