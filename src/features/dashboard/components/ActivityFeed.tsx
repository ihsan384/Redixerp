import { motion } from 'framer-motion'
import { Phone, ArrowUpRight, Clock, ThumbsUp, Calendar, CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Activity, Lead, Call } from '@/types'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'

interface RecentActivityFeedProps {
  activities: Activity[]
  leads: Lead[]
}

interface UpcomingFollowUpsProps {
  calls: Call[]
  leads: Lead[]
}

export function RecentActivityFeed({ activities, leads }: RecentActivityFeedProps) {
  const navigate = useNavigate()


  const recentActivities = activities.slice(0, 5)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-3.5 h-3.5 text-[#8c8c8c]" />
      case 'converted':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      case 'follow_up':
        return <Calendar className="w-3.5 h-3.5 text-yellow-400" />
      default:
        return <ThumbsUp className="w-3.5 h-3.5 text-[#636363]" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 hover:border-[#2a2a2a] transition-colors flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
          <button
            onClick={() => navigate('/leads')}
            className="text-xs text-[#4b5563] hover:text-white transition-colors flex items-center gap-1"
          >
            View Leads <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <p className="text-xs text-[#525252] italic p-6 text-center">No activities recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((item, i) => {
              const lead = leads.find((l) => l.id === item.lead_id)
              const timeString = formatDistanceToNow(new Date(item.created_at), { addSuffix: true })

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.01] transition-colors group"
                >
                  <div className="w-8 h-8 bg-white/[0.03] border border-[#1f1f1f] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {lead ? lead.shop_name : 'System Activity'}
                    </p>
                    <p className="text-[11px] text-[#8c8c8c] mt-0.5 leading-snug">{item.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <p className="text-[9px] text-[#525252] font-semibold uppercase">{timeString}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function UpcomingFollowUps({ calls, leads }: UpcomingFollowUpsProps) {
  const navigate = useNavigate()
  const todayStr = new Date().toISOString().split('T')[0]

  // Filter call logs that are followups scheduled for today onwards, and haven't been resolved
  const upcoming = calls
    .filter((c) => c.follow_up && c.follow_up_date && c.follow_up_date >= todayStr)
    .map((c) => ({
      ...c,
      lead: leads.find((l) => l.id === c.lead_id),
    }))
    .filter((c) => c.lead && c.lead.status !== 'converted')
    .slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.4 }}
      className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 hover:border-[#2a2a2a] transition-colors flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">Upcoming Follow-ups</h3>
          <button
            onClick={() => navigate('/follow-ups')}
            className="text-xs text-[#4b5563] hover:text-white transition-colors flex items-center gap-1"
          >
            View Planner <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-xs text-[#525252] italic p-6 text-center">No upcoming follow-ups scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 + i * 0.05 }}
                onClick={() => navigate(`/call-center?leadId=${item.lead_id}`)}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] cursor-pointer transition-colors group"
              >
                <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.lead?.shop_name}</p>
                  <p className="text-[11px] text-[#8c8c8c] mt-0.5 truncate">
                    {item.follow_up_reminder || 'Schedule callback review.'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 pl-2">
                  <span className="text-[10px] font-bold text-amber-400">{item.follow_up_time || '12:00'}</span>
                  <p className="text-[9px] text-[#525252] mt-0.5 font-bold uppercase">{item.follow_up_date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
