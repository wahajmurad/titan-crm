'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Eye, EyeOff, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { validatePassword } from '@/lib/types'

export function SetupView() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pwValidation = validatePassword(password)
  const pwChecks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(password) },
    { label: 'Lowercase', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwValidation.valid) {
      setError(`Password needs: ${pwValidation.errors.join(', ')}`)
      return
    }
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
      if (!res.ok) { setError(data.error || 'Setup failed.'); return }
      window.location.reload()
    } catch {
      setError('Network error. Please try again.')
    }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4 relative" role="main">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f3460]/10 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Zap className="w-7 h-7 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">Set Up TITAN</h1>
          <p className="text-[#64748B] mt-1 text-sm">Create your owner account to get started</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] p-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="setup-name" className="text-[13px] font-medium text-[#334155]">Full Name</Label>
              <Input
                id="setup-name"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                required
                aria-required="true"
                className="h-11 bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] rounded-xl focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup-email" className="text-[13px] font-medium text-[#334155]">Email</Label>
              <Input
                id="setup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                aria-required="true"
                className="h-11 bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] rounded-xl focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup-password" className="text-[13px] font-medium text-[#334155]">Password</Label>
              <div className="relative">
                <Input
                  id="setup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  aria-required="true"
                  className="h-11 bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] rounded-xl pr-11 focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 mt-2"
                >
                  {pwChecks.map(check => (
                    <div key={check.label} className="flex items-center gap-1 text-[11px]">
                      {check.met ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <X className="w-3 h-3 text-[#CBD5E1]" />
                      )}
                      <span className={check.met ? 'text-emerald-600' : 'text-[#94A3B8]'}>{check.label}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium rounded-xl transition-all duration-200 mt-2"
              disabled={loading || !pwValidation.valid}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : 'Create Owner Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          Your data is stored locally and encrypted.
        </p>
      </motion.div>
    </div>
  )
}