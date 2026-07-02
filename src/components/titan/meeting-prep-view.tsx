'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
 Target, ArrowLeft, Copy, Check, Building2, Users, Globe,
 Lightbulb, TrendingUp, Shield, ListChecks, MessageSquare,
 Handshake, Clock, Sparkles, Printer
} from 'lucide-react'

/* ════════════════════════════════════════════════════════════════
  Types
  ════════════════════════════════════════════════════════════════ */

interface MeetingBrief {
 companyOverview: string
 decisionMakers: string
 websiteAudit: string
 businessProblems: string
 recommendedSolutions: string
 estimatedROI: string
 potentialObjections: string
 suggestedAgenda: string
 talkingPoints: string
 closingStrategy: string
}

interface FormData {
 company: string
 contactName: string
 industry: string
}

/* ════════════════════════════════════════════════════════════════
  Constants
  ════════════════════════════════════════════════════════════════ */

const INDUSTRIES = [
 'Technology',
 'SaaS',
 'Marketing',
 'E-commerce',
 'Healthcare',
 'Finance',
 'Real Estate',
 'Education',
 'Construction',
 'Manufacturing',
 'Legal',
 'Consulting',
 'Retail',
 'Logistics',
 'Other',
]



/* ════════════════════════════════════════════════════════════════
  Animation Variants
  ════════════════════════════════════════════════════════════════ */

const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
  opacity: 1,
  transition: { staggerChildren: 0.06, delayChildren: 0.1 },
 },
}

const itemVariants = {
 hidden: { opacity: 0, y: 16 },
 visible: {
  opacity: 1,
  y: 0,
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
 },
}

const loadingContainerVariants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { duration: 0.3 } },
 exit: { opacity: 0, transition: { duration: 0.2 } },
}

/* ════════════════════════════════════════════════════════════════
  Section Card Component
  ════════════════════════════════════════════════════════════════ */

function BriefSectionCard({
 icon: Icon,
 title,
 content,
}: {
 icon: React.ElementType
 title: string
 content: string
}) {
 return (
  <motion.div variants={itemVariants} className="bg-white rounded-xl border border-gray-200/60 rounded-[18px] p-5">
   <div className="flex items-center gap-2 mb-3">
    <div className="w-7 h-7 rounded-[10px] bg-blue-500/10 flex items-center justify-center">
     <Icon className="w-3.5 h-3.5 text-blue-500" />
    </div>
    <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
   </div>
   <div className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-line">
    {content}
   </div>
  </motion.div>
 )
}

/* ════════════════════════════════════════════════════════════════
  Loading State
  ════════════════════════════════════════════════════════════════ */

function LoadingState() {
 return (
  <motion.div
   variants={loadingContainerVariants}
   initial="hidden"
   animate="visible"
   exit="exit"
 className="flex flex-col items-center justify-center py-32"
  >
   {/* Bouncing Sparkles icon */}
   <motion.div
    animate={{ y: [0, -12, 0] }}
    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
 className="relative mb-8"
   >
    <div className="w-20 h-20 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
     <Sparkles className="w-10 h-10 text-white" />
    </div>
    <div className="absolute -inset-3 rounded-3xl bg-blue-500/10 -z-10 blur-xl animate-ping [animation-duration:2s]" />
   </motion.div>

   <h3 className="text-base font-semibold text-foreground mb-2">Preparing Your Meeting Brief</h3>
   <p className="text-[13px] text-foreground/50 max-w-sm text-center">
    Analyzing company data, researching decision makers, and crafting your strategy...
   </p>

   {/* Shimmer bars */}
   <div className="w-full max-w-md mt-8 space-y-3">
    {[1, 2, 3].map((i) => (
     <motion.div
      key={i}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
 className="h-3 rounded-full skeleton-shimmer"
      style={{ width: `${85 - i * 15}%` }}
     />
    ))}
   </div>
  </motion.div>
 )
}

/* ════════════════════════════════════════════════════════════════
  Input Form State
  ════════════════════════════════════════════════════════════════ */

function InputForm({
 formData,
 setFormData,
 onSubmit,
 isLoading,
}: {
 formData: FormData
 setFormData: React.Dispatch<React.SetStateAction<FormData>>
 onSubmit: () => void
 isLoading: boolean
}) {
 const [recentLeads, setRecentLeads] = useState<{company: string; contact: string; industry: string}[]>([])

 useEffect(() => {
  fetch('/api/leads?limit=5')
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.leads)) {
        setRecentLeads(data.leads.map((l: any) => ({
          company: l.business?.name || l.company || 'Unknown',
          contact: l.contactName || l.name || 'Unknown',
          industry: l.business?.industry || l.industry || 'General',
        })))
      }
    })
    .catch(() => {})
 }, [])
 const handleQuickFill = (lead: { company: string; contact: string; industry: string }) => {
  setFormData({
   company: lead.company,
   contactName: lead.contact,
   industry: lead.industry,
  })
 }

 return (
  <motion.div
   initial={{ opacity: 0, y: 24 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
 className="flex items-start justify-center pt-12 sm:pt-20"
  >
   <div className="bg-white rounded-xl border border-gray-200/60 rounded-[22px] p-6 max-w-xl w-full mx-4">
    {/* Header */}
    <div className="text-center mb-8">
     <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
      <Target className="w-7 h-7 text-white" />
     </div>
     <h2 className="text-lg font-semibold text-foreground mb-1">
      🎯 AI Meeting Preparation
     </h2>
     <p className="text-[13px] text-foreground/50">
      Generate comprehensive briefings before every call
     </p>
    </div>

    {/* Form Fields */}
    <div className="space-y-4">
     {/* Company + Contact Row */}
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
       <label className="text-[13px] font-medium text-foreground/70">
        Company Name
       </label>
       <Input
        placeholder="e.g. Acme Corp"
        value={formData.company}
        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
 className="h-10 rounded-[12px] text-[13px] bg-background/50 border-border/60 focus:border-blue-400 focus:ring-blue-400/20"
       />
      </div>
      <div className="space-y-1.5">
       <label className="text-[13px] font-medium text-foreground/70">
        Contact Person
       </label>
       <Input
        placeholder="e.g. John Smith"
        value={formData.contactName}
        onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
 className="h-10 rounded-[12px] text-[13px] bg-background/50 border-border/60 focus:border-blue-400 focus:ring-blue-400/20"
       />
      </div>
     </div>

     {/* Industry Select */}
     <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-foreground/70">
       Industry
      </label>
      <select
       value={formData.industry}
       onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
 className="w-full h-10 rounded-[12px] text-[13px] bg-background/50 border border-border/60 px-3 outline-none text-foreground focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 appearance-none cursor-pointer"
       style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.75rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.25em 1.25em',
        paddingRight: '2.5rem',
       }}
      >
       <option value="" disabled>Select an industry...</option>
       {INDUSTRIES.map((ind) => (
        <option key={ind} value={ind}>{ind}</option>
       ))}
      </select>
     </div>

     {/* Submit Button */}
     <Button
      onClick={onSubmit}
      disabled={!formData.company.trim() || !formData.contactName.trim() || !formData.industry || isLoading}
 className="w-full h-11 rounded-[14px] text-[13px] font-medium bg-blue-600 text-white hover:shadow-lg hover: hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
     >
      🎯 Generate Meeting Brief
     </Button>
    </div>

    {/* Recent Leads */}
    <div className="mt-6 pt-5 border-t border-border/40">
     <p className="text-[12px] text-foreground/40 text-center mb-3">
      ── Or use recent leads ──
     </p>
     <div className="flex flex-wrap gap-2 justify-center">
      {recentLeads.map((lead) => (
       <button
        key={lead.company}
        onClick={() => handleQuickFill(lead)}
 className="px-3.5 py-1.5 rounded-full text-[12px] font-medium text-foreground/60 bg-foreground/[0.04] hover:bg-foreground/[0.08] hover:text-foreground/90 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] border border-transparent hover:border-border/60"
       >
        {lead.company}
       </button>
      ))}
     </div>
    </div>
   </div>
  </motion.div>
 )
}

/* ════════════════════════════════════════════════════════════════
  Meeting Brief Display State
  ════════════════════════════════════════════════════════════════ */

function BriefDisplay({
 brief,
 formData,
 onBack,
 onRegenerate,
}: {
 brief: MeetingBrief
 formData: FormData
 onBack: () => void
 onRegenerate: () => void
}) {
 const [copied, setCopied] = useState(false)

 const getFullText = useCallback(() => {
  const lines = [
   `MEETING BRIEFING — ${formData.company}`,
   `Contact: ${formData.contactName} • Industry: ${formData.industry}`,
   `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
   '',
   '── COMPANY OVERVIEW ──',
   brief.companyOverview,
   '',
   '── DECISION MAKERS ──',
   brief.decisionMakers,
   '',
   '── WEBSITE AUDIT ──',
   brief.websiteAudit,
   '',
   '── BUSINESS PROBLEMS ──',
   brief.businessProblems,
   '',
   '── RECOMMENDED SOLUTIONS ──',
   brief.recommendedSolutions,
   '',
   '── ESTIMATED ROI ──',
   brief.estimatedROI,
   '',
   '── POTENTIAL OBJECTIONS ──',
   brief.potentialObjections,
   '',
   '── SUGGESTED AGENDA ──',
   brief.suggestedAgenda,
   '',
   '── TALKING POINTS ──',
   brief.talkingPoints,
   '',
   '── CLOSING STRATEGY ──',
   brief.closingStrategy,
  ]
  return lines.join('\n')
 }, [brief, formData])

 const handleCopy = useCallback(async () => {
  try {
   await navigator.clipboard.writeText(getFullText())
   setCopied(true)
   setTimeout(() => setCopied(false), 2000)
  } catch {
   // fallback
   const textarea = document.createElement('textarea')
   textarea.value = getFullText()
   document.body.appendChild(textarea)
   textarea.select()
   document.execCommand('copy')
   document.body.removeChild(textarea)
   setCopied(true)
   setTimeout(() => setCopied(false), 2000)
  }
 }, [getFullText])

 const handlePrint = useCallback(() => {
  window.print()
 }, [])

 return (
  <motion.div
   variants={containerVariants}
   initial="hidden"
   animate="visible"
 className="max-w-5xl mx-auto space-y-4 pb-8"
  >
   {/* Top Actions Bar */}
   <motion.div
    variants={itemVariants}
 className="flex items-center justify-between"
   >
    <button
     onClick={onBack}
 className="flex items-center gap-2 text-[13px] text-foreground/60 hover:text-foreground transition-colors duration-200"
    >
     <ArrowLeft className="w-4 h-4" />
     <span>Back</span>
    </button>
    <div className="flex items-center gap-2">
     <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
 className="h-8 rounded-[10px] text-[12px] font-medium gap-1.5 border-border/60 hover:bg-foreground/[0.04]"
     >
      <Printer className="w-3.5 h-3.5" />
      Print
     </Button>
     <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
 className="h-8 rounded-[10px] text-[12px] font-medium gap-1.5 border-border/60 hover:bg-foreground/[0.04]"
     >
      {copied ? (
       <>
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        Copied
       </>
      ) : (
       <>
        <Copy className="w-3.5 h-3.5" />
        Copy Brief
       </>
      )}
     </Button>
    </div>
   </motion.div>

   {/* Header Card */}
   <motion.div
    variants={itemVariants}
 className="bg-blue-600 rounded-[18px] p-6 text-white"
   >
    <div className="flex items-center gap-3 mb-3">
     <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
      <Target className="w-5 h-5 text-white" />
     </div>
     <div>
      <h2 className="text-base font-bold tracking-tight">🎯 MEETING BRIEFING</h2>
      <p className="text-[13px] text-white/70">
       {formData.company}
      </p>
     </div>
     <Badge className="ml-auto bg-white/15 text-white/90 border-white/20 text-[11px] hover:bg-white/20">
      <Sparkles className="w-3 h-3 mr-1" />
      AI Generated
     </Badge>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-white/80">
     <span className="flex items-center gap-1.5">
      <Users className="w-3.5 h-3.5" />
      {formData.contactName}
     </span>
     <span>•</span>
     <span className="flex items-center gap-1.5">
      <Building2 className="w-3.5 h-3.5" />
      {formData.industry}
     </span>
     <span>•</span>
     <span className="flex items-center gap-1.5">
      <Clock className="w-3.5 h-3.5" />
      {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
     </span>
    </div>
   </motion.div>

   {/* Row 1: Overview, Decision Makers, Website Audit */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <BriefSectionCard
     icon={Building2}
     title="Company Overview"
     content={brief.companyOverview}
    />
    <BriefSectionCard
     icon={Users}
     title="Decision Makers"
     content={brief.decisionMakers}
    />
    <BriefSectionCard
     icon={Globe}
     title="Website Audit"
     content={brief.websiteAudit}
    />
   </div>

   {/* Row 2: Problems, Solutions, ROI */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <BriefSectionCard
     icon={Lightbulb}
     title="Business Problems"
     content={brief.businessProblems}
    />
    <BriefSectionCard
     icon={TrendingUp}
     title="Recommended Solutions"
     content={brief.recommendedSolutions}
    />
    <BriefSectionCard
     icon={TrendingUp}
     title="Estimated ROI"
     content={brief.estimatedROI}
    />
   </div>

   {/* Full Width: Potential Objections */}
   <motion.div variants={itemVariants}>
    <BriefSectionCard
     icon={Shield}
     title="Potential Objections"
     content={brief.potentialObjections}
    />
   </motion.div>

   {/* Full Width: Suggested Agenda */}
   <motion.div variants={itemVariants}>
    <BriefSectionCard
     icon={ListChecks}
     title="Suggested Agenda"
     content={brief.suggestedAgenda}
    />
   </motion.div>

   {/* Row 3: Talking Points, Closing Strategy */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <BriefSectionCard
     icon={MessageSquare}
     title="Talking Points"
     content={brief.talkingPoints}
    />
    <BriefSectionCard
     icon={Handshake}
     title="Closing Strategy"
     content={brief.closingStrategy}
    />
   </div>

   {/* Bottom Actions */}
   <motion.div
    variants={itemVariants}
 className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
   >
    <Button
     onClick={onRegenerate}
 className="h-10 rounded-[12px] text-[13px] font-medium bg-blue-600 text-white hover:shadow-lg hover: hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 gap-2"
    >
     <Sparkles className="w-4 h-4" />
     ✨ Regenerate Brief
    </Button>
    <Button
     variant="outline"
     onClick={onBack}
 className="h-10 rounded-[12px] text-[13px] font-medium border-border/60 hover:bg-foreground/[0.04] transition-all duration-200 gap-2"
    >
     <ArrowLeft className="w-4 h-4" />
     ← Edit Inputs
    </Button>
   </motion.div>
  </motion.div>
 )
}

/* ════════════════════════════════════════════════════════════════
  Main Component
  ════════════════════════════════════════════════════════════════ */

export function MeetingPrepView() {
 const [formData, setFormData] = useState<FormData>({
  company: '',
  contactName: '',
  industry: '',
 })
 const [isLoading, setIsLoading] = useState(false)
 const [brief, setBrief] = useState<MeetingBrief | null>(null)

 const generateBrief = useCallback(async () => {
  if (!formData.company.trim() || !formData.contactName.trim() || !formData.industry) return

  setIsLoading(true)
  setBrief(null)

  try {
   const res = await fetch('/api/ai/meeting-prep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     company: formData.company,
     contactName: formData.contactName,
     industry: formData.industry,
    }),
   })

   if (!res.ok) throw new Error('Failed to generate meeting brief')

   const data = await res.json()

   setBrief({
    companyOverview: data.companyOverview || 'Company overview data will appear here.',
    decisionMakers: data.decisionMakers || 'Decision maker information will appear here.',
    websiteAudit: data.websiteAudit || 'Website audit summary will appear here.',
    businessProblems: data.businessProblems || 'Business problems analysis will appear here.',
    recommendedSolutions: data.recommendedSolutions || 'Recommended solutions will appear here.',
    estimatedROI: data.estimatedROI || 'ROI estimation will appear here.',
    potentialObjections: data.potentialObjections || 'Potential objections will appear here.',
    suggestedAgenda: data.suggestedAgenda || 'Suggested agenda will appear here.',
    talkingPoints: data.talkingPoints || 'Talking points will appear here.',
    closingStrategy: data.closingStrategy || 'Closing strategy will appear here.',
   })
  } catch {
   toast.error('Failed to generate meeting brief. Please try again.')
   setIsLoading(false)
   return
  } finally {
   setIsLoading(false)
  }
 }, [formData])

 const handleBack = useCallback(() => {
  setBrief(null)
 }, [])

 const handleRegenerate = useCallback(() => {
  setBrief(null)
  generateBrief()
 }, [generateBrief])

 return (
  <div className="min-h-[calc(100vh-8rem)]">
   <AnimatePresence mode="wait">
    {isLoading ? (
     <LoadingState key="loading" />
    ) : brief ? (
     <BriefDisplay
      key="brief"
      brief={brief}
      formData={formData}
      onBack={handleBack}
      onRegenerate={handleRegenerate}
     />
    ) : (
     <InputForm
      key="form"
      formData={formData}
      setFormData={setFormData}
      onSubmit={generateBrief}
      isLoading={isLoading}
     />
    )}
   </AnimatePresence>
  </div>
 )
}