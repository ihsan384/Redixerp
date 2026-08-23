import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Radio,
  BarChart3,
  ListFilter,
  FileText,
  Clock,
  Sparkles,
  Download,
  ExternalLink,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/Primitives'
import { LivePulseBar } from './components/LivePulseBar'
import { VisitorStatsCards } from './components/VisitorStatsCards'
import { TrafficTrendsChart } from './components/TrafficTrendsChart'
import { GeoAndDeviceBreakdown } from './components/GeoAndDeviceBreakdown'
import { TopPagesAndReferrers } from './components/TopPagesAndReferrers'
import { VisitorLogsTable } from './components/VisitorLogsTable'
import { LiveStreamFeed } from './components/LiveStreamFeed'
import { VisitorJourneyModal } from './components/VisitorJourneyModal'
import {
  fetchRawVisitors,
  computeVisitorAnalytics,
  exportVisitorsToCSV,
} from './services/visitorService'
import type { SiteVisitor } from '@/types/database.types'
import type { TimeRangePreset } from './types'

export function VisitorsPage() {
  const [timePreset, setTimePreset] = useState<TimeRangePreset>('today')
  const [visitors, setVisitors] = useState<SiteVisitor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'live' | 'logs' | 'pages'>('overview')
  const [selectedVisitor, setSelectedVisitor] = useState<SiteVisitor | null>(null)
  const [isRealtimeActive, setIsRealtimeActive] = useState(true)
  const [latestHit, setLatestHit] = useState<SiteVisitor | null>(null)

  // Fetch visitors
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchRawVisitors(timePreset, 2500)
      setVisitors(data)
      if (data.length > 0 && !latestHit) {
        setLatestHit(data[0])
      }
    } catch (err) {
      console.error('Failed to load visitor analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [timePreset])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Real-time Supabase postgres_changes on site_visitors table
  useEffect(() => {
    if (!isRealtimeActive) return

    const channel = supabase
      .channel('realtime:site_visitors')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'site_visitors' },
        (payload) => {
          const newVisitor = payload.new as SiteVisitor
          setLatestHit(newVisitor)
          setVisitors((prev) => [newVisitor, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isRealtimeActive])

  // Computed overview
  const overview = useMemo(() => {
    return computeVisitorAnalytics(visitors, timePreset)
  }, [visitors, timePreset])

  const timeframeLabels: Record<TimeRangePreset, string> = {
    today: 'Today (Midnight - Now)',
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    all: 'All Time Records',
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        eyebrow="Website Ecosystem"
        title="Visitor Analytics & Live Traffic"
        description="Real-time monitoring and comprehensive visitor insights for REDIX.MEDIA"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Presets */}
            <div className="flex items-center rounded-xl bg-white/[0.04] p-1 border border-white/10">
              {(['today', '24h', '7d', '30d', 'all'] as TimeRangePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTimePreset(preset)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    timePreset === preset
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <button
              onClick={() => exportVisitorsToCSV(visitors)}
              disabled={visitors.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        }
      />

      {/* Real-time Live Pulse Banner */}
      <LivePulseBar
        activeNow={overview.activeNow}
        latestHit={latestHit}
        isRealtimeActive={isRealtimeActive}
        onToggleRealtime={() => setIsRealtimeActive((prev) => !prev)}
        onManualRefresh={loadData}
        isLoading={loading}
        onViewHit={(hit) => setSelectedVisitor(hit)}
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-white/10 text-white border border-white/10'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4 text-red-400" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition relative ${
            activeTab === 'live'
              ? 'bg-white/10 text-white border border-white/10'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>Live Stream</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[10px] font-bold text-emerald-400">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'logs'
              ? 'bg-white/10 text-white border border-white/10'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <ListFilter className="h-4 w-4 text-blue-400" />
          <span>Visitor Logs</span>
          <span className="rounded-full bg-white/10 px-2 py-0.2 text-[10px] font-bold text-zinc-300">
            {visitors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'pages'
              ? 'bg-white/10 text-white border border-white/10'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4 text-purple-400" />
          <span>Pages & Traffic Sources</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <VisitorStatsCards overview={overview} />

          {/* Traffic Timeline Chart */}
          <TrafficTrendsChart data={overview.trafficTrends} timeframeLabel={timeframeLabels[timePreset]} />

          {/* Geographic & Device Stack */}
          <GeoAndDeviceBreakdown
            geoBreakdown={overview.geoBreakdown}
            deviceBreakdown={overview.deviceBreakdown}
            osBreakdown={overview.osBreakdown}
            browserBreakdown={overview.browserBreakdown}
          />

          {/* Top Pages & Referrers */}
          <TopPagesAndReferrers
            topPages={overview.topPages}
            referrerBreakdown={overview.referrerBreakdown}
          />

          {/* Recent Visitor Logs snippet */}
          <div>
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Visitor Explorations
              </h3>
              <button
                onClick={() => setActiveTab('logs')}
                className="text-xs font-semibold text-red-400 hover:text-red-300"
              >
                View all logs →
              </button>
            </div>
            <VisitorLogsTable
              visitors={visitors.slice(0, 15)}
              onSelectVisitor={(v) => setSelectedVisitor(v)}
            />
          </div>
        </div>
      )}

      {activeTab === 'live' && (
        <LiveStreamFeed
          visitors={visitors}
          onSelectVisitor={(v) => setSelectedVisitor(v)}
        />
      )}

      {activeTab === 'logs' && (
        <VisitorLogsTable
          visitors={visitors}
          onSelectVisitor={(v) => setSelectedVisitor(v)}
        />
      )}

      {activeTab === 'pages' && (
        <div className="space-y-6">
          <TopPagesAndReferrers
            topPages={overview.topPages}
            referrerBreakdown={overview.referrerBreakdown}
          />
        </div>
      )}

      {/* Visitor Journey Drawer / Modal */}
      <VisitorJourneyModal
        visitor={selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
      />
    </div>
  )
}
