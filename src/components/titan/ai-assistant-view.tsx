'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User, Sparkles, Brain, Target, Mail, BarChart3, Paperclip, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_ACTIONS = [
  { icon: Brain, label: 'Industry Analysis', color: 'text-violet-600', bg: 'bg-violet-50', query: 'Give me a detailed industry analysis for AI automation agencies. Include trends, challenges, and AI opportunities.' },
  { icon: Target, label: 'Campaign Strategy', color: 'text-blue-600', bg: 'bg-blue-50', query: 'Help me design a multi-step outreach campaign for web development agencies. Include timing, channels, and AI decision points.' },
  { icon: Lightbulb, label: 'Sales Objections', color: 'text-amber-600', bg: 'bg-amber-50', query: 'What are the top 10 sales objections I will face selling AI automation services, and how should I respond to each one?' },
  { icon: BarChart3, label: 'Pricing Strategy', color: 'text-emerald-600', bg: 'bg-emerald-50', query: 'Help me create a pricing strategy for AI automation services. Include pricing tiers, value anchoring, and package design.' },
  { icon: Mail, label: 'Email Angles', color: 'text-rose-600', bg: 'bg-rose-50', query: 'Generate 5 unique email angles for cold outreach to restaurant owners about AI automation. Each should sell outcomes, not technology.' },
]

const messageVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

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
      <div className="flex-1 overflow-y-auto pb-4 px-1">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-600/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              Ask me anything about sales, marketing, or growth
            </p>

            {/* Quick actions grid in empty state */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {QUICK_ACTIONS.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  onClick={() => sendMessage(action.query)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200/60 text-left hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', action.bg)}>
                    <action.icon className={cn('w-4 h-4', action.color)} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

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
                  'max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 rounded-bl-sm text-gray-700'
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3 py-1.5"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span className="text-xs text-gray-400">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick action chips above input (when chat has messages) */}
      {messages.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.slice(0, 4).map((action) => (
              <button
                key={action.label}
                onClick={() => sendMessage(action.query)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                  'bg-white border border-gray-200/60 text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:shadow-sm'
                )}
              >
                <action.icon className="w-3 h-3" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-2 shadow-sm">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <button
            type="button"
            className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask TITAN anything..."
            rows={1}
            className="flex-1 resize-none bg-transparent border-0 outline-none text-sm text-gray-900 placeholder:text-gray-400 py-2.5 px-1 max-h-32"
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
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}