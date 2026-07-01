'use client'

import { useEffect, useState, useCallback } from 'react'
import { Command } from 'cmdk'
import { useAppStore } from '@/lib/store'
import {
  Search, LayoutDashboard, Users, Globe2, Target, Mail, Inbox,
  Brain, GraduationCap, Lightbulb, BookOpen, Calendar, Plug,
  UserCog, Settings, Sparkles, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const NAV_ITEMS = [
  { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard, category: 'Navigation' },
  { label: 'Lead Discovery', view: 'discovery', icon: Search, category: 'Navigation' },
  { label: 'Website Audit', view: 'audit', icon: Globe2, category: 'Navigation' },
  { label: 'Leads', view: 'leads', icon: Users, category: 'Navigation' },
  { label: 'Campaigns', view: 'campaigns', icon: Target, category: 'Navigation' },
  { label: 'Email Center', view: 'email-center', icon: Mail, category: 'Navigation' },
  { label: 'Inbox', view: 'inbox', icon: Inbox, category: 'Navigation' },
  { label: 'AI Assistant', view: 'ai-assistant', icon: Brain, category: 'Navigation' },
  { label: 'Industry Expert', view: 'industry-expert', icon: GraduationCap, category: 'Navigation' },
  { label: 'Strategy AI', view: 'strategy-assistant', icon: Lightbulb, category: 'Navigation' },
  { label: 'Prompt Library', view: 'prompts', icon: BookOpen, category: 'Navigation' },
  { label: 'Meetings', view: 'meetings', icon: Calendar, category: 'Navigation' },
  { label: 'Lead Providers', view: 'lead-providers', icon: Plug, category: 'Navigation' },
  { label: 'Team', view: 'team', icon: UserCog, category: 'Navigation' },
  { label: 'Settings', view: 'settings', icon: Settings, category: 'Navigation' },
]

const ACTION_ITEMS = [
  { label: 'Find New Leads', view: 'discovery', icon: Search, category: 'Quick Actions' },
  { label: 'Run Website Audit', view: 'audit', icon: Globe2, category: 'Quick Actions' },
  { label: 'Create Campaign', view: 'campaigns', icon: Target, category: 'Quick Actions' },
  { label: 'Generate AI Email', view: 'email-center', icon: Mail, category: 'Quick Actions' },
  { label: 'Open AI Assistant', view: 'ai-assistant', icon: Brain, category: 'Quick Actions' },
  { label: 'Check Inbox', view: 'inbox', icon: Inbox, category: 'Quick Actions' },
]

const AI_COMMANDS = [
  { label: 'Find law firms in Manhattan', view: 'ai-assistant', icon: Sparkles, category: 'Ask AI', query: 'Find law firms in Manhattan' },
  { label: 'Analyze my campaign performance', view: 'strategy-assistant', icon: Lightbulb, category: 'Ask AI', query: 'Analyze campaign performance' },
  { label: 'Generate outreach emails', view: 'email-center', icon: Mail, category: 'Ask AI', query: 'Generate outreach emails' },
  { label: 'Audit a competitor website', view: 'audit', icon: Globe2, category: 'Ask AI', query: 'Audit competitor website' },
]

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { setView } = useAppStore()

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const handleSelect = useCallback((view: string) => {
    setView(view as Parameters<typeof setView>[0])
    onOpenChange(false)
  }, [setView, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Command Box */}
      <div className="relative mx-auto max-w-lg mt-[15vh]">
        <Command className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center border-b border-gray-100 px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-gray-400"
              autoFocus
            />
            <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-400">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-400">
              No results found.
            </Command.Empty>

            {/* Navigation */}
            <Command.Group heading="Go to..." className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider">
              {NAV_ITEMS.map(item => (
                <Command.Item
                  key={item.label}
                  value={item.label}
                  onSelect={() => handleSelect(item.view)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg mx-0.5 text-sm cursor-pointer',
                    'data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-900',
                    'text-gray-700 transition-colors'
                  )}
                >
                  <item.icon className="h-4 w-4 text-gray-400 data-[selected=true]:text-blue-500" />
                  <span className="flex-1">{item.label}</span>
                  <ArrowRight className="h-3 w-3 text-gray-300 data-[selected=true]:text-blue-400" />
                </Command.Item>
              ))}
            </Command.Group>

            {/* Quick Actions */}
            <Command.Group heading="Quick actions..." className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider">
              {ACTION_ITEMS.map(item => (
                <Command.Item
                  key={item.label}
                  value={item.label}
                  onSelect={() => handleSelect(item.view)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg mx-0.5 text-sm cursor-pointer',
                    'data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-900',
                    'text-gray-700 transition-colors'
                  )}
                >
                  <item.icon className="h-4 w-4 text-gray-400 data-[selected=true]:text-blue-500" />
                  <span className="flex-1">{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* AI Commands */}
            <Command.Group heading="Ask AI..." className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider">
              {AI_COMMANDS.map(item => (
                <Command.Item
                  key={item.label}
                  value={item.label}
                  onSelect={() => handleSelect(item.view)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg mx-0.5 text-sm cursor-pointer',
                    'data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-900',
                    'text-gray-700 transition-colors'
                  )}
                >
                  <item.icon className="h-4 w-4 text-gray-400 data-[selected=true]:text-blue-500" />
                  <span className="flex-1">{item.label}</span>
                  <Sparkles className="h-3 w-3 text-blue-400" />
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              <span className="font-semibold text-gray-500">TITAN</span> AI
            </span>
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span><kbd className="font-mono bg-gray-100 rounded px-1 py-0.5">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono bg-gray-100 rounded px-1 py-0.5">↵</kbd> select</span>
              <span><kbd className="font-mono bg-gray-100 rounded px-1 py-0.5">esc</kbd> close</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  )
}