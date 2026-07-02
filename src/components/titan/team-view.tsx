'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MODULES, type Module } from '@/lib/types'
import { Plus, Shield, Users, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface TeamUser {
  id: string; email: string; name: string; role: string; isActive: boolean
  permissions: Array<{ id: string; module: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>
}

interface PermState {
  [module: string]: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
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
    <motion.div className="mx-auto max-w-4xl space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-medium text-gray-700">{users.length}</span> members
            <span className="mx-1.5 text-gray-300">·</span>
            Manage permissions
          </p>
        </div>
        <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} onAdded={refresh} />
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No team members yet</p>
          <p className="text-xs text-gray-400 mt-1">Add team members and configure their permissions</p>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          {users.map(user => {
            const perms: PermState = {}
            for (const m of MODULES) {
              const p = user.permissions.find(pm => pm.module === m)
              perms[m] = { canView: p?.canView ?? false, canCreate: p?.canCreate ?? false, canEdit: p?.canEdit ?? false, canDelete: p?.canDelete ?? false }
            }
            const grantedCount = Object.values(perms).filter(p => p.canView || p.canCreate || p.canEdit || p.canDelete).length

            return (
              <motion.div
                key={user.id}
                variants={item}
                whileHover={{ y: -2, boxShadow: '0 8px 30px -8px rgba(0,0,0,0.06)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={cn(
                  'rounded-2xl border bg-white/80 backdrop-blur-sm p-4 transition-colors',
                  !user.isActive ? 'opacity-50 border-gray-100' : 'border-gray-100 hover:border-blue-100'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    {/* Avatar */}
                    <div className={cn(
                      'w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 shadow-sm',
                      user.isActive
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20'
                        : 'bg-gray-100 text-gray-400'
                    )}>
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <Badge variant="outline" className="text-[10px] font-semibold rounded-md px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-100">
                          {user.role}
                        </Badge>
                        {!user.isActive && (
                          <Badge variant="outline" className="text-[10px] font-semibold rounded-md px-1.5 py-0 bg-red-50 text-red-500 border-red-100">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[11px] font-semibold rounded-lg px-2.5 py-0.5 bg-gray-50 border-gray-100 text-gray-600">
                      <Shield className="w-3 h-3 mr-1" />
                      {grantedCount} module{grantedCount !== 1 ? 's' : ''}
                    </Badge>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggleActive(user)}
                      className={cn(
                        'h-8 px-3 rounded-xl text-xs font-semibold border transition-colors',
                        user.isActive
                          ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100'
                          : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                      )}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </motion.button>
                  </div>
                </div>

                {/* Permission badges */}
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <div className="flex flex-wrap gap-1.5">
                    {MODULES.map(m => (
                      <span
                        key={m}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium capitalize transition-colors',
                          perms[m].canView
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-gray-50 text-gray-400 border border-gray-100'
                        )}
                      >
                        {perms[m].canView ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                        {m}
                        {perms[m].canEdit && <span className="text-emerald-600 font-bold">E</span>}
                        {perms[m].canDelete && <span className="text-red-500 font-bold">D</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
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
    if (!name || !email || !password) { setError('All fields are required'); return }
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
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 text-white font-semibold text-sm shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </motion.button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[85vh] overflow-y-auto rounded-2xl border-0 shadow-xl p-0">
        <div className="bg-gradient-to-r from-[#2563EB] to-blue-600 px-6 py-5">
          <DialogTitle className="text-lg font-bold text-white">Add Team Member</DialogTitle>
          <p className="text-sm text-blue-100 mt-1">Create an account and set permissions</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{error}</div>
          )}
          <div>
            <Label className="text-xs font-medium text-gray-500">Full Name *</Label>
            <Input className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30" value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500">Email *</Label>
            <Input type="email" className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.com" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500">Password *</Label>
            <Input type="password" className="mt-1.5 h-10 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" />
          </div>

          {/* Permissions */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-semibold text-gray-700">Permissions</p>
            </div>
            <div className="space-y-1">
              {/* Header */}
              <div className="flex items-center justify-between py-2 px-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Module</span>
                <div className="flex items-center gap-1">
                  {['View', 'Create', 'Edit', 'Delete'].map(label => (
                    <span key={label} className="w-8 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label[0]}</span>
                  ))}
                </div>
              </div>
              {MODULES.map(m => (
                <div key={m} className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-700 capitalize w-24 font-medium">{m}</span>
                  <div className="flex items-center gap-1">
                    {([['canView', 'V'], ['canCreate', 'C'], ['canEdit', 'E'], ['canDelete', 'D']] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => togglePerm(m, key)}
                        className={cn(
                          'w-8 h-8 rounded-xl text-xs font-bold transition-all',
                          perms[m][key]
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-500/20'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-2.5">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-gray-200 text-gray-500 hover:bg-gray-100 font-semibold h-10 px-5">Cancel</Button>
          <Button
            onClick={handleAdd}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 text-white font-semibold h-10 px-6 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}