'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User, Sparkles, Brain, Target, Mail, BarChart3, FileText, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_ACTIONS = [
  { icon: Brain, label: 'Industry Analysis', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/50', query: 'Give me a detailed industry analysis for AI automation agencies. Include trends, challenges, and AI opportunities.' },
  { icon: Target, label: 'Campaign Strategy', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/50', query: 'Help me design a multi-step outreach campaign for web development agencies. Include timing, channels, and AI decision points.' },
  { icon: Lightbulb, label: 'Sales Objections', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/50', query: 'What are the top 10 sales objections I will face selling AI automation services, and how should I respond to each one?' },
  { icon: BarChart3, label: 'Pricing Strategy', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/50', query: 'Help me create a pricing strategy for AI automation services. Include pricing tiers, value anchoring, and package design.' },
  { icon: Mail, label: 'Email Angles', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/50', query: 'Generate 5 unique email angles for cold outreach to restaurant owners about AI automation. Each should sell outcomes, not technology.' },
]

export function AIAssistantView() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pendingQuery = useAppStore(s => s.pendingAiQuery)
  const clearPending = useCallback(() => useAppStore.getState().setPendingAiQuery(null), [])

  // Handle pending query from command palette
  useEffect(() => {
    if (pendingQuery) {
      sendMessage(pendingQuery)
      clearPending()
    }
  }, [pendingQuery, clearPending])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      })

      if (!res.ok) throw new Error('AI response failed')
      const data = await res.json()

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.message || data.content || data.response || 'I processed your request.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error. ${err instanceof Error ? err.message : 'Please try again.'}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-1">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl gradient-blue flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">AI Assistant</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md">Ask me anything about sales strategy, industry analysis, email copy, pricing, or growth tactics.</p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'glass-card rounded-bl-md text-gray-700 dark:text-gray-300'
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                <span className="text-xs text-gray-400">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => sendMessage(action.query)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  action.bg, action.color,
                  'hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                )}
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="glass-strong rounded-2xl p-2">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask TITAN anything..."
            rows={1}
            className="flex-1 resize-none bg-transparent border-0 outline-none text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 py-2.5 px-3 max-h-32"
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
                ? 'gradient-blue text-white hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            )}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}