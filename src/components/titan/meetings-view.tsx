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
import { Plus, Calendar, Video, MapPin, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

interface MeetingItem {
  id: string; title: string; description: string | null; date: string
  duration: number; status: string; location: string | null; meetingLink: string | null; notes: string | null
  lead: { business: { name: string; website: string | null; email: string | null; phone: string | null } }
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  SCHEDULED: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Calendar },
  COMPLETED: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  CANCELLED: { color: 'bg-slate-100 text-gray-400 border-slate-200', icon: XCircle },
  NO_SHOW: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-400 mt-0.5">{upcoming.length} upcoming · {past.length} past</p>
        </div>
        <BookMeetingDialog open={addOpen} onOpenChange={setAddOpen} leads={leads} onCreated={refresh} />
      </div>

      {loading ? (
        <Card><CardContent className="p-8"><div className="h-48 bg-slate-100 rounded-lg animate-pulse" /></CardContent></Card>
      ) : meetings.length === 0 ? (
        <Card className="border-slate-200"><CardContent className="py-16 text-center">
          <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No meetings yet</p>
          <p className="text-sm text-gray-500 mt-1">Book your first meeting from a lead</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-400 mb-2">Upcoming</h2>
              <div className="grid gap-3">
                {upcoming.map(m => <MeetingCard key={m.id} meeting={m} onUpdate={refresh} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-400 mb-2">Past</h2>
              <div className="grid gap-3">
                {past.map(m => <MeetingCard key={m.id} meeting={m} onUpdate={refresh} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MeetingCard({ meeting, onUpdate }: { meeting: MeetingItem; onUpdate: () => void }) {
  const config = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.SCHEDULED
  const Icon = config.icon
  const d = new Date(meeting.date)

  const markComplete = async () => {
    await fetch(`/api/meetings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: meeting.id, status: 'COMPLETED' }) }).catch(() => {})
    onUpdate()
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center shrink-0">
              <span className="text-xs font-medium text-gray-400">{format(d, 'MMM')}</span>
              <span className="text-lg font-bold text-gray-900 leading-tight">{format(d, 'd')}</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">{meeting.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{meeting.lead?.business?.name}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(d, 'h:mm a')} · {meeting.duration}min</span>
                {meeting.meetingLink && <span className="flex items-center gap-1"><Video className="w-3 h-3" />Virtual</span>}
                {meeting.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{meeting.location}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {meeting.status === 'SCHEDULED' && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={markComplete}>Complete</Button>
            )}
            <Badge variant="outline" className={config.color}>
              <Icon className="w-3 h-3 mr-1" />{meeting.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BookMeetingDialog({ open, onOpenChange, leads, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void
  leads: Array<{ id: string; business: { name: string } }>
  onCreated: () => void
}) {
  const [form, setForm] = useState({ leadId: '', title: '', date: '', time: '', duration: '30', location: '', meetingLink: '', description: '' })
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
          duration: parseInt(form.duration), location: form.location || null, meetingLink: form.meetingLink || null, description: form.description || null,
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
        <Button size="sm" className="h-8"><Plus className="w-3.5 h-3.5 mr-1.5" />Book Meeting</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Book Meeting</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div><Label>Lead *</Label>
            <Select value={form.leadId} onValueChange={v => setForm(f => ({ ...f, leadId: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a lead..." /></SelectTrigger>
              <SelectContent>{leads.map(l => <SelectItem key={l.id} value={l.id}>{l.business.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Title *</Label><Input className="mt-1" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Discovery Call" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Date *</Label><Input type="date" className="mt-1" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>Time *</Label><Input type="time" className="mt-1" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></div>
            <div><Label>Duration</Label>
              <Select value={form.duration} onValueChange={v => setForm(f => ({ ...f, duration: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Meeting Link</Label><Input className="mt-1" value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} placeholder="Zoom/Meet link" /></div>
          <div><Label>Location</Label><Input className="mt-1" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Office address" /></div>
          <div><Label>Notes</Label><Textarea className="mt-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Meeting agenda or notes" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || !form.leadId || !form.title || !form.date || !form.time}>{loading ? 'Saving...' : 'Book Meeting'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}