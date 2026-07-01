'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
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
  if (score >= 80) return 'bg-emerald-50'
  if (score >= 60) return 'bg-blue-50'
  if (score >= 40) return 'bg-amber-50'
  return 'bg-red-50'
}

function getScoreRingStroke(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#2563eb'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function getScoreRingBg(score: number): string {
  if (score >= 80) return 'rgba(16,185,129,0.12)'
  if (score >= 60) return 'rgba(37,99,235,0.12)'
  if (score >= 40) return 'rgba(245,158,11,0.12)'
  return 'rgba(239,68,68,0.12)'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Work'
}

function getScoreBorderColor(score: number): string {
  if (score >= 80) return 'border-emerald-200/70'
  if (score >= 60) return 'border-blue-200/70'
  if (score >= 40) return 'border-amber-200/70'
  return 'border-red-200/70'
}

function clampScore(val: unknown): number {
  const n = Number(val)
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function parseStringList(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item.replace(/^\d+[\.\)\-]\s*/, '').trim()
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>
          return String(obj.title || obj.text || obj.description || obj.point || obj.content || '').trim()
        }
        return String(item).trim()
      })
      .filter((s) => s.length > 0 && !s.startsWith('[object'))
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parseStringList(parsed)
    } catch {
      return val.split(/[\n]/).map(s => s.replace(/^\d+[\.\)\-]\s*/, '').trim()).filter(Boolean)
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

/* ──────────── animated counter hook ──────────── */

function useAnimatedScore(target: number, duration = 1200) {
  const spring = useSpring(target, { duration, bounce: 0 })
  const display = useTransform(spring, (v) => Math.round(v))
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const unsub = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = String(v)
    })
    return unsub
  }, [display])

  useEffect(() => {
    spring.set(target)
  }, [spring, target])

  return ref
}

/* ──────────── premium circular score component ──────────── */

function CircularScore({ value, size = 160, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const counterRef = useAnimatedScore(value, 1400)
  const strokeColor = getScoreRingStroke(value)
  const bgColor = getScoreRingBg(value)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Subtle glow behind the ring */}
      <div
        className="absolute rounded-full blur-xl opacity-40 transition-all duration-1000"
        style={{
          width: size * 0.75,
          height: size * 0.75,
          background: strokeColor,
        }}
      />
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        {/* background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          style={{ stroke: bgColor }}
        />
        {/* score ring with animation */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ stroke: strokeColor }}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span
          ref={counterRef}
          className={cn('font-bold leading-none tabular-nums tracking-tight', getScoreColor(value))}
          style={{ fontSize: size * 0.3 }}
        >
          0
        </span>
        <span className="text-gray-400 text-xs mt-1 font-medium">/ 100</span>
      </div>
    </div>
  )
}

/* ──────────── mini circular score for recent audits ──────────── */

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
          cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
          style={{ stroke: getScoreRingStroke(value) }}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className={cn('absolute text-xs font-semibold tabular-nums', getScoreColor(value))} style={{ fontSize: size * 0.3 }}>
        {value}
      </span>
    </div>
  )
}

/* ──────────── animated score counter for cards ──────────── */

function AnimatedScoreNumber({ value }: { value: number }) {
  const ref = useAnimatedScore(value, 1000)
  return (
    <span ref={ref} className={cn('text-2xl font-bold tabular-nums tracking-tight', getScoreColor(value))}>
      0
    </span>
  )
}

/* ──────────── strategy section config ──────────── */

const STRATEGY_SECTIONS = [
  {
    key: 'problemsFound' as const,
    label: 'Problems Found',
    icon: AlertTriangle,
    accentColor: 'red',
    borderClass: 'border-red-200/70',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    titleColor: 'text-red-700',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    bulletBg: 'bg-red-100',
    bulletText: 'text-red-600',
    bulletIcon: null as LucideIcon | null,
  },
  {
    key: 'opportunities' as const,
    label: 'Opportunities',
    icon: Lightbulb,
    accentColor: 'amber',
    borderClass: 'border-amber-200/70',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    bulletBg: 'bg-amber-100',
    bulletText: 'text-amber-600',
    bulletIcon: null as LucideIcon | null,
  },
  {
    key: 'recommendations' as const,
    label: 'Recommendations',
    icon: CheckCircle2,
    accentColor: 'emerald',
    borderClass: 'border-emerald-200/70',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    bulletBg: 'bg-emerald-100',
    bulletText: 'text-emerald-600',
    bulletIcon: CheckCircle2,
  },
  {
    key: 'talkingPoints' as const,
    label: 'Talking Points',
    icon: MessageSquare,
    accentColor: 'blue',
    borderClass: 'border-blue-200/70',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-700',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    bulletBg: 'bg-blue-100',
    bulletText: 'text-blue-600',
    bulletIcon: MessageSquare,
  },
  {
    key: 'pitchStrategy' as const,
    label: 'Pitch Strategy',
    icon: Target,
    accentColor: 'purple',
    borderClass: 'border-purple-200/70',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    titleColor: 'text-purple-700',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    bulletBg: '',
    bulletText: '',
    bulletIcon: null as LucideIcon | null,
  },
]

/* ──────────── animation variants ──────────── */

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease },
  },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

/* ══════════════════════════════════════════════════════════════
   ═══════════════  MAIN COMPONENT  ═══════════════
   ════════════════════════════════════════════════════════════════ */

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
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set())
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

  // toggle strategy section expansion
  const toggleStrategy = (key: string) => {
    setExpandedStrategies(prev => {
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
      ui: clampScore(raw.uiScore ?? raw.ui ?? s.uiScore ?? s.ui ?? 0),
      ux: clampScore(raw.uxScore ?? raw.ux ?? s.uxScore ?? s.ux ?? 0),
      seo: clampScore(raw.seoScore ?? raw.seo ?? s.seoScore ?? s.seo ?? 0),
      performance: clampScore(raw.performanceScore ?? raw.performance ?? s.performanceScore ?? s.performance ?? 0),
      accessibility: clampScore(raw.accessibilityScore ?? raw.accessibility ?? s.accessibilityScore ?? s.accessibility ?? 0),
      mobile: clampScore(raw.mobileScore ?? raw.mobile ?? s.mobileScore ?? s.mobile ?? 0),
      security: clampScore(raw.securityScore ?? raw.security ?? s.securityScore ?? s.security ?? 0),
      aiReadiness: clampScore(raw.aiReadinessScore ?? raw.aiReadiness ?? s.aiReadinessScore ?? s.aiReadiness ?? 0),
      automation: clampScore(raw.automationScore ?? raw.automation ?? s.automationScore ?? s.automation ?? 0),
      conversion: clampScore(raw.conversionScore ?? raw.conversion ?? s.conversionScore ?? s.conversion ?? 0),
      overall: clampScore(raw.overallScore ?? raw.overall ?? s.overallScore ?? s.overall ?? 0),
    }

    // calculate overall if not provided
    if (!raw.overallScore && !s.overallScore && !raw.overall && !s.overall) {
      const vals = [scores.ui, scores.ux, scores.seo, scores.performance, scores.accessibility, scores.mobile, scores.security, scores.aiReadiness, scores.automation, scores.conversion]
      scores.overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    }

    const rawDetails = (raw.details ?? raw.analysis ?? {}) as Record<string, unknown>
    const details = {
      ui: String(rawDetails.ui ?? raw.uiDetails ?? ''),
      ux: String(rawDetails.ux ?? raw.uxDetails ?? ''),
      seo: String(rawDetails.seo ?? raw.seoDetails ?? ''),
      performance: String(rawDetails.performance ?? raw.performanceDetails ?? ''),
      accessibility: String(rawDetails.accessibility ?? raw.accessibilityDetails ?? ''),
      mobile: String(rawDetails.mobile ?? raw.mobileDetails ?? ''),
      security: String(rawDetails.security ?? raw.securityDetails ?? ''),
      aiReadiness: String(rawDetails.aiReadiness ?? raw.aiReadinessDetails ?? ''),
      automation: String(rawDetails.automation ?? raw.automationDetails ?? ''),
      conversion: String(rawDetails.conversion ?? raw.conversionDetails ?? ''),
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
      <div className="min-h-full bg-gradient-to-b from-gray-50/80 via-white to-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* ══════════ HEADER ══════════ */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-4"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
              <ScanSearch className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">AI Website Intelligence</h1>
              <p className="text-sm text-gray-500 mt-0.5">Deep analysis with actionable insights in seconds</p>
            </div>
          </motion.div>

          {/* ══════════ AUDIT INPUT ══════════ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            {/* Top gradient accent */}
            <div className="h-[2px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />
            <CardContent className="pt-6 pb-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Enter website URL (e.g., example.com)"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isAnalyzing}
                    className="pl-11 h-12 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus:bg-white transition-colors"
                  />
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !url.trim()}
                    className="h-12 px-7 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 text-sm"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze Website
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* Recent audit pills */}
              {recentAudits.length > 0 && !audit && !isAnalyzing && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mr-1">Recent</span>
                  {recentAudits.slice(0, 5).map(ra => (
                    <motion.button
                      key={ra.id}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => loadAuditById(ra.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100/80 hover:bg-blue-50 hover:text-blue-600 border border-gray-200/60 hover:border-blue-200/60 transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: getScoreRingStroke(ra.overallScore) }} />
                      {ra.domain}
                    </motion.button>
                  ))}
                </div>
              )}
            </CardContent>
          </motion.div>

          {/* ══════════ LOADING STATE ══════════ */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <CardContent className="pt-6 pb-6 space-y-5">
                  {/* Progress header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <div className="absolute inset-0 h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Running deep analysis</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-blue-600">{progressPct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>

                  {/* Step indicators */}
                  <div className="space-y-1.5 mt-4">
                    {ANALYSIS_STEPS.map((step, i) => {
                      const isComplete = i < progressStep
                      const isActive = i === progressStep
                      return (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.03 }}
                          className={cn(
                            'flex items-center gap-3 py-1.5 px-3 rounded-lg text-sm transition-colors',
                            isActive && 'bg-blue-50/80',
                          )}
                        >
                          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                            {isComplete ? (
                              <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </motion.div>
                            ) : isActive ? (
                              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                            ) : (
                              <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                            )}
                          </div>
                          <span className={cn(
                            'text-sm transition-colors',
                            isComplete ? 'text-gray-400 line-through' : isActive ? 'text-gray-900 font-medium' : 'text-gray-300',
                          )}>
                            {step}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Premium skeleton shimmer below steps */}
                  <div className="pt-4 space-y-3 border-t border-gray-100">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                    <div className="grid grid-cols-5 gap-3 pt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════ ERROR ══════════ */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border-red-200/70 bg-red-50/50 backdrop-blur-sm rounded-2xl">
                  <CardContent className="flex items-start gap-3 pt-5 pb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 flex-shrink-0">
                      <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800">Analysis Error</p>
                      <p className="text-sm text-red-600 mt-0.5">{error}</p>
                      <Button variant="ghost" size="sm" className="mt-2 text-red-700 hover:text-red-900 hover:bg-red-100/50" onClick={() => setError(null)}>
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════ RESULTS ══════════ */}
          <AnimatePresence mode="wait">
            {audit && !isAnalyzing && (
              <motion.div
                key={audit.id ?? audit.domain}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {/* ──── HERO SECTION: Domain + Overall Score + Executive Summary ──── */}
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="show"
                  className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <CardContent className="pt-8 pb-8">
                    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                      {/* Large circular score */}
                      <div className="flex flex-col items-center gap-3 flex-shrink-0">
                        <CircularScore value={audit.scores.overall} size={180} strokeWidth={12} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8, duration: 0.4 }}
                        >
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs font-semibold px-3 py-1 rounded-full',
                              getScoreBgColor(audit.scores.overall),
                              getScoreColor(audit.scores.overall),
                              'border',
                              getScoreBorderColor(audit.scores.overall),
                            )}
                          >
                            {getScoreLabel(audit.scores.overall)}
                          </Badge>
                        </motion.div>
                        <span className="text-sm text-gray-400 font-medium">Overall Score</span>
                      </div>

                      {/* Domain info + Executive Summary */}
                      <div className="flex-1 min-w-0 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                            <Globe className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-xl font-semibold text-gray-900 truncate tracking-tight">{audit.domain}</h2>
                            <p className="text-sm text-gray-400 truncate flex items-center gap-2 justify-center lg:justify-start">
                              {audit.url}
                              <a href={audit.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </p>
                          </div>
                          {audit.createdAt && (
                            <span className="text-xs text-gray-400 hidden sm:flex items-center gap-1 ml-2">
                              <Clock className="h-3 w-3" />
                              {formatDate(audit.createdAt)}
                            </span>
                          )}
                        </div>

                        {audit.executiveSummary && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/80 border border-gray-100"
                          >
                            <Sparkles className="h-4.5 w-4.5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Executive Summary</h3>
                              <p className="text-sm leading-relaxed text-gray-600">{audit.executiveSummary}</p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </motion.div>

                {/* ──── SCORE GRID: 10 Category Cards ──── */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4"
                >
                  {SCORE_CONFIG.map(({ key, label, icon: Icon }) => {
                    const val = audit.scores[key]
                    const detail = audit.details[key as keyof AuditResult['details']] ?? ''
                    const isExpanded = expandedCards.has(key)

                    return (
                      <motion.div key={key} variants={itemVariants}>
                        <Collapsible open={isExpanded} onOpenChange={() => toggleCard(key)}>
                          <motion.div
                            whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className={cn(
                              'h-full rounded-2xl border bg-white/80 backdrop-blur-sm transition-all duration-200 cursor-pointer group',
                              getScoreBorderColor(val),
                              'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
                            )}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="p-5">
                                {/* Icon + Label + Score */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl transition-colors', getScoreBgColor(val))}>
                                      <Icon className={cn('h-5 w-5', getScoreColor(val))} />
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-semibold text-gray-900 leading-tight">{label}</h3>
                                      <Badge
                                        variant="secondary"
                                        className={cn('mt-1 text-[10px] font-medium px-2 py-0 rounded-full', getScoreBgColor(val), getScoreColor(val))}
                                      >
                                        {getScoreLabel(val)}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <AnimatedScoreNumber value={val} />
                                    <ChevronDown
                                      className={cn(
                                        'h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-transform duration-300',
                                        isExpanded && 'rotate-180',
                                      )}
                                    />
                                  </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                  <motion.div
                                    className={cn('h-full rounded-full', getScoreBarColor(val))}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${val}%` }}
                                    transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                  />
                                </div>
                              </div>
                            </CollapsibleTrigger>

                            {/* Expandable detail */}
                            <AnimatePresence>
                              {isExpanded && detail && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                  className="overflow-hidden"
                                >
                                  <CollapsibleContent>
                                    <div className="px-5 pb-4">
                                      <Separator className="mb-3 bg-gray-100" />
                                      <p className="text-sm leading-relaxed text-gray-500 whitespace-pre-line">{detail}</p>
                                    </div>
                                  </CollapsibleContent>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </Collapsible>
                      </motion.div>
                    )
                  })}
                </motion.div>

                {/* ──── STRATEGY SECTIONS (Collapsible) ──── */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {STRATEGY_SECTIONS.map((section) => {
                    const SectionIcon = section.icon

                    // Pitch strategy is a text block, others are lists
                    if (section.key === 'pitchStrategy') {
                      const content = audit.pitchStrategy
                      if (!content) return null
                      const isOpen = expandedStrategies.has(section.key)
                      return (
                        <motion.div key={section.key} variants={itemVariants}>
                          <Collapsible open={isOpen} onOpenChange={() => toggleStrategy(section.key)}>
                            <motion.div
                              whileHover={{ y: -1 }}
                              transition={{ duration: 0.2 }}
                              className={cn('rounded-2xl border bg-white/80 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden', section.borderClass)}
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center gap-3 p-5 cursor-pointer group">
                                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', section.iconBg)}>
                                    <SectionIcon className={cn('h-4.5 w-4.5', section.iconColor)} />
                                  </div>
                                  <h3 className={cn('text-sm font-semibold flex-1', section.titleColor)}>{section.label}</h3>
                                  <ChevronDown className={cn('h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-transform duration-300', isOpen && 'rotate-180')} />
                                </div>
                              </CollapsibleTrigger>
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                    className="overflow-hidden"
                                  >
                                    <CollapsibleContent>
                                      <div className="px-5 pb-5 pt-0">
                                        <Separator className="mb-4 bg-gray-100" />
                                        <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{content}</p>
                                      </div>
                                    </CollapsibleContent>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          </Collapsible>
                        </motion.div>
                      )
                    }

                    // List-based sections
                    const items = audit[section.key]
                    if (!items || items.length === 0) return null
                    const isOpen = expandedStrategies.has(section.key)
                    const BulletIcon = section.bulletIcon

                    return (
                      <motion.div key={section.key} variants={itemVariants}>
                        <Collapsible open={isOpen} onOpenChange={() => toggleStrategy(section.key)}>
                          <motion.div
                            whileHover={{ y: -1 }}
                            transition={{ duration: 0.2 }}
                            className={cn('rounded-2xl border bg-white/80 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden', section.borderClass)}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-3 p-5 cursor-pointer group">
                                <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', section.iconBg)}>
                                  <SectionIcon className={cn('h-4.5 w-4.5', section.iconColor)} />
                                </div>
                                <h3 className={cn('text-sm font-semibold flex-1', section.titleColor)}>{section.label}</h3>
                                <Badge variant="secondary" className={cn('text-[10px] font-medium px-2 py-0 rounded-full', section.badgeBg, section.badgeText)}>
                                  {items.length}
                                </Badge>
                                <ChevronDown className={cn('h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-transform duration-300', isOpen && 'rotate-180')} />
                              </div>
                            </CollapsibleTrigger>
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                  className="overflow-hidden"
                                >
                                  <CollapsibleContent>
                                    <div className="px-5 pb-5 pt-0">
                                      <Separator className="mb-4 bg-gray-100" />
                                      <ul className="space-y-2.5">
                                        {items.map((item, i) => (
                                          <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04, duration: 0.3 }}
                                            className="flex items-start gap-2.5 text-sm text-gray-600"
                                          >
                                            {BulletIcon ? (
                                              <BulletIcon className={cn('h-4 w-4 flex-shrink-0 mt-0.5', section.iconColor)} />
                                            ) : (
                                              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold flex-shrink-0 mt-0.5', section.bulletBg, section.bulletText)}>
                                                {i + 1}
                                              </span>
                                            )}
                                            <span className="leading-relaxed">{item}</span>
                                          </motion.li>
                                        ))}
                                      </ul>
                                    </div>
                                  </CollapsibleContent>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </Collapsible>
                      </motion.div>
                    )
                  })}
                </motion.div>

                {/* ──── ACTION BUTTONS ──── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-none">
                        <Button
                          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
                          onClick={() => setView('email-center')}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Generate Email
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-none">
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                          onClick={() => setView('leads')}
                        >
                          <Target className="mr-2 h-4 w-4" />
                          Qualify Lead
                        </Button>
                      </motion.div>
                      {campaigns.length > 0 && (
                        <div className="flex-1 sm:flex-none sm:w-56">
                          <Label className="text-xs text-gray-400 mb-1.5 block font-medium">Add to Campaign</Label>
                          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                            <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-gray-50/50">
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
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════ RECENT AUDITS (when no current audit) ══════════ */}
          <AnimatePresence>
            {!audit && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Recent Audits</h3>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={fetchRecentAudits}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>

                {recentAudits.length > 0 ? (
                  <div className="space-y-2">
                    {recentAudits.map((ra, i) => (
                      <motion.button
                        key={ra.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                        whileTap={{ scale: 0.995 }}
                        onClick={() => loadAuditById(ra.id)}
                        className="w-full text-left bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-blue-200/70 transition-all duration-200 px-5 py-4 flex items-center gap-4 group"
                      >
                        <MiniCircularScore value={ra.overallScore} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{ra.domain}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{ra.url}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {ra.createdAt && (
                            <span className="text-xs text-gray-400 hidden sm:flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(ra.createdAt)}
                            </span>
                          )}
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-blue-50 transition-colors')}>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                  >
                    <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-5">
                        <ScanSearch className="h-7 w-7 text-gray-300" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">No audits yet</h3>
                      <p className="text-sm text-gray-400 mt-2 max-w-md leading-relaxed">
                        Enter a website URL above and click &quot;Analyze Website&quot; to get your first AI-powered website audit with actionable insights.
                      </p>
                    </CardContent>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom spacing */}
          <div className="h-4" />
        </div>
      </div>
    </ScrollArea>
  )
}