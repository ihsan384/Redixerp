import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Radio, RefreshCw, Sparkles, ExternalLink, Globe, Wifi } from 'lucide-react'
import type { SiteVisitor } from '@/types/database.types'

interface LivePulseBarProps {
  activeNow: number
  latestHit: SiteVisitor | null
  isRealtimeActive: boolean
  onToggleRealtime: () => void
  onManualRefresh: () => void
  isLoading: boolean
  onViewHit?: (hit: SiteVisitor) => void
}

export function LivePulseBar({
  activeNow,
  latestHit,
  isRealtimeActive,
  onToggleRealtime,
  onManualRefresh,
  isLoading,
  onViewHit,
}: LivePulseBarProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#141414] via-[#1a1212] to-[#141414] p-4 shadow-xl backdrop-blur-xl">
      <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left: Active pulse & count */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-inner">
            <Radio className="h-6 w-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#111]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">{activeNow}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Right Now
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              Live visitors actively browsing <span className="text-zinc-200 font-semibold">REDIX.MEDIA</span> (past 15 mins)
            </p>
          </div>
        </div>

        {/* Middle: Latest Activity Stream snippet */}
        <div className="flex-1 md:mx-6">
          <AnimatePresence mode="wait">
            {latestHit ? (
              <motion.div
                key={latestHit.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => onViewHit?.(latestHit)}
                className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2 transition hover:border-red-500/30 hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <div className="truncate text-xs">
                    <span className="font-semibold text-zinc-200">
                      {latestHit.city || latestHit.country || 'Visitor'}
                    </span>{' '}
                    <span className="text-zinc-500">viewed</span>{' '}
                    <span className="font-mono text-red-400 font-medium">
                      {latestHit.page_path || '/'}
                    </span>
                    {latestHit.page_title && (
                      <span className="text-zinc-500 hidden lg:inline"> — {latestHit.page_title}</span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-[11px] text-zinc-400">
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 capitalize font-medium">
                    {latestHit.device_type || 'Desktop'}
                  </span>
                  <span className="hidden sm:inline text-zinc-500">Just now</span>
                  <Sparkles className="h-3.5 w-3.5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2 text-xs text-zinc-500">
                <Wifi className="h-3.5 w-3.5 animate-pulse text-zinc-400" />
                Waiting for incoming live traffic on REDIX.MEDIA...
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={onToggleRealtime}
            title={isRealtimeActive ? 'Live updates connected' : 'Live updates paused'}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
              isRealtimeActive
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-zinc-700 bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isRealtimeActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            {isRealtimeActive ? 'Live Stream On' : 'Live Paused'}
          </button>

          <button
            onClick={onManualRefresh}
            disabled={isLoading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
          </button>

          <a
            href="https://redix.media"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Open Website</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>
      </div>
    </div>
  )
}
