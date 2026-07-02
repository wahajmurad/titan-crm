'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Rocket, Sparkles, Play, Pause, CheckCircle, Clock, ArrowRight,
  Target, Globe, Mail, Brain, Zap, Search, Users, BarChart3,
  Calendar, Bot, Loader2, ChevronRight, Plus, Send, X,
  Workflow, FileSearch, Link2, MessageSquare, Timer, BookOpen,
  Shield, Megaphone, Layers, Building2
} from 'lucide-react'

// ─── Animation Variants ──────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

// ─── Types ───────────────────────────────────────────────────────

type WizardStep = {
  id: string
  question: string
  options: string[]
  icon: React.ElementType
}

type AutomationStatus = 'running' | 'paused' | 'completed' | 'failed'

interface ActiveAutomation {
  id: string
  name: string
  status: AutomationStatus
  progress: number
  leadsFound: number
  emailsSent: number
  repliesReceived: number
  meetingsBooked: number
  startedAt: string
  currentStep: string
}

interface PipelineStep {
  label: string
  icon: React.ElementType
  status: 'pending' | 'running' | 'completed' | 'failed'
  detail: string
}

interface DecisionLogEntry {
  id: string
  timestamp: string
  action: string
  detail: string
  type: 'discovery' | 'qualification' | 'personalization' | 'outreach' | 'system'
}

// ─── Wizard Configuration ────────────────────────────────────────

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'industry',
    question: 'Which industry are you targeting?',
    options: ['Law Firms', 'Dental Practices', 'Real Estate', 'SaaS / Tech', 'E-commerce', 'Healthcare', 'Financial Services', 'Marketing Agencies', 'Construction', 'Accounting Firms'],
    icon: Building2,
  },
  {
    id: 'location',
    question: 'Which location or region?',
    options: ['New York City', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'London', 'Toronto', 'Sydney', 'Berlin', 'National (US-wide)'],
    icon: Globe,
  },
  {
    id: 'companySize',
    question: 'Target company size?',
    options: ['Solo / 1-5', 'Small (6-20)', 'Medium (21-100)', 'Large (101-500)', 'Enterprise (500+)'],
    icon: Users,
  },
  {
    id: 'services',
    question: 'Preferred services to offer?',
    options: ['AI Automation', 'Website Design', 'SEO & Marketing', 'CRM Setup', 'Lead Generation', 'Full-Stack Dev', 'Data Analytics', 'Process Optimization'],
    icon: Zap,
  },
  {
    id: 'channels',
    question: 'Outreach channels?',
    options: ['Email Only', 'LinkedIn Only', 'Both Email & LinkedIn', 'Email + LinkedIn + Phone'],
    icon: Send,
  },
  {
    id: 'dailyLimit',
    question: 'Daily sending limit?',
    options: ['25 emails/day', '50 emails/day', '100 emails/day', '200 emails/day', '500 emails/day'],
    icon: Timer,
  },
  {
    id: 'personalization',
    question: 'Personalization depth?',
    options: ['Basic — Name & company', 'Deep — Website audit insights', 'Hyper-personalized — Multi-research, case studies, custom ROI projections'],
    icon: Brain,
  },
  {
    id: 'followUp',
    question: 'Follow-up schedule?',
    options: ['1 follow-up (Day 3)', '2 follow-ups (Day 3 & 7)', '3 follow-ups (Day 3, 7, 14)', 'Aggressive (5-touch sequence)', 'Custom schedule'],
    icon: Calendar,
  },
  {
    id: 'bookingLink',
    question: 'Meeting booking link?',
    options: ['Calendly', 'Cal.com', 'HubSpot Meetings', 'Zoom Scheduler', 'I\'ll add it later', 'No booking link needed'],
    icon: Link2,
  },
]

// ─── Mock Data ───────────────────────────────────────────────────

const MOCK_AUTOMATIONS: ActiveAutomation[] = [
  {
    id: 'auto-1',
    name: 'Manhattan Law Firms — AI Audit Campaign',
    status: 'running',
    progress: 67,
    leadsFound: 142,
    emailsSent: 89,
    repliesReceived: 23,
    meetingsBooked: 7,
    startedAt: '2 hours ago',
    currentStep: 'Personalization',
  },
  {
    id: 'auto-2',
    name: 'Dental Practices — NYC Outreach',
    status: 'paused',
    progress: 34,
    leadsFound: 68,
    emailsSent: 45,
    repliesReceived: 8,
    meetingsBooked: 2,
    startedAt: '1 day ago',
    currentStep: 'Qualification',
  },
  {
    id: 'auto-3',
    name: 'Real Estate Brokerages — Full Pipeline',
    status: 'completed',
    progress: 100,
    leadsFound: 210,
    emailsSent: 198,
    repliesReceived: 52,
    meetingsBooked: 18,
    startedAt: '3 days ago',
    currentStep: 'Completed',
  },
  {
    id: 'auto-4',
    name: 'SaaS Startups — LinkedIn Warm-up',
    status: 'running',
    progress: 22,
    leadsFound: 37,
    emailsSent: 15,
    repliesReceived: 3,
    meetingsBooked: 0,
    startedAt: '45 minutes ago',
    currentStep: 'Discovery',
  },
]

const MOCK_PIPELINE_STEPS: PipelineStep[] = [
  { label: 'Discovery', icon: Search, status: 'completed', detail: '142 leads found across Manhattan law firms' },
  { label: 'Research', icon: BookOpen, status: 'completed', detail: 'Company profiles, tech stack, and social presence analyzed' },
  { label: 'Website Audit', icon: FileSearch, status: 'completed', detail: '89 websites audited — 67 flagged for AI opportunities' },
  { label: 'Qualification', icon: Shield, status: 'completed', detail: '67 qualified based on audit score > 60 and revenue signals' },
  { label: 'Personalization', icon: Brain, status: 'running', detail: 'Generating deep-personalized messaging for 67 leads...' },
  { label: 'Outreach', icon: Send, status: 'pending', detail: 'Waiting for personalization to complete' },
  { label: 'Follow-up', icon: MessageSquare, status: 'pending', detail: '3-touch follow-up sequence configured' },
  { label: 'Meeting Booking', icon: Calendar, status: 'pending', detail: 'Calendly integration ready' },
]

const MOCK_DECISION_LOG: DecisionLogEntry[] = [
  { id: 'd1', timestamp: '2:14 PM', action: 'Lead Scored', detail: 'Morrison & Foerster LLP — scored 92/100. Strong AI adoption signals.', type: 'qualification' },
  { id: 'd2', timestamp: '2:12 PM', action: 'Audit Completed', detail: 'Website uses legacy CMS, no chatbot, no automation. High priority.', type: 'discovery' },
  { id: 'd3', timestamp: '2:10 PM', action: 'Personalization', detail: 'Crafted audit-based hook referencing their 2024 digital transformation initiative.', type: 'personalization' },
  { id: 'd4', timestamp: '2:08 PM', action: 'Lead Skipped', detail: 'Baker & Associates — already uses AI scheduling. Score: 31/100.', type: 'qualification' },
  { id: 'd5', timestamp: '2:05 PM', action: 'Channel Selected', detail: 'Partners at Davis Wright prefer LinkedIn. Routed to LinkedIn sequence.', type: 'outreach' },
  { id: 'd6', timestamp: '2:01 PM', action: 'Batch Queued', detail: '15 high-priority leads queued for immediate outreach.', type: 'system' },
]

const TEMPLATES = [
  {
    id: 't1',
    icon: Search,
    title: 'Lead Discovery & Outreach',
    description: 'Find leads, audit websites, identify opportunities, and send personalized emails automatically.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    id: 't2',
    icon: Workflow,
    title: 'Full Sales Pipeline',
    description: 'End-to-end from lead discovery through research, qualification, outreach, and meeting booking.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    id: 't3',
    icon: FileSearch,
    title: 'Website Audit Campaign',
    description: 'Audit target websites, generate AI opportunity reports, and launch personalized outreach.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    id: 't4',
    icon: Link2,
    title: 'LinkedIn + Email Warm-up',
    description: 'Multi-channel engagement combining LinkedIn connections with email sequences for maximum reach.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
]

// ─── Status Helpers ──────────────────────────────────────────────

function getStatusConfig(status: AutomationStatus) {
  switch (status) {
    case 'running':
      return { label: 'Running', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', progressColor: '[&>div]:bg-blue-500' }
    case 'paused':
      return { label: 'Paused', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', progressColor: '[&>div]:bg-amber-500' }
    case 'completed':
      return { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', progressColor: '[&>div]:bg-emerald-500' }
    case 'failed':
      return { label: 'Failed', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', progressColor: '[&>div]:bg-red-500' }
  }
}

function getStepStatusIcon(status: PipelineStep['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />
    case 'running':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    case 'failed':
      return <X className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-300" />
  }
}

function getLogTypeColor(type: DecisionLogEntry['type']) {
  switch (type) {
    case 'discovery': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'qualification': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'personalization': return 'bg-violet-50 text-violet-700 border-violet-200'
    case 'outreach': return 'bg-amber-50 text-amber-700 border-amber-200'
    default: return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

// ─── Component ───────────────────────────────────────────────────

export function AutomationCenterView() {
  const [activeTab, setActiveTab] = useState('create')
  const [objective, setObjective] = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string>>({})
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const wizardRef = useRef<HTMLDivElement>(null)
  const objectiveInputRef = useRef<HTMLTextAreaElement>(null)

  // ─── Handlers ──────────────────────────────────────────────

  const handleStartWizard = useCallback(() => {
    if (!objective.trim()) {
      toast.error('Please describe your automation objective first.')
      objectiveInputRef.current?.focus()
      return
    }
    setShowWizard(true)
    setWizardStep(0)
    setWizardAnswers({})
    toast.success('TITAN AI is configuring your automation...')
  }, [objective])

  const handleSelectOption = useCallback((stepId: string, option: string) => {
    setWizardAnswers(prev => ({ ...prev, [stepId]: option }))
  }, [])

  const handleNextStep = useCallback(() => {
    const currentStep = WIZARD_STEPS[wizardStep]
    if (!wizardAnswers[currentStep.id]) {
      toast.error('Please select an option to continue.')
      return
    }
    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep(prev => prev + 1)
    }
  }, [wizardStep, wizardAnswers])

  const handlePrevStep = useCallback(() => {
    if (wizardStep > 0) setWizardStep(prev => prev - 1)
  }, [wizardStep])

  const handleGenerateAutomation = useCallback(() => {
    const currentStep = WIZARD_STEPS[wizardStep]
    if (!wizardAnswers[currentStep.id]) {
      toast.error('Please select an option to continue.')
      return
    }
    setIsGenerating(true)
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false)
      setShowWizard(false)
      setActiveTab('executing')
      toast.success('Automation generated and launched successfully!')
    }, 2000)
  }, [wizardStep, wizardAnswers])

  const handleUseTemplate = useCallback((templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId)
    if (template) {
      toast.success(`Template "${template.title}" loaded. Customize it in the wizard.`)
      setObjective(template.description)
      setShowWizard(true)
      setWizardStep(0)
      setWizardAnswers({})
      setActiveTab('create')
    }
  }, [])

  const handleToggleAutomation = useCallback((id: string, currentStatus: AutomationStatus) => {
    if (currentStatus === 'running') {
      toast.success('Automation paused.')
    } else {
      toast.success('Automation resumed.')
    }
  }, [])

  // ─── Scroll wizard into view ───────────────────────────────

  useEffect(() => {
    if (showWizard && wizardRef.current) {
      wizardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showWizard, wizardStep])

  // ─── Current wizard step ───────────────────────────────────

  const currentWizardStep = WIZARD_STEPS[wizardStep]
  const isLastStep = wizardStep === WIZARD_STEPS.length - 1
  const allAnswered = WIZARD_STEPS.every(s => wizardAnswers[s.id])
  const selectedAuto = MOCK_AUTOMATIONS.find(a => a.id === selectedAutomation)

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* ── Hero Section ──────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Automation Center</h1>
              <p className="text-sm text-gray-500">
                Describe your objective. TITAN AI will build and execute the entire workflow.
              </p>
            </div>
          </div>

          {/* Objective Input */}
          <div className="relative">
            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Sparkles className="absolute left-4 top-4 h-5 w-5 text-blue-500" />
              <Textarea
                ref={objectiveInputRef}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Find 100 law firms in Manhattan, analyze every website, identify AI automation opportunities, generate personalized audits, and launch outreach campaigns..."
                className="min-h-[100px] resize-none border-0 bg-transparent pl-12 pr-36 pt-4 pb-4 text-[15px] text-gray-800 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="absolute right-3 bottom-3">
                <Button
                  onClick={handleStartWizard}
                  disabled={showWizard}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
                >
                  <Bot className="h-4 w-4" />
                  Build Automation
                </Button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
              <span className="text-xs text-gray-400">Try:</span>
              {[
                'Find SaaS startups needing CRM setup',
                'Audit dental practice websites in Miami',
                'Full pipeline for NYC real estate brokers',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setObjective(suggestion)}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── AI Setup Wizard ───────────────────────────────── */}
        <AnimatePresence>
          {showWizard && (
            <motion.section
              ref={wizardRef}
              initial={{ opacity: 0, y: 16, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900">AI Setup Wizard</CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">Step {wizardStep + 1} of {WIZARD_STEPS.length}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowWizard(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Progress bar */}
                  <Progress value={((wizardStep + 1) / WIZARD_STEPS.length) * 100} className="mt-3 h-1.5" />
                  {/* Step dots */}
                  <div className="mt-3 flex gap-1">
                    {WIZARD_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          i < wizardStep ? 'bg-blue-500' : i === wizardStep ? 'bg-blue-400' : 'bg-gray-200'
                        )}
                      />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Objective recap */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Your Objective</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{objective}</p>
                  </div>

                  {/* Current question */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentWizardStep.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <currentWizardStep.icon className="h-4.5 w-4.5 text-blue-500" />
                        <h3 className="text-sm font-medium text-gray-800">{currentWizardStep.question}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentWizardStep.options.map((option) => {
                          const isSelected = wizardAnswers[currentWizardStep.id] === option
                          return (
                            <button
                              key={option}
                              onClick={() => handleSelectOption(currentWizardStep.id, option)}
                              className={cn(
                                'inline-flex items-center rounded-lg border px-3.5 py-2 text-sm transition-all',
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium shadow-sm'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600'
                              )}
                            >
                              {option}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevStep}
                      disabled={wizardStep === 0}
                      className="text-gray-500"
                    >
                      Back
                    </Button>
                    <div className="flex items-center gap-3">
                      {isLastStep ? (
                        <Button
                          onClick={handleGenerateAutomation}
                          disabled={!wizardAnswers[currentWizardStep.id] || isGenerating}
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Rocket className="h-4 w-4" />
                              Generate Automation
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNextStep}
                          disabled={!wizardAnswers[currentWizardStep.id]}
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Tabs: Automations / Templates ─────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="create" className="gap-2 text-sm">
              <Layers className="h-3.5 w-3.5" />
              Active Automations
              <Badge variant="secondary" className="ml-1 bg-blue-50 text-blue-700 hover:bg-blue-50">
                {MOCK_AUTOMATIONS.filter(a => a.status === 'running').length} active
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2 text-sm">
              <Zap className="h-3.5 w-3.5" />
              Quick Start Templates
            </TabsTrigger>
            <TabsTrigger value="executing" className="gap-2 text-sm">
              <Play className="h-3.5 w-3.5" />
              Live Execution
            </TabsTrigger>
          </TabsList>

          {/* ── Active Automations Tab ──────────────────────── */}
          <TabsContent value="create" className="mt-5">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2"
            >
              {MOCK_AUTOMATIONS.map((automation) => {
                const cfg = getStatusConfig(automation.status)
                const StepIcon = automation.status === 'running' ? Pause : Play
                return (
                  <motion.div key={automation.id} variants={itemVariants}>
                    <Card
                      className={cn(
                        'cursor-pointer border transition-all hover:shadow-md',
                        selectedAutomation === automation.id ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'
                      )}
                      onClick={() => setSelectedAutomation(selectedAutomation === automation.id ? null : automation.id)}
                    >
                      <CardContent className="p-5 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('h-2 w-2 rounded-full', cfg.dot, automation.status === 'running' && 'animate-pulse')} />
                              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', cfg.bg, cfg.color, cfg.border)}>
                                {cfg.label}
                              </span>
                              <span className="text-xs text-gray-400">{automation.startedAt}</span>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{automation.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Current step: {automation.currentStep}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn('h-8 w-8 shrink-0', automation.status === 'running' ? 'text-blue-600 border-blue-200 hover:bg-blue-50' : 'text-gray-500')}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleAutomation(automation.id, automation.status)
                            }}
                          >
                            <StepIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium text-gray-700">{automation.progress}%</span>
                          </div>
                          <Progress value={automation.progress} className={cn('h-1.5', cfg.progressColor)} />
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Leads', value: automation.leadsFound, icon: Users },
                            { label: 'Sent', value: automation.emailsSent, icon: Send },
                            { label: 'Replies', value: automation.repliesReceived, icon: MessageSquare },
                            { label: 'Meetings', value: automation.meetingsBooked, icon: Calendar },
                          ].map((metric) => (
                            <div key={metric.label} className="text-center">
                              <metric.icon className="h-3.5 w-3.5 text-gray-400 mx-auto mb-0.5" />
                              <p className="text-sm font-semibold text-gray-800">{metric.value}</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{metric.label}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          </TabsContent>

          {/* ── Quick Start Templates Tab ───────────────────── */}
          <TabsContent value="templates" className="mt-5">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2"
            >
              {TEMPLATES.map((template) => (
                <motion.div key={template.id} variants={itemVariants}>
                  <Card className="border-gray-200 transition-all hover:shadow-md">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start gap-3.5">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', template.bg)}>
                          <template.icon className={cn('h-5 w-5', template.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900">{template.title}</h3>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{template.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Sparkles className="h-3 w-3" />
                          AI-powered template
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 gap-1.5"
                          onClick={() => handleUseTemplate(template.id)}
                        >
                          Use Template
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* ── Live Execution Tab ──────────────────────────── */}
          <TabsContent value="executing" className="mt-5 space-y-6">
            <AnimatePresence>
              {selectedAuto && selectedAuto.status === 'running' ? (
                <motion.div
                  key="execution-view"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Execution Header */}
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                              <Play className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-blue-500 border-2 border-white animate-pulse" />
                          </div>
                          <div>
                            <h2 className="text-base font-semibold text-gray-900">{selectedAuto.name}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Started {selectedAuto.startedAt} — {selectedAuto.progress}% complete
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex items-center gap-4 text-center">
                            {[
                              { label: 'Leads', value: selectedAuto.leadsFound },
                              { label: 'Sent', value: selectedAuto.emailsSent },
                              { label: 'Replies', value: selectedAuto.repliesReceived },
                              { label: 'Meetings', value: selectedAuto.meetingsBooked },
                            ].map((m) => (
                              <div key={m.label}>
                                <p className="text-lg font-bold text-gray-900">{m.value}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{m.label}</p>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => handleToggleAutomation(selectedAuto.id, selectedAuto.status)}
                          >
                            <Pause className="h-3.5 w-3.5 mr-1.5" />
                            Pause
                          </Button>
                        </div>
                      </div>
                      <Progress value={selectedAuto.progress} className="mt-4 h-2 [&>div]:bg-blue-500" />
                    </CardContent>
                  </Card>

                  {/* Pipeline Steps */}
                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-blue-500" />
                        Pipeline Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                      {MOCK_PIPELINE_STEPS.map((step, idx) => (
                        <motion.div
                          key={step.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: idx * 0.06 }}
                          className="flex gap-4"
                        >
                          {/* Connector line */}
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                              step.status === 'completed' ? 'border-emerald-200 bg-emerald-50' :
                              step.status === 'running' ? 'border-blue-200 bg-blue-50' :
                              step.status === 'failed' ? 'border-red-200 bg-red-50' :
                              'border-gray-200 bg-gray-50'
                            )}>
                              {getStepStatusIcon(step.status)}
                            </div>
                            {idx < MOCK_PIPELINE_STEPS.length - 1 && (
                              <div className={cn(
                                'w-0.5 h-10 my-1',
                                step.status === 'completed' ? 'bg-emerald-200' :
                                step.status === 'running' ? 'bg-gradient-to-b from-blue-300 to-gray-200' :
                                'bg-gray-100'
                              )} />
                            )}
                          </div>
                          {/* Step content */}
                          <div className="flex-1 pb-6 min-w-0">
                            <div className="flex items-center gap-2">
                              <step.icon className={cn(
                                'h-4 w-4',
                                step.status === 'completed' ? 'text-emerald-600' :
                                step.status === 'running' ? 'text-blue-600' :
                                step.status === 'failed' ? 'text-red-500' :
                                'text-gray-300'
                              )} />
                              <h4 className={cn(
                                'text-sm font-medium',
                                step.status === 'pending' ? 'text-gray-400' : 'text-gray-800'
                              )}>
                                {step.label}
                              </h4>
                              {step.status === 'running' && (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                                  In Progress
                                </Badge>
                              )}
                              {step.status === 'completed' && (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
                                  Done
                                </Badge>
                              )}
                            </div>
                            <p className={cn(
                              'text-xs mt-1 leading-relaxed',
                              step.status === 'pending' ? 'text-gray-300' : 'text-gray-500'
                            )}>
                              {step.detail}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* AI Decision Log */}
                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-violet-500" />
                          AI Decision Log
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] text-gray-400 font-normal">
                          Live — updating in real-time
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {MOCK_DECISION_LOG.map((entry, idx) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3"
                          >
                            <div className="mt-0.5">
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 font-medium border', getLogTypeColor(entry.type))}>
                                {entry.type}
                              </Badge>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-800">{entry.action}</span>
                                <span className="text-[10px] text-gray-400">{entry.timestamp}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{entry.detail}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="no-execution"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 mb-4">
                    <Play className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">No Active Execution</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    Select a running automation from the Active Automations tab to view its live execution pipeline and AI decision log.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => {
                      setSelectedAutomation('auto-1')
                      setActiveTab('executing')
                    }}
                  >
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    View Sample Execution
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}