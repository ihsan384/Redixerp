import { ExternalLink, FileText, Share2, Compass, ArrowUpRight } from 'lucide-react'
import type { PageMetric, ReferrerMetric } from '../types'

interface TopPagesAndReferrersProps {
  topPages: PageMetric[]
  referrerBreakdown: ReferrerMetric[]
}

export function TopPagesAndReferrers({ topPages, referrerBreakdown }: TopPagesAndReferrersProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Top Visited Pages (2 cols) */}
      <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Top Visited Pages</h3>
              <p className="text-xs text-zinc-400">Most engaged URLs on REDIX.MEDIA</p>
            </div>
          </div>
          <span className="text-xs text-zinc-500 font-medium">Ranked by Views</span>
        </div>

        <div className="mt-5 space-y-3">
          {topPages.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">No page views recorded yet</div>
          ) : (
            topPages.map((page, idx) => (
              <div
                key={page.path}
                className="group relative flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition hover:border-red-500/30 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-zinc-400">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-400 truncate">
                          {page.path}
                        </span>
                        <a
                          href={`https://redix.media${page.path.startsWith('/') ? page.path : `/${page.path}`}`}
                          target="_blank"
                          rel="noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-white"
                          title="Open live page"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <p className="text-xs text-zinc-400 truncate max-w-md">{page.title || 'REDIX.MEDIA'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <div className="text-xs font-bold text-white">{page.views.toLocaleString()}</div>
                      <div className="text-[10px] text-zinc-500 font-medium">
                        {page.uniqueVisitors} visitors
                      </div>
                    </div>
                    <span className="w-12 text-right text-xs font-black text-red-400">
                      {page.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400"
                    style={{ width: `${Math.max(page.percentage, 3)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Referrers / Traffic Sources (1 col) */}
      <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Traffic Referrers</h3>
                <p className="text-xs text-zinc-400">Acquisition origins</p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {referrerBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">No referrer data recorded</div>
            ) : (
              referrerBreakdown.map((ref) => (
                <div
                  key={ref.source}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Compass className="h-4 w-4 shrink-0 text-purple-400" />
                    <span className="font-semibold text-zinc-200 truncate">{ref.source}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-white">{ref.count}</span>
                    <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[11px] font-bold text-purple-300">
                      {ref.percentage}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-zinc-400">
          💡 <span className="text-zinc-300 font-semibold">Tip:</span> Use campaign parameters (e.g.{' '}
          <code className="text-red-400">?ref=instagram</code>) in social links to track campaigns cleanly.
        </div>
      </div>
    </div>
  )
}
