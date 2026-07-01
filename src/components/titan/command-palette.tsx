'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut
} from '@/components/ui/command'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, Search, Globe, Users, Mail, Inbox, Calendar,
  Bot, Brain, Zap, Target, Settings, UsersRound, FileText,
  Workflow, Terminal, Moon, Sun, Building2, BarChart3,
  Lightbulb, ChevronRight, Sparkles
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
  { id: 'email-center', label: 'Email Center', icon: Mail, shortcut: 'E' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, shortcut: 'I' },
  { id: 'meetings', label: 'Meetings', icon: Calendar, shortcut: 'M' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, shortcut: '' },
  { id: 'industry-expert', label: 'Industry Expert', icon: Brain, shortcut: '' },
  { id: 'strategy-assistant', label: 'Strategy Assistant', icon: Lightbulb, shortcut: '' },
  { id: 'workflows', label: 'Workflow Builder', icon: Workflow, shortcut: 'W' },
  { id: 'command-center', label: 'AI Command Center', icon: Terminal, shortcut: 'K' },
  { id: 'ai-agents', label: 'AI Agents', icon: Sparkles, shortcut: '' },
  { id: 'lead-providers', label: 'Lead Providers', icon: Building2, shortcut: '' },
  { id: 'prompts', label: 'Prompt Library', icon: FileText, shortcut: '' },
  { id: 'team', label: 'Team Management', icon: UsersRound, shortcut: '' },
  { id: 'settings', label: 'Settings', icon: Settings, shortcut: ',' },
]

const ACTION_ITEMS = [
  { id: 'find-leads', label: 'Find New Leads', icon: Search, description: 'Discover businesses in your target market' },
  { id: 'run-audit', label: 'Run Website Audit', icon: Globe, description: 'Audit a website with 10-category analysis' },
  { id: 'gen-email', label: 'Generate AI Email', icon: Mail, description: 'Create personalized outreach email' },
  { id: 'industry-analysis', label: 'Industry Analysis', icon: BarChart3, description: 'Deep dive into any industry' },
  { id: 'full-pipeline', label: 'Run Full Pipeline', icon: Zap, description: 'Discover → Research → Audit → Qualify → Email' },
]

export function CommandPalette({ open, onOpenChange }: CommandCenterProps) {
  const setView = useAppStore(s => s.setView)
  const setPendingAiQuery = useAppStore(s => s.setPendingAiQuery)
  const { theme, setTheme } = useTheme()
  const [search, setSearch] = useState('')
  const [leads, setLeads] = useState<any[]>([])

  // Search leads when query changes
  useEffect(() => {
    if (!search || search.length < 2) { setLeads([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/leads?search=${encodeURIComponent(search)}&limit=5`)
        if (res.ok) {
          const data = await res.json()
          setLeads(data.leads || data || [])
        }
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleSelect = useCallback((id: string) => {
    // Check if it's a view
    const viewItem = VIEW_ITEMS.find(v => v.id === id)
    if (viewItem) {
      setView(viewItem.id as any)
      onOpenChange(false)
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
      }
      setPendingAiQuery(queries[id] || id)
      setView('command-center')
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
  }, [setView, setPendingAiQuery, setTheme, theme, onOpenChange])

  const filteredViews = VIEW_ITEMS.filter(v => v.label.toLowerCase().includes(search.toLowerCase()))
  const filteredActions = search ? ACTION_ITEMS.filter(a =>
    a.label.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  ) : ACTION_ITEMS

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search views, leads, actions... (type / for commands)"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        {filteredActions.length > 0 && (
          <CommandGroup heading="AI Actions">
            {filteredActions.map(action => (
              <CommandItem key={action.id} onSelect={() => handleSelect(action.id)} className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                  <action.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{action.description}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Lead Search Results */}
        {leads.length > 0 && (
          <CommandGroup heading="Leads">
            {leads.slice(0, 5).map((lead: any) => (
              <CommandItem key={`lead-${lead.id}`} onSelect={() => handleSelect(`lead-${lead.id}`)} className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{lead.business?.name || lead.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{lead.business?.industry || ''} · {lead.stage || ''}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Navigation */}
        {filteredViews.length > 0 && (
          <CommandGroup heading="Navigate">
            {filteredViews.map(view => (
              <CommandItem key={view.id} onSelect={() => handleSelect(view.id)} className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <view.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{view.label}</p>
                </div>
                {view.shortcut && (
                  <kbd className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded">{view.shortcut}</kbd>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Settings */}
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => handleSelect('toggle-theme')} className="flex items-center gap-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-gray-500" />}
            </div>
            <p className="text-sm font-medium">
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </p>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}