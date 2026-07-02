'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
 Lightbulb,
 Brain,
 Target,
 TrendingUp,
 Mail,
 Zap,
 BarChart3,
 ArrowRight,
 RefreshCw,
 Copy,
 CheckCircle2,
 AlertTriangle,
 ChevronDown,
 Loader2,
 Clock,
 Sparkles,
 Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────

interface Campaign {
 id: string
 name: string
 industry: string | null
 targetLocation: string | null
 targetCity: string | null
 targetSize: string | null
 serviceOffering: string | null
 dailyLimit: number
 aiModel: string
 notes: string | null
 status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
 leadCount: number
 sentCount: number
 replyCount: number
 meetingCount: number
 wonCount: number
 createdAt: string
 updatedAt: string
 owner: { id: string; name: string; email: string }
 _count?: { leads: number; outreaches: number }
}

interface Finding {
 severity: 'Critical' | 'Warning' | 'Opportunity'
 category: string
 description: string
}

interface Recommendation {
 priority: 'High' | 'Medium' | 'Low'
 title: string
 description: string
 expectedImpact: string
}

interface AnalysisResult {
 executiveSummary: string
 findings: Finding[]
 recommendations: Recommendation[]
 strategyScore: number
}

interface AnalysisHistory {
 id: string
 timestamp: Date
 campaignName: string
 categories: string[]
 result: AnalysisResult
}

interface AnalysisCategory {
 id: string
 label: string
 icon: React.ElementType
 description: string
}

// ─── Constants ───────────────────────────────────────────────────────

const ANALYSIS_CATEGORIES: AnalysisCategory[] = [
 {
  id: 'lead-quality',
  label: 'Lead Quality Analysis',
  icon: Target,
  description: 'Evaluate lead scoring, qualification rates, and ICP fit',
 },
 {
  id: 'email-performance',
  label: 'Email Performance',
  icon: Mail,
  description: 'Open rates, reply rates, bounce rates, and deliverability',
 },
 {
  id: 'conversion-optimization',
  label: 'Conversion Optimization',
  icon: TrendingUp,
  description: 'Conversion funnel analysis and bottleneck identification',
 },
 {
  id: 'follow-up-strategy',
  label: 'Follow-up Strategy',
  icon: RefreshCw,
  description: 'Follow-up cadence, timing, and response patterns',
 },
 {
  id: 'pipeline-velocity',
  label: 'Pipeline Velocity',
  icon: Zap,
  description: 'Speed from lead to meeting to close and deal flow',
 },
 {
  id: 'audience-targeting',
  label: 'Audience Targeting',
  icon: BarChart3,
  description: 'ICP alignment, segment performance, and targeting precision',
 },
]

const PROGRESS_STAGES = [
 'Analyzing campaign data...',
 'Evaluating lead quality...',
 'Generating strategy recommendations...',
 'Finalizing insights...',
]

const SEVERITY_CONFIG = {
 Critical: {
  bg: 'bg-red-50 text-red-700 border-red-200',
  dot: 'bg-red-500',
  icon: AlertTriangle,
 },
 Warning: {
  bg: 'bg-amber-50 text-amber-700 border-amber-200',
  dot: 'bg-amber-500',
  icon: AlertTriangle,
 },
 Opportunity: {
  bg: 'bg-blue-50 text-blue-700 border-blue-200',
  dot: 'bg-blue-500',
  icon: Lightbulb,
 },
} as const

const PRIORITY_CONFIG = {
 High: 'bg-red-50 text-red-700',
 Medium: 'bg-amber-50 text-amber-700',
 Low: 'bg-gray-100 text-gray-600',
} as const

// ─── Helpers ─────────────────────────────────────────────────────────

function generateId() {
 return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

function getScoreColor(score: number): string {
 if (score >= 80) return 'text-emerald-600'
 if (score >= 60) return 'text-blue-600'
 if (score >= 40) return 'text-amber-600'
 return 'text-red-600'
}

function getScoreLabel(score: number): string {
 if (score >= 80) return 'Excellent'
 if (score >= 60) return 'Good'
 if (score >= 40) return 'Needs Improvement'
 return 'Critical'
}

function getScoreProgressColor(score: number): string {
 if (score >= 80) return '[&>div]:bg-emerald-500'
 if (score >= 60) return '[&>div]:bg-blue-500'
 if (score >= 40) return '[&>div]:bg-amber-500'
 return '[&>div]:bg-red-500'
}

// ─── Progress Indicator ──────────────────────────────────────────────

function AnalysisProgress({ currentStage }: { currentStage: number }) {
 return (
  <div className="flex flex-col items-center justify-center py-16 space-y-6">
   {/* Pulsing blue dot */}
   <div className="relative">
    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
     <div className="w-5 h-5 rounded-full bg-blue-500 animate-pulse" />
    </div>
    <div className="absolute -inset-4 rounded-full bg-blue-400/10 animate-ping" />
   </div>

   {/* Stage text with transition */}
   <div className="h-6 flex items-center">
    <p className="text-sm font-medium bg-blue-600 from-blue-600 to-blue-400 bg-clip-text text-transparent transition-all duration-500">
     {PROGRESS_STAGES[currentStage]}
    </p>
   </div>

   {/* Stage dots */}
   <div className="flex items-center gap-2">
    {PROGRESS_STAGES.map((_, idx) => (
     <div
      key={idx}
 className={cn(
       'w-2 h-2 rounded-full transition-all duration-500',
       idx <= currentStage ? 'bg-blue-500 scale-100' : 'bg-gray-200 scale-75'
      )}
     />
    ))}
   </div>

   {/* Sub-text */}
   <p className="text-xs text-gray-400">This may take a moment...</p>
  </div>
 )
}

// ─── Strategy Score Visualization ─────────────────────────────────────

function StrategyScore({ score }: { score: number }) {
 return (
  <div className="bg-white/80 border border-gray-200/60 rounded-xl p-6 shadow-sm">
   <div className="flex items-center justify-between mb-4">
    <h3 className="font-semibold text-gray-900 text-sm">Strategy Score</h3>
    <Badge variant="outline" className={cn('text-xs font-medium', getScoreColor(score))}>
     {getScoreLabel(score)}
    </Badge>
   </div>

   <div className="flex items-end gap-4 mb-4">
    <span className={cn('text-4xl font-bold tabular-nums', getScoreColor(score))}>
     {score}
    </span>
    <span className="text-sm text-gray-400 mb-1">/ 100</span>
   </div>

   <Progress
    value={score}
 className={cn('h-2 bg-gray-100', getScoreProgressColor(score))}
   />

   <div className="flex justify-between mt-2 text-[10px] text-gray-400">
    <span>Critical</span>
    <span>Needs Work</span>
    <span>Good</span>
    <span>Excellent</span>
   </div>
  </div>
 )
}

// ─── Finding Card ─────────────────────────────────────────────────────

function FindingCard({ finding }: { finding: Finding }) {
 const config = SEVERITY_CONFIG[finding.severity]
 const Icon = config.icon

 return (
  <div className={cn('flex items-start gap-3 p-4 rounded-xl border', config.bg)}>
   <Icon className="w-4 h-4 mt-0.5 shrink-0" />
   <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-1">
     <Badge variant="outline" className={cn('text-[10px] font-medium border-current/30', config.bg)}>
      {finding.severity}
     </Badge>
     <span className="text-xs text-gray-500">{finding.category}</span>
    </div>
    <p className="text-sm text-gray-700 leading-relaxed">{finding.description}</p>
   </div>
  </div>
 )
}

// ─── Recommendation Card ──────────────────────────────────────────────

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
 const [copied, setCopied] = useState(false)

 const handleCopy = useCallback(() => {
  const text = `${recommendation.title}\n${recommendation.description}\nExpected Impact: ${recommendation.expectedImpact}`
  navigator.clipboard.writeText(text).then(() => {
   setCopied(true)
   toast.success('Copied to clipboard')
   setTimeout(() => setCopied(false), 2000)
  })
 }, [recommendation])

 return (
  <div className="bg-white border border-gray-200/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
   <div className="flex items-start justify-between gap-3 mb-2">
    <h4 className="font-semibold text-gray-900 text-sm">{recommendation.title}</h4>
    <div className="flex items-center gap-2 shrink-0">
     <Badge className={cn('text-[10px] font-medium border-0', PRIORITY_CONFIG[recommendation.priority])}>
      {recommendation.priority}
     </Badge>
     <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
 className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
     >
      {copied ? (
       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
       <Copy className="w-3.5 h-3.5" />
      )}
     </Button>
    </div>
   </div>
   <p className="text-sm text-gray-600 leading-relaxed mb-3">{recommendation.description}</p>
   <div className="flex items-center gap-1.5 text-xs text-gray-500">
    <TrendingUp className="w-3 h-3" />
    <span>Expected impact: {recommendation.expectedImpact}</span>
   </div>
  </div>
 )
}

// ─── History Item ─────────────────────────────────────────────────────

function HistoryItem({
 entry,
 onSelect,
}: {
 entry: AnalysisHistory
 onSelect: (entry: AnalysisHistory) => void
}) {
 return (
  <button
   onClick={() => onSelect(entry)}
 className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200/60 bg-white hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all text-left group"
  >
   <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
    <Brain className="w-4 h-4 text-blue-500" />
   </div>
   <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-gray-900 truncate">{entry.campaignName}</p>
    <div className="flex items-center gap-1.5 mt-0.5">
     <Clock className="w-3 h-3 text-gray-400" />
     <p className="text-xs text-gray-400">
      {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {entry.categories.length} categories
     </p>
    </div>
   </div>
   <div className="flex items-center gap-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
    <span>View</span>
    <ArrowRight className="w-3 h-3" />
   </div>
  </button>
 )
}

// ─── Main Component ──────────────────────────────────────────────────

export function StrategyAssistantView() {
 // State
 const [campaigns, setCampaigns] = useState<Campaign[]>([])
 const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all')
 const [selectedCategories, setSelectedCategories] = useState<string[]>([])
 const [isAnalyzing, setIsAnalyzing] = useState(false)
 const [progressStage, setProgressStage] = useState(0)
 const [result, setResult] = useState<AnalysisResult | null>(null)
 const [history, setHistory] = useState<AnalysisHistory[]>([])
 const [loadingCampaigns, setLoadingCampaigns] = useState(true)
 const [showHistory, setShowHistory] = useState(false)

 // Fetch campaigns
 useEffect(() => {
  async function fetchCampaigns() {
   try {
    const res = await fetch('/api/campaigns')
    if (res.ok) {
     const data = await res.json()
     setCampaigns(data.campaigns || [])
    }
   } catch {
    toast.error('Failed to load campaigns')
   } finally {
    setLoadingCampaigns(false)
   }
  }
  fetchCampaigns()
 }, [])

 // Toggle category selection
 const toggleCategory = useCallback((categoryId: string) => {
  setSelectedCategories((prev) =>
   prev.includes(categoryId)
    ? prev.filter((id) => id !== categoryId)
    : [...prev, categoryId]
  )
 }, [])

 // Select all / deselect all
 const toggleAllCategories = useCallback(() => {
  if (selectedCategories.length === ANALYSIS_CATEGORIES.length) {
   setSelectedCategories([])
  } else {
   setSelectedCategories(ANALYSIS_CATEGORIES.map((c) => c.id))
  }
 }, [selectedCategories.length])

 // Progress stage animation
 useEffect(() => {
  if (!isAnalyzing) return

  const interval = setInterval(() => {
   setProgressStage((prev) => {
    if (prev < PROGRESS_STAGES.length - 1) return prev + 1
    return prev
   })
  }, 2500)

  return () => clearInterval(interval)
 }, [isAnalyzing])

 // Run analysis
 const runAnalysis = useCallback(async () => {
  if (selectedCategories.length === 0) {
   toast.error('Please select at least one analysis category')
   return
  }

  setIsAnalyzing(true)
  setProgressStage(0)
  setResult(null)

  // Build campaign data payload — limit to essential fields to avoid token overflow
  const selectedCampaign = selectedCampaignId === 'all'
   ? null
   : campaigns.find((c) => c.id === selectedCampaignId) || null
  const campaignData = selectedCampaignId === 'all'
   ? campaigns.map(c => ({
     name: c.name,
     industry: c.industry,
     status: c.status,
     leadCount: c.leadCount,
     sentCount: c.sentCount,
     replyCount: c.replyCount,
     meetingCount: c.meetingCount,
     wonCount: c.wonCount,
    }))
   : selectedCampaign

  const categoryLabels = selectedCategories
   .map((id) => ANALYSIS_CATEGORIES.find((c) => c.id === id)?.label)
   .filter(Boolean)
   .join(', ')

  const campaignLabel =
   selectedCampaignId === 'all' ? 'All Campaigns' : selectedCampaign?.name || 'Selected Campaign'

  try {
   // Add AbortController for 60s timeout
   const controller = new AbortController()
   const timeoutId = setTimeout(() => controller.abort(), 60000)

   let res: Response
   try {
    res = await fetch('/api/ai/chat', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     signal: controller.signal,
     body: JSON.stringify({
      messages: [
       {
        role: 'system',
        content:
         'You are a senior sales strategy consultant with deep expertise in B2B sales, demand generation, pipeline optimization, and revenue operations. You analyze campaign data and provide actionable, data-driven recommendations. Always respond with valid JSON matching the requested schema. Be specific, quantified, and practical.',
       },
       {
        role: 'user',
        content: `Analyze my campaign: ${JSON.stringify(campaignData)}. Focus on: ${categoryLabels}. Provide JSON with: { executiveSummary: string (2-3 sentence high-level assessment), findings: [{severity: "Critical"|"Warning"|"Opportunity", category: string, description: string}], recommendations: [{priority: "High"|"Medium"|"Low", title: string, description: string, expectedImpact: string}], strategyScore: number (0-100) }. Return ONLY valid JSON, no markdown.`,
       },
      ],
     }),
    })
   } finally {
    clearTimeout(timeoutId)
   }

   if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: `Request failed (${res.status})` }))
    throw new Error(errData.error || `AI request failed (${res.status}). Please try again in 30 seconds.`)
   }

   const data = await res.json()
   const content = data.response || data.message || data.content || ''

   if (!content.trim()) {
    throw new Error('AI returned an empty response. Please try again.')
   }

   // Try to parse JSON from the response
   let analysisResult: AnalysisResult
   try {
    // Strip markdown code fences first
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    // Try direct parse
    try {
     analysisResult = JSON.parse(cleaned)
    } catch {
     // Try regex extraction
     const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
     if (jsonMatch) {
      analysisResult = JSON.parse(jsonMatch[0])
     } else {
      throw new Error('No JSON found')
     }
    }
    // Validate shape
    if (!analysisResult.executiveSummary || !Array.isArray(analysisResult.findings) || !Array.isArray(analysisResult.recommendations)) {
     throw new Error('Invalid shape')
    }
    // Ensure strategyScore is a number
    if (typeof analysisResult.strategyScore !== 'number') {
     analysisResult.strategyScore = 65
    }
   } catch {
    // Fallback: create a structured result from the raw text
    analysisResult = {
     executiveSummary: content.slice(0, 300) || 'Analysis completed but the response could not be structured.',
     findings: content.trim()
      ? [{ severity: 'Opportunity' as const, category: 'General', description: content.slice(0, 200) }]
      : [],
     recommendations: content.trim()
      ? [{
        priority: 'Medium' as const,
        title: 'Review Full Analysis',
        description: content.slice(200, 500),
        expectedImpact: 'Review AI output for detailed insights',
       }]
      : [],
     strategyScore: 65,
    }
   }

   setResult(analysisResult)

   // Save to history
   const historyEntry: AnalysisHistory = {
    id: generateId(),
    timestamp: new Date(),
    campaignName: campaignLabel,
    categories: selectedCategories,
    result: analysisResult,
   }
   setHistory((prev) => [historyEntry, ...prev].slice(0, 5))

   toast.success('Analysis complete')
  } catch (error) {
   let msg = 'Unknown error'
   if (error instanceof Error) {
    if (error.name === 'AbortError') {
     msg = 'Request timed out. The AI took too long to respond. Please try again.'
    } else if (error.message.includes('rate limit') || error.message.includes('busy') || error.message.includes('429')) {
     msg = 'AI is currently busy. Please wait 30 seconds and try again.'
    } else {
     msg = error.message
    }
   }
   toast.error(`Analysis failed: ${msg}`)
  } finally {
   setIsAnalyzing(false)
   setProgressStage(0)
  }
 }, [selectedCampaignId, selectedCategories, campaigns])

 // Select from history
 const selectFromHistory = useCallback((entry: AnalysisHistory) => {
  setResult(entry.result)
  setShowHistory(false)
 }, [])

 // Get selected campaign name for display
 const selectedCampaignName =
  selectedCampaignId === 'all'
   ? 'All Campaigns'
   : campaigns.find((c) => c.id === selectedCampaignId)?.name || 'Select a campaign'

 return (
  <div className="space-y-6 max-w-5xl mx-auto">
   {/* Header */}
   <div className="bg-white/80 border border-gray-200/60 rounded-xl p-6 shadow-sm">
    <div className="flex items-start justify-between gap-4">
     <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
       <Brain className="w-5 h-5 text-white" />
      </div>
      <div>
       <h1 className="font-semibold text-gray-900 text-lg">AI Strategy Assistant</h1>
       <p className="text-sm text-gray-500">
        Analyze your campaigns and get actionable improvement suggestions
       </p>
      </div>
     </div>
     {history.length > 0 && (
      <div className="relative">
       <Button
        variant="outline"
        size="sm"
        onClick={() => setShowHistory(!showHistory)}
 className="text-xs gap-1.5"
       >
        <Clock className="w-3.5 h-3.5" />
        History ({history.length})
        <ChevronDown className={cn('w-3 h-3 transition-transform', showHistory && 'rotate-180')} />
       </Button>

       {/* History Dropdown */}
       {showHistory && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200/60 rounded-xl shadow-lg z-50 overflow-hidden">
         <div className="p-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Analyses</p>
         </div>
         <div className="p-2 space-y-1.5 max-h-80 overflow-y-auto">
          {history.map((entry) => (
           <HistoryItem key={entry.id} entry={entry} onSelect={selectFromHistory} />
          ))}
         </div>
        </div>
       )}
      </div>
     )}
    </div>
   </div>

   {/* Campaign Selector */}
   <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <h3 className="font-semibold text-gray-900 text-sm mb-3">Campaign Context</h3>
    <p className="text-sm text-gray-500 mb-4">
     Select which campaign to analyze, or review all campaigns together.
    </p>
    <Select
     value={selectedCampaignId}
     onValueChange={setSelectedCampaignId}
     disabled={loadingCampaigns || isAnalyzing}
    >
     <SelectTrigger className="w-full max-w-md">
      <SelectValue placeholder={loadingCampaigns ? 'Loading campaigns...' : 'Select campaign'} />
     </SelectTrigger>
     <SelectContent>
      <SelectItem value="all">
       <span className="flex items-center gap-2">
        <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
        Analyze All Campaigns
       </span>
      </SelectItem>
      {campaigns.map((campaign) => (
       <SelectItem key={campaign.id} value={campaign.id}>
        <span className="flex items-center gap-2">
         <Target className="w-3.5 h-3.5 text-gray-400" />
         {campaign.name}
         {campaign.status === 'ACTIVE' && (
          <Badge className="ml-1 bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0">
           Live
          </Badge>
         )}
        </span>
       </SelectItem>
      ))}
     </SelectContent>
    </Select>

    {/* Campaign stats when specific campaign selected */}
    {selectedCampaignId !== 'all' && campaigns.length > 0 && (() => {
     const c = campaigns.find((c) => c.id === selectedCampaignId)
     if (!c) return null
     return (
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
       {[
        { label: 'Leads', value: c.leadCount || c._count?.leads || 0 },
        { label: 'Sent', value: c.sentCount || c._count?.outreaches || 0 },
        { label: 'Replies', value: c.replyCount },
        { label: 'Meetings', value: c.meetingCount },
       ].map((stat) => (
        <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
         <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
         <p className="text-xs text-gray-500">{stat.label}</p>
        </div>
       ))}
      </div>
     )
    })()}
   </div>

   {/* Analysis Categories */}
   <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
     <div>
      <h3 className="font-semibold text-gray-900 text-sm">Analysis Categories</h3>
      <p className="text-sm text-gray-500 mt-0.5">
       Select areas you want the AI to focus on.
      </p>
     </div>
     <Button
      variant="ghost"
      size="sm"
      onClick={toggleAllCategories}
 className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
     >
      {selectedCategories.length === ANALYSIS_CATEGORIES.length ? 'Deselect All' : 'Select All'}
     </Button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
     {ANALYSIS_CATEGORIES.map((category) => {
      const isSelected = selectedCategories.includes(category.id)
      const Icon = category.icon
      return (
       <button
        key={category.id}
        onClick={() => toggleCategory(category.id)}
        disabled={isAnalyzing}
 className={cn(
         'relative border border-gray-200/60 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all text-left group disabled:opacity-50 disabled:pointer-events-none',
         isSelected && 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
        )}
       >
        <div className="flex items-start gap-3">
         <div
 className={cn(
           'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
           isSelected ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-100'
          )}
         >
          <Icon
 className={cn(
            'w-4 h-4 transition-colors',
            isSelected ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
           )}
          />
         </div>
         <div className="flex-1 min-w-0">
          <p
 className={cn(
            'text-sm font-medium transition-colors',
            isSelected ? 'text-blue-900' : 'text-gray-900'
           )}
          >
           {category.label}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
           {category.description}
          </p>
         </div>
        </div>
        {/* Check indicator */}
        {isSelected && (
         <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-4 h-4 text-blue-500" />
         </div>
        )}
       </button>
      )
     })}
    </div>
   </div>

   {/* Analyze Button */}
   <div className="flex items-center justify-center">
    <Button
     onClick={runAnalysis}
     disabled={isAnalyzing || selectedCategories.length === 0}
     size="lg"
 className={cn(
      'gap-2 px-8 shadow-sm',
      isAnalyzing
       ? 'bg-blue-400 cursor-wait'
       : 'bg-blue-600 hover:bg-blue-700'
     )}
    >
     {isAnalyzing ? (
      <>
       <Loader2 className="w-4 h-4 animate-spin" />
       Analyzing...
      </>
     ) : (
      <>
       <Sparkles className="w-4 h-4" />
       Run Analysis
       <Send className="w-3.5 h-3.5" />
      </>
     )}
    </Button>
   </div>

   {/* Loading / Progress Indicator */}
   {isAnalyzing && (
    <div className="bg-white border border-gray-200/60 rounded-xl shadow-sm overflow-hidden">
     <AnalysisProgress currentStage={progressStage} />
    </div>
   )}

   {/* Results */}
   {result && !isAnalyzing && (
    <div className="space-y-6">
     {/* Strategy Score */}
     <StrategyScore score={result.strategyScore} />

     {/* Executive Summary */}
     <Card className="bg-white border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
       <CardTitle className="font-semibold text-gray-900 text-sm flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        Executive Summary
       </CardTitle>
      </CardHeader>
      <CardContent>
       <p className="text-sm text-gray-600 leading-relaxed">{result.executiveSummary}</p>
      </CardContent>
     </Card>

     {/* Findings */}
     {result.findings.length > 0 && (
      <Card className="bg-white border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-shadow">
       <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
         <CardTitle className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Key Findings
         </CardTitle>
         <div className="flex items-center gap-1.5">
          {result.findings.filter((f) => f.severity === 'Critical').length > 0 && (
           <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] border">
            {result.findings.filter((f) => f.severity === 'Critical').length} Critical
           </Badge>
          )}
          {result.findings.filter((f) => f.severity === 'Warning').length > 0 && (
           <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] border">
            {result.findings.filter((f) => f.severity === 'Warning').length} Warning
           </Badge>
          )}
          {result.findings.filter((f) => f.severity === 'Opportunity').length > 0 && (
           <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] border">
            {result.findings.filter((f) => f.severity === 'Opportunity').length} Opportunity
           </Badge>
          )}
         </div>
        </div>
       </CardHeader>
       <CardContent>
        <div className="space-y-3">
         {result.findings.map((finding, idx) => (
          <FindingCard key={idx} finding={finding} />
         ))}
        </div>
       </CardContent>
      </Card>
     )}

     {/* Recommendations */}
     {result.recommendations.length > 0 && (
      <Card className="bg-white border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-shadow">
       <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
         <CardTitle className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          Actionable Recommendations
         </CardTitle>
         <span className="text-xs text-gray-400">{result.recommendations.length} items</span>
        </div>
       </CardHeader>
       <CardContent>
        <div className="space-y-3">
         {/* Sort by priority: High first */}
         {[...result.recommendations]
          .sort((a, b) => {
           const order = { High: 0, Medium: 1, Low: 2 }
           return order[a.priority] - order[b.priority]
          })
          .map((rec, idx) => (
           <RecommendationCard key={idx} recommendation={rec} />
          ))}
        </div>
       </CardContent>
      </Card>
     )}

     {/* Run Again */}
     <div className="flex justify-center pt-2 pb-4">
      <Button
       variant="outline"
       onClick={runAnalysis}
 className="gap-2 text-sm"
      >
       <RefreshCw className="w-3.5 h-3.5" />
       Run New Analysis
      </Button>
     </div>
    </div>
   )}

   {/* Empty state */}
   {!result && !isAnalyzing && (
    <div className="bg-white/80 border border-gray-200/60 rounded-xl p-12 shadow-sm text-center">
     <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
      <Sparkles className="w-8 h-8 text-blue-400" />
     </div>
     <h3 className="font-semibold text-gray-900 mb-2">Ready to Analyze</h3>
     <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
      Select a campaign, choose your analysis categories, and click &ldquo;Run Analysis&rdquo; to get
      AI-powered insights and actionable recommendations for improving your sales strategy.
     </p>
    </div>
   )}
  </div>
 )
}