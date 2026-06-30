'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Globe,
  MapPin,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Loader2,
  Radar,
  CheckCircle2,
  Circle,
  Target,
  Zap,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ──────────── types ──────────── */

interface DiscoveredCompany {
  id?: string
  name: string
  website: string
  location: string
  industry: string
  status: 'new' | 'existing'
  leadId?: string
}

interface DiscoveryResult {
  companies: DiscoveredCompany[]
  discoveredCount: number
  newLeadsAdded: number
}

interface Campaign {
  id: string
  name: string
  status: string
}

/* ──────────── constants ──────────── */

const INDUSTRIES = [
  'SaaS / Software',
  'Digital Marketing Agency',
  'Law Firm',
  'Accounting / Finance',
  'Real Estate',
  'Healthcare / Medical',
  'E-commerce',
  'Consulting',
  'Manufacturing',
  'Construction',
  'Education / EdTech',
  'Hospitality / Travel',
  'Logistics / Supply Chain',
  'Non-Profit',
  'Insurance',
  'Automotive',
]

const BUSINESS_SIZES = [
  { value: '1-10', label: '1 – 10 employees', icon: Users },
  { value: '11-50', label: '11 – 50 employees', icon: Users },
  { value: '51-200', label: '51 – 200 employees', icon: Building2 },
  { value: '201-500', label: '201 – 500 employees', icon: Building2 },
  { value: '500+', label: '500+ employees', icon: Building2 },
]

/* ──────────── main component ──────────── */

export function DiscoveryView() {
  const { setView } = useAppStore()

  // Form state
  const [industry, setIndustry] = useState('')
  const [customIndustry, setCustomIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [businessSize, setBusinessSize] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [customCampaign, setCustomCampaign] = useState('')

  // Data state
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsLoaded, setCampaignsLoaded] = useState(false)

  // Discovery state
  const [discovering, setDiscovering] = useState(false)
  const [discoveryProgress, setDiscoveryProgress] = useState(0)
  const [results, setResults] = useState<DiscoveryResult | null>(null)

  // Fetch campaigns on mount
  useEffect(() => {
    let cancelled = false
    fetch('/api/campaigns', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!cancelled) {
          setCampaigns(Array.isArray(d) ? d : d.campaigns || [])
          setCampaignsLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setCampaignsLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const resetDiscovery = useCallback(() => {
    setResults(null)
    setDiscovering(false)
    setDiscoveryProgress(0)
  }, [])

  const handleDiscover = useCallback(async () => {
    if (!industry && !customIndustry) return
    if (!country) return

    setDiscovering(true)
    setDiscoveryProgress(0)
    setResults(null)

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setDiscoveryProgress((p) => {
        if (p >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return p + Math.random() * 15
      })
    }, 600)

    try {
      const payload = {
        industry: customIndustry || industry,
        country,
        city: city || undefined,
        businessSize: businessSize || undefined,
        campaignName: customCampaign || campaignName || undefined,
      }

      const res = await fetch('/api/ai/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })

      clearInterval(progressInterval)
      setDiscoveryProgress(100)

      if (res.ok) {
        const data = await res.json()
        setResults({
          companies: data.companies || [],
          discoveredCount: data.discoveredCount ?? data.companies?.length ?? 0,
          newLeadsAdded: data.newLeadsAdded ?? 0,
        })
      } else {
        const err = await res.json().catch(() => ({}))
        setResults({
          companies: [],
          discoveredCount: 0,
          newLeadsAdded: 0,
        })
      }
    } catch {
      clearInterval(progressInterval)
      setResults({ companies: [], discoveredCount: 0, newLeadsAdded: 0 })
    } finally {
      setDiscovering(false)
    }
  }, [industry, customIndustry, country, city, businessSize, campaignName, customCampaign])

  const hasFormFilled = (industry || customIndustry) && country

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20">
              <Radar className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-xl font-semibold text-white">AI Lead Discovery</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-1">
            Discover high-value prospects using AI-powered search across industries and regions
          </p>
        </div>
      </div>

      {/* ── Discovery Form Card ── */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        {/* Gradient top accent */}
        <div className="h-1 bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-500" />
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Search Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Industry */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Industry *</Label>
              <div className="space-y-2">
                <Select
                  value={customIndustry ? '__custom__' : industry}
                  onValueChange={(v) => {
                    if (v === '__custom__') {
                      setIndustry('')
                      setCustomIndustry('')
                    } else {
                      setIndustry(v)
                      setCustomIndustry('')
                    }
                  }}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200 h-10">
                    <SelectValue placeholder="Select industry..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind} className="text-slate-200 focus:bg-slate-700 focus:text-white">
                        {ind}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-cyan-400 focus:bg-slate-700">
                      ✏️ Type custom industry...
                    </SelectItem>
                  </SelectContent>
                </Select>
                {customIndustry !== undefined && industry === '' && (
                  <Input
                    placeholder="Enter custom industry..."
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-slate-200 h-9 text-sm"
                  />
                )}
              </div>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Country *</Label>
              <Input
                placeholder="e.g. United States"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-slate-200 h-10"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">
                City <span className="text-slate-500 font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="e.g. New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-slate-200 h-10"
              />
            </div>

            {/* Business Size */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Business Size</Label>
              <Select value={businessSize} onValueChange={setBusinessSize}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200 h-10">
                  <SelectValue placeholder="Any size" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {BUSINESS_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value} className="text-slate-200 focus:bg-slate-700 focus:text-white">
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Name */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Assign to Campaign</Label>
              <div className="space-y-2">
                <Select
                  value={customCampaign ? '__custom__' : campaignName}
                  onValueChange={(v) => {
                    if (v === '__custom__') {
                      setCampaignName('')
                      setCustomCampaign('')
                    } else {
                      setCampaignName(v)
                      setCustomCampaign('')
                    }
                  }}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200 h-10">
                    <SelectValue placeholder="Select campaign..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {campaignsLoaded && campaigns.length === 0 && (
                      <SelectItem value="__none__" disabled className="text-slate-500">
                        No campaigns yet
                      </SelectItem>
                    )}
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.name} className="text-slate-200 focus:bg-slate-700 focus:text-white">
                        {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-cyan-400 focus:bg-slate-700">
                      ✏️ Create new campaign...
                    </SelectItem>
                  </SelectContent>
                </Select>
                {customCampaign !== undefined && campaignName === '' && (
                  <Input
                    placeholder="New campaign name..."
                    value={customCampaign}
                    onChange={(e) => setCustomCampaign(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-slate-200 h-9 text-sm"
                  />
                )}
              </div>
            </div>

            {/* Discover Button */}
            <div className="flex items-end">
              <Button
                onClick={handleDiscover}
                disabled={!hasFormFilled || discovering}
                className={cn(
                  'w-full h-10 font-medium transition-all duration-300',
                  'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500',
                  'text-white shadow-lg shadow-violet-500/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {discovering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Discover Leads
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Active filters display */}
          {(industry || customIndustry || country || city || businessSize) && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-slate-500">Active filters:</span>
              {(industry || customIndustry) && (
                <Badge variant="outline" className="bg-violet-500/10 border-violet-500/30 text-violet-300 text-xs">
                  {customIndustry || industry}
                </Badge>
              )}
              {country && (
                <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-300 text-xs">
                  📍 {country}{city ? ` → ${city}` : ''}
                </Badge>
              )}
              {businessSize && (
                <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-300 text-xs">
                  👥 {businessSize} employees
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Loading State ── */}
      {discovering && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              {/* Animated radar rings */}
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-2 rounded-full border-2 border-cyan-500/40 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                <div className="absolute inset-4 rounded-full border-2 border-emerald-500/50 animate-ping" style={{ animationDuration: '1s', animationDelay: '0.6s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radar className="w-8 h-8 text-violet-400 animate-pulse" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-white font-medium">AI is scanning for leads...</p>
                <p className="text-sm text-slate-400">
                  Analyzing businesses in {customIndustry || industry} across {country}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(discoveryProgress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">Searching databases & web sources</span>
                  <span className="text-xs text-slate-400">{Math.round(discoveryProgress)}%</span>
                </div>
              </div>

              {/* Skeleton results preview */}
              <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2.5 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <Skeleton className="h-4 w-3/4 bg-slate-700" />
                    <Skeleton className="h-3 w-full bg-slate-700/50" />
                    <Skeleton className="h-3 w-1/2 bg-slate-700/50" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Results Section ── */}
      {results && !discovering && (
        <div className="space-y-5">
          {/* Results header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Discovery Complete</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-sm text-slate-300">
                    <span className="font-semibold text-cyan-400">{results.discoveredCount}</span> companies discovered
                  </span>
                  <span className="text-slate-700">•</span>
                  <span className="text-sm text-slate-300">
                    <span className="font-semibold text-emerald-400">{results.newLeadsAdded}</span> new leads added
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetDiscovery}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              New Search
            </Button>
          </div>

          {/* Companies Grid */}
          {results.companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.companies.map((company, idx) => (
                <CompanyCard
                  key={company.id || idx}
                  company={company}
                  onViewLead={() => {
                    if (company.leadId) setView('lead-detail', company.leadId)
                    else setView('leads')
                  }}
                  onRunAudit={() => {
                    if (company.leadId) setView('audit', company.leadId)
                    else setView('audit')
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-slate-500" />
                </div>
                <p className="text-white font-medium">No companies found</p>
                <p className="text-sm text-slate-400 mt-1">
                  Try broadening your search criteria or a different industry/region
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Empty State (no discovery yet) ── */}
      {!results && !discovering && (
        <Card className="bg-slate-900 border-slate-800 border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <Radar className="w-9 h-9 text-slate-600" />
            </div>
            <p className="text-white font-medium text-lg">Ready to discover leads</p>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              Fill in the search parameters above and let our AI engine find high-quality prospects
              matching your ideal customer profile. We&apos;ll scan databases, websites, and business directories.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Target className="w-4 h-4 text-violet-500" />
                Industry-targeted
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Zap className="w-4 h-4 text-cyan-500" />
                AI-powered
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Globe className="w-4 h-4 text-emerald-500" />
                Global coverage
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ──────────── Company Card Sub-component ──────────── */

function CompanyCard({
  company,
  onViewLead,
  onRunAudit,
}: {
  company: DiscoveredCompany
  onViewLead: () => void
  onRunAudit: () => void
}) {
  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all duration-200 group overflow-hidden">
      {/* Top gradient accent on hover */}
      <div className="h-0.5 bg-gradient-to-r from-violet-600/0 via-cyan-500/0 to-emerald-500/0 group-hover:from-violet-600/60 group-hover:via-cyan-500/60 group-hover:to-emerald-500/60 transition-all duration-300" />

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Company name + status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shrink-0 text-sm font-semibold text-slate-300 border border-slate-700">
                {company.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{company.name}</p>
                {company.website && (
                  <p className="text-xs text-slate-500 truncate">{company.website}</p>
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0.5 shrink-0 font-medium',
                company.status === 'new'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-700/50 border-slate-600 text-slate-400'
              )}
            >
              {company.status === 'new' ? (
                <><Circle className="w-2 h-2 mr-1 fill-emerald-400" />New</>
              ) : (
                <><CheckCircle2 className="w-2 h-2 mr-1" />Existing</>
              )}
            </Badge>
          </div>

          <Separator className="bg-slate-800" />

          {/* Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">{company.location}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">{company.industry}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onRunAudit()
              }}
              className="flex-1 h-8 text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Run Audit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onViewLead()
              }}
              className="flex-1 h-8 text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
            >
              <ArrowRight className="w-3 h-3 mr-1" />
              View Lead
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
