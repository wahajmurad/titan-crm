'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Heart, Play, CheckCircle2, XCircle, AlertTriangle, Loader2, Sparkles,
  FileText, Globe, Linkedin, BarChart3, Target, Package, Mail,
  ArrowRight, Clock, Shield, TrendingUp, Zap, Eye, Download,
  RefreshCw, ExternalLink, Users, Brain, Copy, Check, Send, X, Edit3,
  MessageSquare, Layers, Star, ChevronRight, FileBarChart, DollarSign,
  ThumbsUp, ThumbsDown, Save, Quote, Lightbulb, AlertCircle, Info, Rocket
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────

interface LeadOption {
  id: string
  businessName: string
  website: string | null
  industry: string | null
  stage: string
  score: number
}

interface PipelineStepResult {
  step: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  duration?: number
  output?: Record<string, unknown>
  error?: string
}

interface QualityScoreDetail {
  researchQuality?: number
  businessUnderstanding?: number
  personalizationDepth?: number
  offerRelevance?: number
  emailQuality?: number
  professionalism?: number
  confidence?: number
  overall?: number
  issues?: string[]
  improvements?: string[]
}

interface SalesAngle {
  angleName: string
  hook: string
  subjectLine: string
  openingLine: string
  valueProposition: string
  emotionalTrigger: string
  bestFor: string
  estimatedEffectiveness: string
  effectivenessScore?: number
}

interface OutreachPackageData {
  companyName: string
  estimatedDealValue: string
  tier: 'platinum' | 'gold' | 'silver'
  assets: Record<string, boolean>
  rationale: string
  recommendedSequence: Array<{ step: number; action: string; asset: string; timing: string; reason: string }>
  estimatedResponseRate?: string
  estimatedMeetingRate?: string
  totalAssetsToGenerate?: number
  estimatedPrepTime?: string
}

interface ROIData {
  implementationCost?: { oneTime: string; monthly: string }
  timeSavings?: { hoursPerWeek: number; annualValue: string }
  revenueImpact?: { increasePercent: number; annualValue: string }
  costReduction?: { percent: number; annualValue: string }
  paybackPeriod?: string
  roi?: { twelveMonth: number; twentyFourMonth: number }
  netValue?: { year1: string; year2: string }
  assumptions?: string[]
  confidence?: string
  summary?: string
  potentialRevenueIncrease?: string
  potentialTimeSavings?: string
  potentialCostReduction?: string
}

// ─── Animation ──────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const stagger = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

// ─── Constants ──────────────────────────────────────────

const STEP_ICONS: Record<string, React.ElementType> = {
  research_company: Globe,
  analyze_website: Eye,
  analyze_industry: BarChart3,
  analyze_competitors: Users,
  identify_problems: AlertTriangle,
  identify_opportunities: TrendingUp,
  recommend_ai_solutions: Brain,
  generate_assets: Layers,
  generate_outreach: Mail,
  quality_check: Shield,
}

const STEP_LABELS: Record<string, string> = {
  research_company: 'Research Company',
  analyze_website: 'Analyze Website',
  analyze_industry: 'Analyze Industry',
  analyze_competitors: 'Analyze Competitors',
  identify_problems: 'Identify Problems',
  identify_opportunities: 'Identify Opportunities',
  recommend_ai_solutions: 'Recommend AI Solutions',
  generate_assets: 'Generate Sales Angles',
  generate_outreach: 'Generate Outreach',
  quality_check: 'Quality Check',
}

const TIER_COLORS = {
  platinum: 'from-amber-400 to-yellow-500 text-black',
  gold: 'from-orange-400 to-amber-500 text-white',
  silver: 'from-gray-400 to-slate-500 text-white',
}

const TIER_BG = {
  platinum: 'bg-amber-50 border-amber-200',
  gold: 'bg-orange-50 border-orange-200',
  silver: 'bg-gray-50 border-gray-200',
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function PersonalizationView() {
  const [leads, setLeads] = useState<LeadOption[]>([])
  const [selectedLead, setSelectedLead] = useState<string>('')
  const [activeTab, setActiveTab] = useState('pipeline')

  // Quick Start mode
  const [quickMode, setQuickMode] = useState(false)
  const [qsCompany, setQsCompany] = useState('')
  const [qsWebsite, setQsWebsite] = useState('')
  const [qsIndustry, setQsIndustry] = useState('')

  // Pipeline state
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepResult[]>([])
  const [pipelineContext, setPipelineContext] = useState<Record<string, unknown>>({})
  const [pipelineProgress, setPipelineProgress] = useState(0)

  // Generated content
  const [email, setEmail] = useState<{ subject: string; body: string } | null>(null)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedBody, setEditedBody] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [linkedin, setLinkedin] = useState<Record<string, unknown> | null>(null)
  const [blueprint, setBlueprint] = useState<Record<string, unknown> | null>(null)
  const [salesAngles, setSalesAngles] = useState<SalesAngle[]>([])
  const [outreachPackage, setOutreachPackage] = useState<OutreachPackageData | null>(null)
  const [qualityScores, setQualityScores] = useState<QualityScoreDetail | null>(null)
  const [roiData, setRoiData] = useState<ROIData | null>(null)

  const [generatingAsset, setGeneratingAsset] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const emailRef = useRef<HTMLDivElement>(null)

  // Load leads
  useEffect(() => {
    fetch('/api/leads?limit=200')
      .then(r => r.json())
      .then(data => {
        const list = (data.leads || []).map((l: Record<string, unknown>) => ({
          id: String(l.id),
          businessName: (l.business as Record<string, unknown>)?.name || 'Unknown',
          website: (l.business as Record<string, unknown>)?.website as string || null,
          industry: (l.business as Record<string, unknown>)?.industry as string || null,
          stage: String(l.stage),
          score: Number(l.score) || 0,
        }))
        setLeads(list)
      })
      .catch(() => {})
  }, [])

  const selectedLeadData = leads.find(l => l.id === selectedLead)

  // ═══ COPY HELPER ═══
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  // ═══ RUN FULL PERSONALIZATION PIPELINE ═══
  const runPipeline = async () => {
    if (!selectedLead && !quickMode) return
    if (quickMode && !qsCompany.trim()) {
      toast.error('Company name is required')
      return
    }

    setPipelineRunning(true)
    setPipelineSteps([])
    setPipelineContext({})
    setPipelineProgress(0)
    setQualityScores(null)
    setEmail(null)
    setLinkedin(null)
    setSalesAngles([])
    setOutreachPackage(null)
    setBlueprint(null)
    setRoiData(null)

    try {
      const body: Record<string, unknown> = quickMode
        ? { companyName: qsCompany, website: qsWebsite, industry: qsIndustry, generateAssets: false }
        : { leadId: selectedLead, generateAssets: false }

      const res = await fetch('/api/ai/personalization-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (data.success) {
        setPipelineSteps(data.pipelineSteps || [])
        setPipelineContext(data.context || {})
        if (data.context?.outreach) {
          const o = data.context.outreach as Record<string, unknown>
          setEmail({ subject: String(o.emailSubject || ''), body: String(o.emailBody || '') })
          setEditedSubject(String(o.emailSubject || ''))
          setEditedBody(String(o.emailBody || ''))
          if (o.linkedinStrategy) setLinkedin(o.linkedinStrategy as Record<string, unknown>)
        }
        if (data.context?.qualityScores) {
          setQualityScores(data.context.qualityScores as QualityScoreDetail)
        }
        if (data.context?.salesAngles) {
          setSalesAngles(data.context.salesAngles as SalesAngle[])
        }
        toast.success(`Pipeline completed for ${data.companyName}`)
      } else {
        toast.error(data.error || 'Pipeline failed')
      }
    } catch {
      toast.error('Failed to run pipeline')
    } finally {
      setPipelineRunning(false)
      setPipelineProgress(100)
    }
  }

  // ═══ GENERATE INDIVIDUAL ASSETS ═══
  const generateLinkedIn = async () => {
    if (!selectedLead && !quickMode) return
    setGeneratingAsset('linkedin')
    try {
      const body: Record<string, unknown> = selectedLead ? { leadId: selectedLead } : { companyName: qsCompany, industry: qsIndustry }
      const res = await fetch('/api/ai/linkedin-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setLinkedin(data)
        toast.success('LinkedIn strategy generated')
        setActiveTab('linkedin')
      }
    } catch { toast.error('Failed') }
    finally { setGeneratingAsset(null) }
  }

  const generateBlueprint = async () => {
    if (!selectedLead && !quickMode) return
    setGeneratingAsset('blueprint')
    try {
      const body: Record<string, unknown> = selectedLead ? { leadId: selectedLead } : { companyName: qsCompany, industry: qsIndustry }
      const res = await fetch('/api/ai/growth-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setBlueprint(data)
        toast.success('Growth Blueprint generated')
        setActiveTab('blueprint')
      }
    } catch { toast.error('Failed') }
    finally { setGeneratingAsset(null) }
  }

  const generateROI = async () => {
    if (!selectedLead && !quickMode) return
    setGeneratingAsset('roi')
    try {
      const problems = pipelineContext.problems as Record<string, unknown> | undefined
      const solutions = pipelineContext.solutions as Record<string, unknown> | undefined
      const body: Record<string, unknown> = {
        companyName: qsCompany || selectedLeadData?.businessName,
        industry: qsIndustry || selectedLeadData?.industry,
        painPoints: problems ? JSON.stringify((problems.problems as unknown[]) || []) : undefined,
        proposedSolutions: solutions ? JSON.stringify((solutions.solutions as unknown[]) || []) : undefined,
      }
      const res = await fetch('/api/ai/roi-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setRoiData(data)
      toast.success('ROI calculated')
      setActiveTab('roi')
    } catch { toast.error('Failed') }
    finally { setGeneratingAsset(null) }
  }

  const generatePackage = async () => {
    if (!selectedLead && !quickMode) return
    setGeneratingAsset('package')
    try {
      const body: Record<string, unknown> = selectedLead
        ? { leadId: selectedLead, auditScore: (pipelineContext.audit as Record<string, unknown>)?.overallScore }
        : { companyName: qsCompany, industry: qsIndustry, auditScore: (pipelineContext.audit as Record<string, unknown>)?.overallScore }
      const res = await fetch('/api/ai/outreach-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setOutreachPackage(data)
      toast.success(`Outreach package generated — ${data.tier?.toUpperCase()} tier`)
      setActiveTab('package')
    } catch { toast.error('Failed') }
    finally { setGeneratingAsset(null) }
  }

  const generateAsset = async (type: string) => {
    if (!selectedLead) return
    const lead = leads.find(l => l.id === selectedLead)
    setGeneratingAsset(type)
    try {
      const endpoint = type === 'pdf' ? '/api/generate/pdf-report' : '/api/generate/html-demo'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead }),
      })
      const data = await res.json()
      if (data.html) {
        const blob = new Blob([data.html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.fileName || `titan-${type}-${lead?.businessName || 'report'}.html`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(`${type === 'pdf' ? 'Audit Report' : 'HTML Demo'} downloaded`)
      }
    } catch { toast.error('Failed') }
    finally { setGeneratingAsset(null) }
  }

  // ═══ REVIEW ACTIONS ═══
  const handleApprove = async () => {
    if (!selectedLead) { toast.error('Lead required to approve'); return }
    setGeneratingAsset('approve')
    try {
      const res = await fetch('/api/ai/review-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          leadId: selectedLead,
          emailSubject: isEditing ? editedSubject : email?.subject,
          emailBody: isEditing ? editedBody : email?.body,
          reviewNotes: reviewNotes || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) toast.success(data.message)
      else toast.error(data.error || 'Failed')
    } catch { toast.error('Failed') }
    finally { setGeneratingAsset(null) }
  }

  const handleReject = async () => {
    if (!selectedLead) return
    setGeneratingAsset('reject')
    try {
      const res = await fetch('/api/ai/review-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', leadId: selectedLead, reviewNotes }),
      })
      const data = await res.json()
      if (data.success) toast.success(data.message)
    } catch { toast.error('Failed') }
    finally { setGeneratingAsset(null) }
  }

  const completedSteps = pipelineSteps.filter(s => s.status === 'completed').length
  const totalSteps = pipelineSteps.length || 10
  const pipelineDone = completedSteps === totalSteps && totalSteps > 0

  // ═══ RENDER ═══

  return (
    <motion.div className="mx-auto max-w-6xl space-y-5" variants={container} initial="hidden" animate="show">
      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/20">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hyper-Personalization Engine</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1.5 ml-[42px]">Deeply personalized outreach that feels like a consultant spent 30 minutes researching</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold px-3 py-1 self-start sm:self-auto">
          <Sparkles className="w-3 h-3 mr-1" /> TITAN USP
        </Badge>
      </motion.div>

      {/* ═══ LEAD SELECTOR / QUICK START ═══ */}
      <motion.div variants={stagger}>
        <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Company</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickMode(!quickMode)}
                className="text-xs text-gray-500 hover:text-blue-600 h-7 px-2"
              >
                {quickMode ? 'Switch to Lead' : 'Quick Start'}
                <Rocket className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {quickMode ? (
                <motion.div key="quick" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-400 font-medium mb-1 block">Company Name *</label>
                      <Input
                        placeholder="e.g. Smith & Associates"
                        value={qsCompany}
                        onChange={e => setQsCompany(e.target.value)}
                        className="h-10 rounded-lg bg-gray-50 border-gray-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 font-medium mb-1 block">Website</label>
                      <Input
                        placeholder="https://example.com"
                        value={qsWebsite}
                        onChange={e => setQsWebsite(e.target.value)}
                        className="h-10 rounded-lg bg-gray-50 border-gray-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 font-medium mb-1 block">Industry</label>
                      <Input
                        placeholder="e.g. Legal, Healthcare"
                        value={qsIndustry}
                        onChange={e => setQsIndustry(e.target.value)}
                        className="h-10 rounded-lg bg-gray-50 border-gray-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="lead" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                  <Select value={selectedLead} onValueChange={setSelectedLead}>
                    <SelectTrigger className="h-10 rounded-lg bg-gray-50 border-gray-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600">
                      <SelectValue placeholder="Choose a lead to personalize..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {leads.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{l.businessName}</span>
                            <span className="text-gray-400 text-xs">{l.industry}</span>
                            <Badge variant="outline" className="text-[10px] h-5">{l.stage}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={runPipeline}
                disabled={pipelineRunning || (!selectedLead && !qsCompany.trim())}
                className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm shadow-blue-600/20 px-6"
              >
                {pipelineRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-1.5" />}
                {pipelineRunning ? 'Running Pipeline...' : 'Run Full Pipeline'}
              </Button>
              {pipelineDone && (
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={generateLinkedIn} disabled={!!generatingAsset} className="h-9 rounded-lg text-xs border-gray-200">
                          {generatingAsset === 'linkedin' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Linkedin className="w-3 h-3 mr-1" />}
                          LinkedIn
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Generate LinkedIn engagement strategy</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={generateBlueprint} disabled={!!generatingAsset} className="h-9 rounded-lg text-xs border-gray-200">
                          {generatingAsset === 'blueprint' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileBarChart className="w-3 h-3 mr-1" />}
                          Blueprint
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Generate 30/60/90 day growth plan</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={generateROI} disabled={!!generatingAsset} className="h-9 rounded-lg text-xs border-gray-200">
                          {generatingAsset === 'roi' ? <Loader2 className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3 h-3 mr-1" />}
                          ROI
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Calculate expected ROI</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={generatePackage} disabled={!!generatingAsset} className="h-9 rounded-lg text-xs border-gray-200">
                          {generatingAsset === 'package' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3 mr-1" />}
                          Package
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Generate outreach package</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ SELECTED LEAD INFO ═══ */}
      <AnimatePresence>
        {(selectedLeadData || (quickMode && qsCompany)) && (
          <motion.div variants={stagger} initial="hidden" animate="show" exit="hidden">
            <Card className="bg-blue-50/50 rounded-xl border border-blue-100 p-4">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Company</div>
                    <div className="font-bold text-gray-900">{quickMode ? qsCompany : selectedLeadData?.businessName}</div>
                  </div>
                  {(quickMode ? qsIndustry : selectedLeadData?.industry) && (
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Industry</div>
                      <div className="text-sm text-gray-700">{quickMode ? qsIndustry : selectedLeadData?.industry}</div>
                    </div>
                  )}
                  {(quickMode ? qsWebsite : selectedLeadData?.website) && (
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Website</div>
                      <div className="text-sm text-blue-600 truncate">{quickMode ? qsWebsite : selectedLeadData?.website}</div>
                    </div>
                  )}
                  {qualityScores && qualityScores.overall !== undefined && (
                    <div className="text-right ml-auto">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Quality</div>
                      <div className={cn(
                        'text-xl font-black',
                        qualityScores.overall >= 90 ? 'text-emerald-600' : 'text-amber-600'
                      )}>
                        {qualityScores.overall}<span className="text-xs font-medium text-gray-400">/100</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MAIN TABS ═══ */}
      {(selectedLead || (quickMode && qsCompany)) && pipelineSteps.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100 rounded-xl p-1 h-auto flex-wrap gap-0.5">
            <TabsTrigger value="pipeline" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="email" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
              <Mail className="w-3.5 h-3.5 mr-1" /> Email
              {email && <CheckCircle2 className="w-3 h-3 ml-1 text-emerald-500" />}
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
              <Linkedin className="w-3.5 h-3.5 mr-1" /> LinkedIn
              {linkedin && <CheckCircle2 className="w-3 h-3 ml-1 text-emerald-500" />}
            </TabsTrigger>
            <TabsTrigger value="angles" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
              <Star className="w-3.5 h-3.5 mr-1" /> Angles
              {salesAngles.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5">{salesAngles.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="blueprint" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
              <FileBarChart className="w-3.5 h-3.5 mr-1" /> Blueprint
              {blueprint && <CheckCircle2 className="w-3 h-3 ml-1 text-emerald-500" />}
            </TabsTrigger>
            <TabsTrigger value="roi" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
              <DollarSign className="w-3.5 h-3.5 mr-1" /> ROI
              {roiData && <CheckCircle2 className="w-3 h-3 ml-1 text-emerald-500" />}
            </TabsTrigger>
            <TabsTrigger value="assets" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
              <Layers className="w-3.5 h-3.5 mr-1" /> Assets
            </TabsTrigger>
            <TabsTrigger value="package" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
              <Target className="w-3.5 h-3.5 mr-1" /> Package
              {outreachPackage && <CheckCircle2 className="w-3 h-3 ml-1 text-emerald-500" />}
            </TabsTrigger>
          </TabsList>

          {/* ═══ PIPELINE TAB ═══ */}
          <TabsContent value="pipeline" className="mt-6 space-y-4">
            {pipelineRunning && (
              <Card className="bg-white rounded-xl border border-gray-200/60 p-4">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500">Pipeline Progress</span>
                    <span className="text-xs font-bold text-gray-700">{completedSteps}/{totalSteps} steps</span>
                  </div>
                  <Progress value={(completedSteps / totalSteps) * 100} className="h-2" />
                </CardContent>
              </Card>
            )}

            {/* Quality Score Banner */}
            {qualityScores && qualityScores.overall !== undefined && (
              <Card className={cn(
                'rounded-xl border p-5',
                qualityScores.overall >= 90
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              )}>
                <CardContent className="p-0">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0',
                      qualityScores.overall >= 90 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    )}>
                      {qualityScores.overall}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">
                          {qualityScores.overall >= 90 ? 'Quality Check PASSED' : 'Quality Check — Below Threshold'}
                        </span>
                        {qualityScores.overall >= 90 ? <Shield className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        {pipelineContext.revisionCount ? `${pipelineContext.revisionCount} auto-revision(s)` : 'First attempt'} ·
                        Research: {qualityScores.researchQuality} ·
                        Business: {qualityScores.businessUnderstanding} ·
                        Depth: {qualityScores.personalizationDepth} ·
                        Relevance: {qualityScores.offerRelevance}
                      </div>
                      {/* Score bars */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { label: 'Research', value: qualityScores.researchQuality || 0 },
                          { label: 'Business', value: qualityScores.businessUnderstanding || 0 },
                          { label: 'Depth', value: qualityScores.personalizationDepth || 0 },
                          { label: 'Relevance', value: qualityScores.offerRelevance || 0 },
                          { label: 'Tone', value: qualityScores.professionalism || 0 },
                          { label: 'Email', value: qualityScores.emailQuality || 0 },
                        ].map(s => (
                          <div key={s.label}>
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className="text-gray-500">{s.label}</span>
                              <span className={cn('font-bold', s.value >= 90 ? 'text-emerald-600' : s.value >= 70 ? 'text-amber-600' : 'text-red-600')}>{s.value}</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', s.value >= 90 ? 'bg-emerald-500' : s.value >= 70 ? 'bg-amber-500' : 'bg-red-500')}
                                style={{ width: `${s.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pipeline Steps */}
            {pipelineSteps.map((step, idx) => {
              const Icon = STEP_ICONS[step.step] || Zap
              const isExpanded = expandedStep === step.step
              return (
                <motion.div
                  key={step.step}
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                >
                  <Card
                    className={cn(
                      'bg-white rounded-xl border border-gray-200/60 transition-all cursor-pointer hover:shadow-md',
                      step.status === 'running' && 'border-blue-300 ring-1 ring-blue-200',
                      step.status === 'failed' && 'border-red-300',
                      step.status === 'skipped' && 'opacity-60',
                    )}
                    onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                  >
                    <CardContent className="p-0">
                      <div className="p-4 flex items-center gap-3">
                        {/* Step indicator circle */}
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2',
                          step.status === 'completed' && 'bg-emerald-50 border-emerald-200 text-emerald-600',
                          step.status === 'running' && 'bg-blue-50 border-blue-300 text-blue-600 animate-pulse',
                          step.status === 'failed' && 'bg-red-50 border-red-200 text-red-600',
                          step.status === 'skipped' && 'bg-gray-50 border-gray-200 text-gray-400',
                          step.status === 'pending' && 'bg-gray-50 border-gray-200 text-gray-400',
                        )}>
                          {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                           step.status === 'failed' ? <XCircle className="w-4 h-4" /> :
                           <Icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900">
                            {STEP_LABELS[step.step] || step.step}
                          </div>
                          <div className="text-xs text-gray-500">
                            {step.status === 'running' ? 'Processing...' :
                             step.status === 'completed' && step.duration ? `${(step.duration / 1000).toFixed(1)}s` :
                             step.status === 'failed' ? step.error?.substring(0, 60) :
                             step.status === 'skipped' ? 'Skipped' : 'Waiting...'}
                          </div>
                        </div>
                        {/* Status badge */}
                        <div className="text-xs">
                          <Badge variant="outline" className={cn(
                            'text-[10px] h-5 rounded-md',
                            step.status === 'completed' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            step.status === 'running' && 'bg-blue-50 text-blue-700 border-blue-200',
                            step.status === 'failed' && 'bg-red-50 text-red-700 border-red-200',
                            step.status === 'pending' && 'bg-gray-50 text-gray-500 border-gray-200',
                          )}>
                            {step.status}
                          </Badge>
                        </div>
                        <ChevronRight className={cn('w-4 h-4 text-gray-400 transition-transform', isExpanded && 'rotate-90')} />
                      </div>

                      <AnimatePresence>
                        {isExpanded && step.output && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                              <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
                                {JSON.stringify(step.output, null, 2)}
                              </pre>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </TabsContent>

          {/* ═══ EMAIL TAB ═══ */}
          <TabsContent value="email" className="mt-6 space-y-4">
            {email ? (
              <>
                {/* Subject line */}
                <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Subject Line</div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(isEditing ? editedSubject : email.subject, 'subject')} className="h-7 text-xs text-gray-400">
                        {copiedField === 'subject' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    {isEditing ? (
                      <Input value={editedSubject} onChange={e => setEditedSubject(e.target.value)} className="rounded-lg bg-gray-50 border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                    ) : (
                      <div className="text-sm font-semibold text-gray-900">{email.subject}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Email body */}
                <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Email Body</div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setIsEditing(!isEditing) }} className="h-7 text-xs text-gray-400">
                          <Edit3 className="w-3 h-3 mr-1" />
                          {isEditing ? 'Preview' : 'Edit'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(isEditing ? editedBody : email.body, 'body')} className="h-7 text-xs text-gray-400">
                          {copiedField === 'body' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                    {isEditing ? (
                      <Textarea value={editedBody} onChange={e => setEditedBody(e.target.value)} className="rounded-lg bg-gray-50 border-gray-200 text-sm min-h-[200px] resize-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                    ) : (
                      <div ref={emailRef} className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                        {email.body}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Personalization Points */}
                {(pipelineContext.outreach as Record<string, unknown>)?.keyPersonalizationPoints && (
                  <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                    <CardContent className="p-0">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-3">Key Personalization Points</div>
                      <div className="space-y-2">
                        {((pipelineContext.outreach as Record<string, unknown>).keyPersonalizationPoints as string[]).map((p, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Quote className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{p}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Review & Approve */}
                {selectedLead && (
                  <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                    <CardContent className="p-0">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-3">Review & Approve</div>
                      <Textarea
                        placeholder="Add review notes (optional)..."
                        value={reviewNotes}
                        onChange={e => setReviewNotes(e.target.value)}
                        className="rounded-lg bg-gray-50 border-gray-200 text-sm min-h-[60px] resize-none mb-3 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleApprove}
                          disabled={!!generatingAsset}
                          className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold px-4"
                        >
                          {generatingAsset === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />}
                          Approve & Send
                        </Button>
                        <Button
                          onClick={handleReject}
                          disabled={!!generatingAsset}
                          variant="outline"
                          className="h-9 rounded-lg text-xs px-4 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {generatingAsset === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />}
                          Reject
                        </Button>
                        <Button
                          onClick={() => { setIsEditing(true); setActiveTab('email') }}
                          variant="outline"
                          className="h-9 rounded-lg text-xs px-4 border-gray-200"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                          Edit & Save
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-white rounded-xl border border-gray-200/60 p-12 text-center">
                <CardContent className="p-0 flex flex-col items-center">
                  <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Run the pipeline first to generate a personalized email</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══ LINKEDIN TAB ═══ */}
          <TabsContent value="linkedin" className="mt-6 space-y-4">
            {linkedin ? (
              <>
                <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                  <CardContent className="p-0">
                    <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-3">Recommended Approach</div>
                    {(linkedin as any)?.recommendedApproach && (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            'text-[10px] font-bold rounded-md',
                            ((linkedin as any).recommendedApproach as Record<string, unknown>).firstAction === 'engage_post' && 'bg-blue-50 text-blue-700',
                            ((linkedin as any).recommendedApproach as Record<string, unknown>).firstAction === 'connect_first' && 'bg-emerald-50 text-emerald-700',
                            ((linkedin as any).recommendedApproach as Record<string, unknown>).firstAction === 'view_profile' && 'bg-violet-50 text-violet-700',
                          )}>
                            {String(((linkedin as any).recommendedApproach as Record<string, unknown>).firstAction || '').replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">{String(((linkedin as any).recommendedApproach as Record<string, unknown>).timeline || '')}</span>
                        </div>
                        <p className="text-sm text-gray-700">{String(((linkedin as any).recommendedApproach as Record<string, unknown>).reasoning || '')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Connection Request</div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(String(((linkedin as any).connectionRequest as Record<string, unknown>)?.text || ''), 'conn')} className="h-7 text-xs">
                        {copiedField === 'conn' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700 bg-blue-50/50 rounded-lg p-3">
                      {String(((linkedin as any).connectionRequest as Record<string, unknown>)?.text || 'No connection request generated')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">First Message (After Connection)</div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(String(((linkedin as any).firstMessage as Record<string, unknown>)?.text || ''), 'firstmsg')} className="h-7 text-xs">
                        {copiedField === 'firstmsg' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700">{String(((linkedin as any).firstMessage as Record<string, unknown>)?.text || 'No first message generated')}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {String(((linkedin as any).firstMessage as Record<string, unknown>)?.timing || 'Timing not specified')}
                    </div>
                  </CardContent>
                </Card>

                {(linkedin as any).followUpSequence && Array.isArray((linkedin as any).followUpSequence) && (
                  <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                    <CardContent className="p-0">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-3">Follow-Up Sequence</div>
                      <div className="space-y-3">
                        {((linkedin as any).followUpSequence as Array<Record<string, unknown>>).map((step, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{i + 1}</div>
                              {i < ((linkedin as any).followUpSequence as Array<Record<string, unknown>>).length - 1 && (
                                <div className="w-px h-full bg-gray-200 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-900">{String(step.action || '').replace(/_/g, ' ')}</span>
                                <Badge variant="outline" className="text-[10px] h-4 rounded-md">{String(step.day || '')}</Badge>
                              </div>
                              <p className="text-xs text-gray-500">{String(step.content || '')}</p>
                              <p className="text-[10px] text-gray-400 mt-1 italic">{String(step.purpose || '')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-white rounded-xl border border-gray-200/60 p-12 text-center">
                <CardContent className="p-0 flex flex-col items-center">
                  <Linkedin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">No LinkedIn strategy generated yet</p>
                  {pipelineDone && (
                    <Button variant="outline" onClick={generateLinkedIn} disabled={!!generatingAsset} className="rounded-lg text-xs border-gray-200">
                      {generatingAsset === 'linkedin' ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Linkedin className="w-3 h-3 mr-1.5" />}
                      Generate LinkedIn Strategy
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══ SALES ANGLES TAB ═══ */}
          <TabsContent value="angles" className="mt-6 space-y-4">
            {salesAngles.length > 0 ? (
              <div className="grid gap-3">
                {salesAngles.map((angle, idx) => (
                  <motion.div
                    key={angle.angleName}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="bg-white rounded-xl border border-gray-200/60 p-5 hover:shadow-md hover:border-gray-300 transition-all">
                      <CardContent className="p-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                              <span className="text-sm font-bold text-gray-900">{angle.angleName}</span>
                              <Badge variant="outline" className={cn(
                                'text-[10px] h-5 rounded-md',
                                angle.estimatedEffectiveness === 'High' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                angle.estimatedEffectiveness === 'Medium' && 'bg-amber-50 text-amber-700 border-amber-200',
                                angle.estimatedEffectiveness === 'Low' && 'bg-gray-50 text-gray-500 border-gray-200',
                              )}>
                                {angle.estimatedEffectiveness}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] h-5 rounded-md bg-blue-50 text-blue-700 border-blue-200">
                                {String(angle.bestFor)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{angle.hook}</p>
                            <div className="space-y-1.5">
                              <div className="flex items-start gap-2">
                                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-[10px] text-gray-400 font-medium block">SUBJECT</span>
                                  <span className="text-xs text-gray-700">{angle.subjectLine}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-[10px] text-gray-400 font-medium block">OPENING</span>
                                  <span className="text-xs text-gray-700">{angle.openingLine}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Lightbulb className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-[10px] text-gray-400 font-medium block">VALUE</span>
                                  <span className="text-xs text-gray-700">{angle.valueProposition}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-[10px] text-gray-400 font-medium block">EMOTIONAL TRIGGER</span>
                                  <span className="text-xs text-gray-700">{angle.emotionalTrigger}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {angle.effectivenessScore !== undefined && (
                            <div className="text-center shrink-0">
                              <div className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black',
                                angle.effectivenessScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                angle.effectivenessScore >= 60 ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-500'
                              )}>
                                {angle.effectivenessScore}
                              </div>
                              <div className="text-[9px] text-gray-400 mt-0.5">SCORE</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="bg-white rounded-xl border border-gray-200/60 p-12 text-center">
                <CardContent className="p-0 flex flex-col items-center">
                  <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Sales angles will be generated during the pipeline</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══ BLUEPRINT TAB ═══ */}
          <TabsContent value="blueprint" className="mt-6 space-y-4">
            {blueprint ? (
              <>
                {blueprint.currentSituation && (
                  <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                    <CardContent className="p-0">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-2">Current Situation</div>
                      <p className="text-sm text-gray-700 leading-relaxed">{String(blueprint.currentSituation)}</p>
                    </CardContent>
                  </Card>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['thirtyDayPlan', 'sixtyDayPlan', 'ninetyDayPlan'] as const).map((plan, i) => {
                    const data = blueprint[plan] as Record<string, unknown> | undefined
                    if (!data) return null
                    const colors = ['border-blue-400 text-blue-700', 'border-violet-400 text-violet-700', 'border-emerald-400 text-emerald-700']
                    const labels = ['Days 1-30', 'Days 31-60', 'Days 61-90']
                    return (
                      <Card key={plan} className="bg-white rounded-xl border border-gray-200/60 p-5 border-l-4" style={{ borderLeftColor: colors[i].includes('blue') ? '#3B82F6' : colors[i].includes('violet') ? '#8B5CF6' : '#059669' }}>
                        <CardContent className="p-0">
                          <Badge variant="outline" className={cn('text-[10px] mb-2 rounded-md', colors[i])}>{labels[i]}</Badge>
                          <div className="text-sm font-bold text-gray-900 mb-2">{String(data.focus || '')}</div>
                          <p className="text-xs text-gray-500">{String(data.expectedResults || '')}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                {blueprint.recommendedAISolutions && Array.isArray(blueprint.recommendedAISolutions) && (
                  <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                    <CardContent className="p-0">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-3">Recommended AI Solutions</div>
                      <div className="space-y-2">
                        {(blueprint.recommendedAISolutions as Array<Record<string, unknown>>).slice(0, 5).map((s, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs font-semibold text-gray-900">{String(s.solution || s.name || '')}</div>
                              <div className="text-[11px] text-gray-500">{String(s.description || '')}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[9px] h-4 rounded-md">{String(s.category || '')}</Badge>
                                {s.confidence != null && <span className="text-[9px] text-gray-400">Confidence: {String(s.confidence)}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-white rounded-xl border border-gray-200/60 p-12 text-center">
                <CardContent className="p-0 flex flex-col items-center">
                  <FileBarChart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">Generate a 30/60/90 day growth blueprint</p>
                  {pipelineDone && (
                    <Button variant="outline" onClick={generateBlueprint} disabled={!!generatingAsset} className="rounded-lg text-xs border-gray-200">
                      {generatingAsset === 'blueprint' ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <FileBarChart className="w-3 h-3 mr-1.5" />}
                      Generate Blueprint
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══ ROI TAB ═══ */}
          <TabsContent value="roi" className="mt-6 space-y-4">
            {roiData ? (
              <>
                {roiData.summary && (
                  <Card className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
                    <CardContent className="p-0">
                      <p className="text-sm text-emerald-800 font-medium">{String(roiData.summary)}</p>
                      {roiData.confidence && (
                        <Badge variant="outline" className="mt-2 text-[10px] bg-white/80 border-emerald-200 text-emerald-700 rounded-md">
                          Confidence: {String(roiData.confidence)}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Time Savings', value: roiData.timeSavings?.hoursPerWeek ? `${roiData.timeSavings.hoursPerWeek}h/week` : roiData.potentialTimeSavings || 'N/A', color: 'text-blue-600', icon: Clock },
                    { label: 'Revenue Increase', value: roiData.revenueImpact?.increasePercent ? `${roiData.revenueImpact.increasePercent}%` : roiData.potentialRevenueIncrease || 'N/A', color: 'text-emerald-600', icon: TrendingUp },
                    { label: 'Cost Reduction', value: roiData.costReduction?.percent ? `${roiData.costReduction.percent}%` : roiData.potentialCostReduction || 'N/A', color: 'text-violet-600', icon: DollarSign },
                    { label: 'Payback Period', value: roiData.paybackPeriod || 'N/A', color: 'text-amber-600', icon: Target },
                  ].map(m => (
                    <Card key={m.label} className="bg-white rounded-xl border border-gray-200/60 p-4 text-center">
                      <CardContent className="p-0">
                        <m.icon className={cn('w-5 h-5 mx-auto mb-1.5', m.color)} />
                        <div className={cn('text-xl font-black', m.color)}>{m.value}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{m.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {(roiData.roi || roiData.netValue || roiData.implementationCost) && (
                  <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                    <CardContent className="p-0">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-3">Financial Details</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {roiData.implementationCost && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-[10px] text-gray-400 font-medium">One-Time Cost</div>
                            <div className="text-sm font-bold text-gray-900">{String(roiData.implementationCost.oneTime || 'N/A')}</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-2">Monthly Cost</div>
                            <div className="text-sm font-bold text-gray-900">{String(roiData.implementationCost.monthly || 'N/A')}</div>
                          </div>
                        )}
                        {roiData.roi && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-[10px] text-gray-400 font-medium">12-Month ROI</div>
                            <div className="text-sm font-bold text-emerald-600">{roiData.roi.twelveMonth}%</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-2">24-Month ROI</div>
                            <div className="text-sm font-bold text-emerald-600">{roiData.roi.twentyFourMonth}%</div>
                          </div>
                        )}
                        {roiData.netValue && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-[10px] text-gray-400 font-medium">Year 1 Net Value</div>
                            <div className="text-sm font-bold text-gray-900">{String(roiData.netValue.year1 || 'N/A')}</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-2">Year 2 Net Value</div>
                            <div className="text-sm font-bold text-gray-900">{String(roiData.netValue.year2 || 'N/A')}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {roiData.assumptions && roiData.assumptions.length > 0 && (
                  <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                    <CardContent className="p-0">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-2">Assumptions</div>
                      <ul className="space-y-1">
                        {roiData.assumptions.map((a, i) => (
                          <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                            <Info className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-white rounded-xl border border-gray-200/60 p-12 text-center">
                <CardContent className="p-0 flex flex-col items-center">
                  <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">Calculate expected ROI for this company</p>
                  {pipelineDone && (
                    <Button variant="outline" onClick={generateROI} disabled={!!generatingAsset} className="rounded-lg text-xs border-gray-200">
                      {generatingAsset === 'roi' ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <DollarSign className="w-3 h-3 mr-1.5" />}
                      Calculate ROI
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══ ASSETS TAB ═══ */}
          <TabsContent value="assets" className="mt-6 space-y-4">
            {selectedLead ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { type: 'pdf', label: 'Premium Audit PDF', desc: '17-section consulting-grade report', icon: FileText, color: 'text-red-500 bg-red-50' },
                  { type: 'html', label: 'Personalized HTML Demo', desc: 'Custom landing page for this company', icon: Globe, color: 'text-blue-500 bg-blue-50' },
                ].map(asset => (
                  <Card key={asset.type} className="bg-white rounded-xl border border-gray-200/60 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group" onClick={() => generateAsset(asset.type)}>
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', asset.color)}>
                          <asset.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">{asset.label}</div>
                          <div className="text-xs text-gray-500">{asset.desc}</div>
                        </div>
                        {generatingAsset === asset.type ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <Download className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white rounded-xl border border-gray-200/60 p-12 text-center">
                <CardContent className="p-0 flex flex-col items-center">
                  <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Select a lead (not Quick Start) to generate downloadable assets</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══ PACKAGE TAB ═══ */}
          <TabsContent value="package" className="mt-6 space-y-4">
            {outreachPackage ? (
              <>
                {/* Tier badge */}
                <Card className={cn('rounded-xl border p-5', TIER_BG[outreachPackage.tier])}>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">Outreach Tier</div>
                        <div className="text-xl font-black">
                          <span className={cn('bg-gradient-to-r bg-clip-text text-transparent px-2 py-0.5 rounded-lg', TIER_COLORS[outreachPackage.tier])}>
                            {outreachPackage.tier.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-medium text-gray-500">Est. Deal Value</div>
                        <div className="text-lg font-bold text-gray-900">{outreachPackage.estimatedDealValue || 'N/A'}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-3">{outreachPackage.rationale}</p>
                  </CardContent>
                </Card>

                {/* Asset checklist */}
                <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                  <CardContent className="p-0">
                    <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-3">Package Assets</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(outreachPackage.assets).map(([key, val]) => (
                        <div key={key} className={cn('flex items-center gap-1.5 p-2 rounded-lg text-xs', val ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400')}>
                          {val ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {outreachPackage.estimatedResponseRate && (
                    <Card className="bg-white rounded-xl border border-gray-200/60 p-4 text-center">
                      <CardContent className="p-0">
                        <div className="text-xl font-black text-blue-600">{outreachPackage.estimatedResponseRate}</div>
                        <div className="text-[10px] text-gray-500">Est. Response Rate</div>
                      </CardContent>
                    </Card>
                  )}
                  {outreachPackage.estimatedMeetingRate && (
                    <Card className="bg-white rounded-xl border border-gray-200/60 p-4 text-center">
                      <CardContent className="p-0">
                        <div className="text-xl font-black text-emerald-600">{outreachPackage.estimatedMeetingRate}</div>
                        <div className="text-[10px] text-gray-500">Est. Meeting Rate</div>
                      </CardContent>
                    </Card>
                  )}
                  {outreachPackage.totalAssetsToGenerate && (
                    <Card className="bg-white rounded-xl border border-gray-200/60 p-4 text-center">
                      <CardContent className="p-0">
                        <div className="text-xl font-black text-violet-600">{outreachPackage.totalAssetsToGenerate}</div>
                        <div className="text-[10px] text-gray-500">Assets to Generate</div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sequence Timeline */}
                {outreachPackage.recommendedSequence && outreachPackage.recommendedSequence.length > 0 && (
                  <Card className="bg-white rounded-xl border border-gray-200/60 p-5">
                    <CardContent className="p-0">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-3">Recommended Sequence</div>
                      <div className="space-y-3">
                        {outreachPackage.recommendedSequence.map((seq, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{seq.step}</div>
                              {i < outreachPackage.recommendedSequence.length - 1 && (
                                <div className="w-px h-full bg-gray-200 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-900">{seq.action}</span>
                                <Badge variant="outline" className="text-[10px] h-4 rounded-md">{seq.timing}</Badge>
                              </div>
                              <p className="text-xs text-gray-500">{seq.reason}</p>
                              {seq.asset && (
                                <div className="text-[10px] text-gray-400 mt-1">Asset: {seq.asset}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-white rounded-xl border border-gray-200/60 p-12 text-center">
                <CardContent className="p-0 flex flex-col items-center">
                  <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">Generate an outreach package based on deal value</p>
                  {pipelineDone && (
                    <Button variant="outline" onClick={generatePackage} disabled={!!generatingAsset} className="rounded-lg text-xs border-gray-200">
                      {generatingAsset === 'package' ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Package className="w-3 h-3 mr-1.5" />}
                      Generate Package
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  )
}