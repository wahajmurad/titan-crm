'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

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
    <div className="min-h-screen flex">
      {/* Left Panel - Blue Gradient Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-[#2563EB] via-[#2563EB] to-[#1D4ED8] overflow-hidden items-center justify-center">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white/20 rounded-full" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/15 rounded-full" />
        <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-white/10 rounded-full" />
        <div className="absolute top-2/3 right-1/4 w-2.5 h-2.5 bg-white/20 rounded-full" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
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
            className="mx-auto w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl"
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
              <div className="h-px w-8 bg-white/30" />
              <Sparkles className="w-4 h-4 text-white/60" />
              <div className="h-px w-8 bg-white/30" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg text-white/80 font-medium leading-relaxed"
          >
            AI-Powered Growth<br />Operating System
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex items-center justify-center gap-6 text-white/50 text-sm"
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 font-bold text-xs">10x</div>
              <span className="text-[11px]">Faster</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 font-bold text-xs">AI</div>
              <span className="text-[11px]">Native</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 font-bold text-xs">24/7</div>
              <span className="text-[11px]">Active</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] p-6 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
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
            <div className="w-10 h-10 bg-gradient-to-br from-[#2563EB] to-[#3B82F6] rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="font-bold text-[#0F172A] text-lg tracking-tight">TITAN</span>
            <span className="text-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-bold rounded-md px-1.5 py-0.5 leading-none">AI</span>
          </div>

          {/* Premium card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">Welcome back</h2>
              <p className="text-sm text-[#475569] mt-1.5">Sign in to your TITAN account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-medium text-[#0F172A]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="h-11 bg-[#F8FAFC] border-gray-200 text-[#0F172A] placeholder:text-[#94A3B8] rounded-xl focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[13px] font-medium text-[#0F172A]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="h-11 bg-[#F8FAFC] border-gray-200 text-[#0F172A] placeholder:text-[#94A3B8] rounded-xl focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-all duration-200"
                />
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#2563EB] hover:to-[#3B82F6] text-white font-medium rounded-xl shadow-sm shadow-blue-500/20 transition-all duration-200 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>
          </div>

          <p className="text-center text-xs text-[#94A3B8] mt-6">
            Secure AI-powered platform for modern teams
          </p>
        </motion.div>
      </div>
    </div>
  )
}