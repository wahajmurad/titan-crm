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
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Target,
  Lightbulb,
  MessageSquare,
  Palette,
  Zap,
  Shield,
  Smartphone,
  Bot,
  TrendingUp,
  Search,
  ScanSearch,
  Mail,
  CheckCircle2,
  ArrowRight,
  Clock,
  BarChart3,
  AlertTriangle,
  Sparkles,
  Gauge,
  Users,
  RefreshCw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ──────────── types ──────────── */

interface AuditResult {
  id?: string
  url: string
  domain: string
  scores: {
    ui: number
    ux: number
    seo: number
    performance: number
    accessibility: number
    mobile: number
    security: number
    aiReadiness: number
    automation: number
    conversion: number
    overall: number
  }
  details: {
    ui: string
    ux: string
    seo: string
    performance: string
    accessibility: string
    mobile: string
    security: string
    aiReadiness: string
    automation: string
    conversion: string
  }
  executiveSummary: string
  problemsFound: string[]
  opportunities: string[]
  recommendations: string[]
  talkingPoints: string[]
  pitchStrategy: string
  createdAt?: string
}

interface RecentAudit {
  id: string
  url: string
  domain: string
  overallScore: number
  createdAt: string
}

interface Campaign {
  id: string
  name: string
}

/* ──────────── constants ──────────── */

type ScoreKey = keyof AuditResult['scores']

const SCORE_CONFIG: { key: ScoreKey; label: string; icon: LucideIcon }[] = [
  { key: 'ui', label: 'UI Design', icon: Palette },
  { key: 'ux', label: 'UX', icon: Users },
  { key: 'seo', label: 'SEO', icon: Search },
  { key: 'performance', label: 'Performance', icon: Gauge },
  { key: 'accessibility', label: 'Accessibility', icon: Users },
  { key: 'mobile', label: 'Mobile', icon: Smartphone },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'aiReadiness', label: 'AI Readiness', icon: Bot },
  { key: 'automation', label: 'Automation', icon: Zap },
  { key: 'conversion', label: 'Conversion', icon: TrendingUp },
]

const ANALYSIS_STEPS = [
  'Fetching page content…',
  'Analyzing UI & visual design…',
  'Evaluating user experience…',
  'Scanning SEO indicators…',
  'Measuring performance metrics…',
  'Checking accessibility standards…',
  'Testing mobile responsiveness…',
  'Auditing security headers…',
  'Assessing AI readiness…',
  'Reviewing automation opportunities…',
  'Analyzing conversion potential…',
  'Generating executive summary…',
]

/* ──────────── helpers ──────────── */

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-100'
  if (score >= 60) return 'bg-blue-100'
  if (score >= 40) return 'bg-amber-100'
  return 'bg-red-100'
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-500'
  if (score >= 60) return 'stroke-blue-500'
  if (score >= 40) return 'stroke-amber-500'
  return 'stroke-red-500'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Work'
}

function clampScore(val: unknown): number {
  const n = Number(val)
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function parseStringList(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string')
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string')
    } catch {
      // split by newlines or commas
      return val.split(/[\n,]/).map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

function formatDate(iso: string | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/* ──────────── circular score component ──────────── */

function CircularScore({ value, size = 140 }: { value: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-200"
        />
        {/* score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-1000 ease-out',
            getScoreRingColor(value)
          )}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold leading-none', getScoreColor(value))} style={{ fontSize: size * 0.28 }}>
          {value}
        </span>
        <span className="text-gray-400 text-xs mt-1">/ 100</span>
      </div>
    </div>
  )
}

/* ──────────── mini circular score (for recent audits) ──────────── */

function MiniCircularScore({ value, size = 44 }: { value: number; size?: number }) {
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-gray-200" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn('transition-all duration-700 ease-out', getScoreRingColor(value))}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={cn('absolute text-xs font-semibold', getScoreColor(value))} style={{ fontSize: size * 0.3 }}>
        {value}
      </span>
    </div>
  )
}

/* ──────────── main component ──────────── */

export function AuditView() {
  const { setView } = useAppStore()

  // state
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [progressPct, setProgressPct] = useState(0)
  const [audit, setAudit] = useState<AuditResult | null>(null)
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState('')

  // toggle card expansion
  const toggleCard = (key: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  /* ──── fetch recent audits ──── */
  const fetchRecentAudits = useCallback(async () => {
    try {
      const res = await fetch('/api/audit')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.audits)) {
          setRecentAudits(
            data.audits.map((a: Record<string, unknown>) => ({
              id: String(a.id ?? ''),
              url: String(a.url ?? ''),
              domain: String(a.domain ?? ''),
              overallScore: clampScore((a.overallScore as number) ?? (a.scores as Record<string, unknown>)?.overall ?? 0),
              createdAt: String(a.createdAt ?? ''),
            }))
          )
        }
      }
    } catch {
      // silent fail for recent audits
    }
  }, [])

  /* ──── fetch campaigns ──── */
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.campaigns)) {
          setCampaigns(data.campaigns.map((c: { id: string; name: string }) => c))
        }
      }
    } catch {
      // silent fail
    }
  }, [])

  /* ──── load a past audit by id ──── */
  const loadAuditById = useCallback(async (id: string) => {
    try {
      setError(null)
      const res = await fetch(`/api/audit?id=${encodeURIComponent(id)}`)
      if (res.ok) {
        const raw = await res.json()
        setAudit(normalizeAudit(raw))
      }
    } catch {
      setError('Failed to load audit. Please try again.')
    }
  }, [])

  /* ──── normalize raw API data into AuditResult ──── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function normalizeAudit(raw: any): AuditResult {
    const rawUrl = String(raw.url ?? '')
    const s = (raw.scores && typeof raw.scores === 'object') ? raw.scores : {}
    const scores = {
      ui: clampScore(raw.ui ?? s.ui ?? 0),
      ux: clampScore(raw.ux ?? s.ux ?? 0),
      seo: clampScore(raw.seo ?? s.seo ?? 0),
      performance: clampScore(raw.performance ?? s.performance ?? 0),
      accessibility: clampScore(raw.accessibility ?? s.accessibility ?? 0),
      mobile: clampScore(raw.mobile ?? s.mobile ?? 0),
      security: clampScore(raw.security ?? s.security ?? 0),
      aiReadiness: clampScore(raw.aiReadiness ?? s.aiReadiness ?? 0),
      automation: clampScore(raw.automation ?? s.automation ?? 0),
      conversion: clampScore(raw.conversion ?? s.conversion ?? 0),
      overall: clampScore(raw.overall ?? s.overall ?? 0),
    }

    // calculate overall if not provided
    if (!raw.overall && !s.overall) {
      const vals = [scores.ui, scores.ux, scores.seo, scores.performance, scores.accessibility, scores.mobile, scores.security, scores.aiReadiness, scores.automation, scores.conversion]
      scores.overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    }

    const rawDetails = (raw.details ?? raw.analysis ?? {}) as Record<string, unknown>
    const details = {
      ui: String(rawDetails.ui ?? ''),
      ux: String(rawDetails.ux ?? ''),
      seo: String(rawDetails.seo ?? ''),
      performance: String(rawDetails.performance ?? ''),
      accessibility: String(rawDetails.accessibility ?? ''),
      mobile: String(rawDetails.mobile ?? ''),
      security: String(rawDetails.security ?? ''),
      aiReadiness: String(rawDetails.aiReadiness ?? ''),
      automation: String(rawDetails.automation ?? ''),
      conversion: String(rawDetails.conversion ?? ''),
    }

    return {
      id: String(raw.id ?? ''),
      url: rawUrl,
      domain: String(raw.domain ?? extractDomain(rawUrl)),
      scores,
      details,
      executiveSummary: String(raw.executiveSummary ?? raw.summary ?? ''),
      problemsFound: parseStringList(raw.problemsFound ?? raw.problems ?? raw.issues ?? []),
      opportunities: parseStringList(raw.opportunities ?? []),
      recommendations: parseStringList(raw.recommendations ?? []),
      talkingPoints: parseStringList(raw.talkingPoints ?? raw.talking_points ?? []),
      pitchStrategy: String(raw.pitchStrategy ?? raw.pitch_strategy ?? ''),
      createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    }
  }

  /* ──── run analysis ──── */
  const handleAnalyze = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed) return

    // ensure URL has protocol
    const normalizedUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`

    setIsAnalyzing(true)
    setError(null)
    setAudit(null)
    setProgressStep(0)
    setProgressPct(0)

    // simulate progress animation
    let step = 0
    const totalSteps = ANALYSIS_STEPS.length
    const progressInterval = setInterval(() => {
      step = Math.min(step + 1, totalSteps)
      setProgressStep(step)
      setProgressPct(Math.round((step / totalSteps) * 100))
      if (step >= totalSteps) clearInterval(progressInterval)
    }, 2500)

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error')
        throw new Error(errText || `Analysis failed (${res.status})`)
      }

      const raw = await res.json()
      const normalized = normalizeAudit(raw)

      // finish progress to 100%
      setProgressStep(totalSteps)
      setProgressPct(100)

      // brief delay for UX feel
      await new Promise(r => setTimeout(r, 400))

      setAudit(normalized)
      setUrl('')
      fetchRecentAudits()
    } catch (err) {
      clearInterval(progressInterval)
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
      setIsAnalyzing(false)
    } finally {
      setIsAnalyzing(false)
    }
  }, [url, fetchRecentAudits])

  /* ──── init ──── */
  useEffect(() => {
    fetchRecentAudits()
    fetchCampaigns()
  }, [fetchRecentAudits, fetchCampaigns])

  /* ──── key down handler ──── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze()
  }

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <ScrollArea className="h-full">
      <div className="min-h-full bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* ──── Header ──── */}
          <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
              <ScanSearch className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Website Intelligence</h1>
              <p className="text-sm text-gray-500">Analyze any website and get actionable insights in seconds</p>
            </div>
          </div>

          {/* ──── Search Card ──── */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Enter website URL (e.g., example.com)"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isAnalyzing}
                    className="pl-10 h-11"
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !url.trim()}
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <ScanSearch className="mr-2 h-4 w-4" />
                      Analyze Website
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ──── Progress ──── */}
          {isAnalyzing && (
            <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">Running analysis…</span>
                  <span className="text-gray-500">{progressPct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  <span className="transition-all">
                    {ANALYSIS_STEPS[Math.min(progressStep, ANALYSIS_STEPS.length - 1)]}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ──── Error ──── */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-start gap-3 pt-4">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Analysis Error</p>
                  <p className="text-sm text-red-600 mt-0.5">{error}</p>
                  <Button variant="ghost" size="sm" className="mt-2 text-red-700 hover:text-red-900" onClick={() => setError(null)}>
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ══════════ RESULTS ══════════ */}
          {audit && !isAnalyzing && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* ──── Domain Header ──── */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{audit.domain}</h2>
                  <p className="text-sm text-gray-500 truncate">{audit.url}</p>
                </div>
                <a href={audit.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </a>
                {audit.createdAt && (
                  <span className="text-xs text-gray-400 hidden sm:flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(audit.createdAt)}
                  </span>
                )}
              </div>

              {/* ──── Overall Score + Mini Scores ──── */}
              <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Large circular score */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <CircularScore value={audit.scores.overall} />
                    <Badge variant="secondary" className={cn('text-xs font-medium', getScoreBgColor(audit.scores.overall), getScoreColor(audit.scores.overall))}>
                      {getScoreLabel(audit.scores.overall)}
                    </Badge>
                    <span className="text-sm text-gray-500">Overall Score</span>
                  </div>

                  {/* 10 mini score bars */}
                  <div className="flex-1 w-full">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Category Scores</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                      {SCORE_CONFIG.map(({ key, label, icon: Icon }) => {
                        const val = audit.scores[key]
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-500 w-24 truncate flex-shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all duration-700 ease-out', getScoreBarColor(val))}
                                style={{ width: `${val}%` }}
                              />
                            </div>
                            <span className={cn('text-xs font-semibold w-7 text-right', getScoreColor(val))}>
                              {val}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ──── Executive Summary ──── */}
              {audit.executiveSummary && (
                <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{audit.executiveSummary}</p>
                  </CardContent>
                </Card>
              )}

              {/* ──── Problems Found ──── */}
              {audit.problemsFound.length > 0 && (
                <Card className="bg-white border border-red-200/60 rounded-xl shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-red-700">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Problems Found
                      <Badge variant="secondary" className="bg-red-100 text-red-700 ml-1">{audit.problemsFound.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {audit.problemsFound.map((problem, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-medium flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{problem}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* ──── 10 Category Score Cards ──── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SCORE_CONFIG.map(({ key, label, icon: Icon }) => {
                  const val = audit.scores[key]
                  const detail = audit.details[key as keyof AuditResult['details']] ?? ''
                  const isExpanded = expandedCards.has(key)

                  return (
                    <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleCard(key)}>
                      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <CollapsibleTrigger asChild>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', getScoreBgColor(val))}>
                                  <Icon className={cn('h-4.5 w-4.5', getScoreColor(val))} />
                                </div>
                                <div>
                                  <CardTitle className="text-sm font-semibold text-gray-900">{label}</CardTitle>
                                  <Badge variant="secondary" className={cn('mt-0.5 text-[10px]', getScoreBgColor(val), getScoreColor(val))}>
                                    {getScoreLabel(val)}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={cn('text-2xl font-bold tabular-nums', getScoreColor(val))}>{val}</span>
                                <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', isExpanded && 'rotate-180')} />
                              </div>
                            </div>
                            <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all duration-700 ease-out', getScoreBarColor(val))}
                                style={{ width: `${val}%` }}
                              />
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        {detail && (
                          <CollapsibleContent>
                            <CardContent className="pt-0 pb-4">
                              <Separator className="mb-3" />
                              <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{detail}</p>
                            </CardContent>
                          </CollapsibleContent>
                        )}
                      </Card>
                    </Collapsible>
                  )
                })}
              </div>

              {/* ──── 3-Column Row: Opportunities, Recommendations, Talking Points ──── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Opportunities */}
                <Card className="bg-white border border-emerald-200/60 rounded-xl shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      <Lightbulb className="h-4 w-4 text-emerald-500" />
                      Opportunities
                      {audit.opportunities.length > 0 && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px]">{audit.opportunities.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {audit.opportunities.length > 0 ? (
                      <ul className="space-y-2">
                        {audit.opportunities.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No opportunities identified</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="bg-white border border-blue-200/60 rounded-xl shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                      <Target className="h-4 w-4 text-blue-500" />
                      Recommendations
                      {audit.recommendations.length > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">{audit.recommendations.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {audit.recommendations.length > 0 ? (
                      <ul className="space-y-2">
                        {audit.recommendations.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <ArrowRight className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No recommendations available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Talking Points */}
                <Card className="bg-white border border-blue-200/60 rounded-xl shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      Talking Points
                      {audit.talkingPoints.length > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">{audit.talkingPoints.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {audit.talkingPoints.length > 0 ? (
                      <ul className="space-y-2">
                        {audit.talkingPoints.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No talking points generated</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ──── Pitch Strategy ──── */}
              {audit.pitchStrategy && (
                <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      Pitch Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{audit.pitchStrategy}</p>
                  </CardContent>
                </Card>
              )}

              {/* ──── Action Buttons ──── */}
              <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Button
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                      onClick={() => setView('email-center')}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Generate Email
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setView('leads')}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Qualify Lead
                    </Button>
                    {campaigns.length > 0 && (
                      <div className="flex-1 sm:flex-none sm:w-56">
                        <Label className="text-xs text-gray-500 mb-1.5 block">Add to Campaign</Label>
                        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select campaign…" />
                          </SelectTrigger>
                          <SelectContent>
                            {campaigns.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════ RECENT AUDITS (when no current audit) ══════════ */}
          {!audit && !isAnalyzing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Recent Audits</h3>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" onClick={fetchRecentAudits}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Refresh
                </Button>
              </div>

              {recentAudits.length > 0 ? (
                <div className="space-y-2">
                  {recentAudits.map(ra => (
                    <button
                      key={ra.id}
                      onClick={() => loadAuditById(ra.id)}
                      className="w-full text-left bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow px-4 py-3 flex items-center gap-4 group"
                    >
                      <MiniCircularScore value={ra.overallScore} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{ra.domain}</p>
                        <p className="text-xs text-gray-500 truncate">{ra.url}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ra.createdAt && (
                          <span className="text-xs text-gray-400 hidden sm:block">{formatDate(ra.createdAt)}</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm">
                  <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
                      <ScanSearch className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">No audits yet</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-sm">
                      Enter a website URL above and click &quot;Analyze Website&quot; to get your first AI-powered website audit with actionable insights.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}
