'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Bug, X, Upload, Camera, Send, Sparkles, CheckCircle2,
  AlertTriangle, Loader2, Copy, Check, FileCode, MessageSquare,
  ImageIcon, Trash2, ChevronDown, ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'

type FixStatus = 'idle' | 'analyzing' | 'fixing' | 'done' | 'error'

interface BugFixResult {
  errorFound: string
  rootCause: string
  affectedFile: string
  fixDescription: string
  fixCode: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
}

export function BugReportButton() {
  const [open, setOpen] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotName, setScreenshotName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<FixStatus>('idle')
  const [result, setResult] = useState<BugFixResult | null>(null)
  const [showFixCode, setShowFixCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  const addLog = (msg: string) => setLogs(prev => [...prev, msg])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, GIF, WebP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB')
      return
    }
    setScreenshotName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setScreenshot(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) handleFile(file)
        break
      }
    }
  }, [handleFile])

  const handleSubmit = async () => {
    if (!screenshot && !description.trim()) {
      toast.error('Please upload a screenshot or describe the issue')
      return
    }

    setStatus('analyzing')
    setResult(null)
    setLogs([])
    setShowFixCode(false)

    addLog('Analyzing report...')

    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshot: screenshot || undefined,
          description: description.trim(),
          currentView: typeof window !== 'undefined' ? window.location.pathname : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: new Date().toISOString(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze bug')
      }

      if (data.logs) {
        setLogs(data.logs)
      }

      addLog('AI analysis complete!')
      setStatus('done')
      setResult(data.result)
      toast.success('AI found the issue and generated a fix!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      addLog(`Error: ${msg}`)
      setStatus('error')
      toast.error(msg)
    }
  }

  const handleCopy = () => {
    if (result?.fixCode) {
      navigator.clipboard.writeText(result.fixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Fix code copied to clipboard!')
    }
  }

  const reset = () => {
    setScreenshot(null)
    setScreenshotName('')
    setDescription('')
    setStatus('idle')
    setResult(null)
    setLogs([])
    setShowFixCode(false)
  }

  const severityColors: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <>
      {/* ── Floating Bug Button ── */}
      <motion.button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full',
          'bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10',
          'shadow-lg shadow-black/5 dark:shadow-black/30',
          'flex items-center justify-center gap-1.5',
          'hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/30',
          'transition-all duration-200 group',
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Report a bug"
      >
        <Bug className="w-5 h-5 text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400 transition-colors" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-900" />
      </motion.button>

      {/* ── Modal Overlay ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[4px]" onClick={() => { setOpen(false); reset() }} />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-white/[0.08] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                    <Bug className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Bug Reporter</h2>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Screenshot upload karo, AI fix karega</p>
                  </div>
                </div>
                <button
                  onClick={() => { setOpen(false); reset() }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-none">
                {/* Screenshot Upload */}
                <div>
                  <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-2 block">Screenshot / Error Image</label>
                  {screenshot ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                      <img src={screenshot} alt="Bug screenshot" className="w-full max-h-48 object-contain" />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <button
                          onClick={() => { setScreenshot(null); setScreenshotName('') }}
                          className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors backdrop-blur-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {screenshotName && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/50 text-white text-[10px] font-medium backdrop-blur-sm">
                          {screenshotName}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      ref={dragRef}
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onPaste={handlePaste}
                      onClick={() => fileRef.current?.click()}
                      className={cn(
                        'rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10',
                        'bg-gray-50/50 dark:bg-white/[0.02]',
                        'flex flex-col items-center justify-center py-8 px-4 cursor-pointer',
                        'hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/[0.04]',
                        'transition-all duration-200'
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mb-3">
                        <Upload className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-[12px] font-medium text-gray-600 dark:text-gray-300">
                        Click to upload, drag & drop, or paste
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, GIF, WebP up to 10MB</p>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Describe the issue (optional)
                    </span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 'Dashboard pe chart nahi dikh raha' ya 'Create account pe error aa raha hai'..."
                    rows={3}
                    className={cn(
                      'w-full rounded-xl border border-gray-200 dark:border-white/10',
                      'bg-white dark:bg-white/[0.03] text-gray-900 dark:text-gray-100',
                      'text-[13px] px-4 py-3 resize-none',
                      'placeholder:text-gray-400 dark:placeholder:text-gray-600',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 dark:focus:border-blue-500/40',
                      'transition-all duration-150'
                    )}
                  />
                </div>

                {/* AI Logs */}
                {logs.length > 0 && (
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">AI Process</span>
                    </div>
                    <div className="p-3 space-y-1 max-h-32 overflow-y-auto scrollbar-none">
                      {logs.map((log, i) => (
                        <p key={i} className="text-[11px] text-gray-500 dark:text-gray-500 font-mono">
                          <span className="text-gray-400 dark:text-gray-600 mr-1.5">&gt;</span>{log}
                        </p>
                      ))}
                      {status === 'analyzing' && (
                        <div className="ai-thinking mt-1">
                          <span /><span /><span />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Result */}
                {result && status === 'done' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {/* Error Found */}
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                          result.severity === 'critical' || result.severity === 'high'
                            ? 'bg-red-50 dark:bg-red-500/10'
                            : 'bg-amber-50 dark:bg-amber-500/10'
                        )}>
                          <AlertTriangle className={cn(
                            'w-4 h-4',
                            result.severity === 'critical' || result.severity === 'high'
                              ? 'text-red-500'
                              : 'text-amber-500'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border', severityColors[result.severity])}>
                              {result.severity}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {Math.round(result.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{result.errorFound}</p>
                        </div>
                      </div>

                      {/* Root Cause */}
                      <div className="ml-11">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1">Root Cause</p>
                        <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">{result.rootCause}</p>
                      </div>

                      {/* Affected File */}
                      <div className="ml-11 flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-gray-400" />
                        <code className="text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
                          {result.affectedFile}
                        </code>
                      </div>
                    </div>

                    {/* Fix Description */}
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/[0.04] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[12px] font-semibold text-emerald-800 dark:text-emerald-300">AI Fix</span>
                      </div>
                      <p className="text-[12px] text-emerald-700 dark:text-emerald-400 leading-relaxed">{result.fixDescription}</p>

                      {/* Fix Code */}
                      {result.fixCode && (
                        <div className="mt-3">
                          <button
                            onClick={() => setShowFixCode(!showFixCode)}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
                          >
                            {showFixCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {showFixCode ? 'Hide' : 'Show'} Fix Code
                          </button>
                          <AnimatePresence>
                            {showFixCode && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 relative">
                                  <pre className="text-[11px] font-mono text-gray-800 dark:text-gray-200 bg-gray-900 dark:bg-black/40 rounded-lg p-3 overflow-x-auto max-h-60 scrollbar-none leading-relaxed">
                                    {result.fixCode}
                                  </pre>
                                  <button
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors backdrop-blur-sm"
                                  >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Error State */}
                {status === 'error' && (
                  <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/[0.04] p-4">
                    <p className="text-[12px] text-red-700 dark:text-red-400">
                      AI analysis failed. Please try again or describe the issue in more detail.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
                <button
                  onClick={reset}
                  className="text-[12px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={status === 'analyzing'}
                >
                  Clear
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={status === 'analyzing' || (!screenshot && !description.trim())}
                  className={cn(
                    'h-9 px-5 rounded-xl text-[12px] font-medium flex items-center gap-2',
                    'transition-all duration-200',
                    status === 'analyzing' || (!screenshot && !description.trim())
                      ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/20'
                  )}
                >
                  {status === 'analyzing' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Fix
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}