import { cn } from '@/utils/cn'
import type { LeadStatus } from '@/types'
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/utils/constants'

interface LeadStatusBadgeProps {
  status: LeadStatus
  size?: 'sm' | 'md'
}

export function LeadStatusBadge({ status, size = 'sm' }: LeadStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-lg',
        LEAD_STATUS_COLORS[status],
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      )}
    >
      <span className={cn(
        'rounded-full pulse-dot',
        size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
        status === 'converted' ? 'bg-emerald-400' :
        status === 'interested' ? 'bg-green-400' :
        status === 'not_interested' || status === 'lost' ? 'bg-red-400' :
        status === 'meeting_scheduled' ? 'bg-indigo-400' :
        status === 'new' ? 'bg-blue-400' :
        'bg-gray-400'
      )} />
      {LEAD_STATUS_LABELS[status]}
    </span>
  )
}
