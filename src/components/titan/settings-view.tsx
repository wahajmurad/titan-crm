'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Save, CheckCircle, Plus, Trash2, Globe, Key, Settings, Shield, ExternalLink } from 'lucide-react'

// ── Lead Provider Types ──────────────────────────────────────────────

interface LeadProvider {
  id: string
  name: string
  type: 'SERPER' | 'CUSTOM'
  baseUrl: string
  authMethod: 'bearer' | 'api-key' | 'header' | 'none'
  apiKey: string
  authHeader?: string
  headers: Record<string, string>
  requestParams: Record<string, string>
  isActive: boolean
}

const SERPER_DEFAULT: Omit<LeadProvider, 'id'> = {
  name: 'Serper (Google Search)',
  type: 'SERPER',
  baseUrl: 'https://google.serper.dev',
  authMethod: 'api-key',
  apiKey: '',
  authHeader: 'X-API-KEY',
  headers: {},
  requestParams: {},
  isActive: true,
}

const AUTH_METHOD_LABELS: Record<LeadProvider['authMethod'], string> = {
  bearer: 'Bearer Token',
  'api-key': 'API Key in Header',
  header: 'Custom Header',
  none: 'None',
}

const TYPE_LABELS: Record<LeadProvider['type'], string> = {
  SERPER: 'Serper',
  CUSTOM: 'Custom',
}

function generateId() {
  return crypto.randomUUID()
}

// ── Component ────────────────────────────────────────────────────────

export function SettingsView() {
  // ── Existing settings state ──
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // ── Lead provider state ──
  const [providers, setProviders] = useState<LeadProvider[]>([])
  const [providersLoaded, setProvidersLoaded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<LeadProvider | null>(null)
  const [savingProviders, setSavingProviders] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<LeadProvider['type']>('SERPER')
  const [formBaseUrl, setFormBaseUrl] = useState('')
  const [formAuthMethod, setFormAuthMethod] = useState<LeadProvider['authMethod']>('api-key')
  const [formApiKey, setFormApiKey] = useState('')
  const [formAuthHeader, setFormAuthHeader] = useState('')
  const [formHeaders, setFormHeaders] = useState('')
  const [formParams, setFormParams] = useState('')
  const [formActive, setFormActive] = useState(true)

  // ── Load all settings (existing + providers) ──
  useEffect(() => {
    Promise.all([fetch('/api/settings'), fetch('/api/auth')])
      .then(([sRes, uRes]) => Promise.all([sRes.json(), uRes.json()]))
      .then(([sData, uData]) => {
        if (uData.user) setName(uData.user.name)
        setSettings(sData.settings || {})

        // Parse lead providers from settings
        const raw = sData.settings?.lead_providers
        if (raw) {
          try {
            setProviders(JSON.parse(raw))
          } catch {
            setProviders([])
          }
        }
        setProvidersLoaded(true)
      })
      .catch(() => {
        setProvidersLoaded(true)
      })
  }, [])

  // ── Existing helpers ──
  const updateSetting = (key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }))
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setLoading(false)
  }

  const updateProfile = async () => {
    if (!name) return
    setLoading(true)
    try {
      const payload: Record<string, string> = { name }
      if (currentPass && newPass) { payload.currentPassword = currentPass; payload.newPassword = newPass }
      await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      setSaved(true)
      setCurrentPass(''); setNewPass('')
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setLoading(false)
  }

  // ── Lead Provider helpers ──

  const resetForm = () => {
    setFormName('')
    setFormType('SERPER')
    setFormBaseUrl('')
    setFormAuthMethod('api-key')
    setFormApiKey('')
    setFormAuthHeader('')
    setFormHeaders('')
    setFormParams('')
    setFormActive(true)
    setEditingProvider(null)
  }

  const openAddDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (provider: LeadProvider) => {
    setEditingProvider(provider)
    setFormName(provider.name)
    setFormType(provider.type)
    setFormBaseUrl(provider.baseUrl)
    setFormAuthMethod(provider.authMethod)
    setFormApiKey(provider.apiKey)
    setFormAuthHeader(provider.authHeader || '')
    setFormHeaders(JSON.stringify(provider.headers || {}, null, 2))
    setFormParams(JSON.stringify(provider.requestParams || {}, null, 2))
    setFormActive(provider.isActive)
    setDialogOpen(true)
  }

  const handleQuickAddSerper = () => {
    const newProvider: LeadProvider = {
      ...SERPER_DEFAULT,
      id: generateId(),
    }
    setEditingProvider(newProvider)
    setFormName(newProvider.name)
    setFormType(newProvider.type)
    setFormBaseUrl(newProvider.baseUrl)
    setFormAuthMethod(newProvider.authMethod)
    setFormApiKey('')
    setFormAuthHeader(newProvider.authHeader || '')
    setFormHeaders('')
    setFormParams('')
    setFormActive(newProvider.isActive)
    setDialogOpen(true)
  }

  const saveProviders = async (updatedProviders: LeadProvider[]) => {
    setSavingProviders(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { lead_providers: JSON.stringify(updatedProviders) },
        }),
      })
      setProviders(updatedProviders)
    } catch {}
    setSavingProviders(false)
  }

  const handleSaveProvider = async () => {
    let parsedHeaders: Record<string, string> = {}
    let parsedParams: Record<string, string> = {}

    if (formHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(formHeaders)
      } catch {
        return
      }
    }

    if (formParams.trim()) {
      try {
        parsedParams = JSON.parse(formParams)
      } catch {
        return
      }
    }

    const providerData: LeadProvider = {
      id: editingProvider?.id || generateId(),
      name: formName.trim(),
      type: formType,
      baseUrl: formBaseUrl.trim(),
      authMethod: formAuthMethod,
      apiKey: formApiKey,
      authHeader: formAuthHeader.trim() || undefined,
      headers: parsedHeaders,
      requestParams: parsedParams,
      isActive: formActive,
    }

    let updatedProviders: LeadProvider[]
    if (editingProvider) {
      updatedProviders = providers.map(p => (p.id === editingProvider.id ? providerData : p))
    } else {
      updatedProviders = [...providers, providerData]
    }

    await saveProviders(updatedProviders)
    setDialogOpen(false)
    resetForm()
  }

  const handleDeleteProvider = async (id: string) => {
    const updatedProviders = providers.filter(p => p.id !== id)
    await saveProviders(updatedProviders)
  }

  const handleToggleActive = async (id: string) => {
    const updatedProviders = providers.map(p =>
      p.id === id ? { ...p, isActive: !p.isActive } : p
    )
    await saveProviders(updatedProviders)
  }

  // ── Render ──

  return (
    <div className="space-y-6 max-w-2xl dark:text-gray-100">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your profile and system configuration</p>
      </div>

      {/* ── Lead Providers ── */}
      <Card className="border-gray-200/60 shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-semibold">Lead Providers</CardTitle>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={openAddDialog}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Provider
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Configure data sources for lead discovery and enrichment
          </p>
        </CardHeader>
        <CardContent>
          {!providersLoaded ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-400">
              <Settings className="w-4 h-4 mr-2 animate-spin" />
              Loading providers...
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 mb-3">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">No lead providers configured</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Add a data source to start discovering leads. We recommend starting with Serper.dev for Google Search results.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={handleQuickAddSerper}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Quick Add Serper.dev
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map(provider => (
                <div
                  key={provider.id}
                  className="group flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => openEditDialog(provider)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
                      >
                        {provider.name}
                      </button>
                      <Badge
                        variant={provider.isActive ? 'default' : 'secondary'}
                        className={
                          provider.isActive
                            ? 'bg-blue-600 text-white text-[10px] px-1.5 py-0'
                            : 'text-[10px] px-1.5 py-0'
                        }
                      >
                        {TYPE_LABELS[provider.type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1 truncate">
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        {provider.baseUrl}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3 shrink-0" />
                        {AUTH_METHOD_LABELS[provider.authMethod]}
                      </span>
                      {provider.apiKey && (
                        <span className="flex items-center gap-1">
                          <Key className="w-3 h-3 shrink-0" />
                          Configured
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">
                        {provider.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Switch
                        checked={provider.isActive}
                        onCheckedChange={() => handleToggleActive(provider.id)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                      onClick={() => handleDeleteProvider(provider.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Provider Add/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={open => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProvider ? 'Edit Provider' : 'Add Lead Provider'}</DialogTitle>
            <DialogDescription>
              {editingProvider
                ? 'Update the configuration for this lead data provider.'
                : 'Configure a new lead data source for discovery and enrichment.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Provider Name */}
            <div className="space-y-1.5">
              <Label className="text-xs">Provider Name</Label>
              <Input
                placeholder="e.g. Serper (Google Search)"
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={formType} onValueChange={v => {
                setFormType(v as LeadProvider['type'])
                if (v === 'SERPER') {
                  setFormBaseUrl('https://google.serper.dev')
                  setFormAuthMethod('api-key')
                  setFormAuthHeader('X-API-KEY')
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERPER">Serper</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Base URL */}
            <div className="space-y-1.5">
              <Label className="text-xs">Base URL</Label>
              <Input
                placeholder="https://api.example.com"
                value={formBaseUrl}
                onChange={e => setFormBaseUrl(e.target.value)}
              />
            </div>

            {/* Auth Method */}
            <div className="space-y-1.5">
              <Label className="text-xs">Auth Method</Label>
              <Select value={formAuthMethod} onValueChange={v => setFormAuthMethod(v as LeadProvider['authMethod'])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select auth method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="api-key">API Key in Header</SelectItem>
                  <SelectItem value="header">Custom Header</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* API Key (hidden when auth is none) */}
            {formAuthMethod !== 'none' && (
              <div className="space-y-1.5">
                <Label className="text-xs">API Key</Label>
                <Input
                  type="password"
                  placeholder={formAuthMethod === 'bearer' ? 'Bearer token...' : 'Enter your API key...'}
                  value={formApiKey}
                  onChange={e => setFormApiKey(e.target.value)}
                />
              </div>
            )}

            {/* Auth Header (only for api-key type) */}
            {formAuthMethod === 'api-key' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Auth Header Name</Label>
                <Input
                  placeholder="X-API-KEY"
                  value={formAuthHeader}
                  onChange={e => setFormAuthHeader(e.target.value)}
                />
              </div>
            )}

            {/* Custom Headers */}
            <div className="space-y-1.5">
              <Label className="text-xs">Custom Headers <span className="text-gray-400">(JSON)</span></Label>
              <Textarea
                placeholder={'{\n  "X-Custom-Header": "value"\n}'}
                value={formHeaders}
                onChange={e => setFormHeaders(e.target.value)}
                className="min-h-[72px] font-mono text-xs"
              />
            </div>

            {/* Custom Request Params */}
            <div className="space-y-1.5">
              <Label className="text-xs">Custom Request Params <span className="text-gray-400">(JSON)</span></Label>
              <Textarea
                placeholder={'{\n  "gl": "us",\n  "hl": "en"\n}'}
                value={formParams}
                onChange={e => setFormParams(e.target.value)}
                className="min-h-[72px] font-mono text-xs"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs">Active</Label>
              <Switch
                checked={formActive}
                onCheckedChange={setFormActive}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={savingProviders || !formName.trim() || !formBaseUrl.trim()}
              onClick={handleSaveProvider}
            >
              {savingProviders ? (
                <>
                  <Settings className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Save Provider
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile */}
      <Card className="border-gray-200/60 shadow-sm rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Display Name</Label><Input className="mt-1" value={name} onChange={e => setName(e.target.value)} /></div>
          <Button size="sm" onClick={updateProfile} disabled={loading || !name}>
            {saved ? <><CheckCircle className="w-3.5 h-3.5 mr-1" />Saved</> : <><Save className="w-3.5 h-3.5 mr-1" />Update Profile</>}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-gray-200/60 shadow-sm rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Current Password</Label><Input type="password" className="mt-1" value={currentPass} onChange={e => setCurrentPass(e.target.value)} /></div>
          <div><Label>New Password</Label><Input type="password" className="mt-1" value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
          <Button size="sm" onClick={updateProfile} disabled={loading || !currentPass || !newPass}>Update Password</Button>
        </CardContent>
      </Card>

      {/* SMTP */}
      <Card className="border-gray-200/60 shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Email (SMTP)</CardTitle>
          <p className="text-xs text-gray-500">Configure your outgoing email server</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Host</Label><Input className="mt-1" value={settings.smtp_host || ''} onChange={e => updateSetting('smtp_host', e.target.value)} placeholder="smtp.gmail.com" /></div>
            <div><Label>Port</Label><Input className="mt-1" value={settings.smtp_port || ''} onChange={e => updateSetting('smtp_port', e.target.value)} placeholder="587" /></div>
          </div>
          <div><Label>Email Address</Label><Input className="mt-1" value={settings.smtp_email || ''} onChange={e => updateSetting('smtp_email', e.target.value)} placeholder="outreach@company.com" /></div>
          <div><Label>Password</Label><Input type="password" className="mt-1" value={settings.smtp_password || ''} onChange={e => updateSetting('smtp_password', e.target.value)} placeholder="App password" /></div>
          <Button size="sm" onClick={saveSettings} disabled={loading}>
            {saved ? <><CheckCircle className="w-3.5 h-3.5 mr-1" />Saved</> : <><Save className="w-3.5 h-3.5 mr-1" />Save SMTP Settings</>}
          </Button>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card className="border-gray-200/60 shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">AI Configuration</CardTitle>
          <p className="text-xs text-gray-500">API keys for AI-powered features</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><Label>OpenAI API Key</Label><Input type="password" className="mt-1" value={settings.openai_key || ''} onChange={e => updateSetting('openai_key', e.target.value)} placeholder="sk-..." /></div>
          <div><Label>Gemini API Key</Label><Input type="password" className="mt-1" value={settings.gemini_key || ''} onChange={e => updateSetting('gemini_key', e.target.value)} placeholder="AIza..." /></div>
          <div><Label>Claude API Key</Label><Input type="password" className="mt-1" value={settings.claude_key || ''} onChange={e => updateSetting('claude_key', e.target.value)} placeholder="sk-ant-..." /></div>
          <Button size="sm" onClick={saveSettings} disabled={loading}>
            {saved ? <><CheckCircle className="w-3.5 h-3.5 mr-1" />Saved</> : <><Save className="w-3.5 h-3.5 mr-1" />Save AI Settings</>}
          </Button>
        </CardContent>
      </Card>

      {/* Follow-up Configuration */}
      <Card className="border-gray-200/60 shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Follow-up Schedule</CardTitle>
          <p className="text-xs text-gray-500">Configure automated follow-up timing (days)</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><Label>Follow-up 1</Label><Input type="number" className="mt-1" value={settings.followup_1 || '4'} onChange={e => updateSetting('followup_1', e.target.value)} /></div>
            <div><Label>Follow-up 2</Label><Input type="number" className="mt-1" value={settings.followup_2 || '8'} onChange={e => updateSetting('followup_2', e.target.value)} /></div>
            <div><Label>Follow-up 3</Label><Input type="number" className="mt-1" value={settings.followup_3 || '14'} onChange={e => updateSetting('followup_3', e.target.value)} /></div>
            <div><Label>Final (days)</Label><Input type="number" className="mt-1" value={settings.followup_final || '21'} onChange={e => updateSetting('followup_final', e.target.value)} /></div>
          </div>
          <Button size="sm" onClick={saveSettings} disabled={loading}>
            {saved ? <><CheckCircle className="w-3.5 h-3.5 mr-1" />Saved</> : <><Save className="w-3.5 h-3.5 mr-1" />Save Schedule</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}