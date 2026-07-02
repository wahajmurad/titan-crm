'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, ArrowRight, Sparkles, Eye, EyeOff, ArrowLeft, Check, X, KeyRound } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { validatePassword } from '@/lib/types'

type AuthStep = 'login' | 'forgot' | 'reset-password' | 'reset-success'

export function LoginView({ onLogin }: { onLogin: (user: unknown) => void }) {
  const [step, setStep] = useState<AuthStep>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetToken, setResetToken] = useState('')

  const pwValidation = validatePassword(newPassword)
  const pwChecks = [
    { label: '8+ characters', met: newPassword.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(newPassword) },
    { label: 'Lowercase', met: /[a-z]/.test(newPassword) },
    { label: 'Number', met: /[0-9]/.test(newPassword) },
  ]

  const handleLogin = async (e: React.FormEvent) => {
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

      if (res.status === 429) {
        setError('Too many login attempts. Please wait a few minutes.')
        return
      }
      if (!res.ok) { setError(data.error || 'Login failed.'); return }

      const sessionRes = await fetch('/api/auth', { credentials: 'same-origin' })
      const sessionData = await sessionRes.json()
      if (sessionData.user) onLogin(sessionData.user)
    } catch {
      setError('Network error. Please check your connection.')
    }
    finally { setLoading(false) }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Request failed.'); return }

      // If we got a reset token, go to reset-password step
      if (data.resetToken) {
        setResetToken(data.resetToken)
        setStep('reset-password')
      } else {
        // Generic response (user not found) — still show success
        setStep('reset-success')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    finally { setLoading(false) }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwValidation.valid) {
      setError(`Password needs: ${pwValidation.errors.join(', ')}`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Reset failed.'); return }
      setStep('reset-success')
    } catch {
      setError('Network error. Please try again.')
    }
    finally { setLoading(false) }
  }

  const goBack = () => { setStep('login'); setError(''); setNewPassword(''); setResetToken('') }

  return (
    <div className="min-h-screen flex" role="main">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden items-center justify-center">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/[0.03] rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white/10 rounded-full" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/[0.07] rounded-full" />
        <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-white/[0.05] rounded-full" />
        <div className="absolute top-2/3 right-1/4 w-2.5 h-2.5 bg-white/10 rounded-full" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 text-center px-12 max-w-lg"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/10"
          >
            <Zap className="w-8 h-8 text-white" fill="white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-4"
          >
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">TITAN AI</h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-white/20" />
              <Sparkles className="w-4 h-4 text-white/40" />
              <div className="h-px w-8 bg-white/20" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg text-white/70 font-medium leading-relaxed"
          >
            AI-Powered Growth<br />Operating System
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex items-center justify-center gap-6 text-white/40 text-sm"
          >
            {[
              { val: '10x', label: 'Faster' },
              { val: 'AI', label: 'Native' },
              { val: '24/7', label: 'Active' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/50 font-bold text-xs">{item.val}</div>
                <span className="text-[11px]">{item.label}</span>
              </div>
            ))}
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
          </motion.div>
        </motion.div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] p-6 relative">
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #0F172A 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="font-bold text-[#0F172A] text-lg tracking-tight">TITAN</span>
            <span className="text-[10px] bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] text-white font-bold rounded-md px-1.5 py-0.5 leading-none">AI</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] p-8">
            <AnimatePresence mode="wait">
              {/* ── Login Step ── */}
              {step === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-[#0F172A] tracking-tight">Welcome back</h2>
                    <p className="text-sm text-[#64748B] mt-1.5">Sign in to your TITAN account</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5" noValidate>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{error}</motion.div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-[13px] font-medium text-[#334155]">Email</Label>
                      <Input id="login-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required aria-required="true" className="h-11 bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] rounded-xl focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-all duration-200" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-[13px] font-medium text-[#334155]">Password</Label>
                        <button type="button" onClick={() => setStep('forgot')} className="text-[12px] text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors">Forgot password?</button>
                      </div>
                      <div className="relative">
                        <Input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required aria-required="true" className="h-11 bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] rounded-xl pr-11 focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-all duration-200" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-11 bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium rounded-xl transition-all duration-200 mt-2" disabled={loading} aria-busy={loading}>
                      {loading ? (
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Signing in...</span></div>
                      ) : (
                        <div className="flex items-center gap-2"><span>Sign In</span><ArrowRight className="w-4 h-4" /></div>
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ── Forgot Password Step ── */}
              {step === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] font-medium transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to sign in
                  </button>

                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-[#0F172A] tracking-tight">Reset password</h2>
                    <p className="text-sm text-[#64748B] mt-1.5">Enter your email to generate a reset token.</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-5" noValidate>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{error}</motion.div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-[13px] font-medium text-[#334155]">Email address</Label>
                      <Input id="forgot-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required aria-required="true" className="h-11 bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] rounded-xl focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-all duration-200" />
                    </div>

                    <Button type="submit" className="w-full h-11 bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium rounded-xl transition-all duration-200" disabled={loading}>
                      {loading ? (
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Generating...</span></div>
                      ) : 'Generate Reset Token'}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ── Set New Password Step ── */}
              {step === 'reset-password' && (
                <motion.div
                  key="reset-password"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] font-medium transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to sign in
                  </button>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <KeyRound className="w-5 h-5 text-[#2563EB]" />
                      <h2 className="text-xl font-semibold text-[#0F172A] tracking-tight">Set new password</h2>
                    </div>
                    <p className="text-sm text-[#64748B] mt-1.5">Enter your new password for <span className="font-medium text-[#334155]">{email}</span></p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{error}</motion.div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-[13px] font-medium text-[#334155]">New password</Label>
                      <div className="relative">
                        <Input id="new-password" type={showNewPassword ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Create a strong password" required aria-required="true" className="h-11 bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] rounded-xl pr-11 focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-all duration-200" />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors" aria-label={showNewPassword ? 'Hide password' : 'Show password'}>
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {newPassword.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 mt-2">
                          {pwChecks.map(check => (
                            <div key={check.label} className="flex items-center gap-1 text-[11px]">
                              {check.met ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-[#CBD5E1]" />}
                              <span className={check.met ? 'text-emerald-600' : 'text-[#94A3B8]'}>{check.label}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-11 bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium rounded-xl transition-all duration-200" disabled={loading || !pwValidation.valid}>
                      {loading ? (
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Resetting...</span></div>
                      ) : 'Reset Password'}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ── Reset Success Step ── */}
              {step === 'reset-success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-4"
                >
                  <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#0F172A] tracking-tight mb-2">Password reset</h2>
                  <p className="text-sm text-[#64748B] mb-6">
                    Your password has been updated. Sign in with your new password.
                  </p>
                  <Button onClick={goBack} className="h-11 bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium rounded-xl transition-all duration-200">
                    Back to sign in
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-xs text-[#94A3B8] mt-6">
            Secure AI-powered platform for modern teams
          </p>
        </motion.div>
      </div>
    </div>
  )
}