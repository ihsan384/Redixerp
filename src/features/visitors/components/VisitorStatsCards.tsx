import { motion } from 'framer-motion'
import { Eye, Users, Layers, Smartphone, Globe, TrendingUp, Compass, Monitor } from 'lucide-react'
import type { VisitorAnalyticsOverview } from '../types'

interface VisitorStatsCardsProps {
  overview: VisitorAnalyticsOverview
}

export function VisitorStatsCards({ overview }: VisitorStatsCardsProps) {
  const cards = [
    {
      title: 'Total Page Views',
      value: overview.totalPageViews.toLocaleString(),
      subtitle: `${overview.trafficTrends.reduce((acc, t) => acc + t.pageViews, 0)} recorded hits`,
      icon: Eye,
      color: 'red',
      glow: 'rgba(239, 68, 68, 0.15)',
      badge: 'Traffic Volume',
    },
    {
      title: 'Unique Visitors',
      value: overview.uniqueVisitors.toLocaleString(),
      subtitle: `${overview.totalSessions} browsing sessions`,
      icon: Users,
      color: 'blue',
      glow: 'rgba(59, 130, 246, 0.15)',
      badge: 'Distinct Users',
    },
    {
      title: 'Pages / Session',
      value: `${overview.pagesPerSession || 1.0}`,
      subtitle: `Depth of engagement`,
      icon: Layers,
      color: 'purple',
      glow: 'rgba(168, 85, 247, 0.15)',
      badge: 'Session Depth',
    },
    {
      title: 'Top Traffic Source',
      value: overview.topCountry.name !== 'N/A' ? overview.topCountry.name : 'Direct / Organic',
      subtitle: `${overview.topDevice.name} (${overview.topDevice.percentage}% share)`,
      icon: Globe,
      color: 'emerald',
      glow: 'rgba(16, 185, 129, 0.15)',
      badge: `${overview.topCountry.percentage}% traffic`,
    },
  ]

  const colorStyles: Record<string, { border: string; bg: string; text: string; iconBg: string }> = {
    red: {
      border: 'border-red-500/20 hover:border-red-500/40',
      bg: 'from-red-500/5 to-transparent',
      text: 'text-red-400',
      iconBg: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      bg: 'from-blue-500/5 to-transparent',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      bg: 'from-purple-500/5 to-transparent',
      text: 'text-purple-400',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bg: 'from-emerald-500/5 to-transparent',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon
        const style = colorStyles[card.color] || colorStyles.red

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`group relative overflow-hidden rounded-2xl border bg-[#111111] bg-gradient-to-b p-5 shadow-lg transition-all duration-300 ${style.border} ${style.bg}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {card.title}
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-3xl font-black tracking-tight text-white">{card.value}</h3>
                </div>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${style.iconBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-xs font-medium text-zinc-400 truncate">{card.subtitle}</span>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${style.iconBg}`}>
                {card.badge}
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
