'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Globe,
  Mail,
  Target,
  FileText,
  Microscope,
  Workflow,
  Search,
  Sparkles,
  Clock,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ──────────── Types ──────────── */

interface KnowledgeItem {
  id: string
  type: string
  title: string
  company: string
  industry: string
  score: number
  createdAt: string
  summary: string
}

/* ──────────── Constants ──────────── */

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: LucideIcon; label: string }> = {
  audit: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Globe, label: 'Audit' },
  email: { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10', icon: Mail, label: 'Email' },
  campaign: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: Target, label: 'Campaign' },
  proposal: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: FileText, label: 'Proposal' },
  research: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10', icon: Microscope, label: 'Research' },
  workflow: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', icon: Workflow, label: 'Workflow' },
}

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'audit', label: 'Audits' },
  { key: 'email', label: 'Emails' },
  { key: 'campaign', label: 'Campaigns' },
  { key: 'proposal', label: 'Proposals' },
  { key: 'research', label: 'Research' },
  { key: 'workflow', label: 'Workflows' },
]

/* ──────────── Animation Variants ──────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

/* ──────────── Helpers ──────────── */

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 70) return 'text-blue-600 dark:text-blue-400'
  if (score >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

function getScoreRingStroke(score: number): string {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#2563eb'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function getScoreRingBg(score: number): string {
  if (score >= 85) return 'rgba(16,185,129,0.12)'
  if (score >= 70) return 'rgba(37,99,235,0.12)'
  if (score >= 50) return 'rgba(245,158,11,0.12)'
  return 'rgba(239,68,68,0.12)'
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center w-11 h-11 shrink-0">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44" fill="none">
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke={getScoreRingBg(score)}
          strokeWidth="3.5"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke={getScoreRingStroke(score)}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className={cn('absolute text-[11px] font-bold tabular-nums', getScoreColor(score))}>
        {score}
      </span>
    </div>
  )
}

/* ──────────── Skeleton Loader ──────────── */

function SkeletonCard() {
  return (
    <Card className="glass-card border-gray-200/60 dark:border-gray-700/40 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800" />
            <Skeleton className="h-5 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
          <Skeleton className="h-11 w-11 rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28 bg-gray-100 dark:bg-gray-800" />
          <Skeleton className="h-5 w-full bg-gray-100 dark:bg-gray-800" />
          <Skeleton className="h-5 w-3/4 bg-gray-100 dark:bg-gray-800" />
        </div>
        <Skeleton className="h-3.5 w-full bg-gray-100 dark:bg-gray-800" />
        <Skeleton className="h-3.5 w-2/3 bg-gray-100 dark:bg-gray-800" />
        <div className="flex items-center gap-1.5 pt-1">
          <Skeleton className="h-3 w-3 rounded bg-gray-100 dark:bg-gray-800" />
          <Skeleton className="h-3 w-20 bg-gray-100 dark:bg-gray-800" />
        </div>
      </CardContent>
    </Card>
  )
}

/* ──────────── Main Component ──────────── */

export function KnowledgeBaseView() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  /* ── Fetch on mount ── */
  useEffect(() => {
    async function fetchKnowledge() {
      try {
        const res = await fetch('/api/ai/knowledge')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (data.success) setItems(data.items)
      } catch {
        // Silently fail — show empty state
      } finally {
        setLoading(false)
      }
    }
    fetchKnowledge()
  }, [])

  /* ── Local filtering ── */
  const filtered = items.filter((item) => {
    const matchesType = activeTab === 'all' || item.type === activeTab
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.company.toLowerCase().includes(search.toLowerCase()) ||
      item.industry.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h1 className="text-[17px] font-semibold tracking-tight">AI Knowledge Base</h1>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Search and reuse all AI-generated intelligence
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            placeholder="Search knowledge base…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-[13px] bg-white dark:bg-gray-900/60 border-gray-200/70 dark:border-gray-700/50 rounded-xl"
          />
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'h-8 px-3.5 text-[12px] font-medium rounded-full transition-all duration-200',
              activeTab === tab.key
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* ── Stats Bar ── */}
      {!loading && (
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Last updated 2 hours ago
          </span>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div key={i} variants={itemVariants}>
              <SkeletonCard />
            </motion.div>
          ))}
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card border-gray-200/60 dark:border-gray-700/40 rounded-[18px]"
        >
          <div className="flex flex-col items-center justify-center py-16">
            <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No matching items</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try a different search or filter</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={`${activeTab}-${search}`}
        >
          {filtered.map((item) => {
            const config = TYPE_CONFIG[item.type]
            if (!config) return null
            const Icon = config.icon

            return (
              <motion.div key={item.id} variants={itemVariants}>
                <Card
                  className="glass-card hover-lift border-gray-200/60 dark:border-gray-700/40 overflow-hidden cursor-pointer group"
                  onClick={() => alert(`Opening: ${item.title}`)}
                >
                  <CardContent className="p-4 space-y-2.5">
                    {/* Top row: type badge + score */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex items-center justify-center w-8 h-8 rounded-lg',
                            config.bg,
                          )}
                        >
                          <Icon className={cn('w-4 h-4', config.color)} />
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[11px] font-medium px-2 py-0.5 rounded-full border-0',
                            config.bg,
                            config.color,
                          )}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <ScoreCircle score={item.score} />
                    </div>

                    {/* Company + industry */}
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground truncate">
                        {item.company}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium px-1.5 py-0 rounded-full border-gray-200/70 dark:border-gray-700/50 text-muted-foreground shrink-0"
                      >
                        {item.industry}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="text-[14px] font-semibold leading-snug text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {item.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                      {item.summary}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[11px] text-muted-foreground/60">
                        Created {item.createdAt}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}