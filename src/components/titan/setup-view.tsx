'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap } from 'lucide-react'

export function SetupView() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      window.location.reload()
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/15">
            <Zap className="w-7 h-7 text-gray-900" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up TITAN</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your owner account to get started</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-600">Full Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required className="bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-600">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className="bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-600">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} className="bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400" />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-gray-900 shadow-lg shadow-violet-500/10" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Owner Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}