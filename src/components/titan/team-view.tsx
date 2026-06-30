'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MODULES, type Module } from '@/lib/types'
import { Plus, Shield, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamUser {
  id: string; email: string; name: string; role: string; isActive: boolean
  permissions: Array<{ id: string; module: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>
}

interface PermState {
  [module: string]: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }
}

export function TeamView() {
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetch('/api/team')
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [refreshKey])

  const refresh = () => setRefreshKey(k => k + 1)

  const toggleActive = async (user: TeamUser) => {
    await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
    }).catch(() => {})
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Team</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage team members and their permissions</p>
        </div>
        <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} onAdded={refresh} />
      </div>

      {loading ? (
        <Card><CardContent className="p-8"><div className="h-48 bg-slate-100 rounded-lg animate-pulse" /></CardContent></Card>
      ) : users.length === 0 ? (
        <Card className="border-slate-200"><CardContent className="py-16 text-center">
          <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No team members yet</p>
          <p className="text-sm text-gray-500 mt-1">Add team members and set their permissions</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {users.map(user => {
            const perms: PermState = {}
            for (const m of MODULES) {
              const p = user.permissions.find(pm => pm.module === m)
              perms[m] = { canView: p?.canView ?? false, canCreate: p?.canCreate ?? false, canEdit: p?.canEdit ?? false, canDelete: p?.canDelete ?? false }
            }
            const grantedCount = Object.values(perms).filter(p => p.canView || p.canCreate || p.canEdit || p.canDelete).length

            return (
              <Card key={user.id} className={cn('border-slate-200', !user.isActive && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-gray-300">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          {!user.isActive && <Badge variant="outline" className="text-xs text-red-500">Inactive</Badge>}
                        </div>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{grantedCount} module{grantedCount !== 1 ? 's' : ''}</Badge>
                      <Button size="sm" variant="outline" className={cn('h-7 text-xs', user.isActive ? 'text-red-500 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-700')} onClick={() => toggleActive(user)}>
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1.5">
                      {MODULES.map(m => (
                        <Badge
                          key={m}
                          variant={perms[m].canView ? 'secondary' : 'outline'}
                          className={cn('text-xs capitalize', perms[m].canView ? 'bg-slate-100 text-slate-700' : 'text-gray-600')}
                        >
                          {m}
                          {perms[m].canEdit && <span className="ml-1 text-emerald-600">E</span>}
                          {perms[m].canDelete && <span className="ml-1 text-red-500">D</span>}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AddMemberDialog({ open, onOpenChange, onAdded }: { open: boolean; onOpenChange: (o: boolean) => void; onAdded: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [perms, setPerms] = useState<PermState>(() => {
    const p: PermState = {}
    for (const m of MODULES) p[m] = { canView: false, canCreate: false, canEdit: false, canDelete: false }
    return p
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const togglePerm = (mod: Module, field: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    setPerms(p => ({
      ...p,
      [mod]: { ...p[mod], [field]: !p[mod][field] },
    }))
  }

  const handleAdd = async () => {
    if (!name || !email || !password) { setError('All fields required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, permissions: perms }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error); return }
      setName(''); setEmail(''); setPassword('')
      const p: PermState = {}
      for (const m of MODULES) p[m] = { canView: false, canCreate: false, canEdit: false, canDelete: false }
      setPerms(p)
      onOpenChange(false)
      onAdded()
    } catch { setError('Something went wrong') }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8"><Plus className="w-3.5 h-3.5 mr-1.5" />Add Member</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        <div className="space-y-3 mt-2">
          <div><Label>Full Name *</Label><Input className="mt-1" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>Email *</Label><Input type="email" className="mt-1" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label>Password *</Label><Input type="password" className="mt-1" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-sm font-medium text-slate-700 mb-3">Permissions</p>
            <div className="space-y-2">
              {MODULES.map(m => (
                <div key={m} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-slate-700 capitalize w-24">{m}</span>
                  <div className="flex items-center gap-1">
                    {[['canView', 'V'], ['canCreate', 'C'], ['canEdit', 'E'], ['canDelete', 'D']].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => togglePerm(m, key as keyof PermState[string])}
                        className={cn(
                          'w-7 h-7 rounded text-xs font-medium transition-colors',
                          perms[m][key as keyof PermState[string]]
                            ? 'bg-white text-gray-900'
                            : 'bg-slate-100 text-gray-500 hover:bg-slate-200'
                        )}
                      >{label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={loading}>{loading ? 'Adding...' : 'Add Member'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}