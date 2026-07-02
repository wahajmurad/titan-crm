'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search, Globe, Bot, Brain, Lightbulb, Wrench, Gift, PenTool, Target,
  GraduationCap, Play, Zap, ChevronRight, Activity, Clock, CheckCircle2,
  AlertCircle, Loader2, Send
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
  capabilities?: string[]
}

const AGENTS: AgentCard[] = [
  { id: 'lead_discovery', name: 'Lead Discovery', description: 'Finds and generates qualified business leads based on industry, location, and size criteria', icon: Search, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', status: 'ready', runCount: 24, avgDuration: '3.2s', capabilities: ['Industry Filters', 'Location Targeting', 'Size Matching'] },
  { id: 'research', name: 'AI Research Agent', description: 'Deep company research — the brain. Collects business overview, services, pain points, opportunities, and personalization data', icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', status: 'ready', runCount: 18, avgDuration: '4.1s', capabilities: ['Company Research', 'Pain Points', 'Opportunities'] },
  { id: 'website_intel', name: 'Website Intelligence', description: 'Analyzes websites like a UX Consultant. 10-category scoring: UI, UX, SEO, Performance, Accessibility, Mobile, Security, AI, Automation, Conversion', icon: Bot, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', status: 'ready', runCount: 42, avgDuration: '5.8s', capabilities: ['UI/UX Scoring', 'SEO Analysis', 'Performance Audit'] },
  { id: 'business_intel', name: 'Business Intelligence', description: 'Analyzes business model, revenue potential, decision maker profiles, competitive landscape, and deal readiness', icon: Brain, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', status: 'ready', runCount: 15, avgDuration: '3.5s', capabilities: ['Revenue Analysis', 'Decision Makers', 'Competitive Intel'] },
  { id: 'industry_expert', name: 'Industry Expert', description: 'Deep industry knowledge — trends, problems, AI opportunities, outreach strategies, objections, and closing tactics', icon: Lightbulb, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', status: 'ready', runCount: 8, avgDuration: '6.2s', capabilities: ['Trend Analysis', 'Objection Handling', 'Closing Tactics'] },
  { id: 'solution_architect', name: 'Solution Architect', description: 'Converts business problems into specific AI solutions with implementation plans, ROI estimates, and priority levels', icon: Wrench, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', status: 'ready', runCount: 12, avgDuration: '3.8s', capabilities: ['Solution Design', 'ROI Estimates', 'Implementation Plans'] },
  { id: 'offer_generator', name: 'Offer Generator', description: 'Creates irresistible outcome-based offers. Sells transformations, not technology. Primary, secondary, and upsell offers', icon: Gift, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', status: 'ready', runCount: 10, avgDuration: '4.0s', capabilities: ['Offer Design', 'Value Anchoring', 'Package Tiers'] },
  { id: 'personalization', name: 'Hyper-Personalization', description: 'HIGHEST PRIORITY. Makes every outreach feel handcrafted. 90% quality threshold — regenerates if below. Never uses templates.', icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', status: 'ready', runCount: 35, avgDuration: '2.9s', capabilities: ['Email Personalization', 'Quality Threshold', 'No Templates'] },
  { id: 'campaign_strategy', name: 'Campaign Strategy', description: 'Automatically builds data-driven multi-step campaigns with AI decision nodes, follow-up strategy, and success metrics', icon: Target, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', status: 'ready', runCount: 6, avgDuration: '5.1s', capabilities: ['Multi-Step Design', 'AI Decision Nodes', 'Success Metrics'] },
  { id: 'outreach', name: 'Outreach Agent', description: 'Executes personalized outreach across email, LinkedIn, and phone. Finalizes content, validates quality, prepares for sending.', icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', status: 'ready', runCount: 42, avgDuration: '1.5s', capabilities: ['Email Sending', 'LinkedIn Outreach', 'Quality Validation'] },
  { id: 'learning', name: 'Continuous Learning', description: 'Self-learning from every interaction — tracks best emails, open rates, conversions, and auto-optimizes future campaigns', icon: GraduationCap, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', status: 'ready', runCount: 3, avgDuration: '4.5s', capabilities: ['Auto-Optimization', 'Pattern Recognition', 'Performance Tracking'] },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
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
  const activeAgents = agents.filter(a => a.status === 'running').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Agents</h2>
          <p className="text-sm text-gray-500 mt-1">
            {agents.length} specialized agents working together as your growth team
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl border border-gray-200/60 px-4 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-gray-600">{totalRuns} total runs</span>
          </div>
          {activeAgents > 0 && (
            <div className="bg-white rounded-xl border border-blue-200/60 px-4 py-2.5 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span className="text-xs font-medium text-blue-700">{activeAgents} running</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Pipeline visualization */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-gray-200/60 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Orchestration Pipeline</h3>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['Discover', 'Research', 'Audit', 'Qualify', 'Solutions', 'Offer', 'Personalize', 'Campaign'].map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                <span className="text-xs font-medium text-blue-700">{step}</span>
              </div>
              {i < 7 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Agent grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            variants={item}
            className={cn(
              'bg-white rounded-xl border border-gray-200/60 p-5 transition-all duration-300 hover:shadow-md hover:border-gray-300 group',
              agent.status === 'running' && 'border-blue-300 shadow-blue-500/5',
              agent.status === 'completed' && 'border-emerald-300',
              agent.status === 'error' && 'border-red-300',
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', agent.bgColor)}>
                  <agent.icon className={cn('w-5 h-5', agent.color)} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{agent.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      agent.status === 'ready' && 'bg-gray-400',
                      agent.status === 'running' && 'bg-blue-500 animate-pulse',
                      agent.status === 'completed' && 'bg-emerald-500',
                      agent.status === 'error' && 'bg-red-500',
                    )} />
                    <span className="text-[11px] text-gray-500">
                      {agent.status === 'ready' && 'Idle'}
                      {agent.status === 'running' && 'Running...'}
                      {agent.status === 'completed' && 'Completed'}
                      {agent.status === 'error' && 'Error'}
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
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'
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

            <p className="text-xs text-gray-500 leading-relaxed mb-3">{agent.description}</p>

            {/* Capabilities */}
            {agent.capabilities && agent.capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {agent.capabilities.map(cap => (
                  <span key={cap} className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                    {cap}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-3 border-t border-gray-100">
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