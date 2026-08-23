import { Globe, Smartphone, Monitor, Tablet, Laptop, Cpu, Compass, MapPin } from 'lucide-react'
import type { GeoMetric, TechMetric } from '../types'

interface GeoAndDeviceBreakdownProps {
  geoBreakdown: GeoMetric[]
  deviceBreakdown: TechMetric[]
  osBreakdown: TechMetric[]
  browserBreakdown: TechMetric[]
}

// Country code to Flag emoji helper
function getCountryFlag(code?: string): string {
  if (!code || code.length !== 2 || code === 'UN') return '🌐'
  const base = 127397
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => base + c.charCodeAt(0)))
}

export function GeoAndDeviceBreakdown({
  geoBreakdown,
  deviceBreakdown,
  osBreakdown,
  browserBreakdown,
}: GeoAndDeviceBreakdownProps) {
  const topCountries = geoBreakdown.slice(0, 5)
  const topCities = geoBreakdown
    .flatMap((g) => g.cities.map((c) => ({ ...c, country: g.country })))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Geo Distribution Card */}
      <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-xl">
        <div>
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Geographic Locations</h3>
                <p className="text-xs text-zinc-400">Visitor distribution by country & top cities</p>
              </div>
            </div>
            <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              {geoBreakdown.length} {geoBreakdown.length === 1 ? 'Country' : 'Countries'}
            </span>
          </div>

          {/* Countries list with visual bars */}
          <div className="mt-5 space-y-4">
            {topCountries.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">No geographic data recorded yet</div>
            ) : (
              topCountries.map((geo) => (
                <div key={geo.country} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getCountryFlag(geo.countryCode)}</span>
                      <span className="font-semibold text-zinc-200">{geo.country}</span>
                      <span className="text-[11px] font-mono text-zinc-500">({geo.countryCode})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{geo.count}</span>
                      <span className="text-zinc-500">({geo.percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${Math.max(geo.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Cities Pill Tags */}
        {topCities.length > 0 && (
          <div className="mt-6 border-t border-white/5 pt-4">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Top Cities</span>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {topCities.map((c, i) => (
                <span
                  key={`${c.city}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-500/30 hover:bg-emerald-500/5"
                >
                  <MapPin className="h-3 w-3 text-emerald-400" />
                  <span className="font-medium">{c.city}</span>
                  <span className="rounded bg-white/10 px-1 py-0.2 text-[10px] font-bold text-zinc-400">
                    {c.count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tech & Devices Card */}
      <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-xl">
        <div>
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Laptop className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Devices & Technologies</h3>
                <p className="text-xs text-zinc-400">Platforms, Operating Systems, & Browsers</p>
              </div>
            </div>
          </div>

          {/* Devices breakdown */}
          <div className="mt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Device Platform</span>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {['Desktop', 'Mobile', 'Tablet'].map((dev) => {
                const found = deviceBreakdown.find((d) => d.name.toLowerCase() === dev.toLowerCase())
                const pct = found ? found.percentage : 0
                const count = found ? found.count : 0
                const Icon = dev === 'Desktop' ? Monitor : dev === 'Mobile' ? Smartphone : Tablet

                return (
                  <div
                    key={dev}
                    className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center transition hover:border-blue-500/30"
                  >
                    <Icon className="h-5 w-5 text-blue-400" />
                    <span className="mt-2 text-xs font-semibold text-zinc-300">{dev}</span>
                    <span className="text-lg font-black text-white">{pct}%</span>
                    <span className="text-[11px] text-zinc-500">{count} views</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Operating Systems */}
          <div className="mt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Operating Systems</span>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {osBreakdown.length === 0 ? (
                <span className="text-xs text-zinc-500">No OS data</span>
              ) : (
                osBreakdown.map((os) => (
                  <span
                    key={os.name}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300"
                  >
                    <Cpu className="h-3 w-3 text-purple-400" />
                    <span>{os.name}</span>
                    <span className="font-bold text-purple-400">{os.percentage}%</span>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Browsers */}
          <div className="mt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Browsers</span>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {browserBreakdown.length === 0 ? (
                <span className="text-xs text-zinc-500">No browser data</span>
              ) : (
                browserBreakdown.map((b) => (
                  <span
                    key={b.name}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300"
                  >
                    <Compass className="h-3 w-3 text-amber-400" />
                    <span>{b.name}</span>
                    <span className="font-bold text-amber-400">{b.percentage}%</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
