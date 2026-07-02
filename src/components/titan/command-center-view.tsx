'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Search, Globe, Mail, Target,
  BarChart3, Zap, Loader2, CheckCircle2, Circle,
  Lightbulb, Bot, User, ChevronRight,
  Building2, FileText, Workflow, TrendingUp,
  Activity, Shield, Cpu, Wifi
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  steps?: { label: string; status: 'pending' | 'running' | 'done' | 'error' }[]
  timestamp: Date
  isStreaming?: boolean
}

interface SystemMetric {
  label: string
  value: string
  status: 'healthy' | 'warning' | 'critical'
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const QUICK_ACTIONS = [
  { icon: Search, label: 'Find Leads', color: 'text-blue-600', bg: 'bg-blue-50', command: 'Find 10 businesses in my target market' },
  { icon: Globe, label: 'Run Audit', color: 'text-emerald-600', bg: 'bg-emerald-50', command: 'Audit the selected website thoroughly' },
  { icon: Mail, label: 'Generate Emails', color: 'text-violet-600', bg: 'bg-violet-50', command: 'Generate personalized emails for qualified leads' },
  { icon: Target, label: 'Create Campaign', color: 'text-amber-600', bg: 'bg-amber-50', command: 'Create an AI-powered outreach campaign' },
  { icon: BarChart3, label: 'Industry Analysis', color: 'text-rose-600', bg: 'bg-rose-50', command: 'Run a full industry analysis for my target market' },
  { icon: Workflow, label: 'Full Pipeline', color: 'text-blue-600', bg: 'bg-blue-50', command: 'Run the full pipeline: discover, research, audit, qualify, and prepare outreach' },
]

const messageVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export function CommandCenterView() {
  const [messages, setMessages] = useState<CommandMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to the **TITAN AI Command Center**. Tell me what you want to do and I\'ll execute it — step by step.\n\nYou can say things like:\n• "Find 50 law firms in Manhattan"\n• "Audit every website and keep only poor ones"\n• "Generate personalized reports"\n• "Create a campaign starting Monday"\n\nOr use the quick actions below.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingSteps, setStreamingSteps] = useState<{ label: string; status: 'pending' | 'running' | 'done' | 'error' }[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([])
  const [operations, setOperations] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Fetch real system metrics
    fetch('/api/dashboard').then(r => r.json()).then(data => {
      if (data.success) {
        setSystemMetrics([
          { label: 'AI Model', value: 'Online', status: 'healthy' },
          { label: 'Leads', value: `${data.stats?.totalLeads || 0} records`, status: 'healthy' },
          { label: 'Campaigns', value: `${data.stats?.activeCampaigns || 0} active`, status: 'healthy' },
          { label: 'Meetings', value: `${data.upcomingMeetings?.length || 0} upcoming`, status: 'healthy' },
        ])
      }
    }).catch(() => {})

    // Fetch recent operations/activities from API
    fetch('/api/workflows?limit=5').then(r => r.json()).then(data => {
      if (data.success && Array.isArray(data.workflows)) {
        setOperations(data.workflows.slice(0, 5).map((w: any) => ({
          id: w.id,
          name: w.name,
          status: w.status || 'completed',
          agent: 'Workflow',
          duration: '-',
          time: w.updatedAt ? timeAgo(new Date(w.updatedAt)) : 'Unknown',
        })))
      }
    }).catch(() => {})
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, streamingSteps, scrollToBottom])

  const executeCommand = async (command: string) => {
    const userMsg: CommandMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: command,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/command-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      })

      if (!res.ok) throw new Error('Command execution failed')

      const data = await res.json()

      // Animate steps
      const steps = data.steps || []
      setStreamingSteps(steps.map((s: string) => ({ label: s, status: 'pending' as const })))

      // Simulate step progression
      for (let i = 0; i < steps.length; i++) {
        setStreamingSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s))
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1200))
        setStreamingSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s))
      }

      const aiMsg: CommandMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.message || `Command executed successfully. ${data.action || 'custom'}`,
        steps: steps.map((s: string) => ({ label: s, status: 'done' as const })),
        timestamp: new Date(),
      }

      setTimeout(() => {
        setMessages(prev => [...prev, aiMsg])
        setStreamingSteps([])
      }, 500)

    } catch (err) {
      const errMsg: CommandMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I couldn't execute that command. ${err instanceof Error ? err.message : 'Please try again.'}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMsg])
      setStreamingSteps([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    executeCommand(input.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleQuickAction = (command: string) => {
    executeCommand(command)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* Mission Control Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-shrink-0"
      >
        {/* System Health */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">System Health</h3>
          </div>
          <div className="space-y-2">
            {systemMetrics.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No data yet</p>
            ) : (
            systemMetrics.map(metric => (
              <div key={metric.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{metric.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-gray-700">{metric.value}</span>
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    metric.status === 'healthy' && 'bg-emerald-500',
                    metric.status === 'warning' && 'bg-amber-500',
                    metric.status === 'critical' && 'bg-red-500',
                  )} />
                </div>
              </div>
            ))
            )}
          </div>
        </div>

        {/* Active Operations */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Recent Operations</h3>
          </div>
          <div className="space-y-2 max-h-[130px] overflow-y-auto">
            {operations.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No operations yet</p>
            ) : (
            operations.map(op => (
              <div key={op.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-gray-700 truncate">{op.name}</span>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{op.time}</span>
              </div>
            ))
            )}
          </div>
        </div>

        {/* Quick Commands */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Quick Commands</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Find Leads', icon: Search, cmd: 'Find 10 businesses in my target market' },
              { label: 'Run Audit', icon: Globe, cmd: 'Audit the selected website thoroughly' },
              { label: 'Generate Emails', icon: Mail, cmd: 'Generate personalized emails' },
              { label: 'Full Pipeline', icon: Workflow, cmd: 'Run the full pipeline' },
            ].map(cmd => (
              <button
                key={cmd.label}
                onClick={() => handleQuickAction(cmd.cmd)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-gray-50 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all disabled:opacity-50"
              >
                <cmd.icon className="w-3 h-3" />
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-1 min-h-0">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              variants={messageVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className={cn('flex gap-3 py-1.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 rounded-bl-sm text-gray-700'
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.steps && msg.steps.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200/60 space-y-2">
                    {msg.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-gray-600">{step.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming steps indicator */}
        <AnimatePresence>
          {streamingSteps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 py-1.5"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 space-y-2 max-w-[75%]">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  Executing command...
                </div>
                {streamingSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {step.status === 'done' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : step.status === 'running' ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-gray-300" />
                    )}
                    <span className={cn(
                      step.status === 'done' ? 'text-emerald-600' : step.status === 'running' ? 'text-blue-600 font-medium' : 'text-gray-400'
                    )}>{step.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions (only when few messages) */}
      {messages.length <= 2 && !isLoading && (
        <div className="flex-shrink-0">
          <p className="text-[11px] font-medium text-gray-400 mb-2 uppercase tracking-wider">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.command)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                  'bg-white border border-gray-200/60 text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:shadow-sm',
                  'hover:scale-[1.01] active:scale-[0.99]',
                )}
              >
                <action.icon className={cn('w-3.5 h-3.5', action.color)} />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-2 shadow-sm flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell TITAN what to do... e.g., 'Find 100 law firms in Manhattan and audit their websites'"
            rows={1}
            className="flex-1 resize-none bg-transparent border-0 outline-none text-sm text-gray-900 placeholder:text-gray-400 py-2.5 px-3 max-h-32"
            style={{ minHeight: '40px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 128) + 'px'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              'p-2.5 rounded-xl transition-all duration-200 flex-shrink-0',
              input.trim() && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20'
                : 'bg-gray-100 text-gray-400'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}