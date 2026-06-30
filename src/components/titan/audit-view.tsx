'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Globe,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Target,
  Lightbulb,
  MessageSquare,
  Palette,
  Code2,
  Briefcase,
  Bot,
  Mail,
  CheckCircle2,
  ArrowRight,
  Clock,
  ScanSearch,
  Shield,
  TrendingUp,
  Zap,
  BarChart3,
  FileText,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuditScores, AuditDetails } from '@/lib/types'

/* ──────────── types ──────────── */

interface AuditResult {
  id?: string
  url: string
  domain: string
  scores: AuditScores
  details: AuditDetails
  opportunities: string[]
  recommendations: string[]
  talkingPoints: string[]
  createdAt?: string
}

interface RecentAudit {
  id: string
  url: string
  domain: string
  scores: AuditScores
  createdAt: string
  lead?: {
    id: string
    business: { name: string }
  }
}

/* ──────────── helpers ──────────── */

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-cyan-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-cyan-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Critical'
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-400'
  if (score >= 60) return 'stroke-cyan-400'
  if (score >= 40) return 'stroke-amber-400'
  return 'stroke-red-400'
}

function getOverallLabel(score: number): string {
  if (score >= 90) return 'Outstanding'
  if (score >= 80) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 55) return 'Average'
  if (score >= 40) return 'Below Average'
  return 'Poor'
}

/* ──────────── Circular Score Component ──────────── */

function CircularScore({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-800"
        />
        {/* Score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn('transition-all duration-1000 ease-out', getScoreRingColor(score))}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-bold', getScoreColor(score))}>{score}</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Score</span>
      </div>
    </div>
  )
}

/* ──────────── Score Card Component ──────────── */

function ScoreCard({
  title,
  score,
  icon: Icon,
  gradient,
  details,
}: {
  title: string
  score: number
  icon: React.ElementType
  gradient: string
  details: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="bg-white border-gray-200 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn('p-2 rounded-lg', gradient)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={cn('text-xs', getScoreColor(score))}>{getScoreLabel(score)}</p>
          </div>
          <span className={cn('text-2xl font-bold', getScoreColor(score))}>{score}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className={cn('h-full rounded-full transition-all duration-1000 ease-out', getScoreBarColor(score))}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Expandable details */}
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors w-full">
            {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {open ? 'Hide details' : 'View details'}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="text-xs text-gray-500 leading-relaxed bg-gray-100/70 rounded-lg p-3 border border-gray-200">
              {details}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

/* ──────────── Main Audit View ──────────── */

export function AuditView() {
  const { setView } = useAppStore()

  // Quick audit form
  const [url, setUrl] = useState('')
  const [auditing, setAuditing] = useState(false)
  const [auditProgress, setAuditProgress] = useState(0)

  // Current audit result
  const [currentAudit, setCurrentAudit] = useState<AuditResult | null>(null)

  // Recent audits
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([])
  const [auditsLoading, setAuditsLoading] = useState(true)

  // Campaign select for "Add to Campaign" action
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])
  const [addCampaignOpen, setAddCampaignOpen] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState('')

  // Fetch recent audits + campaigns on mount
  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetch('/api/audit', { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          if (!cancelled) setRecentAudits(Array.isArray(d) ? d : d.audits || [])
        })
        .catch(() => {}),
      fetch('/api/campaigns', { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          if (!cancelled) setCampaigns(Array.isArray(d) ? d : d.campaigns || [])
        })
        .catch(() => {}),
    ]).finally(() => {
      if (!cancelled) setAuditsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const handleAudit = useCallback(async () => {
    if (!url.trim()) return

    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    setAuditing(true)
    setAuditProgress(0)
    setCurrentAudit(null)

    // Simulate progress
    const steps = [
      { at: 15, label: 'Fetching page...' },
      { at: 35, label: 'Analyzing design...' },
      { at: 55, label: 'Checking technical SEO...' },
      { at: 75, label: 'Evaluating business model...' },
      { at: 90, label: 'Generating insights...' },
    ]
    let stepIdx = 0
    const progressInterval = setInterval(() => {
      if (stepIdx < steps.length) {
        setAuditProgress(steps[stepIdx].at)
        stepIdx++
      } else {
        clearInterval(progressInterval)
      }
    }, 1200)

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ url: normalizedUrl }),
      })

      clearInterval(progressInterval)
      setAuditProgress(100)

      if (res.ok) {
        const data = await res.json()
        setCurrentAudit({
          id: data.id,
          url: normalizedUrl,
          domain: data.domain || new URL(normalizedUrl).hostname,
          scores: data.scores || { design: 0, technical: 0, business: 0, automation: 0, overall: 0 },
          details: data.details || { design: '', technical: '', business: '', automation: '' },
          opportunities: data.opportunities || [],
          recommendations: data.recommendations || [],
          talkingPoints: data.talkingPoints || [],
          createdAt: data.createdAt,
        })
      }
    } catch {
      clearInterval(progressInterval)
    } finally {
      setAuditing(false)
    }
  }, [url])

  const handleLoadAudit = useCallback((audit: RecentAudit) => {
    setUrl(audit.url)
    setCurrentAudit({
      id: audit.id,
      url: audit.url,
      domain: audit.domain,
      scores: audit.scores,
      details: { design: '', technical: '', business: '', automation: '' },
      opportunities: [],
      recommendations: [],
      talkingPoints: [],
      createdAt: audit.createdAt,
    })
    // Fetch full audit details
    fetch(`/api/audit?id=${audit.id}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        setCurrentAudit({
          id: d.id,
          url: d.url || audit.url,
          domain: d.domain || audit.domain,
          scores: d.scores || audit.scores,
          details: d.details || { design: '', technical: '', business: '', automation: '' },
          opportunities: d.opportunities || [],
          recommendations: d.recommendations || [],
          talkingPoints: d.talkingPoints || [],
          createdAt: d.createdAt,
        })
      })
      .catch(() => {})
  }, [])

  const handleAddToCampaign = useCallback(async () => {
    if (!currentAudit || !selectedCampaignId) return
    try {
      await fetch('/api/campaigns/add-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          auditId: currentAudit.id,
          campaignId: selectedCampaignId,
        }),
      })
      setAddCampaignOpen(false)
    } catch {}
  }, [currentAudit, selectedCampaignId])

  const resetAudit = useCallback(() => {
    setCurrentAudit(null)
    setUrl('')
    setAuditProgress(0)
  }, [])

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20">
              <ScanSearch className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">AI Website Intelligence</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-1">
            Analyze any website with AI — get scores, opportunities, and sales talking points
          </p>
        </div>
      </div>

      {/* ── Quick Audit Card ── */}
      <Card className="bg-white border-gray-200 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-cyan-600 via-emerald-500 to-teal-400" />
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900 text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Quick Website Audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Enter website URL (e.g. acme.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
                disabled={auditing}
                className="pl-10 bg-gray-100/70 border-gray-200 text-slate-200 h-11 placeholder:text-gray-400"
              />
            </div>
            <Button
              onClick={handleAudit}
              disabled={!url.trim() || auditing}
              className={cn(
                'h-11 px-6 font-medium transition-all duration-300',
                'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500',
                'text-gray-900 shadow-lg shadow-cyan-500/20',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {auditing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Website
                </>
              )}
            </Button>
          </div>

          {/* Progress steps */}
          {auditing && (
            <div className="mt-4 space-y-3">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${auditProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                  {auditProgress < 15
                    ? 'Connecting to website...'
                    : auditProgress < 35
                    ? 'Fetching page content...'
                    : auditProgress < 55
                    ? 'Analyzing design patterns...'
                    : auditProgress < 75
                    ? 'Checking technical infrastructure...'
                    : auditProgress < 90
                    ? 'Evaluating business signals...'
                    : auditProgress < 100
                    ? 'Generating AI insights...'
                    : 'Finalizing report...'}
                </div>
                <span className="text-xs text-gray-400">{auditProgress}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Audit Results ── */}
      {currentAudit && (
        <div className="space-y-5">
          {/* Domain header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">{currentAudit.domain}</p>
                <p className="text-xs text-gray-400 truncate max-w-xs">{currentAudit.url}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetAudit}
              className="border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              New Audit
            </Button>
          </div>

          {/* Overall Score + Score Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Overall Score - Left column */}
            <Card className="bg-white border-gray-200 lg:col-span-4">
              <CardContent className="p-6 flex flex-col items-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">Overall Score</p>
                <CircularScore score={currentAudit.scores.overall} />
                <p className={cn('text-sm font-medium mt-3', getScoreColor(currentAudit.scores.overall))}>
                  {getOverallLabel(currentAudit.scores.overall)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {currentAudit.scores.overall >= 70
                    ? 'Strong candidate for outreach'
                    : currentAudit.scores.overall >= 50
                    ? 'Moderate potential — review opportunities'
                    : 'Low priority — may need nurturing'}
                </p>

                <Separator className="my-4 bg-gray-100" />

                {/* Quick stats */}
                <div className="w-full space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Design</span>
                    <span className={cn('font-medium', getScoreColor(currentAudit.scores.design))}>
                      {currentAudit.scores.design}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', getScoreBarColor(currentAudit.scores.design))}
                      style={{ width: `${currentAudit.scores.design}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Technical</span>
                    <span className={cn('font-medium', getScoreColor(currentAudit.scores.technical))}>
                      {currentAudit.scores.technical}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', getScoreBarColor(currentAudit.scores.technical))}
                      style={{ width: `${currentAudit.scores.technical}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Business</span>
                    <span className={cn('font-medium', getScoreColor(currentAudit.scores.business))}>
                      {currentAudit.scores.business}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', getScoreBarColor(currentAudit.scores.business))}
                      style={{ width: `${currentAudit.scores.business}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Automation</span>
                    <span className={cn('font-medium', getScoreColor(currentAudit.scores.automation))}>
                      {currentAudit.scores.automation}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', getScoreBarColor(currentAudit.scores.automation))}
                      style={{ width: `${currentAudit.scores.automation}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Score Cards - Right column */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ScoreCard
                title="Design & UX"
                score={currentAudit.scores.design}
                icon={Palette}
                gradient="bg-violet-500/15 text-violet-400"
                details={currentAudit.details.design || 'Design analysis details will appear here after a full audit.'}
              />
              <ScoreCard
                title="Technical"
                score={currentAudit.scores.technical}
                icon={Code2}
                gradient="bg-cyan-500/15 text-cyan-400"
                details={currentAudit.details.technical || 'Technical analysis details will appear here after a full audit.'}
              />
              <ScoreCard
                title="Business Model"
                score={currentAudit.scores.business}
                icon={Briefcase}
                gradient="bg-amber-500/15 text-amber-400"
                details={currentAudit.details.business || 'Business model analysis details will appear here after a full audit.'}
              />
              <ScoreCard
                title="Automation"
                score={currentAudit.scores.automation}
                icon={Bot}
                gradient="bg-emerald-500/15 text-emerald-400"
                details={currentAudit.details.automation || 'Automation analysis details will appear here after a full audit.'}
              />
            </div>
          </div>

          {/* AI Insights Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Opportunities */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/15">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentAudit.opportunities.length > 0 ? (
                  <div className="space-y-2">
                    {currentAudit.opportunities.map((opp, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Zap className="w-2 h-2 text-emerald-400" />
                        </div>
                        <span>{opp}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">Run a full audit to discover opportunities</p>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-cyan-500/15">
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentAudit.recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {currentAudit.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                        <div className="w-4 h-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Target className="w-2 h-2 text-cyan-400" />
                        </div>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">Run a full audit to get recommendations</p>
                )}
              </CardContent>
            </Card>

            {/* Talking Points */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-violet-500/15">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  Sales Talking Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentAudit.talkingPoints.length > 0 ? (
                  <div className="space-y-2">
                    {currentAudit.talkingPoints.map((tp, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                        <div className="w-4 h-4 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare className="w-2 h-2 text-violet-400" />
                        </div>
                        <span>{tp}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">Run a full audit to generate talking points</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  className={cn(
                    'flex-1 sm:flex-none h-10 px-5',
                    'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
                    'text-gray-900 shadow-lg shadow-violet-500/15'
                  )}
                  onClick={() => setView('email-center')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Generate Email
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none h-10 px-5 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setView('leads')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Qualify Lead
                </Button>

                {/* Add to Campaign */}
                {campaigns.length > 0 ? (
                  <div className="flex-1 sm:flex-none">
                    <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                      <SelectTrigger className="h-10 w-full sm:w-auto bg-gray-100/70 border-gray-200 text-gray-600">
                        <SelectValue placeholder="Add to Campaign..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-100 border-gray-200">
                        {campaigns.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-slate-200 focus:bg-gray-200 focus:text-gray-900">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {selectedCampaignId && (
                  <Button
                    variant="outline"
                    className="h-10 px-5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={handleAddToCampaign}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                )}

                <div className="flex-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Recent Audits ── */}
      {!currentAudit && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Recent Audits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30">
                    <Skeleton className="h-9 w-9 rounded-lg bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-40 bg-gray-100" />
                      <Skeleton className="h-3 w-60 bg-gray-200/70" />
                    </div>
                    <Skeleton className="h-6 w-12 bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : recentAudits.length > 0 ? (
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {recentAudits.map((audit) => (
                    <button
                      key={audit.id}
                      onClick={() => handleLoadAudit(audit)}
                      className="w-full flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 hover:bg-gray-100/80 border border-transparent hover:border-gray-200 transition-all text-left group"
                    >
                      {/* Mini score circle */}
                      <div className="relative w-9 h-9 shrink-0">
                        <svg className="w-9 h-9 -rotate-90">
                          <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" className="stroke-slate-700" />
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className={getScoreRingColor(audit.scores.overall)}
                            strokeDasharray={`${2 * Math.PI * 14}`}
                            strokeDashoffset={`${2 * Math.PI * 14 - (audit.scores.overall / 100) * 2 * Math.PI * 14}`}
                          />
                        </svg>
                        <span className={cn('absolute inset-0 flex items-center justify-center text-[10px] font-bold', getScoreColor(audit.scores.overall))}>
                          {audit.scores.overall}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-200 font-medium truncate">{audit.domain}</p>
                          {audit.lead && (
                            <Badge variant="outline" className="bg-gray-200/70 border-gray-300 text-gray-500 text-[10px] px-1.5 py-0 shrink-0">
                              {audit.lead.business.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {audit.createdAt
                            ? new Date(audit.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Mini score badges */}
                        <div className="hidden sm:flex items-center gap-1.5">
                          <span className={cn('text-[10px] font-medium', getScoreColor(audit.scores.design))}>{audit.scores.design}</span>
                          <span className="text-[10px] text-gray-300">/</span>
                          <span className={cn('text-[10px] font-medium', getScoreColor(audit.scores.technical))}>{audit.scores.technical}</span>
                          <span className="text-[10px] text-gray-300">/</span>
                          <span className={cn('text-[10px] font-medium', getScoreColor(audit.scores.business))}>{audit.scores.business}</span>
                          <span className="text-[10px] text-gray-300">/</span>
                          <span className={cn('text-[10px] font-medium', getScoreColor(audit.scores.automation))}>{audit.scores.automation}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="py-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100/70 flex items-center justify-center mx-auto mb-4">
                  <ScanSearch className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-900 font-medium">No audits yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Enter a website URL above to run your first AI-powered website audit
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
