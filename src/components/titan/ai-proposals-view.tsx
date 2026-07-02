'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowLeft, Copy, Download, Check, FileText } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

interface ProposalFormData {
 companyName: string
 industry: string
 challenges: string
 services: string
 budget: string
}

interface ProposalSection {
 title: string
 content: string
}

interface Proposal {
 title: string
 companyName: string
 industry: string
 date: string
 sections: ProposalSection[]
}

// ─── Constants ───────────────────────────────────────────────────────

const INDUSTRIES = [
 'Technology',
 'Healthcare',
 'Legal',
 'Financial Services',
 'Real Estate',
 'E-Commerce',
 'SaaS',
 'Marketing Agency',
 'Manufacturing',
 'Education',
 'Hospitality',
 'Other',
]

const BUDGET_RANGES = [
 'Not specified',
 '< $2K',
 '$2K - $5K',
 '$5K - $10K',
 '$10K - $25K',
 '$25K+',
]

// ─── Animation Variants ──────────────────────────────────────────────

const fadeSlideUp = {
 initial: { opacity: 0, y: 12 },
 animate: { opacity: 1, y: 0 },
 exit: { opacity: 0, y: -8 },
 transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
}

const staggerContainer = {
 animate: {
  transition: {
   staggerChildren: 0.06,
  },
 },
}

const staggerItem = {
 initial: { opacity: 0, y: 10 },
 animate: { opacity: 1, y: 0 },
 transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
}

// ─── Helper: Render bold markdown ────────────────────────────────────

function renderFormattedText(text: string) {
 const parts = text.split(/(\*\*[^*]+\*\*)/g)
 return parts.map((part, i) => {
  if (part.startsWith('**') && part.endsWith('**')) {
   return (
    <span key={i} className="font-semibold text-foreground">
     {part.slice(2, -2)}
    </span>
   )
  }
  return <span key={i}>{part}</span>
 })
}

// ─── Component ───────────────────────────────────────────────────────

export function AIProposalsView() {
 // Form state
 const [formData, setFormData] = useState<ProposalFormData>({
  companyName: '',
  industry: '',
  challenges: '',
  services: '',
  budget: 'Not specified',
 })

 // UI state
 const [phase, setPhase] = useState<'form' | 'loading' | 'result'>('form')
 const [proposal, setProposal] = useState<Proposal | null>(null)
 const [copied, setCopied] = useState(false)
 const [generating, setGenerating] = useState(false)

 // ─── Update form field ───────────────────────────────────────────

 const updateField = useCallback(
  (field: keyof ProposalFormData, value: string) => {
   setFormData((prev) => ({ ...prev, [field]: value }))
  },
  [],
 )

 // ─── Handle generate ─────────────────────────────────────────────

 const handleGenerate = useCallback(async () => {
  if (!formData.companyName.trim()) return

  setGenerating(true)
  setPhase('loading')

  try {
   const res = await fetch('/api/ai/proposals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     companyName: formData.companyName,
     industry: formData.industry,
     challenges: formData.challenges,
     services: formData.services,
     budget: formData.budget,
    }),
   })

   if (!res.ok) throw new Error('Failed to generate proposal')

   const data = await res.json()

   // Minimum 1.5s delay for premium loading effect
   await new Promise((resolve) => setTimeout(resolve, 1500))

   setProposal(data.proposal)
   setPhase('result')
  } catch {
   // Fallback mock proposal if API fails
   await new Promise((resolve) => setTimeout(resolve, 1500))

   const now = new Date()
   const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
   const challengesList = formData.challenges
    .split('\n')
    .filter((c) => c.trim())
   const servicesList = formData.services
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s)

   const mockProposal: Proposal = {
    title: 'AI GROWTH STRATEGY',
    companyName: formData.companyName,
    industry: formData.industry || 'General Business',
    date: monthYear,
    sections: [
     {
      title: 'Executive Summary',
      content: `**${formData.companyName}** is a **${formData.industry || 'forward-thinking'}** company poised for significant growth in today's competitive landscape. This proposal outlines a comprehensive strategy to address current business challenges and unlock new revenue streams through AI-powered solutions.\n\nOur analysis indicates that with the right combination of ${servicesList.length > 0 ? servicesList.join(', ').toLowerCase() : 'strategic services'} and targeted execution, **${formData.companyName}** can expect to see measurable improvements in lead generation, client engagement, and overall revenue within the first 90 days.`,
     },
     {
      title: 'Business Challenges',
      content:
       challengesList.length > 0
        ? challengesList
          .map(
           (c, i) =>
            `${i + 1}. **${c.trim()}** — Our preliminary assessment indicates this challenge is impacting your growth potential and market positioning. Addressing this will be a key focus of our engagement.`,
          )
          .join('\n\n')
        : `Based on industry analysis of the **${formData.industry || 'General'}** sector, we've identified several common challenges that **${formData.companyName}** is likely facing:\n\n1. **Lead Generation** — Difficulty maintaining a consistent pipeline of qualified leads\n2. **Competitive Positioning** — Standing out in an increasingly crowded market\n3. **Conversion Optimization** — Converting prospects into paying clients efficiently`,
     },
     {
      title: 'Proposed Solution',
      content: `We recommend a multi-faceted approach combining ${servicesList.length > 0 ? `**${servicesList.join('**, **')}**` : '**AI-driven marketing and sales optimization**'} tailored specifically to the **${formData.industry || 'General'}** industry.\n\nOur methodology is built on three core pillars:\n\n**Discovery & Analysis** — Deep-dive into your current operations, market position, and competitive landscape to identify the highest-impact opportunities.\n\n**Strategic Implementation** — Deploy targeted solutions with measurable KPIs, ensuring every action drives toward your business objectives.\n\n**Optimization & Scale** — Continuous refinement based on real-time data, scaling what works and pivoting what doesn't.`,
     },
     {
      title: 'Service Breakdown',
      content:
       servicesList.length > 0
        ? servicesList
          .map(
           (service) =>
            `**${service}**\nOur team will deliver a comprehensive ${service.toLowerCase()} package designed for maximum ROI. This includes strategy development, implementation, ongoing optimization, and detailed reporting.`,
          )
          .join('\n\n')
        : `**AI Lead Generation** — Automated prospecting and qualification using advanced AI models\n**Website Audit & Optimization** — Full technical and conversion analysis with actionable recommendations\n**Email Outreach Campaigns** — Personalized, AI-crafted email sequences for your target market\n**CRM Integration** — Seamless connection to your existing sales infrastructure`,
     },
     {
      title: 'Expected Outcomes',
      content: `Based on our experience with similar **${formData.industry || ''}** companies, we project the following outcomes:\n\n• **3-5x increase** in qualified lead volume within 60 days\n• **40-60% improvement** in email response rates\n• **25-35% reduction** in customer acquisition cost\n• **2-3x faster** sales cycle through AI-powered qualification\n• **Measurable ROI** within the first quarter of engagement\n\nThese projections are based on ${formData.budget !== 'Not specified' ? `a **${formData.budget}** budget framework` : 'standard engagement parameters'} and may be adjusted based on scope.`,
     },
     {
      title: 'Implementation Timeline',
      content: `**Week 1-2: Discovery & Planning**\nComprehensive audit, stakeholder interviews, and strategy development.\n\n**Week 3-4: Foundation Setup**\nInfrastructure deployment, tool configuration, and team onboarding.\n\n**Week 5-8: Active Execution**\nCampaign launch, lead generation activation, and initial optimization cycles.\n\n**Week 9-12: Scale & Optimize**\nPerformance analysis, strategy refinement, and scaling successful initiatives.\n\n**Ongoing: Monthly Review & Iteration**\nRegular reporting, strategy sessions, and continuous improvement.`,
     },
     {
      title: 'Investment Summary',
      content:
       formData.budget !== 'Not specified'
        ? `Based on your indicated budget of **${formData.budget}**, we have structured a phased engagement that maximizes value at each stage.\n\n**Total Estimated Investment: ${formData.budget}**\n\nThis includes all services, tools, dedicated account management, and weekly reporting. Additional scope can be discussed as results demonstrate clear ROI.\n\n**Payment Terms:** 50% upon project kickoff, 50% upon 30-day milestone completion.`
        : `Investment is structured based on the selected services and scope of engagement. We offer flexible pricing models:\n\n• **Project-Based** — Fixed scope with clear deliverables and timeline\n• **Monthly Retainer** — Ongoing support with adjustable scope\n• **Performance-Based** — Tied to measurable KPIs and outcomes\n\nWe will provide a detailed quote after our discovery phase, typically within 3-5 business days of engagement.`,
     },
    ],
   }

   setProposal(mockProposal)
   setPhase('result')
  } finally {
   setGenerating(false)
  }
 }, [formData])

 // ─── Handle copy ─────────────────────────────────────────────────

 const handleCopy = useCallback(async () => {
  if (!proposal) return

  const fullText = [
   `${proposal.title}`,
   `${proposal.companyName} — ${proposal.industry}`,
   `Prepared by TITAN AI • ${proposal.date}`,
   '',
   ...proposal.sections.map((s) => `${s.title}\n${s.content}`),
  ].join('\n\n')

  await navigator.clipboard.writeText(fullText)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
 }, [proposal])

 // ─── Handle back to form ─────────────────────────────────────────

 const handleBack = useCallback(() => {
  setPhase('form')
  setProposal(null)
 }, [])

 // ─── Handle regenerate ───────────────────────────────────────────

 const handleRegenerate = useCallback(() => {
  handleGenerate()
 }, [handleGenerate])

 // ─── Build proposal full text for download ───────────────────────

 const getProposalText = useCallback(() => {
  if (!proposal) return ''
  return [
   proposal.title,
   `${proposal.companyName} — ${proposal.industry}`,
   `Prepared by TITAN AI • ${proposal.date}`,
   '',
   ...proposal.sections.map((s) => `${s.title}\n${s.content}`),
  ].join('\n\n')
 }, [proposal])

 // ─── Handle download ─────────────────────────────────────────────

 const handleDownload = useCallback(() => {
  if (!proposal) return
  const text = getProposalText()
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${proposal.companyName.replace(/\s+/g, '_')}_Proposal.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
 }, [proposal, getProposalText])

 const isFormValid = formData.companyName.trim().length > 0

 // ─── Render: Loading State ───────────────────────────────────────

 if (phase === 'loading') {
  return (
   <div className="flex flex-col items-center justify-center py-20">
    <div className="relative">
     <div className="w-16 h-16 rounded-xl bg-blue-600 animate-pulse opacity-40" />
     <div className="absolute inset-0 flex items-center justify-center">
      <Sparkles className="w-7 h-7 text-white animate-bounce" />
     </div>
    </div>
    <p className="text-sm font-medium text-foreground mt-4">
     Generating your proposal...
    </p>
    <p className="text-xs text-muted-foreground mt-1">
     AI is analyzing data and crafting content
    </p>
   </div>
  )
 }

 // ─── Render: Proposal Result ─────────────────────────────────────

 if (phase === 'result' && proposal) {
  return (
   <AnimatePresence mode="wait">
    <motion.div
     key="result"
     {...fadeSlideUp}
 className="max-w-2xl mx-auto space-y-4"
    >
     {/* Top bar */}
     <motion.div
 className="flex items-center justify-between"
      {...staggerItem}
     >
      <Button
       variant="ghost"
       size="sm"
       onClick={handleBack}
 className="text-[13px] text-muted-foreground hover:text-foreground -ml-2"
      >
       <ArrowLeft className="w-4 h-4 mr-1.5" />
       Back to Form
      </Button>
      <div className="flex items-center gap-2">
       <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
 className="text-[13px] rounded-[12px] h-9 px-3"
       >
        {copied ? (
         <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
        ) : (
         <Copy className="w-3.5 h-3.5 mr-1.5" />
        )}
        {copied ? 'Copied!' : 'Copy'}
       </Button>
       <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
 className="text-[13px] rounded-[12px] h-9 px-3"
       >
        <Download className="w-3.5 h-3.5 mr-1.5" />
        Download
       </Button>
      </div>
     </motion.div>

     {/* Proposal header */}
     <motion.div
 className="bg-blue-600 rounded-[18px] p-6 text-white"
      {...staggerItem}
     >
      <div className="flex items-center gap-2 mb-1">
       <FileText className="w-4 h-4 opacity-70" />
       <span className="text-xs font-medium tracking-widest uppercase opacity-60">
        TITAN AI
       </span>
      </div>
      <h1 className="text-xl font-bold tracking-tight leading-tight">
       {proposal.title}
      </h1>
      <p className="text-sm opacity-80 mt-1">
       {proposal.companyName} — {proposal.industry}
      </p>
      <p className="text-xs opacity-60 mt-2">
       Prepared by TITAN AI • {proposal.date}
      </p>
     </motion.div>

     {/* Sections */}
     <motion.div
 className="space-y-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
     >
      {proposal.sections.map((section, index) => (
       <motion.div
        key={index}
        variants={staggerItem}
 className="bg-white rounded-xl border border-gray-200/60 rounded-[18px] p-6"
       >
        <h3 className="text-[15px] font-semibold tracking-tight mb-3">
         {section.title}
        </h3>
        <div className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-line">
         {renderFormattedText(section.content)}
        </div>
       </motion.div>
      ))}
     </motion.div>

     {/* Bottom actions */}
     <motion.div
 className="bg-white rounded-xl border border-gray-200/60 rounded-[18px] p-4 flex items-center justify-center gap-3"
      {...staggerItem}
     >
      <Button
       onClick={handleRegenerate}
       disabled={generating}
 className="text-[13px] rounded-[14px] bg-blue-600 text-white border-0 hover:opacity-90"
      >
       <Sparkles className="w-4 h-4 mr-1.5" />
       {generating ? 'Regenerating...' : 'Regenerate'}
      </Button>
      <Button
       variant="outline"
       onClick={handleBack}
 className="text-[13px] rounded-[14px]"
      >
       <ArrowLeft className="w-4 h-4 mr-1.5" />
       Edit Inputs
      </Button>
     </motion.div>
    </motion.div>
   </AnimatePresence>
  )
 }

 // ─── Render: Input Form ──────────────────────────────────────────

 return (
  <AnimatePresence mode="wait">
   <motion.div
    key="form"
    {...fadeSlideUp}
 className="max-w-2xl mx-auto"
   >
    <div className="bg-white rounded-xl border border-gray-200/60 rounded-[22px] p-6">
     {/* Header */}
     <div className="flex items-start justify-between mb-6">
      <div>
       <h2 className="text-lg font-semibold tracking-tight">
        AI Proposal Generator
       </h2>
       <p className="text-[13px] text-muted-foreground mt-1">
        Generate professional proposals in seconds
       </p>
      </div>
      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
       <Sparkles className="w-4 h-4 text-white" />
      </div>
     </div>

     {/* Form fields */}
     <div className="space-y-4">
      {/* Company Name & Industry row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
       <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-foreground/80">
         Company Name
        </label>
        <Input
         placeholder="Acme Corp"
         value={formData.companyName}
         onChange={(e) => updateField('companyName', e.target.value)}
 className="h-11 rounded-[14px] text-[13px]"
        />
       </div>
       <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-foreground/80">
         Industry
        </label>
        <select
         value={formData.industry}
         onChange={(e) => updateField('industry', e.target.value)}
 className="h-11 w-full rounded-[14px] border border-input bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
        >
         <option value="" disabled>
          Select industry
         </option>
         {INDUSTRIES.map((ind) => (
          <option key={ind} value={ind}>
           {ind}
          </option>
         ))}
        </select>
       </div>
      </div>

      {/* Key Challenges */}
      <div className="space-y-1.5">
       <label className="text-[13px] font-medium text-foreground/80">
        Key Challenges
        <span className="text-muted-foreground font-normal ml-1">
         (one per line)
        </span>
       </label>
       <Textarea
        placeholder={"Low lead volume\nHigh customer acquisition cost\nInconsistent sales pipeline"}
        value={formData.challenges}
        onChange={(e) => updateField('challenges', e.target.value)}
        rows={4}
 className="rounded-[14px] text-[13px] resize-none"
       />
      </div>

      {/* Services */}
      <div className="space-y-1.5">
       <label className="text-[13px] font-medium text-foreground/80">
        Services to Include
        <span className="text-muted-foreground font-normal ml-1">
         (comma separated)
        </span>
       </label>
       <Input
        placeholder="AI Lead Gen, Website Audit, Email Campaigns"
        value={formData.services}
        onChange={(e) => updateField('services', e.target.value)}
 className="h-11 rounded-[14px] text-[13px]"
       />
      </div>

      {/* Budget Range */}
      <div className="space-y-1.5">
       <label className="text-[13px] font-medium text-foreground/80">
        Budget Range
       </label>
       <select
        value={formData.budget}
        onChange={(e) => updateField('budget', e.target.value)}
 className="h-11 w-full rounded-[14px] border border-input bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
       >
        {BUDGET_RANGES.map((range) => (
         <option key={range} value={range}>
          {range}
         </option>
        ))}
       </select>
      </div>
     </div>

     {/* Generate Button */}
     <motion.div className="mt-6" {...staggerItem}>
      <Button
       onClick={handleGenerate}
       disabled={!isFormValid || generating}
 className="w-full h-11 rounded-[14px] bg-blue-600 text-white border-0 text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
       <Sparkles className="w-4 h-4 mr-2" />
       Generate AI Proposal
      </Button>
     </motion.div>
    </div>
   </motion.div>
  </AnimatePresence>
 )
}