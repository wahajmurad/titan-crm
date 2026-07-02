'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut
} from '@/components/ui/command'
import { useAppStore, type AppView } from '@/lib/store'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, Search, Globe, Users, Mail, Inbox, Calendar,
  Bot, Brain, Zap, Target, Settings, UsersRound, FileText,
  Moon, Sun, Building2, BarChart3,
  Lightbulb, ChevronRight, Sparkles, Box, Pause,
  Send, Workflow, BookOpen, CalendarCheck, Command, BookMarked
} from 'lucide-react'

interface CommandCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const VIEW_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'D' },
  { id: 'discovery', label: 'Lead Discovery', icon: Search, shortcut: 'L' },
  { id: 'audit', label: 'Website Audit', icon: Globe, shortcut: 'A' },
  { id: 'leads', label: 'Leads', icon: Users, shortcut: '' },
  { id: 'campaigns', label: 'Campaigns', icon: Target, shortcut: 'C' },
  { id: 'workflow-builder', label: 'Workflow Builder', icon: Workflow, shortcut: 'W' },
  { id: 'email-center', label: 'Email Center', icon: Mail, shortcut: 'E' },
  { id: 'outreach', label: 'Outreach', icon: Send, shortcut: 'O' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, shortcut: 'I' },
  { id: 'meetings', label: 'Meetings', icon: Calendar, shortcut: 'M' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, shortcut: '' },
  { id: 'industry-expert', label: 'Industry Expert', icon: Brain, shortcut: '' },
  { id: 'strategy-assistant', label: 'Strategy Assistant', icon: Lightbulb, shortcut: '' },
  { id: 'personalization', label: 'AI Pipeline', icon: Sparkles, shortcut: 'P' },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen, shortcut: '' },
  { id: 'ai-proposals', label: 'AI Proposals', icon: FileText, shortcut: '' },
  { id: 'meeting-prep', label: 'Meeting Prep', icon: CalendarCheck, shortcut: '' },
  { id: 'ai-agents', label: 'AI Agents', icon: Bot, shortcut: '' },
  { id: 'command-center', label: 'Command Center', icon: Command, shortcut: '' },
  { id: 'lead-providers', label: 'Lead Providers', icon: Building2, shortcut: '' },
  { id: 'prompts', label: 'Prompt Library', icon: BookMarked, shortcut: '' },
  { id: 'team', label: 'Team Management', icon: UsersRound, shortcut: '' },
  { id: 'settings', label: 'Settings', icon: Settings, shortcut: ',' },
]

const ACTION_ITEMS = [
  { id: 'find-leads', label: 'Find New Leads', icon: Search, description: 'Discover businesses in your target market' },
  { id: 'run-audit', label: 'Run Website Audit', icon: Globe, description: 'Audit a website with 10-category analysis' },
  { id: 'gen-email', label: 'Generate AI Email', icon: Mail, description: 'Create personalized outreach email' },
  { id: 'industry-analysis', label: 'Industry Analysis', icon: BarChart3, description: 'Deep dive into any industry' },
  { id: 'full-pipeline', label: 'Run Full Pipeline', icon: Zap, description: 'Discover → Research → Audit → Qualify → Email' },
  { id: 'create-campaign', label: 'Create Campaign', icon: Target, description: 'Launch a new AI-assisted outreach campaign' },
  { id: 'open-inbox', label: 'Open Inbox', icon: Inbox, description: 'Check replies and manage conversations' },
  { id: 'pause-campaign', label: 'Pause Campaign', icon: Pause, description: 'Pause all active campaigns' },
  { id: 'show-analytics', label: 'Show Analytics', icon: BarChart3, description: 'View campaign performance metrics' },
  { id: 'ai-chat', label: 'Ask AI Assistant', icon: Bot, description: 'Get help from your AI assistant' },
]

const AI_SUGGESTIONS = [
  { id: 'sug-1', label: 'Find Law Firms in Manhattan', icon: Search, description: 'Discover potential clients' },
  { id: 'sug-2', label: 'Audit this website', icon: Globe, description: 'Run a 10-category website analysis' },
  { id: 'sug-3', label: 'Generate personalized email', icon: Mail, description: 'Create outreach email with AI' },
]

export function CommandPalette({ open, onOpenChange }: CommandCenterProps) {
  const setView = useAppStore(s => s.setView)
  const setPendingAiQuery = useAppStore(s => s.setPendingAiQuery)
  const { theme, setTheme } = useTheme()
  const [search, setSearch] = useState('')
  const [leads, setLeads] = useState<any[]>([])
  const [recentViews, setRecentViews] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('titan-recent-views')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  // Search leads when query changes
  useEffect(() => {
    if (!search || search.length < 2) return
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/leads?search=${encodeURIComponent(search)}&limit=5`)
        if (res.ok) {
          const data = await res.json()
          setLeads(data.leads || data || [])
        }
      } catch {}
    }, 300)
    return () => {
      clearTimeout(timer)
      setLeads([])
    }
  }, [search])

  const navigateTo = useCallback((viewId: string) => {
    setView(viewId as AppView)
    onOpenChange(false)
    setSearch('')
    // Save to recent
    try {
      const stored = localStorage.getItem('titan-recent-views')
      const recent: string[] = stored ? JSON.parse(stored) : []
      const updated = [viewId, ...recent.filter(v => v !== viewId)].slice(0, 5)
      localStorage.setItem('titan-recent-views', JSON.stringify(updated))
      setRecentViews(updated)
    } catch {}
  }, [setView, onOpenChange])

  const handleSelect = useCallback((id: string) => {
    // Check if it's a view
    const viewItem = VIEW_ITEMS.find(v => v.id === id)
    if (viewItem) {
      navigateTo(viewItem.id)
      return
    }

    // Check if it's an action
    const actionItem = ACTION_ITEMS.find(a => a.id === id)
    if (actionItem) {
      const queries: Record<string, string> = {
        'find-leads': 'Find 10 businesses in my target market',
        'run-audit': 'Run a website audit',
        'gen-email': 'Generate a personalized outreach email',
        'industry-analysis': 'Run industry analysis',
        'full-pipeline': 'Run the full pipeline: discover, research, audit, qualify, and prepare outreach',
        'create-campaign': 'Create a new AI-assisted outreach campaign',
        'open-inbox': 'Open my inbox and show recent conversations',
        'pause-campaign': 'Pause all active campaigns',
        'show-analytics': 'Show campaign performance analytics',
        'ai-chat': 'Get help from AI assistant',
      }
      setPendingAiQuery(queries[id] || id)
      setView('ai-assistant')
      onOpenChange(false)
      return
    }

    // Check AI suggestions
    const sugItem = AI_SUGGESTIONS.find(s => s.id === id)
    if (sugItem) {
      const sugQueries: Record<string, string> = {
        'sug-1': 'Find Law Firms in Manhattan',
        'sug-2': 'Run a 10-category website audit',
        'sug-3': 'Generate a personalized outreach email',
      }
      setPendingAiQuery(sugQueries[id] || sugItem.label)
      setView('ai-assistant')
      onOpenChange(false)
      return
    }

    // Theme toggle
    if (id === 'toggle-theme') {
      setTheme(theme === 'dark' ? 'light' : 'dark')
      onOpenChange(false)
      return
    }

    // Lead navigation
    if (id.startsWith('lead-')) {
      const leadId = id.replace('lead-', '')
      setView('lead-detail', leadId)
      onOpenChange(false)
      return
    }

    onOpenChange(false)
  }, [setView, setPendingAiQuery, setTheme, theme, onOpenChange, navigateTo])

  const filteredViews = VIEW_ITEMS.filter(v => v.label.toLowerCase().includes(search.toLowerCase()))
  const filteredActions = search ? ACTION_ITEMS.filter(a =>
    a.label.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  ) : ACTION_ITEMS

  const recentItems = recentViews
    .slice(0, 3)
    .map(viewId => VIEW_ITEMS.find(v => v.id === viewId))
    .filter(Boolean)

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => { onOpenChange(v); if (!v) setSearch('') }}
      className="[&>[data-slot=dialog-content]]:rounded-[22px] [&>[data-slot=dialog-content]]:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] [&>[data-slot=dialog-content]]:border-border/50 [&>[data-slot=dialog-content]]:backdrop-blur-xl"
    >
      <CommandInput
        placeholder="Search or type a command..."
        value={search}
        onValueChange={setSearch}
        className="[&_[data-slot=command-input]]:rounded-[14px] [&_[data-slot=command-input-wrapper]]:h-12"
      />
      <CommandList className="max-h-[380px]">
        <CommandEmpty>
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No results found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
          </div>
        </CommandEmpty>

        {/* AI Suggestions — only when search is empty */}
        {!search && (
          <>
            <CommandGroup heading="AI Suggestions" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-muted-foreground">
              {AI_SUGGESTIONS.map(sug => (
                <CommandItem
                  key={sug.id}
                  onSelect={() => handleSelect(sug.id)}
                  className="flex items-center gap-3 py-2.5 rounded-[10px] transition-all duration-150 ease-out data-[selected=true]:bg-accent/80 data-[selected=true]:shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center flex-shrink-0">
                    <sug.icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{sug.label}</p>
                    <p className="text-[11px] text-muted-foreground/70 truncate">{sug.description}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator className="my-1" />
          </>
        )}

        {/* Recent — only when search is empty and we have recent items */}
        {!search && recentItems.length > 0 && (
          <>
            <CommandGroup heading="Recent" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-muted-foreground">
              {recentItems.map(item => item && (
                <CommandItem
                  key={`recent-${item.id}`}
                  onSelect={() => navigateTo(item.id)}
                  className="flex items-center gap-3 py-2.5 rounded-[10px] transition-all duration-150 ease-out data-[selected=true]:bg-accent/80 data-[selected=true]:shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  {item.shortcut && (
                    <kbd className="ml-auto text-[10px] font-medium text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded-[5px]">{item.shortcut}</kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator className="my-1" />
          </>
        )}

        {/* AI Actions */}
        {filteredActions.length > 0 && (
          <CommandGroup heading="AI Actions" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-muted-foreground">
            {filteredActions.map(action => (
              <CommandItem
                key={action.id}
                onSelect={() => handleSelect(action.id)}
                className="flex items-center gap-3 py-2.5 rounded-[10px] transition-all duration-150 ease-out data-[selected=true]:bg-accent/80 data-[selected=true]:shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                  <action.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground/70 truncate">{action.description}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Lead Search Results */}
        {leads.length > 0 && (
          <>
            <CommandSeparator className="my-1" />
            <CommandGroup heading="Leads" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-muted-foreground">
              {leads.slice(0, 5).map((lead: any) => (
                <CommandItem
                  key={`lead-${lead.id}`}
                  onSelect={() => handleSelect(`lead-${lead.id}`)}
                  className="flex items-center gap-3 py-2.5 rounded-[10px] transition-all duration-150 ease-out data-[selected=true]:bg-accent/80 data-[selected=true]:shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{lead.business?.name || lead.name || 'Unknown'}</p>
                    <p className="text-[11px] text-muted-foreground/70">{lead.business?.industry || ''} · {lead.stage || ''}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Navigation */}
        {filteredViews.length > 0 && (
          <>
            <CommandSeparator className="my-1" />
            <CommandGroup heading="Navigate" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-muted-foreground">
              {filteredViews.map(view => (
                <CommandItem
                  key={view.id}
                  onSelect={() => navigateTo(view.id)}
                  className="flex items-center gap-3 py-2.5 rounded-[10px] transition-all duration-150 ease-out data-[selected=true]:bg-accent/80 data-[selected=true]:shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <view.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{view.label}</p>
                  </div>
                  {view.shortcut && (
                    <kbd className="ml-auto text-[10px] font-medium text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded-[5px]">{view.shortcut}</kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* Settings */}
        <CommandGroup heading="Settings" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandItem
            onSelect={() => handleSelect('toggle-theme')}
            className="flex items-center gap-3 py-2.5 rounded-[10px] transition-all duration-150 ease-out data-[selected=true]:bg-accent/80 data-[selected=true]:shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-gray-500" />}
            </div>
            <p className="text-sm font-medium">
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </p>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Bottom Actions Bar */}
      <CommandSeparator />
      <div className="p-2 flex items-center justify-between text-[11px] text-muted-foreground/50">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          <span>AI-Powered</span>
        </div>
        <div className="flex items-center gap-3">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>esc Close</span>
        </div>
      </div>
    </CommandDialog>
  )
}