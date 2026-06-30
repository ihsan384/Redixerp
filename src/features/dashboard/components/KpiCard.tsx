import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  icon: ReactNode
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  tone?: 'brand' | 'success' | 'warning' | 'info' | 'neutral'
  index?: number
}

const toneStyles = {
  brand: 'border-red-500/20 bg-red-500/10 text-red-400',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  info: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  neutral: 'border-white/8 bg-white/[0.04] text-zinc-300',
}

export function KpiCard({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  tone = 'neutral',
  index = 0,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card group flex flex-col justify-between w-full p-6 transition-all duration-300 hover:translate-y-[-2px]"
    >
      <div className="flex items-start justify-between mb-5">
        <div className={cn(
          'flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-250 shrink-0',
          toneStyles[tone],
          'group-hover:bg-white/[0.06] group-hover:text-white'
        )}>
          {icon}
        </div>
        {change && (
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-lg border',
              changeType === 'positive' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
              changeType === 'negative' && 'bg-red-500/10 text-red-400 border-red-500/15',
              changeType === 'neutral' && 'bg-white/[0.04] text-[#A1A1AA] border-white/[0.06]'
            )}
          >
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-[28px] font-bold text-white tracking-tight count-up leading-none">{value}</p>
        <p className="text-caption text-zinc-400 mt-2 font-medium group-hover:text-zinc-300 transition-colors">{title}</p>
      </div>
    </motion.div>
  )
}
