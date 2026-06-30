'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap } from 'lucide-react'

export function LoginView({ onLogin }: { onLogin: (user: unknown) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      const sessionRes = await fetch('/api/auth', { credentials: 'same-origin' })
      const sessionData = await sessionRes.json()
      if (sessionData.user) onLogin(sessionData.user)
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/15">
            <Zap className="w-7 h-7 text-gray-900" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to TITAN</h1>
          <p className="text-gray-500 mt-1 text-sm">AI-Powered Growth Operating System</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-600">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className="bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-600">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required className="bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400" />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-gray-900 shadow-lg shadow-blue-500/10" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}