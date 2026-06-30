import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  icon: ReactNode
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  index?: number
}

export function KpiCard({ title, value, icon, change, changeType = 'neutral', index = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-card border border-[#1e1e1e] rounded-xl p-6 shadow-sm hover:border-[#2a2a2a] transition-colors group h-full flex flex-col justify-between w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-white/[0.04] border border-white/[0.06] rounded-xl flex items-center justify-center text-[#6b7280] group-hover:text-white group-hover:bg-white/[0.06] transition-colors">
          {icon}
        </div>
        {change && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-lg',
              changeType === 'positive' && 'bg-emerald-500/10 text-emerald-400',
              changeType === 'negative' && 'bg-red-500/10 text-red-400',
              changeType === 'neutral' && 'bg-gray-500/10 text-gray-400'
            )}
          >
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight count-up">{value}</p>
        <p className="text-xs text-[#6b7280] mt-1 font-medium">{title}</p>
      </div>
    </motion.div>
  )
}
