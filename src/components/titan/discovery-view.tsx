'use client'

import { useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  MapPin,
  Globe,
  Phone,
  Star,
  ExternalLink,
  Loader2,
  Sparkles,
  Plus,
  Check,
  AlertTriangle,
  Target,
  TrendingUp,
  MessageSquare,
  Radar,
  X,
  Shield,
  Cpu,
  Briefcase,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ──────────── Types ──────────── */

interface DiscoveredLead {
  name: string
  address: string
  phone: string
  website: string
  email: string
  mapsUrl: string
  rating: number
  placeId: string
  source: string
  existing?: boolean
}

interface AuditResult {
  overallScore: number
  scores: Record<string, number>
  details: Record<string, string>
  executiveSummary: string
  problemsFound: string[]
  opportunities: string[]
  recommendations: string[]
  talkingPoints: string[]
  pitchStrategy: string
}

/* ──────────── Helpers ──────────── */

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function scoreBg(score: number): string {
  if (score >= 70) return 'bg-emerald-50 border-emerald-200'
  if (score >= 40) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function progressBarColor(score: number): string {
  if (score >= 70) return '[&>div]:bg-emerald-500'
  if (score >= 40) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-red-500'
}

function renderStars(rating: number) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.3
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < full
              ? 'text-amber-400 fill-amber-400'
              : i === full && hasHalf
                ? 'text-amber-400 fill-amber-200'
                : 'text-gray-300',
          )}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating > 0 ? rating.toFixed(1) : '—'}</span>
    </div>
  )
}

function parseNumberedList(text: string): string[] {
  if (!text) return []
  return text
    .split('\n')
    .map((line) => line.replace(/^\d+[\.\)\-]\s*/, '').trim())
    .filter((line) => line.length > 0)
}

/* ──────────── Main Component ──────────── */

export function DiscoveryView() {
  const { setView } = useAppStore()

  // Search form
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')

  // Search state
  const [searching, setSearching] = useState(false)
  const [leads, setLeads] = useState<DiscoveredLead[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [newCount, setNewCount] = useState(0)
  const [existingCount, setExistingCount] = useState(0)
  const [searchError, setSearchError] = useState('')

  // Track which leads have been added
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  // Audit modal
  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [auditLead, setAuditLead] = useState<DiscoveredLead | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [auditError, setAuditError] = useState('')

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !location.trim()) return

    setSearching(true)
    setSearchError('')
    setLeads([])
    setTotalResults(0)
    setNewCount(0)
    setExistingCount(0)

    try {
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ query: query.trim(), location: location.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSearchError(data.error || 'Search failed')
        return
      }

      setLeads(data.leads || [])
      setTotalResults(data.total || 0)
      setNewCount(data.newCount || 0)
      setExistingCount(data.existingCount || 0)
    } catch {
      setSearchError('Network error. Please try again.')
    } finally {
      setSearching(false)
    }
  }, [query, location])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !searching) handleSearch()
    },
    [handleSearch, searching],
  )

  const handleAddLead = useCallback(async (lead: DiscoveredLead) => {
    try {
      // Parse city/country from address
      const addressParts = lead.address.split(',').map((s) => s.trim())
      const city = addressParts[addressParts.length - 2] || ''
      const country = addressParts[addressParts.length - 1] || ''

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          business: {
            name: lead.name,
            website: lead.website || null,
            phone: lead.phone || null,
            email: lead.email || null,
            city: city || null,
            country: country || null,
            source: lead.source,
          },
        }),
      })

      if (res.ok) {
        setAddedIds((prev) => new Set(prev).add(lead.placeId || lead.name))
      }
    } catch {
      // silently fail
    }
  }, [])

  const handleAudit = useCallback(async (lead: DiscoveredLead) => {
    if (!lead.website) {
      setAuditError('No website found for this business. Cannot run audit without a website URL.')
      setAuditLead(lead)
      setAuditResult(null)
      setAuditModalOpen(true)
      return
    }

    setAuditLead(lead)
    setAuditLoading(true)
    setAuditResult(null)
    setAuditError('')
    setAuditModalOpen(true)

    try {
      // First, save as a lead to get a businessId
      let businessId = ''
      const addressParts = lead.address.split(',').map((s) => s.trim())
      const city = addressParts[addressParts.length - 2] || ''
      const country = addressParts[addressParts.length - 1] || ''

      const leadRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          business: {
            name: lead.name,
            website: lead.website,
            phone: lead.phone || null,
            city: city || null,
            country: country || null,
            source: lead.source,
          },
        }),
      })

      if (leadRes.ok) {
        const leadData = await leadRes.json()
        businessId = leadData.lead?.businessId || ''
        // Mark as added
        setAddedIds((prev) => new Set(prev).add(lead.placeId || lead.name))
      }

      if (!businessId) {
        setAuditError('Failed to create business record. Cannot run audit.')
        setAuditLoading(false)
        return
      }

      // Now run audit
      const auditRes = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ url: lead.website, businessId }),
      })

      const auditData = await auditRes.json()

      if (!auditRes.ok) {
        setAuditError(auditData.error || 'Audit failed')
        return
      }

      setAuditResult({
        overallScore: auditData.overallScore || 0,
        scores: auditData.scores || {},
        details: auditData.details || {},
        executiveSummary: auditData.executiveSummary || '',
        problemsFound: auditData.problemsFound || [],
        opportunities: auditData.opportunities || [],
        recommendations: auditData.recommendations || [],
        talkingPoints: auditData.talkingPoints || [],
        pitchStrategy: auditData.pitchStrategy || '',
      })
    } catch {
      setAuditError('Network error during audit. Please try again.')
    } finally {
      setAuditLoading(false)
    }
  }, [])

  const isAdded = (lead: DiscoveredLead) => addedIds.has(lead.placeId || lead.name) || !!lead.existing

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200/60">
            <Radar className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Lead Discovery</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1 ml-1">
          Search Google Maps for real businesses and add them to your pipeline
        </p>
      </div>

      {/* ── Search Form ── */}
      <Card className="glass-card border-gray-200/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder='What to search for (e.g. "digital marketing agency")'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 h-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-400"
                  disabled={searching}
                />
              </div>
            </div>
            <div className="sm:w-64">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder='Location (e.g. "New York")'
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 h-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-400"
                  disabled={searching}
                />
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching || !query.trim() || !location.trim()}
              className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
          {searchError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{searchError}</span>
              <button onClick={() => setSearchError('')} className="ml-auto shrink-0">
                <X className="w-4 h-4 text-red-400 hover:text-red-600" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Loading State ── */}
      {searching && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-2 rounded-full border-2 border-blue-300 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radar className="w-7 h-7 text-blue-500 animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-medium">Searching for businesses...</p>
                <p className="text-sm text-gray-500 mt-1">
                  Finding &quot;{query}&quot; in {location}
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-48 rounded-lg bg-gray-100" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Results ── */}
      {leads.length > 0 && !searching && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-3 px-1">
            <span className="text-sm font-medium text-gray-900">{totalResults} businesses found</span>
            <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 text-xs font-medium">
              {newCount} new
            </Badge>
            <Badge variant="outline" className="bg-gray-100 border-gray-200 text-gray-600 text-xs font-medium">
              {existingCount} already in CRM
            </Badge>
          </div>

          {/* Desktop Table */}
          <Card className="bg-white border-gray-200 shadow-sm hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3">Business</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-3">Phone</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-3">Website</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-3">Rating</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-3">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead, idx) => (
                    <TableRow
                      key={lead.placeId || idx}
                      className={cn(
                        'border-b border-gray-100 hover:bg-gray-50/50 transition-colors',
                        idx % 2 === 1 && 'bg-gray-50/30',
                      )}
                    >
                      <TableCell className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{lead.name}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{lead.address || 'No address'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-xs text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{lead.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 max-w-[180px]"
                          >
                            <Globe className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-3">{renderStars(lead.rating)}</TableCell>
                      <TableCell className="px-3 py-3">
                        {isAdded(lead) ? (
                          <Badge variant="outline" className="bg-gray-100 border-gray-200 text-gray-600 text-[10px] font-medium">
                            <Check className="w-2.5 h-2.5 mr-1" />
                            In CRM
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 text-[10px] font-medium">
                            New
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAudit(lead)}
                            disabled={!lead.website}
                            className="h-8 px-3 text-xs border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={!lead.website ? 'No website available for audit' : 'Run AI website audit'}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Audit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddLead(lead)}
                            disabled={isAdded(lead)}
                            className={cn(
                              'h-8 px-3 text-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                              isAdded(lead)
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default'
                                : 'border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300',
                            )}
                          >
                            {isAdded(lead) ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {leads.map((lead, idx) => (
              <Card key={lead.placeId || idx} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{lead.address || 'No address'}</span>
                      </div>
                    </div>
                    {isAdded(lead) ? (
                      <Badge variant="outline" className="bg-gray-100 border-gray-200 text-gray-600 text-[10px] font-medium shrink-0">
                        <Check className="w-2.5 h-2.5 mr-1" />
                        In CRM
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 text-[10px] font-medium shrink-0">
                        New
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 text-xs">
                    {lead.phone && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <a href={`tel:${lead.phone}`} className="hover:text-blue-600 transition-colors">{lead.phone}</a>
                      </div>
                    )}
                    {lead.website && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Globe className="w-3 h-3 text-gray-400" />
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors truncate">
                          {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          <ExternalLink className="w-2.5 h-2.5 inline ml-1 opacity-50" />
                        </a>
                      </div>
                    )}
                    {lead.rating > 0 && <div className="pt-0.5">{renderStars(lead.rating)}</div>}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAudit(lead)}
                      disabled={!lead.website}
                      className="flex-1 h-8 text-xs border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 disabled:opacity-40"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Audit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddLead(lead)}
                      disabled={isAdded(lead)}
                      className={cn(
                        'flex-1 h-8 text-xs transition-colors disabled:opacity-60',
                        isAdded(lead)
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300',
                      )}
                    >
                      {isAdded(lead) ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State (after search, no results) ── */}
      {!searching && leads.length === 0 && searchError === '' && totalResults === 0 && (
        <Card className="bg-white border-gray-200 border-dashed shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <Radar className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-900 font-medium">Search for businesses on Google Maps</p>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              Enter what type of business you&apos;re looking for and a location to discover real leads.
              Run AI-powered audits to find opportunities and generate talking points.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Search className="w-4 h-4 text-blue-500" />
                Google Maps
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Sparkles className="w-4 h-4 text-blue-500" />
                AI Audits
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Target className="w-4 h-4 text-blue-500" />
                Real Businesses
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── No Results State ── */}
      {!searching && searchError === '' && leads.length === 0 && totalResults > 0 && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-900 font-medium">No businesses found</p>
            <p className="text-sm text-gray-500 mt-1">
              Try different keywords or a broader location
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Audit Modal ── */}
      <Dialog open={auditModalOpen} onOpenChange={(open) => { if (!open) { setAuditModalOpen(false); setAuditResult(null); setAuditError('') } else { setAuditModalOpen(true) } }}>
        <DialogContent className="bg-white border-gray-200 shadow-xl sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {auditLead && (
            <>
              {/* Modal header with business info */}
              <div className="p-6 pb-0">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    AI Website Audit
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-1">
                    {auditLead.name}
                    {auditLead.website && (
                      <a href={auditLead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                        ({auditLead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')})
                      </a>
                    )}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Loading state */}
                {auditLoading && (
                  <div className="p-8 space-y-5">
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Bot className="w-6 h-6 text-blue-500 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-900 font-medium">Analyzing website...</p>
                        <p className="text-sm text-gray-500 mt-1">AI is auditing design, technical, business & automation</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-3/4 bg-gray-100" />
                      <Skeleton className="h-4 w-1/2 bg-gray-100" />
                      <Skeleton className="h-20 w-full bg-gray-100 rounded-lg" />
                      <Skeleton className="h-4 w-2/3 bg-gray-100" />
                      <Skeleton className="h-20 w-full bg-gray-100 rounded-lg" />
                    </div>
                  </div>
                )}

                {/* Error state */}
                {!auditLoading && auditError && (
                  <div className="p-6">
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Audit Failed</p>
                        <p className="text-sm text-red-600 mt-1">{auditError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit results */}
                {!auditLoading && auditResult && (
                  <div className="p-6 pt-2 space-y-5">
                    {/* Overall Score */}
                    <div className="flex items-center gap-5">
                      <div className={cn('w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0', scoreBg(auditResult.overallScore))}>
                        <span className={cn('text-2xl font-bold leading-none', scoreColor(auditResult.overallScore))}>
                          {auditResult.overallScore}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-0.5">/ 100</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Overall Website Score</p>
                        {auditResult.executiveSummary && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-3">{auditResult.executiveSummary}</p>
                        )}
                      </div>
                    </div>

                    {/* Category Scores Grid */}
                    {auditResult.scores && Object.keys(auditResult.scores).length > 0 && (
                      <div className="grid grid-cols-2 gap-2.5">
                        {Object.entries(auditResult.scores).map(([key, score]) => {
                          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
                          return (
                            <div key={key} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-700">{label}</span>
                                <span className={cn('text-sm font-bold', scoreColor(score))}>{score}</span>
                              </div>
                              <Progress value={score} className={cn('h-1.5 bg-gray-200/60', progressBarColor(score))} />
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Problems */}
                    {auditResult.problemsFound && auditResult.problemsFound.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Problems Found ({auditResult.problemsFound.length})
                        </h3>
                        <div className="space-y-1.5">
                          {auditResult.problemsFound.map((item, i) => (
                            <div key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                              <span className="text-amber-500 font-semibold shrink-0">{i + 1}.</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Opportunities */}
                    {auditResult.opportunities && auditResult.opportunities.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          Opportunities
                        </h3>
                        <div className="space-y-1.5">
                          {auditResult.opportunities.map((item, i) => (
                            <div key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                              <span className="text-emerald-500 font-semibold shrink-0">{i + 1}.</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* How to Pitch */}
                    {auditResult.talkingPoints && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          How to Pitch
                        </h3>
                        <div className="space-y-1.5">
                          {Array.isArray(auditResult.talkingPoints) ? auditResult.talkingPoints : parseNumberedList(auditResult.talkingPoints || '').map((item, i) => (
                            <div key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                              <span className="text-blue-500 font-semibold shrink-0">{i + 1}.</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View in CRM button */}
                    <div className="pt-2 pb-1">
                      <Button
                        onClick={() => {
                          setAuditModalOpen(false)
                          setAuditResult(null)
                          setView('leads')
                        }}
                        className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                      >
                        View in Leads Pipeline
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}