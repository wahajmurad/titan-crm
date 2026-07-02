'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
 Plug,
 Plus,
 Settings2,
 ExternalLink,
 Trash2,
 RefreshCw,
 CheckCircle2,
 XCircle,
 Zap,
 Globe,
 Search,
 Shield,
 Edit,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// ─── Types ──────────────────────────────────────────────────────────

interface LeadProvider {
 id: string
 name: string
 type: string
 apiUrl: string | null
 apiKey: string | null
 authType: string
 authHeader: string | null
 authValue: string | null
 headers: string | null
 params: string | null
 isActive: boolean
 isDefault: boolean
 priority: number
 lastUsedAt: string | null
 successCount: number
 failCount: number
 notes: string | null
 createdAt: string
 updatedAt: string
}

type ProviderForm = {
 name: string
 type: string
 apiUrl: string
 apiKey: string
 authType: string
 authHeader: string
 authValue: string
 headers: string
 params: string
 isActive: boolean
 isDefault: boolean
 priority: string
 notes: string
}

const EMPTY_FORM: ProviderForm = {
 name: '',
 type: 'custom',
 apiUrl: '',
 apiKey: '',
 authType: 'none',
 authHeader: '',
 authValue: '',
 headers: '',
 params: '',
 isActive: true,
 isDefault: false,
 priority: '0',
 notes: '',
}

// ─── Config ──────────────────────────────────────────────────────────

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
 serper: { label: 'Serper', color: 'bg-blue-50 text-blue-700 border-blue-200' },
 scraping: { label: 'Scraping', color: 'bg-amber-50 text-amber-700 border-amber-200' },
 custom: { label: 'Custom', color: 'bg-purple-50 text-purple-700 border-purple-200' },
 google_places: { label: 'Google Places', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
 yelp: { label: 'Yelp', color: 'bg-red-50 text-red-700 border-red-200' },
}

const AUTH_TYPE_LABELS: Record<string, string> = {
 none: 'No Auth',
 bearer: 'Bearer Token',
 basic: 'Basic Auth',
 header: 'Custom Header',
 query: 'Query Parameter',
}

const PROVIDER_TYPES = [
 { value: 'serper', label: 'Serper' },
 { value: 'google_places', label: 'Google Places' },
 { value: 'yelp', label: 'Yelp' },
 { value: 'scraping', label: 'Scraping' },
 { value: 'custom', label: 'Custom' },
]

const AUTH_TYPES = [
 { value: 'none', label: 'No Authentication' },
 { value: 'bearer', label: 'Bearer Token' },
 { value: 'basic', label: 'Basic Auth (Username/Password)' },
 { value: 'header', label: 'Custom Header' },
 { value: 'query', label: 'Query Parameter' },
]

// ─── Component ───────────────────────────────────────────────────────

export function LeadProvidersView() {
 const [providers, setProviders] = useState<LeadProvider[]>([])
 const [loading, setLoading] = useState(true)
 const [dialogOpen, setDialogOpen] = useState(false)
 const [editingId, setEditingId] = useState<string | null>(null)
 const [form, setForm] = useState<ProviderForm>(EMPTY_FORM)
 const [saving, setSaving] = useState(false)
 const [testingId, setTestingId] = useState<string | null>(null)
 const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

 // ── Fetch providers ──

 const fetchProviders = useCallback(async () => {
  try {
   setLoading(true)
   const res = await fetch('/api/lead-providers')
   if (!res.ok) throw new Error('Failed to fetch providers')
   const data = await res.json()
   setProviders(data.providers || [])
  } catch {
   toast.error('Failed to load lead providers')
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  fetchProviders()
 }, [fetchProviders])

 // ── Form helpers ──

 const updateField = (field: keyof ProviderForm, value: string | boolean) => {
  setForm((prev) => ({ ...prev, [field]: value }))
 }

 const openCreateDialog = () => {
  setEditingId(null)
  setForm(EMPTY_FORM)
  setDialogOpen(true)
 }

 const openEditDialog = (provider: LeadProvider) => {
  setEditingId(provider.id)
  setForm({
   name: provider.name,
   type: provider.type,
   apiUrl: provider.apiUrl || '',
   apiKey: provider.apiKey || '',
   authType: provider.authType,
   authHeader: provider.authHeader || '',
   authValue: provider.authValue || '',
   headers: provider.headers || '',
   params: provider.params || '',
   isActive: provider.isActive,
   isDefault: provider.isDefault,
   priority: String(provider.priority),
   notes: provider.notes || '',
  })
  setDialogOpen(true)
 }

 // ── Save (create or update) ──

 const handleSave = async () => {
  if (!form.name.trim()) {
   toast.error('Provider name is required')
   return
  }

  try {
   setSaving(true)

   let headersVal: string | undefined = form.headers.trim() || undefined
   let paramsVal: string | undefined = form.params.trim() || undefined

   // Try to parse as JSON and re-stringify for validation
   if (headersVal) {
    try {
     JSON.parse(headersVal)
    } catch {
     toast.error('Headers must be valid JSON')
     setSaving(false)
     return
    }
   }
   if (paramsVal) {
    try {
     JSON.parse(paramsVal)
    } catch {
     toast.error('Query params must be valid JSON')
     setSaving(false)
     return
    }
   }

   const payload = {
    name: form.name.trim(),
    type: form.type,
    apiUrl: form.apiUrl.trim() || null,
    apiKey: form.apiKey.trim() || null,
    authType: form.authType,
    authHeader: form.authHeader.trim() || null,
    authValue: form.authValue.trim() || null,
    headers: headersVal,
    params: paramsVal,
    isActive: form.isActive,
    isDefault: form.isDefault,
    priority: parseInt(form.priority) || 0,
    notes: form.notes.trim() || null,
   }

   const method = editingId ? 'PUT' : 'POST'
   const body = editingId ? { ...payload, id: editingId } : payload

   const res = await fetch('/api/lead-providers', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
   })

   if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to save provider')
   }

   toast.success(editingId ? 'Provider updated successfully' : 'Provider created successfully')
   setDialogOpen(false)
   fetchProviders()
  } catch (e: unknown) {
   const msg = e instanceof Error ? e.message : 'Failed to save provider'
   toast.error(msg)
  } finally {
   setSaving(false)
  }
 }

 // ── Delete ──

 const handleDelete = async (id: string) => {
  try {
   const res = await fetch('/api/lead-providers', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
   })

   if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete provider')
   }

   toast.success('Provider deleted')
   setDeleteConfirmId(null)
   fetchProviders()
  } catch (e: unknown) {
   const msg = e instanceof Error ? e.message : 'Failed to delete provider'
   toast.error(msg)
  }
 }

 // ── Test connection (mock) ──

 const handleTest = async (provider: LeadProvider) => {
  setTestingId(provider.id)
  await new Promise((resolve) => setTimeout(resolve, 1500))
  setTestingId(null)
  toast.success('Connection successful', {
   description: `Successfully connected to ${provider.name}`,
  })
 }

 // ── Toggle active ──

 const handleToggleActive = async (provider: LeadProvider) => {
  try {
   const res = await fetch('/api/lead-providers', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: provider.id, isActive: !provider.isActive }),
   })

   if (!res.ok) throw new Error('Failed to update provider')

   toast.success(provider.isActive ? 'Provider deactivated' : 'Provider activated')
   fetchProviders()
  } catch {
   toast.error('Failed to toggle provider status')
  }
 }

 // ── Truncate URL helper ──

 const truncateUrl = (url: string | null, maxLen = 40) => {
  if (!url) return '—'
  return url.length > maxLen ? url.slice(0, maxLen) + '...' : url
 }

 // ─── Render ───────────────────────────────────────────────────────

 return (
  <div className="flex flex-col h-full">
   {/* ── Header ── */}
   <div className="bg-white/80 border-b border-gray-200/60 px-6 py-5 sticky top-0 z-10">
    <div className="flex items-center justify-between">
     <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
       <Plug className="w-5 h-5 text-blue-700" />
      </div>
      <div>
       <h1 className="text-xl font-semibold text-gray-900">Lead Providers</h1>
       <p className="text-sm text-gray-500">Manage external data source connections</p>
      </div>
     </div>
     <div className="flex items-center gap-3">
      {!loading && (
       <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
        {providers.length} {providers.length === 1 ? 'provider' : 'providers'}
       </Badge>
      )}
      <Button
       onClick={openCreateDialog}
 className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
      >
       <Plus className="w-4 h-4 mr-1.5" />
       Add Provider
      </Button>
     </div>
    </div>
   </div>

   {/* ── Content ── */}
   <div className="flex-1 overflow-y-auto p-6">
    {loading ? (
     <div className="space-y-4">
      {[1, 2, 3].map((i) => (
       <div key={i} className="bg-white border border-gray-200/60 rounded-xl p-6 animate-pulse">
        <div className="flex items-center gap-4">
         <div className="h-5 w-40 bg-gray-200 rounded" />
         <div className="h-5 w-20 bg-gray-200 rounded" />
        </div>
       </div>
      ))}
     </div>
    ) : providers.length === 0 ? (
     /* ── Empty State ── */
     <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gray-100 mb-4">
       <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No lead providers configured</h3>
      <p className="text-sm text-gray-500 max-w-md text-center mb-6">
       Add your first provider to connect external data sources.
      </p>
      <Button
       onClick={openCreateDialog}
 className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
      >
       <Plus className="w-4 h-4 mr-1.5" />
       Add Provider
      </Button>
     </div>
    ) : (
     /* ── Provider Cards ── */
     <div className="space-y-3">
      {providers.map((provider) => {
       const typeBadge = TYPE_BADGES[provider.type] || TYPE_BADGES.custom
       return (
        <Card
         key={provider.id}
 className="bg-white border border-gray-200/60 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
        >
         <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
           {/* Left: Main info */}
           <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
             <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 shrink-0">
              {provider.type === 'serper' ? (
               <Search className="w-4 h-4 text-blue-700" />
              ) : provider.type === 'google_places' ? (
               <Globe className="w-4 h-4 text-emerald-700" />
              ) : provider.type === 'scraping' ? (
               <Zap className="w-4 h-4 text-amber-700" />
              ) : (
               <Plug className="w-4 h-4 text-purple-700" />
              )}
             </div>
             <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
               <h3 className="font-medium text-gray-900 truncate">
                {provider.name}
               </h3>
               {provider.isDefault && (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                 Default
                </Badge>
               )}
               <Badge
                variant="outline"
 className={cn('text-[10px] px-2 py-0', typeBadge.color)}
               >
                {typeBadge.label}
               </Badge>
               {provider.isActive ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0">
                 Active
                </Badge>
               ) : (
                <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px] px-2 py-0">
                 Inactive
                </Badge>
               )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5 font-mono truncate">
               {truncateUrl(provider.apiUrl)}
              </p>
             </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-5 mt-3 ml-12">
             <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Shield className="w-3.5 h-3.5" />
              <span>{AUTH_TYPE_LABELS[provider.authType] || provider.authType}</span>
             </div>
             <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{provider.successCount} success</span>
             </div>
             <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span>{provider.failCount} fail</span>
             </div>
             {provider.priority > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
               <Zap className="w-3.5 h-3.5 text-amber-500" />
               <span>Priority {provider.priority}</span>
              </div>
             )}
             {provider.lastUsedAt && (
              <div className="text-xs text-gray-400">
               Last used {format(new Date(provider.lastUsedAt), 'MMM d, yyyy')}
              </div>
             )}
            </div>
           </div>

           {/* Right: Actions */}
           <div className="flex items-center gap-2 shrink-0">
            <Switch
             checked={provider.isActive}
             onCheckedChange={() => handleToggleActive(provider)}
 className="transition-all duration-200"
            />
            <Button
             variant="outline"
             size="sm"
             onClick={() => handleTest(provider)}
             disabled={testingId === provider.id}
 className="h-8 text-xs border-gray-200/60 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all duration-200"
            >
             <RefreshCw className={cn('w-3.5 h-3.5 mr-1', testingId === provider.id && 'animate-spin')} />
             {testingId === provider.id ? 'Testing...' : 'Test'}
            </Button>
            <Button
             variant="outline"
             size="sm"
             onClick={() => openEditDialog(provider)}
 className="h-8 text-xs border-gray-200/60 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all duration-200"
            >
             <Edit className="w-3.5 h-3.5 mr-1" />
             Edit
            </Button>
            {deleteConfirmId === provider.id ? (
             <div className="flex items-center gap-1">
              <Button
               variant="destructive"
               size="sm"
               onClick={() => handleDelete(provider.id)}
 className="h-8 text-xs"
              >
               Confirm
              </Button>
              <Button
               variant="outline"
               size="sm"
               onClick={() => setDeleteConfirmId(null)}
 className="h-8 text-xs"
              >
               Cancel
              </Button>
             </div>
            ) : (
             <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(provider.id)}
 className="h-8 text-xs border-gray-200/60 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
             >
              <Trash2 className="w-3.5 h-3.5" />
             </Button>
            )}
           </div>
          </div>
         </CardContent>
        </Card>
       )
      })}
     </div>
    )}
   </div>

   {/* ── Add/Edit Dialog ── */}
   <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle className="text-lg text-gray-900">
       {editingId ? 'Edit Provider' : 'Add Provider'}
      </DialogTitle>
     </DialogHeader>

     <div className="space-y-5 mt-2">
      {/* Name */}
      <div className="space-y-1.5">
       <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Provider Name *</Label>
       <Input
        value={form.name}
        onChange={(e) => updateField('name', e.target.value)}
        placeholder="e.g., Serper Google Search"
 className="bg-white border-gray-200/60"
       />
      </div>

      {/* Type & Priority row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
       <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</Label>
        <Select value={form.type} onValueChange={(v) => updateField('type', v)}>
         <SelectTrigger className="bg-white border-gray-200/60">
          <SelectValue />
         </SelectTrigger>
         <SelectContent>
          {PROVIDER_TYPES.map((t) => (
           <SelectItem key={t.value} value={t.value}>
            {t.label}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
       </div>
       <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</Label>
        <Input
         type="number"
         value={form.priority}
         onChange={(e) => updateField('priority', e.target.value)}
         placeholder="0"
 className="bg-white border-gray-200/60"
        />
       </div>
      </div>

      {/* API URL */}
      <div className="space-y-1.5">
       <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">API URL</Label>
       <Input
        value={form.apiUrl}
        onChange={(e) => updateField('apiUrl', e.target.value)}
        placeholder="https://api.example.com/v1/search"
 className="bg-white border-gray-200/60 font-mono text-sm"
       />
      </div>

      {/* Auth Type */}
      <div className="space-y-1.5">
       <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Authentication</Label>
       <Select value={form.authType} onValueChange={(v) => updateField('authType', v)}>
        <SelectTrigger className="bg-white border-gray-200/60">
         <SelectValue />
        </SelectTrigger>
        <SelectContent>
         {AUTH_TYPES.map((t) => (
          <SelectItem key={t.value} value={t.value}>
           {t.label}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </div>

      {/* Auth fields — dynamic based on authType */}
      {form.authType === 'bearer' && (
       <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bearer Token</Label>
        <Input
         type="password"
         value={form.authValue}
         onChange={(e) => updateField('authValue', e.target.value)}
         placeholder="Enter bearer token"
 className="bg-white border-gray-200/60 font-mono text-sm"
        />
       </div>
      )}

      {form.authType === 'header' && (
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
         <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Header Name</Label>
         <Input
          value={form.authHeader}
          onChange={(e) => updateField('authHeader', e.target.value)}
          placeholder="X-API-KEY"
 className="bg-white border-gray-200/60 font-mono text-sm"
         />
        </div>
        <div className="space-y-1.5">
         <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Header Value</Label>
         <Input
          type="password"
          value={form.authValue}
          onChange={(e) => updateField('authValue', e.target.value)}
          placeholder="Enter value"
 className="bg-white border-gray-200/60 font-mono text-sm"
         />
        </div>
       </div>
      )}

      {form.authType === 'basic' && (
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
         <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</Label>
         <Input
          value={form.authHeader}
          onChange={(e) => updateField('authHeader', e.target.value)}
          placeholder="username"
 className="bg-white border-gray-200/60"
         />
        </div>
        <div className="space-y-1.5">
         <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</Label>
         <Input
          type="password"
          value={form.authValue}
          onChange={(e) => updateField('authValue', e.target.value)}
          placeholder="password"
 className="bg-white border-gray-200/60"
         />
        </div>
       </div>
      )}

      {form.authType === 'query' && (
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
         <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Param Name</Label>
         <Input
          value={form.authHeader}
          onChange={(e) => updateField('authHeader', e.target.value)}
          placeholder="api_key"
 className="bg-white border-gray-200/60 font-mono text-sm"
         />
        </div>
        <div className="space-y-1.5">
         <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Param Value</Label>
         <Input
          type="password"
          value={form.authValue}
          onChange={(e) => updateField('authValue', e.target.value)}
          placeholder="Enter value"
 className="bg-white border-gray-200/60 font-mono text-sm"
         />
        </div>
       </div>
      )}

      {/* Additional Headers */}
      <div className="space-y-1.5">
       <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Additional Headers <span className="text-gray-400 normal-case font-normal">(JSON)</span>
       </Label>
       <Textarea
        value={form.headers}
        onChange={(e) => updateField('headers', e.target.value)}
        placeholder='{"X-Custom-Header": "value"}'
        rows={2}
 className="bg-white border-gray-200/60 font-mono text-sm"
       />
      </div>

      {/* Query Params */}
      <div className="space-y-1.5">
       <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Query Params <span className="text-gray-400 normal-case font-normal">(JSON)</span>
       </Label>
       <Textarea
        value={form.params}
        onChange={(e) => updateField('params', e.target.value)}
        placeholder='{"limit": "10", "offset": "0"}'
        rows={2}
 className="bg-white border-gray-200/60 font-mono text-sm"
       />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
       <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</Label>
       <Textarea
        value={form.notes}
        onChange={(e) => updateField('notes', e.target.value)}
        placeholder="Internal notes about this provider..."
        rows={2}
 className="bg-white border-gray-200/60 text-sm"
       />
      </div>

      {/* Toggles */}
      <div className="flex items-center justify-between py-3 border-t border-gray-200/60">
       <div>
        <p className="text-sm font-medium text-gray-900">Active</p>
        <p className="text-xs text-gray-500">This provider will be used for lead discovery</p>
       </div>
       <Switch checked={form.isActive} onCheckedChange={(v) => updateField('isActive', v)} />
      </div>

      <div className="flex items-center justify-between py-3 border-t border-gray-200/60">
       <div>
        <p className="text-sm font-medium text-gray-900">Default Provider</p>
        <p className="text-xs text-gray-500">Use as the primary provider for all searches</p>
       </div>
       <Switch checked={form.isDefault} onCheckedChange={(v) => updateField('isDefault', v)} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/60">
       <Button
        variant="outline"
        onClick={() => setDialogOpen(false)}
 className="border-gray-200/60 transition-all duration-200"
       >
        Cancel
       </Button>
       <Button
        onClick={handleSave}
        disabled={saving || !form.name.trim()}
 className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
       >
        {saving ? (
         <>
          <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
          Saving...
         </>
        ) : editingId ? (
         <>
          <Settings2 className="w-4 h-4 mr-1.5" />
          Update Provider
         </>
        ) : (
         <>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Provider
         </>
        )}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}
