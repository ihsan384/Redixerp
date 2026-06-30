import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarClock,
  Phone,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  User,
  X,
  MessageSquare,
} from 'lucide-react'
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import type { Call, Lead, Employee } from '@/types'
import { format, isToday, isTomorrow, isBefore, isAfter, parseISO } from 'date-fns'
import { toast } from 'sonner'

const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                  !import.meta.env.VITE_SUPABASE_URL

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  call: Call | null
  onSave: (date: string, time: string, reminder: string) => void
}

function RescheduleModal({ isOpen, onClose, call, onSave }: RescheduleModalProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('12:00')
  const [reminder, setReminder] = useState('')

  useEffect(() => {
    if (call) {
      setDate(call.follow_up_date || '')
      setTime(call.follow_up_time || '12:00')
      setReminder(call.follow_up_reminder || '')
    }
  }, [call, isOpen])

  if (!isOpen || !call) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="modal-backdrop" />
      <div role="dialog" aria-modal="true" aria-label="Reschedule follow-up" className="modal-panel z-10 w-full max-w-md space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
          <h3 className="text-sm font-semibold text-white">Reschedule Follow-Up</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-[#8c8c8c]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">New Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">New Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Reminder Notes</label>
            <input
              type="text"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              placeholder="e.g. Call owner after lunch"
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1f1f1f]">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-[#1f1f1f] bg-[#111111] text-xs font-semibold rounded-lg text-[#8c8c8c] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(date, time, reminder)}
            className="px-3.5 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200"
          >
            Reschedule
          </button>
        </div>
      </div>
    </div>
  )
}

export function FollowUpsPage() {
  const navigate = useNavigate()
  const [calls, setCalls] = useState<Call[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  // Modal controls
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)

  // Load Data
  const loadData = () => {
    setCalls(Storage.getCalls())
    setLeads(Storage.getLeads())
    setEmployees(Storage.getEmployees())
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter Active Follow Ups
  const activeFollowUps = calls
    .filter((c) => c.follow_up === true && c.follow_up_date)
    .map((c) => ({
      ...c,
      lead: leads.find((l) => l.id === c.lead_id),
      employee: employees.find((e) => e.id === c.employee_id),
    }))

  const todayStr = new Date().toISOString().split('T')[0]

  // Grouping logic
  const overdueQueue: any[] = []
  const todayQueue: any[] = []
  const tomorrowQueue: any[] = []
  const upcomingQueue: any[] = []

  activeFollowUps.forEach((item) => {
    const fDate = item.follow_up_date as string
    if (fDate === todayStr) {
      todayQueue.push(item)
    } else if (fDate < todayStr) {
      overdueQueue.push(item)
    } else {
      // Check if tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      if (fDate === tomorrowStr) {
        tomorrowQueue.push(item)
      } else {
        upcomingQueue.push(item)
      }
    }
  })

  // Handlers
  const handleCallRedirect = (leadId: string) => {
    navigate(`/call-center?leadId=${leadId}`)
  }

  const handleComplete = async (callId: string) => {
    try {
      const updatedCalls = calls.map((c) => {
        if (c.id === callId) {
          return { ...c, follow_up: false }
        }
        return c
      })
      Storage.saveCalls(updatedCalls)

      const targetCall = calls.find((c) => c.id === callId)
      if (targetCall) {
        // Log Activity
        const newAct = {
          id: `act-${Date.now()}`,
          lead_id: targetCall.lead_id,
          employee_id: targetCall.employee_id,
          type: 'follow_up' as const,
          description: 'Follow-up marked completed.',
          created_at: new Date().toISOString(),
        }
        const updatedActs = [newAct, ...Storage.getActivities()]
        Storage.saveActivities(updatedActs)

        if (!DEMO_MODE) {
          await supabase.from('calls').update({ follow_up: false } as never).eq('id', callId)
          await supabase.from('activities').insert(newAct as never)
        }
      }

      toast.success('Follow-up task marked completed')
      loadData()
    } catch (err: unknown) {
      toast.error('Failed to complete follow-up')
    }
  }

  const handleOpenReschedule = (call: Call) => {
    setSelectedCall(call)
    setIsRescheduleOpen(true)
  }

  const handleSaveReschedule = async (date: string, time: string, reminder: string) => {
    if (!selectedCall) return
    try {
      const updatedCalls = calls.map((c) => {
        if (c.id === selectedCall.id) {
          return {
            ...c,
            follow_up_date: date,
            follow_up_time: time,
            follow_up_reminder: reminder,
          }
        }
        return c
      })
      Storage.saveCalls(updatedCalls)

      // Add Activity
      const newAct = {
        id: `act-${Date.now()}`,
        lead_id: selectedCall.lead_id,
        employee_id: selectedCall.employee_id,
        type: 'follow_up' as const,
        description: `Follow-up rescheduled to ${date} ${time}. Notes: ${reminder || 'None'}`,
        created_at: new Date().toISOString(),
      }
      const updatedActs = [newAct, ...Storage.getActivities()]
      Storage.saveActivities(updatedActs)

      if (!DEMO_MODE) {
        await supabase
          .from('calls')
          .update({
            follow_up_date: date,
            follow_up_time: time,
            follow_up_reminder: reminder,
          } as never)
          .eq('id', selectedCall.id)

        await supabase.from('activities').insert(newAct as never)
      }

      toast.success('Follow-up rescheduled successfully')
      setIsRescheduleOpen(false)
      setSelectedCall(null)
      loadData()
    } catch (err: unknown) {
      toast.error('Failed to reschedule')
    }
  }

  // Helper row component
  const renderQueueRow = (item: any, colorCode: 'red' | 'yellow' | 'green' | 'gray') => {
    const lead = item.lead
    if (!lead) return null

    const borderStyle =
      colorCode === 'red' ? 'border-red-500/20 bg-red-500/[0.02]' :
      colorCode === 'yellow' ? 'border-yellow-500/20 bg-yellow-500/[0.02]' :
      colorCode === 'green' ? 'border-emerald-500/20 bg-emerald-500/[0.02]' :
      'border-[#1f1f1f] bg-[#111111]/10'

    const dotStyle =
      colorCode === 'red' ? 'bg-red-400' :
      colorCode === 'yellow' ? 'bg-yellow-400' :
      colorCode === 'green' ? 'bg-emerald-400' :
      'bg-gray-400'

    return (
      <div
        key={item.id}
        className={`flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border rounded-xl gap-4 hover:border-white/10 transition-colors ${borderStyle}`}
      >
        {/* Company & Meta info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 pulse-dot ${dotStyle}`} />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{lead.shop_name}</h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#525252] mt-1 font-medium">
              <span>{lead.category}</span>
              <span>•</span>
              <span>{lead.phone}</span>
              <span>•</span>
              <span className="text-[#8c8c8c] flex items-center gap-1">
                <User className="w-3 h-3" /> Rep: {item.employee?.name || 'Unassigned'}
              </span>
            </div>
            {item.follow_up_reminder && (
              <p className="text-xs text-[#8c8c8c] bg-[#111111]/30 border border-[#1f1f1f] px-2.5 py-1.5 rounded-lg mt-2 font-medium">
                <span className="text-[#636363] font-semibold text-[10px] uppercase block mb-0.5">Notes</span>
                {item.follow_up_reminder}
              </p>
            )}
          </div>
        </div>

        {/* Schedule & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0 w-full lg:w-auto justify-end border-t border-[#1f1f1f] lg:border-0 pt-3 lg:pt-0">
          <div className="text-left lg:text-right">
            <p className="text-xs font-semibold text-white flex items-center gap-1.5 lg:justify-end">
              <Calendar className="w-3.5 h-3.5 text-[#636363]" />
              {format(parseISO(item.follow_up_date), 'dd MMM yyyy')}
            </p>
            <p className="text-[10px] text-[#525252] mt-0.5 font-medium flex items-center gap-1 lg:justify-end">
              <Clock className="w-3.5 h-3.5 text-[#636363]" />
              {item.follow_up_time || '12:00'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleCallRedirect(lead.id)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200 transition-all"
            >
              <Phone className="w-3.5 h-3.5" /> Call
            </button>
            <button
              onClick={() => handleOpenReschedule(item)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#1f1f1f] bg-[#111111] text-[#8c8c8c] hover:text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Reschedule
            </button>
            <button
              onClick={() => handleComplete(item.id)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#1f1f1f] bg-[#111111] text-[#8c8c8c] hover:text-emerald-400 text-xs font-semibold rounded-lg transition-colors"
              title="Mark Complete"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell page-stack">
      {/* Header Info */}
      <div className="panel-card flex items-center gap-3 p-5">
        <CalendarClock className="w-5 h-5 text-white" />
        <div>
          <p className="text-sm font-semibold text-white">Call Follow-Up Planner</p>
          <p className="text-xs text-[#525252] mt-0.5">Manage callback timelines, rescheduled items, and complete customer tasks.</p>
        </div>
      </div>

      {/* OVERDUE QUEUE */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" /> Overdue Queue ({overdueQueue.length})
        </h3>
        {overdueQueue.length === 0 ? (
          <p className="text-xs text-[#4b5563] italic p-4 border border-[#1f1f1f] border-dashed rounded-xl">No overdue follow-up calls.</p>
        ) : (
          <div className="space-y-2.5">
            {overdueQueue.map((item) => renderQueueRow(item, 'red'))}
          </div>
        )}
      </div>

      {/* TODAY'S QUEUE */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-500" /> Today's Planner ({todayQueue.length})
        </h3>
        {todayQueue.length === 0 ? (
          <p className="text-xs text-[#4b5563] italic p-4 border border-[#1f1f1f] border-dashed rounded-xl">No follow-ups scheduled for today.</p>
        ) : (
          <div className="space-y-2.5">
            {todayQueue.map((item) => renderQueueRow(item, 'yellow'))}
          </div>
        )}
      </div>

      {/* TOMORROW'S QUEUE */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c8c8c] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#636363]" /> Tomorrow ({tomorrowQueue.length})
        </h3>
        {tomorrowQueue.length === 0 ? (
          <p className="text-xs text-[#4b5563] italic p-4 border border-[#1f1f1f] border-dashed rounded-xl">No follow-ups scheduled for tomorrow.</p>
        ) : (
          <div className="space-y-2.5">
            {tomorrowQueue.map((item) => renderQueueRow(item, 'gray'))}
          </div>
        )}
      </div>

      {/* UPCOMING QUEUE */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#636363] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#4b5563]" /> Upcoming Scheduled ({upcomingQueue.length})
        </h3>
        {upcomingQueue.length === 0 ? (
          <p className="text-xs text-[#4b5563] italic p-4 border border-[#1f1f1f] border-dashed rounded-xl">No further upcoming callbacks scheduled.</p>
        ) : (
          <div className="space-y-2.5">
            {upcomingQueue.map((item) => renderQueueRow(item, 'gray'))}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => {
          setIsRescheduleOpen(false)
          setSelectedCall(null)
        }}
        call={selectedCall}
        onSave={handleSaveReschedule}
      />
    </div>
  )
}
