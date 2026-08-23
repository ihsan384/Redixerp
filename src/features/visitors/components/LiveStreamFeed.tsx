import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Wifi, Smartphone, Laptop, Tablet, Clock, MapPin, Eye, Sparkles } from 'lucide-react'
import type { SiteVisitor } from '@/types/database.types'

interface LiveStreamFeedProps {
  visitors: SiteVisitor[]
  onSelectVisitor: (visitor: SiteVisitor) => void
}

function getCountryFlag(code?: string | null): string {
  if (!code || code.length !== 2 || code === 'UN') return '🌐'
  const base = 127397
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => base + c.charCodeAt(0)))
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${Math.max(diffSec, 1)}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  return `${Math.floor(diffMin / 60)}h ago`
}

export function LiveStreamFeed({ visitors, onSelectVisitor }: LiveStreamFeedProps) {
  const recentVisitors = visitors.slice(0, 50)

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Live Visitor Stream</h3>
            <p className="text-xs text-zinc-400">
              Live pageview events on REDIX.MEDIA streaming in real time
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Connected to Realtime
        </span>
      </div>

      <div className="mt-5 space-y-2.5">
        {recentVisitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wifi className="h-10 w-10 animate-pulse text-zinc-600 mb-3" />
            <p className="text-sm font-semibold text-zinc-400">Listening for visitor traffic...</p>
            <p className="text-xs text-zinc-600 mt-1 max-w-sm">
              Any time someone visits REDIX.MEDIA or navigates between pages, hits will stream here instantly.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {recentVisitors.map((v) => {
              const dev = (v.device_type || 'desktop').toLowerCase()
              const DevIcon = dev === 'mobile' ? Smartphone : dev === 'tablet' ? Tablet : Laptop

              return (
                <motion.div
                  key={v.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => onSelectVisitor(v)}
                  className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition hover:border-red-500/40 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-300 group-hover:border-red-500/30 group-hover:text-red-400">
                      <DevIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-400">
                          {v.page_path || '/'}
                        </span>
                        {v.page_title && (
                          <span className="text-xs text-zinc-400 truncate max-w-xs hidden md:inline">
                            — {v.page_title}
                          </span>
                        )}
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                          {v.device_type || 'Desktop'}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                        <span className="text-sm">{getCountryFlag(v.country_code)}</span>
                        <span className="font-medium text-zinc-300">
                          {v.city ? `${v.city}, ` : ''}{v.country || 'Unknown'}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">{v.browser || 'Browser'} / {v.os || 'OS'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium text-zinc-400">{formatRelativeTime(v.created_at)}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectVisitor(v)
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-zinc-300 opacity-80 group-hover:opacity-100 group-hover:bg-red-500/10 group-hover:border-red-500/30 group-hover:text-red-300 transition"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
