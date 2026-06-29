'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LEAD_STAGES, STAGE_DOT_COLORS } from '@/lib/types'
import { LayoutDashboard, Users, Mail, Calendar, TrendingUp, Target, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'

interface DashboardData {
  totalLeads: number
  stages: Record<string, number>
  outreach: Record<string, number>
  meetings: Record<string, number>
  replyRate: number
  recentActivities: Array<{
    id: string; action: string; details: string; createdAt: string
    user: { name: string } | null
    lead: { business: { name: string } } | null
  }>
  leadsByIndustry: Array<{ industry: string | null; _count: { industry: number } }>
  wonCount: number
  meetingBooked: number
  outreachSent: number
}

const defaultData: DashboardData = {
  totalLeads: 0, stages: {}, outreach: {}, meetings: {}, replyRate: 0,
  recentActivities: [], leadsByIndustry: [], wonCount: 0, meetingBooked: 0, outreachSent: 0,
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData>(defaultData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/dashboard')
        const d = await res.json()
        if (!cancelled) setData(d)
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const stats = [
    { label: 'Total Leads', value: data.totalLeads, icon: Users, color: 'text-slate-600' },
    { label: 'Outreach Sent', value: data.outreachSent, icon: Mail, color: 'text-amber-600' },
    { label: 'Meetings Booked', value: data.meetingBooked, icon: Calendar, color: 'text-blue-600' },
    { label: 'Deals Won', value: data.wonCount, icon: TrendingUp, color: 'text-emerald-600' },
  ]

  if (loading) {
    return <div className="space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-5"><div className="h-16 bg-slate-100 rounded-lg animate-pulse" /></CardContent></Card>)}
    </div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your acquisition pipeline at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-1">{s.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-slate-50 ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline Distribution */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Pipeline Distribution</h2>
            <div className="space-y-2.5">
              {LEAD_STAGES.filter(s => s !== 'LOST').map(stage => {
                const count = data.stages[stage] || 0
                const pct = data.totalLeads > 0 ? (count / data.totalLeads) * 100 : 0
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${STAGE_DOT_COLORS[stage]}`} />
                    <span className="text-xs text-slate-500 w-32 truncate">{stage.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 0)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reply Rate + Quick Stats */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-3xl font-bold text-slate-900">{data.replyRate}%</p>
                <p className="text-xs text-slate-500 mt-1">Reply Rate</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Emails Opened</span>
                  <span className="font-medium text-slate-900">{data.outreach['OPENED'] || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Replies</span>
                  <span className="font-medium text-slate-900">{data.outreach['REPLIED'] || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Bounced</span>
                  <span className="font-medium text-slate-900">{data.outreach['BOUNCED'] || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Meetings Done</span>
                  <span className="font-medium text-slate-900">{data.meetings['COMPLETED'] || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">No Shows</span>
                  <span className="font-medium text-slate-900">{data.meetings['NO_SHOW'] || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h2>
            {data.recentActivities.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No activity yet. Start by adding leads.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.recentActivities.map(a => (
                  <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowUpRight className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{a.details}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {a.user?.name} · {format(new Date(a.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Industry Breakdown */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Leads by Industry</h2>
            {data.leadsByIndustry.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No data yet</p>
            ) : (
              <div className="space-y-2">
                {data.leadsByIndustry.map(i => (
                  <div key={i.industry} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-600 truncate mr-2">{i.industry || 'Unknown'}</span>
                    <Badge variant="secondary" className="shrink-0">{i._count.industry}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}