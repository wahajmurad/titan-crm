'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Globe, Bot, Brain, Lightbulb, Wrench, Gift, PenTool, Target,
  GraduationCap, Play, Zap, ChevronRight, Activity, Sparkles, RefreshCw,
  BarChart3, Clock, CheckCircle2, AlertCircle, Loader2, Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentCard {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  status: 'ready' | 'running' | 'completed' | 'error'
  lastRun?: string
  runCount?: number
  avgDuration?: string
}

const AGENTS: AgentCard[] = [
  { id: 'lead_discovery', name: 'Lead Discovery', description: 'Finds and generates qualified business leads based on industry, location, and size criteria', icon: Search, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', status: 'ready', runCount: 24, avgDuration: '3.2s' },
  { id: 'research', name: 'AI Research Agent', description: 'Deep company research — the brain. Collects business overview, services, pain points, opportunities, and personalization data', icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', status: 'ready', runCount: 18, avgDuration: '4.1s' },
  { id: 'website_intel', name: 'Website Intelligence', description: 'Analyzes websites like a UX Consultant. 10-category scoring: UI, UX, SEO, Performance, Accessibility, Mobile, Security, AI, Automation, Conversion', icon: Bot, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', status: 'ready', runCount: 42, avgDuration: '5.8s' },
  { id: 'business_intel', name: 'Business Intelligence', description: 'Analyzes business model, revenue potential, decision maker profiles, competitive landscape, and deal readiness', icon: Brain, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', status: 'ready', runCount: 15, avgDuration: '3.5s' },
  { id: 'industry_expert', name: 'Industry Expert', description: 'Deep industry knowledge — trends, problems, AI opportunities, outreach strategies, objections, and closing tactics', icon: Lightbulb, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', status: 'ready', runCount: 8, avgDuration: '6.2s' },
  { id: 'solution_architect', name: 'Solution Architect', description: 'Converts business problems into specific AI solutions with implementation plans, ROI estimates, and priority levels', icon: Wrench, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', status: 'ready', runCount: 12, avgDuration: '3.8s' },
  { id: 'offer_generator', name: 'Offer Generator', description: 'Creates irresistible outcome-based offers. Sells transformations, not technology. Primary, secondary, and upsell offers', icon: Gift, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', status: 'ready', runCount: 10, avgDuration: '4.0s' },
  { id: 'personalization', name: 'Personalization Agent', description: 'Generates hyper-personalized outreach using all gathered intelligence. Scores personalization quality across 6 dimensions', icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', status: 'ready', runCount: 35, avgDuration: '2.9s' },
  { id: 'campaign_strategy', name: 'Campaign Strategy', description: 'Designs multi-step campaign sequences with AI decision nodes, timing optimization, and success criteria', icon: Target, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', status: 'ready', runCount: 6, avgDuration: '5.1s' },
  { id: 'learning', name: 'Learning Agent', description: 'Self-learning system that analyzes patterns from performance data and continuously improves future outputs', icon: GraduationCap, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', status: 'ready', runCount: 3, avgDuration: '4.5s' },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function AIAgentsView() {
  const [agents, setAgents] = useState(AGENTS)
  const [runningAgent, setRunningAgent] = useState<string | null>(null)

  const handleRun = async (agentId: string) => {
    setRunningAgent(agentId)
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'running' as const } : a))

    // Simulate agent execution
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000))

    setAgents(prev => prev.map(a => {
      if (a.id !== agentId) return a
      const success = Math.random() > 0.15
      return {
        ...a,
        status: success ? 'completed' as const : 'error' as const,
        runCount: (a.runCount || 0) + 1,
      }
    }))
    setRunningAgent(null)

    // Reset status after a moment
    setTimeout(() => {
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'ready' as const } : a))
    }, 3000)
  }

  const totalRuns = agents.reduce((sum, a) => sum + (a.runCount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Agents</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">10 specialized AI agents working together as your growth team</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card rounded-xl px-4 py-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{totalRuns} total runs</span>
          </div>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Orchestration Pipeline</h3>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {['Discover', 'Research', 'Audit', 'Qualify', 'Solutions', 'Offer', 'Personalize', 'Campaign'].map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{step}</span>
              </div>
              {i < 7 && <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Agent grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            variants={item}
            className={cn(
              'glass-card rounded-2xl p-5 border-2 transition-all duration-300 hover:shadow-lg',
              agent.status === 'running' && 'border-blue-300 dark:border-blue-700 shadow-blue-500/10',
              agent.status === 'completed' && 'border-emerald-300 dark:border-emerald-700',
              agent.status === 'error' && 'border-red-300 dark:border-red-700',
              agent.status === 'ready' && agent.borderColor
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', agent.bgColor)}>
                  <agent.icon className={cn('w-5 h-5', agent.color)} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{agent.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      'flex items-center gap-1 text-[10px] font-medium',
                      agent.status === 'ready' && 'text-gray-400',
                      agent.status === 'running' && 'text-blue-500',
                      agent.status === 'completed' && 'text-emerald-500',
                      agent.status === 'error' && 'text-red-500',
                    )}>
                      {agent.status === 'ready' && <><CheckCircle2 className="w-2.5 h-2.5" /> Ready</>}
                      {agent.status === 'running' && <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Running...</>}
                      {agent.status === 'completed' && <><CheckCircle2 className="w-2.5 h-2.5" /> Completed</>}
                      {agent.status === 'error' && <><AlertCircle className="w-2.5 h-2.5" /> Error</>}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRun(agent.id)}
                disabled={agent.status === 'running' || !!runningAgent}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  agent.status === 'running'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {agent.status === 'running' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                {agent.status === 'running' ? 'Running' : 'Run'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{agent.description}</p>
            <div className="flex items-center gap-4 text-[10px] text-gray-400 dark:text-gray-500">
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>{agent.runCount || 0} runs</span>
              </div>
              {agent.avgDuration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>~{agent.avgDuration}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}