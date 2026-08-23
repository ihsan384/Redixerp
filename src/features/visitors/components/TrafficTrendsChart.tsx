import { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { BarChart3, TrendingUp, Eye, Users } from 'lucide-react'
import type { TrafficDataPoint } from '../types'

interface TrafficTrendsChartProps {
  data: TrafficDataPoint[]
  timeframeLabel: string
}

export function TrafficTrendsChart({ data, timeframeLabel }: TrafficTrendsChartProps) {
  const [metricView, setMetricView] = useState<'both' | 'views' | 'visitors'>('both')

  const totalViews = data.reduce((acc, d) => acc + d.pageViews, 0)
  const maxViews = Math.max(...data.map((d) => d.pageViews), 1)

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Traffic & Visitor Activity</h3>
              <p className="text-xs text-zinc-400">
                Timeline distribution for <span className="text-zinc-200">{timeframeLabel}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center rounded-xl bg-white/[0.04] p-1 border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setMetricView('both')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              metricView === 'both'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>All Metrics</span>
          </button>
          <button
            onClick={() => setMetricView('views')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              metricView === 'views'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Eye className="h-3 w-3" />
            <span>Page Views</span>
          </button>
          <button
            onClick={() => setMetricView('visitors')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              metricView === 'visitors'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="h-3 w-3" />
            <span>Visitors</span>
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="mt-6 h-[300px] w-full">
        {data.length === 0 || totalViews === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
            <BarChart3 className="h-8 w-8 text-zinc-600" />
            <p className="text-sm font-medium text-zinc-400">No traffic recorded in this timeframe yet</p>
            <p className="text-xs text-zinc-600">New visits from REDIX.MEDIA will automatically plot here</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />

              <XAxis
                dataKey="label"
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              />

              <YAxis
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-white/15 bg-[#181818]/95 p-3 shadow-2xl backdrop-blur-md">
                        <p className="text-xs font-bold text-zinc-300">{label}</p>
                        <div className="mt-2 space-y-1.5">
                          {(metricView === 'both' || metricView === 'views') && (
                            <div className="flex items-center justify-between gap-4 text-xs">
                              <span className="flex items-center gap-1.5 text-zinc-400">
                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                Page Views:
                              </span>
                              <span className="font-bold text-white">
                                {payload.find((p) => p.dataKey === 'pageViews')?.value || 0}
                              </span>
                            </div>
                          )}
                          {(metricView === 'both' || metricView === 'visitors') && (
                            <div className="flex items-center justify-between gap-4 text-xs">
                              <span className="flex items-center gap-1.5 text-zinc-400">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                Unique Visitors:
                              </span>
                              <span className="font-bold text-white">
                                {payload.find((p) => p.dataKey === 'uniqueVisitors')?.value || 0}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />

              {(metricView === 'both' || metricView === 'views') && (
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name="Page Views"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#viewsGradient)"
                  activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                />
              )}

              {(metricView === 'both' || metricView === 'visitors') && (
                <Area
                  type="monotone"
                  dataKey="uniqueVisitors"
                  name="Unique Visitors"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#visitorsGradient)"
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend & quick summary */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-3 text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="font-medium text-zinc-300">Page Views</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="font-medium text-zinc-300">Unique Visitors</span>
          </div>
        </div>
        <div className="font-mono text-zinc-500">
          Peak Volume: <span className="text-zinc-300 font-bold">{maxViews}</span> hits / bucket
        </div>
      </div>
    </div>
  )
}
