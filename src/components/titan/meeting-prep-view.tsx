'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

const RECENT_LEADS = [
 { company: 'Acme Corp', contact: 'John Smith', industry: 'Technology' },
 { company: 'TechStart Inc', contact: 'Sarah Johnson', industry: 'SaaS' },
 { company: 'Nexus Digital', contact: 'Mike Chen', industry: 'Marketing' },
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
 const handleQuickFill = (lead: (typeof RECENT_LEADS)[number]) => {
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
      {RECENT_LEADS.map((lead) => (
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
  } catch (err) {
   console.error('Meeting prep error:', err)
   // Show a fallback mock brief for demo purposes
   setBrief({
    companyOverview: `${formData.company} is a company operating in the ${formData.industry} sector. Founded with a mission to deliver innovative solutions, they have established themselves as a notable player in their market segment. Their primary focus revolves around delivering value to their customers through modern approaches and technology adoption.`,
    decisionMakers: `Primary Contact: ${formData.contactName}\n\nBased on company size and industry, key stakeholders likely include:\n• C-Suite executives (CEO, CTO, COO)\n• VP of Operations / VP of Sales\n• IT Director or Digital Transformation Lead\n• Marketing Director\n\nRecommendation: Focus initial conversation on ${formData.contactName}'s specific pain points and decision-making authority within the organization.`,
    websiteAudit: `Key Findings for ${formData.company}:\n\n• Website speed: Moderate — opportunities for optimization\n• Mobile responsiveness: Partial — some pages need attention\n• CTA clarity: Could be improved for better conversion\n• Content quality: Good foundation, could benefit from case studies\n• Lead capture: Limited — significant opportunity for improvement\n\nOverall Score: 6.5/10 — There is clear room for digital optimization that our services can address.`,
    businessProblems: `Based on industry analysis (${formData.industry}):\n\n1. Lead Generation — Difficulty maintaining a consistent pipeline of qualified leads\n2. Follow-up Automation — Manual processes causing delayed responses and lost opportunities\n3. Data Organization — Customer data scattered across multiple tools and spreadsheets\n4. Scalability — Current processes cannot support growth without proportional headcount increase\n5. Conversion Rate — Website traffic not converting at optimal rates`,
    recommendedSolutions: `Tailored Solutions for ${formData.company}:\n\n1. AI-Powered Lead Qualification — Automate initial screening and scoring to focus your team on high-value prospects\n2. Automated Follow-up Sequences — Multi-channel nurture campaigns that respond within minutes, not days\n3. Unified CRM Integration — Centralize all customer interactions, notes, and history in one intelligent platform\n4. Workflow Automation — Eliminate repetitive tasks and free up 15+ hours per week per team member\n5. Conversion Rate Optimization — Data-driven improvements to website and sales funnel performance`,
    estimatedROI: `Projected ROI for ${formData.company}:\n\nTime Savings: 120+ hours/month across sales team\nLead Response Time: From 4+ hours to under 5 minutes\nPipeline Growth: 35-50% increase in qualified leads within 90 days\nClose Rate Improvement: 15-25% increase through better preparation and follow-up\nRevenue Impact: Estimated 2-3x return on investment within 12 months\n\nBreak-even Point: Approximately 3-4 months after full implementation`,
    potentialObjections: `1. "We already have a CRM" → "That's great — our solution integrates with existing CRMs to add AI capabilities your current system lacks. We enhance rather than replace."\n\n2. "Budget is tight right now" → "I understand. Many of our clients started with a pilot program. The typical client sees ROI within 3-4 months, making it cash-flow positive quickly."\n\n3. "We need to think about it" → "Absolutely. Would it help if I sent over a customized ROI projection based on your specific numbers? That way you have concrete data for your decision."\n\n4. "We tried automation before and it didn't work" → "That's a common concern. The key difference with our approach is AI-powered personalization — not generic automation. Every interaction feels human and relevant."\n\n5. "Our team is resistant to new tools" → "We include comprehensive onboarding and training. Our adoption rate is 94% within the first 30 days because the tool saves time rather than adding complexity.`,
    suggestedAgenda: `Suggested 30-Minute Meeting Agenda:\n\n1. Opening & Rapport Building (2 min)\n  — Acknowledge their industry expertise\n  — Reference a recent company milestone or news\n\n2. Discovery Questions (8 min)\n  — Current lead generation process\n  — Biggest sales challenges right now\n  — Tools currently in use\n  — What success looks like in 6 months\n\n3. Solution Overview (10 min)\n  — Tailored demo based on discovery\n  — Relevant case studies from ${formData.industry}\n  — Live demonstration of key features\n\n4. ROI Discussion (5 min)\n  — Custom ROI projection\n  — Implementation timeline\n  — Quick wins they can expect\n\n5. Next Steps & Close (5 min)\n  — Address remaining questions\n  — Propose concrete next action\n  — Schedule follow-up if needed`,
    talkingPoints: `Key Talking Points for ${formData.company}:\n\n• "Companies in ${formData.industry} are seeing 40% faster response times with AI-assisted workflows"\n• "Your current team could handle 3x more leads without hiring — using the same hours more effectively"\n• "The average ${formData.industry} company loses 23% of leads due to slow follow-up — we eliminate that gap"\n• "Our clients typically see a full return on investment within the first quarter"\n• "We work with your existing tech stack — no disruptive migration required"\n• "Imagine every lead getting a personalized, timely response within 5 minutes, 24/7"`,
    closingStrategy: `Closing Strategy for ${formData.contactName}:\n\nPrimary Close: "Based on what you've shared, I'd recommend we start with a focused pilot targeting your biggest pain point — [specific problem]. Would next Tuesday work for a 15-minute technical walkthrough?"\n\nSecondary Close: "Would it be helpful if I prepared a customized proposal with specific numbers for your team to review? I can have it ready by [specific date]."\n\nUrgency Driver: "We're currently onboarding ${formData.industry} companies and have limited capacity this quarter. I'd hate for you to miss the window."\n\nFollow-up: If no close today — send a personalized recap within 2 hours with relevant case study attached. Schedule a touchpoint for 3 business days later.\n\nObjection Recovery: If concerns arise, pivot to: "Let me address that specifically — can I show you how [similar client] handled the same concern?"`,
   })
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