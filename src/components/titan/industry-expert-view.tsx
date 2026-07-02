'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { GraduationCap, TrendingUp, AlertTriangle, Lightbulb, Target, Mail, Shield, CheckCircle2, DollarSign, BookOpen, ChevronDown, ChevronRight, Loader2, Search, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ──────────── Types ──────────── */

interface ReportSection {
 id: string
 title: string
 icon: React.ElementType
 color: string
 borderColor: string
 bgColor: string
 iconColor: string
 content: string
}

interface AnalysisResult {
 industry: string
 sections: ReportSection[]
 rawText: string
}

/* ──────────── Constants ──────────── */

const POPULAR_INDUSTRIES = [
 'Law Firms',
 'Plumbers',
 'Dentists',
 'Real Estate',
 'Restaurants',
 'Gyms',
 'Accounting',
 'E-commerce',
 'Healthcare',
 'Education',
 'Construction',
 'Marketing Agencies',
]

const SECTION_DEFINITIONS: Omit<ReportSection, 'content'>[] = [
 { id: 'overview', title: 'Industry Overview', icon: GraduationCap, color: 'blue', borderColor: 'border-l-blue-500', bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
 { id: 'problems', title: 'Common Business Problems', icon: AlertTriangle, color: 'amber', borderColor: 'border-l-amber-500', bgColor: 'bg-amber-50', iconColor: 'text-amber-500' },
 { id: 'trends', title: 'Current Market Trends', icon: TrendingUp, color: 'emerald', borderColor: 'border-l-emerald-500', bgColor: 'bg-emerald-50', iconColor: 'text-emerald-500' },
 { id: 'automation', title: 'AI & Automation Opportunities', icon: Lightbulb, color: 'blue', borderColor: 'border-l-blue-500', bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
 { id: 'services', title: 'Services We Can Sell', icon: DollarSign, color: 'green', borderColor: 'border-l-green-500', bgColor: 'bg-green-50', iconColor: 'text-green-500' },
 { id: 'outreach', title: 'Outreach Strategy', icon: Target, color: 'cyan', borderColor: 'border-l-cyan-500', bgColor: 'bg-cyan-50', iconColor: 'text-cyan-500' },
 { id: 'emails', title: 'Email Angles & Templates', icon: Mail, color: 'rose', borderColor: 'border-l-rose-500', bgColor: 'bg-rose-50', iconColor: 'text-rose-500' },
 { id: 'objections', title: 'Objection Handling', icon: Shield, color: 'orange', borderColor: 'border-l-orange-500', bgColor: 'bg-orange-50', iconColor: 'text-orange-500' },
 { id: 'closing', title: 'Closing Strategies', icon: CheckCircle2, color: 'teal', borderColor: 'border-l-teal-500', bgColor: 'bg-teal-50', iconColor: 'text-teal-500' },
 { id: 'offers', title: 'Offer Recommendations', icon: BookOpen, color: 'indigo', borderColor: 'border-l-indigo-500', bgColor: 'bg-indigo-50', iconColor: 'text-indigo-500' },
]

const LOADING_STEPS = [
 'Analyzing industry landscape...',
 'Researching market trends...',
 'Identifying automation opportunities...',
 'Generating outreach strategies...',
 'Crafting email templates...',
 'Building closing frameworks...',
 'Finalizing report...',
]

/* ──────────── Markdown Renderer ──────────── */

function processInlineFormatting(text: string): React.ReactNode {
 const parts = text.split(/(\*\*[^*]+\*\*)/g)

 return parts.map((part, i) => {
  if (part.startsWith('**') && part.endsWith('**')) {
   return (
    <strong key={i} className="font-semibold text-gray-900">
     {part.slice(2, -2)}
    </strong>
   )
  }
  const codeParts = part.split(/(`[^`]+`)/g)
  return codeParts.map((cp, j) => {
   if (cp.startsWith('`') && cp.endsWith('`')) {
    return (
     <code key={`${i}-${j}`} className="px-1.5 py-0.5 rounded bg-gray-100 text-blue-600 text-xs font-mono">
      {cp.slice(1, -1)}
     </code>
    )
   }
   return <span key={`${i}-${j}`}>{cp}</span>
  })
 })
}

function renderMarkdown(text: string) {
 const lines = text.split('\n')
 const elements: React.ReactNode[] = []
 let key = 0

 for (const line of lines) {
  const trimmed = line.trimEnd()

  if (trimmed === '') {
   elements.push(<div key={key++} className="h-2" />)
   continue
  }

  // Headers: ### Header
  if (trimmed.startsWith('### ')) {
   elements.push(
    <h3 key={key++} className="text-sm font-semibold text-gray-900 mt-3 mb-1">
     {processInlineFormatting(trimmed.slice(4))}
    </h3>
   )
   continue
  }

  // Headers: ## Header
  if (trimmed.startsWith('## ')) {
   elements.push(
    <h2 key={key++} className="text-base font-semibold text-gray-900 mt-3 mb-1">
     {processInlineFormatting(trimmed.slice(3))}
    </h2>
   )
   continue
  }

  // Headers: # Header
  if (trimmed.startsWith('# ')) {
   elements.push(
    <h1 key={key++} className="text-lg font-bold text-gray-900 mt-3 mb-1.5">
     {processInlineFormatting(trimmed.slice(2))}
    </h1>
   )
   continue
  }

  // Bullet points
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
   const content = trimmed.replace(/^[-*•]\s+/, '')
   elements.push(
    <div key={key++} className="flex gap-2 ml-1">
     <span className="text-blue-500 mt-0.5 shrink-0">•</span>
     <span className="text-gray-600 text-sm leading-relaxed">
      {processInlineFormatting(content)}
     </span>
    </div>
   )
   continue
  }

  // Numbered lists: 1. Item
  const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
  if (numberedMatch) {
   elements.push(
    <div key={key++} className="flex gap-2 ml-1">
     <span className="text-blue-500 text-sm font-medium shrink-0">{numberedMatch[1]}.</span>
     <span className="text-gray-600 text-sm leading-relaxed">
      {processInlineFormatting(numberedMatch[2])}
     </span>
    </div>
   )
   continue
  }

  // Regular paragraph
  elements.push(
   <p key={key++} className="text-gray-600 text-sm leading-relaxed">
    {processInlineFormatting(trimmed)}
   </p>
  )
 }

 return elements
}

/* ──────────── Section Parser ──────────── */

function parseSectionsFromResponse(rawText: string): ReportSection[] {
 // Try to parse the AI response into structured sections by looking for common headings
 const sections: ReportSection[] = []
 const sectionKeywords: Record<string, string[]> = {
  overview: ['industry overview', 'overview', 'about the industry', 'industry snapshot', 'industry at a glance'],
  problems: ['common business problems', 'business problems', 'pain points', 'challenges', 'problems'],
  trends: ['market trends', 'current trends', 'trends', 'industry trends', 'market landscape'],
  automation: ['ai & automation', 'ai and automation', 'automation opportunities', 'ai opportunities', 'technology opportunities'],
  services: ['services we can sell', 'services to sell', 'services', 'what we can sell', 'offerings'],
  outreach: ['outreach strategy', 'outreach', 'prospecting', 'lead generation'],
  emails: ['email angles', 'email templates', 'email', 'cold email', 'outreach emails'],
  objections: ['objection handling', 'objections', 'handling objections', 'common objections'],
  closing: ['closing strategies', 'closing', 'how to close', 'sales closing'],
  offers: ['offer recommendations', 'offer', 'pricing', 'pricing strategy', 'recommended offers'],
 }

 // Split the raw text into potential sections by looking for markdown headers or section-like patterns
 const lines = rawText.split('\n')
 let currentSectionId: string | null = null
 let currentContent: string[] = []

 const flushContent = () => {
  if (currentSectionId !== null && currentContent.length > 0) {
   const def = SECTION_DEFINITIONS.find(s => s.id === currentSectionId)
   if (def) {
    sections.push({
     ...def,
     content: currentContent.join('\n').trim(),
    })
   }
  }
  currentContent = []
 }

 for (const line of lines) {
  const headerMatch = line.match(/^#{1,3}\s+(.+)/i)
  const boldHeaderMatch = line.match(/^\*\*(.+?)\*\*[:]?$/)
  const plainHeaderMatch = line.match(/^([A-Z][A-Za-z\s&]+)$/)

  const potentialTitle = headerMatch
   ? headerMatch[1].trim()
   : boldHeaderMatch
    ? boldHeaderMatch[1].trim()
    : plainHeaderMatch
     ? plainHeaderMatch[1].trim()
     : null

  if (potentialTitle) {
   const lowerTitle = potentialTitle.toLowerCase()
   let matchedId: string | null = null

   for (const [id, keywords] of Object.entries(sectionKeywords)) {
    if (keywords.some(kw => lowerTitle.includes(kw) || kw.includes(lowerTitle))) {
     matchedId = id
     break
    }
   }

   if (matchedId && matchedId !== currentSectionId) {
    flushContent()
    currentSectionId = matchedId
    continue
   }
  }

  if (currentSectionId !== null) {
   currentContent.push(line)
  }
 }

 flushContent()

 // If we got structured sections, return them
 if (sections.length >= 3) {
  return sections
 }

 // Fallback: If parsing didn't work well, chunk the text into sequential sections
 return createFallbackSections(rawText)
}

function createFallbackSections(rawText: string): ReportSection[] {
 const lines = rawText.split('\n')
 const totalLines = lines.length
 const linesPerSection = Math.max(Math.ceil(totalLines / SECTION_DEFINITIONS.length), 3)

 return SECTION_DEFINITIONS.map((def, index) => {
  const start = index * linesPerSection
  const end = start + linesPerSection
  const chunk = lines.slice(start, end).join('\n').trim()

  // Try to find the most relevant content for each section
  const keywords = getSectionKeywords(def.id)
  const relevantLines: string[] = []

  for (const line of lines) {
   const lowerLine = line.toLowerCase()
   if (keywords.some(kw => lowerLine.includes(kw))) {
    relevantLines.push(line)
   }
  }

  // If we found relevant lines, use them; otherwise use the chunk
  const content = relevantLines.length > 3
   ? relevantLines.join('\n').trim()
   : chunk || `Analysis for this section is included in the full report above.`

  return {
   ...def,
   content,
  }
 })
}

function getSectionKeywords(sectionId: string): string[] {
 const map: Record<string, string[]> = {
  overview: ['industry', 'market size', 'revenue', 'overview', 'landscape', 'sector'],
  problems: ['problem', 'pain point', 'challenge', 'struggle', 'issue', 'difficulty', 'inefficient'],
  trends: ['trend', 'growth', 'shift', 'emerging', 'adoption', 'changing', 'evolving'],
  automation: ['automat', 'ai ', 'artificial intelligence', 'machine learning', 'workflow', 'bot', 'chatbot'],
  services: ['service', 'offer', 'sell', 'provide', 'solution', 'package', 'deliverable'],
  outreach: ['outreach', 'prospect', 'lead generation', 'find', 'target', 'contact', 'discovery'],
  emails: ['email', 'subject line', 'template', 'cold email', 'message', 'pitch', 'hook'],
  objections: ['objection', 'concern', 'hesitation', 'refuse', 'pushback', 'excuse', 'worry'],
  closing: ['close', 'deal', 'agreement', 'sign', 'commitment', 'proposal', 'convert'],
  offers: ['offer', 'pricing', 'price', 'cost', 'package', 'retainer', 'fee', 'rate'],
 }
 return map[sectionId] || []
}

/* ──────────── Loading Animation ──────────── */

function LoadingState({ industry }: { industry: string }) {
 const [currentStep, setCurrentStep] = useState(0)
 const [progress, setProgress] = useState(0)

 useEffect(() => {
  const stepInterval = setInterval(() => {
   setCurrentStep(prev => {
    const next = prev + 1
    if (next >= LOADING_STEPS.length) {
     clearInterval(stepInterval)
     return prev
    }
    return next
   })
  }, 2200)

  const progressInterval = setInterval(() => {
   setProgress(prev => {
    if (prev >= 92) {
     clearInterval(progressInterval)
     return prev
    }
    // Accelerating progress
    const increment = Math.random() * 3 + 1
    return Math.min(prev + increment, 92)
   })
  }, 300)

  return () => {
   clearInterval(stepInterval)
   clearInterval(progressInterval)
  }
 }, [])

 return (
  <div className="flex flex-col items-center justify-center py-20 px-6">
   {/* Animated spinner */}
   <div className="relative mb-8">
    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg animate-pulse">
     <Sparkles className="w-10 h-10 text-white" />
    </div>
    <div className="absolute -inset-3 rounded-3xl bg-blue-500/10 -z-10 blur-xl animate-ping [animation-duration:2s]" />
   </div>

   <h3 className="text-lg font-semibold text-gray-900 mb-1">
    Analyzing {industry}
   </h3>
   <p className="text-sm text-gray-500 mb-8">
    Our AI is building your comprehensive industry report
   </p>

   {/* Progress bar */}
   <div className="w-full max-w-md mb-6">
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
     <div
 className="h-full bg-blue-600 from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
      style={{ width: `${progress}%` }}
     />
    </div>
    <div className="flex justify-between mt-2">
     <span className="text-xs text-gray-400">Processing...</span>
     <span className="text-xs font-medium text-blue-500">{Math.round(progress)}%</span>
    </div>
   </div>

   {/* Step indicators */}
   <div className="w-full max-w-md space-y-2">
    {LOADING_STEPS.map((step, index) => (
     <div
      key={index}
 className={cn(
       'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-500',
       index < currentStep
        ? 'bg-blue-50/80 text-blue-600'
        : index === currentStep
         ? 'bg-blue-50 text-blue-600 animate-pulse'
         : 'text-gray-300'
      )}
     >
      {index < currentStep ? (
       <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-500" />
      ) : index === currentStep ? (
       <Loader2 className="w-4 h-4 shrink-0 animate-spin text-blue-500" />
      ) : (
       <div className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0" />
      )}
      <span className={cn(
       'text-sm transition-colors',
       index <= currentStep ? 'font-medium' : 'font-normal'
      )}>
       {step}
      </span>
     </div>
    ))}
   </div>
  </div>
 )
}

/* ──────────── Section Card ──────────── */

function SectionCard({ section, defaultOpen }: { section: ReportSection; defaultOpen: boolean }) {
 const [isOpen, setIsOpen] = useState(defaultOpen)
 const Icon = section.icon

 return (
  <Collapsible open={isOpen} onOpenChange={setIsOpen}>
   <Card className={cn(
    'bg-white border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200',
    'border-l-4',
    section.borderColor
   )}>
    <CollapsibleTrigger className="w-full text-left">
     <CardHeader className="pb-3 pt-4 px-5">
      <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', section.bgColor)}>
         <Icon className={cn('w-4.5 h-4.5', section.iconColor)} />
        </div>
        <div>
         <CardTitle className="text-sm font-semibold text-gray-900">{section.title}</CardTitle>
        </div>
       </div>
       <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200',
        isOpen ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400 hover:text-gray-600'
       )}>
        {isOpen ? (
         <ChevronDown className="w-4 h-4" />
        ) : (
         <ChevronRight className="w-4 h-4" />
        )}
       </div>
      </div>
     </CardHeader>
    </CollapsibleTrigger>
    <CollapsibleContent>
     <CardContent className="px-5 pb-5 pt-0">
      <div className="pl-12">
       <div className="space-y-0.5">
        {renderMarkdown(section.content)}
       </div>
      </div>
     </CardContent>
    </CollapsibleContent>
   </Card>
  </Collapsible>
 )
}

/* ──────────── Results View ──────────── */

function ResultsView({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
 return (
  <div className="space-y-4">
   {/* Results header */}
   <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
      <Sparkles className="w-5 h-5 text-white" />
     </div>
     <div>
      <h2 className="text-lg font-bold text-gray-900">Industry Analysis Report</h2>
      <p className="text-sm text-gray-500">Comprehensive breakdown for <span className="font-medium text-blue-600">{result.industry}</span></p>
     </div>
    </div>
    <div className="flex items-center gap-2">
     <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 text-xs font-medium px-3 py-1">
      {result.sections.length} Sections
     </Badge>
     <Button
      variant="outline"
      size="sm"
      onClick={onReset}
 className="border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-xs gap-1.5"
     >
      <Search className="w-3.5 h-3.5" />
      New Analysis
     </Button>
    </div>
   </div>

   {/* Section cards */}
   <div className="space-y-3">
    {result.sections.map((section, index) => (
     <SectionCard
      key={section.id}
      section={section}
      defaultOpen={index === 0}
     />
    ))}
   </div>

   {/* Footer */}
   <div className="flex items-center justify-center pt-4 pb-2">
    <p className="text-xs text-gray-400">
     Analysis generated by TITAN AI • Results may vary • Verify critical details independently
    </p>
   </div>
  </div>
 )
}

/* ──────────── Main Component ──────────── */

export function IndustryExpertView() {
 const [industry, setIndustry] = useState('')
 const [context, setContext] = useState('')
 const [isLoading, setIsLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [result, setResult] = useState<AnalysisResult | null>(null)
 const [showContext, setShowContext] = useState(false)

 const analyzeIndustry = useCallback(async (industryName: string, extraContext?: string) => {
  if (!industryName.trim()) return

  setIsLoading(true)
  setError(null)
  setResult(null)

  try {
   const res = await fetch('/api/ai/industry-expert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
     industry: industryName.trim(),
     context: extraContext?.trim() || undefined,
    }),
   })

   if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
   }

   const data = await res.json()
   const rawText = data.result || data.response || data.message || data.text || ''

   if (!rawText) {
    throw new Error('Empty response received from AI')
   }

   const sections = parseSectionsFromResponse(rawText)

   setResult({
    industry: industryName.trim(),
    sections,
    rawText,
   })
  } catch (err) {
   const message = err instanceof Error ? err.message : 'An unexpected error occurred'
   setError(message)
  } finally {
   setIsLoading(false)
  }
 }, [])

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  analyzeIndustry(industry, context)
 }

 const handleChipClick = (chipIndustry: string) => {
  setIndustry(chipIndustry)
  analyzeIndustry(chipIndustry, context || undefined)
 }

 const handleReset = () => {
  setIndustry('')
  setContext('')
  setResult(null)
  setError(null)
 }

 const handleClearIndustry = () => {
  setIndustry('')
 }

 return (
  <div className="h-full flex flex-col">
   {/* Page Header */}
   <div className="flex items-center justify-between pb-6">
    <div>
     <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
       <GraduationCap className="w-5 h-5 text-white" />
      </div>
      Industry Expert
     </h1>
     <p className="text-sm text-gray-500 mt-1 ml-[52px]">
      AI-powered industry analysis to craft winning sales strategies
     </p>
    </div>
    {result && (
     <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 text-xs font-medium px-3 py-1">
      <Sparkles className="w-3 h-3 mr-1" />
      AI Analysis
     </Badge>
    )}
   </div>

   {/* Search Card — always visible at top */}
   <Card className="bg-white border border-gray-200/60 rounded-xl shadow-sm mb-6 shrink-0">
    <CardContent className="p-5">
     <form onSubmit={handleSubmit} className="space-y-4">
      {/* Industry input row */}
      <div className="flex gap-3">
       <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
         value={industry}
         onChange={(e) => setIndustry(e.target.value)}
         placeholder="Type an industry (e.g., Law Firms, Dentists, Real Estate...)"
 className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-lg text-sm focus-visible:ring-blue-500/30 focus-visible:border-blue-500/30 transition-all"
         disabled={isLoading}
        />
        {industry && !isLoading && (
         <button
          type="button"
          onClick={handleClearIndustry}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
         >
          <X className="w-4 h-4" />
         </button>
        )}
       </div>
       <Button
        type="submit"
        disabled={!industry.trim() || isLoading}
 className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm shadow-blue-600/20 disabled:opacity-40 disabled:shadow-none transition-all gap-2 shrink-0"
       >
        {isLoading ? (
         <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing...
         </>
        ) : (
         <>
          <Sparkles className="w-4 h-4" />
          Analyze Industry
         </>
        )}
       </Button>
      </div>

      {/* Optional context toggle */}
      {!result && (
       <>
        <button
         type="button"
         onClick={() => setShowContext(!showContext)}
 className="text-xs text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1"
        >
         <ChevronRight className={cn('w-3 h-3 transition-transform', showContext && 'rotate-90')} />
         Add extra context (optional)
        </button>
        {showContext && (
         <Input
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g., Focus on businesses in New York City with 10-50 employees"
 className="h-9 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-lg text-sm focus-visible:ring-blue-500/30 focus-visible:border-blue-500/30 transition-all"
          disabled={isLoading}
         />
        )}
       </>
      )}
     </form>

     {/* Popular industry chips */}
     <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-500 mb-2.5">Popular Industries</p>
      <div className="flex flex-wrap gap-2">
       {POPULAR_INDUSTRIES.map((chip) => (
        <button
         key={chip}
         onClick={() => handleChipClick(chip)}
         disabled={isLoading}
 className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
          industry === chip
           ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
           : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50'
         )}
        >
         {chip}
        </button>
       ))}
      </div>
     </div>
    </CardContent>
   </Card>

   {/* Error state */}
   {error && (
    <Card className="bg-red-50 border border-red-200/80 rounded-xl mb-6 shrink-0">
     <CardContent className="p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
       <AlertTriangle className="w-4 h-4 text-red-500" />
      </div>
      <div className="flex-1">
       <h3 className="text-sm font-semibold text-red-800">Analysis Failed</h3>
       <p className="text-sm text-red-600 mt-0.5">{error}</p>
      </div>
      <Button
       variant="ghost"
       size="sm"
       onClick={() => setError(null)}
 className="text-red-500 hover:text-red-700 hover:bg-red-100 h-8 w-8 p-0 shrink-0"
      >
       <X className="w-4 h-4" />
      </Button>
     </CardContent>
    </Card>
   )}

   {/* Loading state */}
   {isLoading && (
    <div className="flex-1 overflow-hidden">
     <LoadingState industry={industry} />
    </div>
   )}

   {/* Results */}
   {result && !isLoading && (
    <div className="flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(203 213 225) transparent' }}>
     <ResultsView result={result} onReset={handleReset} />
    </div>
   )}

   {/* Empty state */}
   {!result && !isLoading && !error && (
    <div className="flex-1 flex items-center justify-center">
     <div className="text-center max-w-md px-6 py-12">
      <div className="relative inline-block mb-6">
       <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <GraduationCap className="w-8 h-8 text-blue-500" />
       </div>
       <div className="absolute -inset-2 rounded-3xl bg-blue-100/50 -z-10 blur-xl" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
       Select an Industry to Analyze
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">
       Choose a popular industry above or type your own. Our AI will generate a comprehensive report covering market trends, pain points, outreach strategies, email templates, and more.
      </p>
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
       <div className="flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5" />
        10 Report Sections
       </div>
       <div className="flex items-center gap-1.5">
        <Lightbulb className="w-3.5 h-3.5" />
        Actionable Insights
       </div>
       <div className="flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5" />
        Email Templates
       </div>
      </div>
     </div>
    </div>
   )}
  </div>
 )
}
