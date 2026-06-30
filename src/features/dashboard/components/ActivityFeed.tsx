import { motion } from 'framer-motion'
import { Phone, ArrowUpRight, Clock, ThumbsUp, Calendar, CheckCircle2, User } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Activity, Lead, Call } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

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
        return <Phone className="w-4 h-4 text-zinc-400" />
      case 'converted':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
      case 'follow_up':
        return <Calendar className="w-4 h-4 text-amber-400" />
      default:
        return <ThumbsUp className="w-4 h-4 text-red-400" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="h-full w-full"
    >
      <Card className="h-full flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between mb-5 pb-2 border-b border-white/[0.04]">
            <div>
              <CardTitle>Recent Workspace Activity</CardTitle>
              <CardDescription>Live operational audit trail of updates and actions</CardDescription>
            </div>
            <button
              onClick={() => navigate('/leads')}
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 bg-red-500/5 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-500/10"
            >
              Leads <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-xs text-zinc-500 italic">No workspace activities logged yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivities.map((item, i) => {
                const lead = leads.find((l) => l.id === item.lead_id)
                const timeString = formatDistanceToNow(new Date(item.created_at), { addSuffix: true })

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.04 }}
                    className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04] transition-all group cursor-pointer"
                    onClick={() => lead && navigate(`/leads?search=${encodeURIComponent(lead.shop_name)}`)}
                  >
                    <div className="w-9 h-9 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-white/[0.04] transition-colors">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate">
                        {lead ? lead.shop_name : 'System Event'}
                      </p>
                      <p className="text-[11px] text-[#A1A1AA] mt-1 leading-snug">{item.description}</p>
                    </div>
                    <div className="shrink-0 pl-2 text-right">
                      <p className="text-[9px] text-[#717172] font-bold uppercase tracking-wider">{timeString}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export function UpcomingFollowUps({ calls, leads }: UpcomingFollowUpsProps) {
  const navigate = useNavigate()
  const todayStr = new Date().toISOString().split('T')[0]

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38, duration: 0.4 }}
      className="h-full w-full"
    >
      <Card className="h-full flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between mb-5 pb-2 border-b border-white/[0.04]">
            <div>
              <CardTitle>Upcoming Callbacks</CardTitle>
              <CardDescription>Scheduled followup outreach targets</CardDescription>
            </div>
            <button
              onClick={() => navigate('/follow-ups')}
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 bg-red-500/5 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-500/10"
            >
              Planner <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-xs text-zinc-500 italic">No upcoming callbacks scheduled.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.04 }}
                  onClick={() => navigate(`/call-center?leadId=${item.lead_id}`)}
                  className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04] cursor-pointer transition-all group"
                >
                  <div className="w-9 h-9 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500/10 transition-colors">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate">{item.lead?.shop_name}</p>
                    <p className="text-[11px] text-[#A1A1AA] mt-1 truncate">
                      {item.follow_up_reminder || 'Outbound campaign review call.'}
                    </p>
                  </div>
                  <div className="shrink-0 pl-2 text-right">
                    <span className="inline-flex h-5 items-center justify-center rounded-lg bg-amber-500/10 px-2 text-[10px] font-bold text-amber-400 border border-amber-500/15">
                      {item.follow_up_time || '12:00'}
                    </span>
                    <p className="text-[9px] text-[#717172] font-bold uppercase tracking-wider mt-1">{item.follow_up_date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
