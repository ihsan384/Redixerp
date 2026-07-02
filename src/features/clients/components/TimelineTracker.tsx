import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Clock, CheckSquare, Square, Zap } from 'lucide-react'
import type { Client, ClientTimelineEvent } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface TimelineTrackerProps {
  client: Client
  onRefresh: () => void
}

const MILESTONES = [
  'Requirement Received',
  'Research',
  'Wireframe',
  'Design',
  'Development',
  'Testing',
  'Client Review',
  'Revision',
  'Deployment',
  'Completed'
]

export function TimelineTracker({ client, onRefresh }: TimelineTrackerProps) {
  const [timelineEvents, setTimelineEvents] = useState<ClientTimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  const loadTimeline = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('client_timeline')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setTimelineEvents((data || []) as ClientTimelineEvent[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTimeline()
  }, [client.id])

  const toggleMilestone = async (milestone: string, isCompleted: boolean) => {
    try {
      const now = new Date().toISOString()
      
      if (isCompleted) {
        // Complete it: add event
        const newEvent = {
          client_id: client.id,
          title: milestone,
          description: `Milestone "${milestone}" marked as completed.`,
          status: 'completed',
          created_at: now
        }
        const { error } = await supabase.from('client_timeline').insert(newEvent as never)
        if (error) throw error
      } else {
        // Uncomplete it: remove matching event
        const { error } = await supabase
          .from('client_timeline')
          .delete()
          .eq('client_id', client.id)
          .eq('title', milestone)
        
        if (error) throw error
      }

      // Re-calculate client's progress percentage
      // We will count completed milestones
      const completedEvents = isCompleted
        ? [...timelineEvents.filter(e => e.title !== milestone), { title: milestone }]
        : timelineEvents.filter(e => e.title !== milestone)
      
      const uniqueCompleted = Array.from(new Set(completedEvents.map(e => e.title)))
      const newProgress = Math.min(100, Math.round((uniqueCompleted.length / MILESTONES.length) * 100))

      // Update client table
      const { error: updateError } = await supabase
        .from('clients')
        .update({ project_progress: newProgress })
        .eq('id', client.id)
      
      if (updateError) throw updateError

      // Log activity
      const activityPayload = {
        lead_id: client.id,
        type: 'status_change',
        description: `Project progress updated to ${newProgress}% (${milestone} ${isCompleted ? 'completed' : 'removed'}).`
      }
      await supabase.from('activities').insert(activityPayload as never)

      toast.success(`Milestone status updated`)
      loadTimeline()
      onRefresh()
    } catch (e) {
      console.error(e)
      toast.error('Failed to update milestone')
    }
  }

  const isCompleted = (milestone: string) => {
    return timelineEvents.some(e => e.title === milestone && e.status === 'completed')
  }

  const getCompletedDate = (milestone: string) => {
    const ev = timelineEvents.find(e => e.title === milestone && e.status === 'completed')
    return ev ? new Date(ev.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual tracker timeline */}
      <div className="lg:col-span-2 space-y-4">
        <div className="panel-card p-5 space-y-4 bg-[#111]/40 border border-white/[0.06] backdrop-blur-md">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-red-500 animate-pulse" /> Project Milestone Tracker
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">Toggle development milestones. Completing milestones updates the global progress percentage automatically.</p>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-red-500/20 border-t-red-500 animate-spin rounded-full" />
            </div>
          ) : (
            <div className="space-y-3.5 pt-2">
              {MILESTONES.map((milestone, idx) => {
                const checked = isCompleted(milestone)
                const date = getCompletedDate(milestone)
                return (
                  <button
                    key={milestone}
                    onClick={() => toggleMilestone(milestone, !checked)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 text-left ${
                      checked 
                        ? 'bg-red-950/10 border-red-950/40 hover:bg-red-950/20' 
                        : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {checked ? (
                        <CheckSquare className="w-5 h-5 text-red-400 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-600 shrink-0" />
                      )}
                      <div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${checked ? 'text-white' : 'text-zinc-400'}`}>
                          {idx + 1}. {milestone}
                        </span>
                        {checked && (
                          <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Checked-off & Verified</p>
                        )}
                      </div>
                    </div>
                    {checked && date && (
                      <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2.5 py-1 border border-red-500/20 rounded-lg">
                        {date}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Side Audit Log list */}
      <div className="space-y-4">
        <div className="panel-card p-5 space-y-4 bg-[#111]/40 border border-white/[0.06] backdrop-blur-md">
          <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-zinc-400" /> Milestone History
          </div>
          
          <div className="relative border-l-2 border-white/[0.06] pl-4 ml-2 space-y-5 py-2">
            {timelineEvents.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No milestones registered yet. Toggle a milestone to build history.</p>
            ) : (
              [...timelineEvents].reverse().map((ev) => (
                <div key={ev.id} className="relative space-y-1">
                  {/* Dot */}
                  <span className="absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-4 ring-[#090909]" />
                  <p className="text-xs font-bold text-white uppercase tracking-wider leading-none">{ev.title}</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">{ev.description}</p>
                  <p className="text-[9px] font-mono text-zinc-500">
                    {new Date(ev.created_at).toLocaleString('en-PK')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
