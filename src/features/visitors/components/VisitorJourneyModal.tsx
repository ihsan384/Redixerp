import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Compass,
  MapPin,
  Clock,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Layers,
  ArrowRight,
  Shield,
  Copy,
  Check,
  UserPlus,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { fetchVisitorJourney } from '../services/visitorService'
import type { SiteVisitor } from '@/types/database.types'
import type { VisitorSessionJourney } from '../types'

interface VisitorJourneyModalProps {
  visitor: SiteVisitor | null
  onClose: () => void
}

export function VisitorJourneyModal({ visitor, onClose }: VisitorJourneyModalProps) {
  const [journey, setJourney] = useState<VisitorSessionJourney | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!visitor?.visitor_id) return
    setLoading(true)
    fetchVisitorJourney(visitor.visitor_id)
      .then((res) => {
        setJourney(res)
      })
      .finally(() => setLoading(false))
  }, [visitor?.visitor_id])

  if (!visitor) return null

  const handleCopyId = () => {
    navigator.clipboard.writeText(visitor.visitor_id)
    setCopied(true)
    toast.success('Visitor ID copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const hits = journey?.hits || [visitor]
  const deviceType = visitor.device_type?.toLowerCase() || 'desktop'
  const DeviceIcon = deviceType === 'mobile' ? Smartphone : deviceType === 'tablet' ? Tablet : Laptop

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#121212] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#161616] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                <DeviceIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Visitor Session Journey</h3>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                    {visitor.city || visitor.country || 'Visitor'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>ID: <code className="text-zinc-300">{visitor.visitor_id.slice(0, 16)}...</code></span>
                  <button
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 text-zinc-400 hover:text-white"
                    title="Copy full Visitor ID"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Grid of details */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase">Location</span>
                <p className="mt-1 text-xs font-bold text-white truncate">
                  {visitor.city ? `${visitor.city}, ` : ''}{visitor.country || 'Unknown'}
                </p>
                <p className="text-[10px] text-zinc-400">{visitor.region || visitor.country_code}</p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase">Device & OS</span>
                <p className="mt-1 text-xs font-bold text-white capitalize">{visitor.device_type || 'Desktop'}</p>
                <p className="text-[10px] text-zinc-400 truncate">{visitor.os || 'Unknown OS'}</p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase">Browser & Screen</span>
                <p className="mt-1 text-xs font-bold text-white truncate">{visitor.browser || 'Other'}</p>
                <p className="text-[10px] text-zinc-400 font-mono">{visitor.screen_resolution || 'N/A'}</p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase">Referrer Source</span>
                <p className="mt-1 text-xs font-bold text-white truncate">{visitor.referrer || 'Direct'}</p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">{visitor.language || 'en'}</p>
              </div>
            </div>

            {/* Navigation Flow Timeline */}
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-bold text-white">Visited Pages & Timeline</span>
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  {hits.length} {hits.length === 1 ? 'page view' : 'page views'} in this session
                </span>
              </div>

              <div className="mt-4 relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {hits.map((hit, idx) => {
                  const isLast = idx === hits.length - 1
                  const isFirst = idx === 0
                  const time = new Date(hit.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                  const date = new Date(hit.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })

                  return (
                    <div key={hit.id || idx} className="relative group">
                      {/* Step circle */}
                      <span
                        className={`absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border ${
                          isFirst
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : isLast
                            ? 'border-red-500 bg-red-500/20 text-red-400'
                            : 'border-zinc-600 bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      </span>

                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition group-hover:border-white/10 group-hover:bg-white/[0.04]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-red-400">
                              {hit.page_path}
                            </span>
                            {hit.page_title && (
                              <span className="text-xs font-medium text-zinc-300">
                                — {hit.page_title}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                            <Clock className="h-3 w-3" />
                            <span>{date} at {time}</span>
                          </div>
                        </div>

                        {hit.referrer && hit.referrer !== 'Direct' && isFirst && (
                          <div className="mt-2 text-[11px] text-zinc-400">
                            Came from:{' '}
                            <span className="font-mono text-zinc-300">{hit.referrer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Technical User Agent & Network snippet */}
            {visitor.user_agent && (
              <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Raw User-Agent Header
                </span>
                <p className="mt-1 font-mono text-[11px] text-zinc-400 break-all leading-relaxed">
                  {visitor.user_agent}
                </p>
                {visitor.ip_address && (
                  <p className="mt-2 text-[10px] font-mono text-zinc-500">
                    IP Address: <span className="text-zinc-300">{visitor.ip_address}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-white/10 bg-[#161616] px-6 py-3.5">
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Visitor ID</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
