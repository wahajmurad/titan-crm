'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  Send,
  BarChart3,
  Target,
  Shield,
  DollarSign,
  Mail,
  Sparkles,
  Bot,
  User,
  ArrowDown,
  RotateCcw,
} from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  id: string
}

const QUICK_ACTIONS = [
  {
    id: 'industry',
    label: 'Industry Analysis',
    icon: BarChart3,
    prompt: 'Help me build a campaign for [industry] companies in [location]',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
  },
  {
    id: 'campaign',
    label: 'Campaign Strategy',
    icon: Target,
    prompt: 'How can I improve my current campaign performance?',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
  },
  {
    id: 'objections',
    label: 'Sales Objections',
    icon: Shield,
    prompt: 'What are common objections for AI automation services and how to handle them?',
    gradient: 'from-rose-500/20 to-pink-500/20',
    iconColor: 'text-rose-400',
    borderColor: 'border-rose-500/20',
  },
  {
    id: 'pricing',
    label: 'Pricing Strategy',
    icon: DollarSign,
    prompt: 'What should I charge for AI automation services?',
    gradient: 'from-blue-500/20 to-purple-500/20',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
  {
    id: 'emails',
    label: 'Email Angles',
    icon: Mail,
    prompt: 'Give me 5 unique email angles for [industry]',
    gradient: 'from-cyan-500/20 to-sky-500/20',
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/20',
  },
]

function generateId() {
  return Math.random().toString(36).substring(2, 15)
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
          <span className="text-blue-400 mt-0.5 shrink-0">•</span>
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
          <span className="text-blue-400 text-sm font-medium shrink-0">{numberedMatch[1]}.</span>
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

function processInlineFormatting(text: string): React.ReactNode {
  // Split by bold markers **...**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    // Inline code `...`
    const codeParts = part.split(/(`[^`]+`)/g)
    return codeParts.map((cp, j) => {
      if (cp.startsWith('`') && cp.endsWith('`')) {
        return (
          <code key={`${i}-${j}`} className="px-1.5 py-0.5 rounded bg-gray-100 text-emerald-300 text-xs font-mono">
            {cp.slice(1, -1)}
          </code>
        )
      }
      return <span key={`${i}-${j}`}>{cp}</span>
    })
  })
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
        <Bot className="w-4 h-4 text-gray-900" />
      </div>
      <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function WelcomeState({ onQuickAction }: { onQuickAction: (prompt: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-fuchsia-600 to-pink-600 flex items-center justify-center shadow-lg shadow-blue-500/15">
          <Sparkles className="w-8 h-8 text-gray-900" />
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-600/20 via-fuchsia-600/20 to-pink-600/20 -z-10 blur-xl" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">TITAN AI Consultant</h2>
      <p className="text-gray-500 text-sm text-center max-w-md mb-8 leading-relaxed">
        Your senior strategy consultant for B2B growth. Ask about industries, campaigns, pricing, objections, or any business challenge.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {QUICK_ACTIONS.slice(0, 4).map((action) => (
          <button
            key={action.id}
            onClick={() => onQuickAction(action.prompt)}
            className={`flex items-center gap-3 p-3 rounded-xl border ${action.borderColor} bg-gradient-to-br ${action.gradient} hover:scale-[1.02] transition-all duration-200 text-left group`}
          >
            <action.icon className={`w-4 h-4 ${action.iconColor} shrink-0`} />
            <span className="text-sm text-slate-200 group-hover:text-gray-900 transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function AIAssistantView() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      scrollToBottom()
    }
  }, [messages, isTyping, scrollToBottom])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100)
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isTyping) return

    const userMsg: ChatMessage = { role: 'user', content: content.trim(), id: generateId() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          context: 'B2B AI automation consulting, campaign strategy, sales objections, pricing',
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const data = await res.json()
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response || data.message || 'I apologize, I could not generate a response. Please try again.',
        id: generateId(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please check your connection and try again.",
        id: generateId(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }, [isTyping])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt)
  }

  const handleClear = () => {
    setMessages([])
    inputRef.current?.focus()
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-[calc(100vh-5rem)] rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
        {/* Sidebar — hidden on mobile, visible on md+ */}
        <div
          className={`hidden md:flex flex-col w-64 border-r border-gray-200 bg-gray-50/80 transition-all duration-300 ${
            sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="p-4 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-fuchsia-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-gray-900" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Quick Actions</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-100 text-gray-900 border-gray-200">Collapse sidebar</TooltipContent>
            </Tooltip>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isTyping}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border ${action.borderColor} bg-gradient-to-r ${action.gradient} hover:scale-[1.01] transition-all duration-200 text-left group disabled:opacity-50 disabled:pointer-events-none`}
                >
                  <action.icon className={`w-4 h-4 ${action.iconColor} shrink-0 group-hover:scale-110 transition-transform`} />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors truncate">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleClear}
              disabled={messages.length === 0}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear conversation
            </button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/60 shrink-0">
            <div className="flex items-center gap-2">
              {!sidebarOpen && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-gray-100 text-gray-900 border-gray-200">Open sidebar</TooltipContent>
                </Tooltip>
              )}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-sm font-semibold text-gray-900">AI Strategy Consultant</h1>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-[10px] px-2">
                <Sparkles className="w-3 h-3 mr-1" />
                GPT-Powered
              </Badge>
            </div>
          </div>

          {/* Mobile quick actions */}
          <div className="md:hidden flex gap-2 px-4 py-2 border-b border-gray-200 overflow-x-auto shrink-0">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isTyping}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${action.borderColor} bg-gradient-to-r ${action.gradient} shrink-0 text-xs text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50`}
              >
                <action.icon className={`w-3 h-3 ${action.iconColor}`} />
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages area */}
          <div className="flex-1 relative overflow-hidden">
            {messages.length === 0 && !isTyping ? (
              <WelcomeState onQuickAction={handleQuickAction} />
            ) : (
              <>
                <div
                  ref={scrollRef}
                  className="h-full overflow-y-auto"
                  onScroll={handleScroll}
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(51 65 85) transparent' }}
                >
                  <div className="px-4 py-4 space-y-1 min-h-full">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 px-3 py-2 ${
                          msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {/* Avatar */}
                        {msg.role === 'assistant' ? (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
                            <Bot className="w-4 h-4 text-gray-900" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-gray-900" />
                          </div>
                        )}

                        {/* Message bubble */}
                        <div
                          className={`max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-blue-600 to-fuchsia-600 text-gray-900 rounded-tr-md shadow-lg shadow-blue-500/10'
                              : 'bg-gray-100 border border-gray-200 rounded-tl-md'
                          }`}
                        >
                          {msg.role === 'user' ? (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isTyping && <TypingIndicator />}

                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </div>

                {/* Scroll to bottom button */}
                {showScrollBtn && (
                  <button
                    onClick={() => scrollToBottom()}
                    className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all shadow-lg"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-gray-200 bg-gray-50/80 p-4">
            <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about B2B growth strategy..."
                  disabled={isTyping}
                  rows={1}
                  className="min-h-[44px] max-h-[120px] resize-none bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-3 pr-12 text-sm focus-visible:ring-blue-500/30 focus-visible:border-blue-500/30 transition-all"
                  style={{ fieldSizing: 'content' } as React.CSSProperties}
                />
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="h-11 w-11 p-0 rounded-xl bg-gradient-to-br from-blue-600 to-fuchsia-600 hover:from-blue-500 hover:to-fuchsia-500 shadow-lg shadow-blue-500/10 shrink-0 disabled:opacity-40 disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
            <p className="text-[10px] text-gray-300 text-center mt-2">
              TITAN AI may produce inaccurate information. Verify critical details independently.
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

