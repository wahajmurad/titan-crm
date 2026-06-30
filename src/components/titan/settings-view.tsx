'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Save, CheckCircle } from 'lucide-react'

export function SettingsView() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([fetch('/api/settings'), fetch('/api/auth')])
      .then(([sRes, uRes]) => Promise.all([sRes.json(), uRes.json()]))
      .then(([sData, uData]) => {
        if (uData.user) setName(uData.user.name)
        setSettings(sData.settings || {})
      })
      .catch(() => {})
  }, [])

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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your profile and system configuration</p>
      </div>

      {/* Profile */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Display Name</Label><Input className="mt-1" value={name} onChange={e => setName(e.target.value)} /></div>
          <Button size="sm" onClick={updateProfile} disabled={loading || !name}>
            {saved ? <><CheckCircle className="w-3.5 h-3.5 mr-1" />Saved</> : <><Save className="w-3.5 h-3.5 mr-1" />Update Profile</>}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Current Password</Label><Input type="password" className="mt-1" value={currentPass} onChange={e => setCurrentPass(e.target.value)} /></div>
          <div><Label>New Password</Label><Input type="password" className="mt-1" value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
          <Button size="sm" onClick={updateProfile} disabled={loading || !currentPass || !newPass}>Update Password</Button>
        </CardContent>
      </Card>

      {/* SMTP */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Email (SMTP)</CardTitle>
          <p className="text-xs text-gray-500">Configure your outgoing email server</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
      <Card className="border-slate-200">
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
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Follow-up Schedule</CardTitle>
          <p className="text-xs text-gray-500">Configure automated follow-up timing (days)</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
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