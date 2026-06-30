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
} from 'lucide-react'
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import type { Call, Lead, Employee } from '@/types'
import { format, parseISO } from 'date-fns'
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
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reschedule Follow-Up</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-500 hover:text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">New Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">New Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Reminder Notes</label>
            <input
              type="text"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              placeholder="e.g. Call owner after lunch"
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3.5 border-t border-white/[0.06] mt-5">
          <button
            onClick={onClose}
            className="btn-secondary h-11 px-4 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(date, time, reminder)}
            className="btn-primary h-11 px-5 text-xs font-bold"
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

  const renderQueueRow = (item: any, colorCode: 'red' | 'yellow' | 'green' | 'gray') => {
    const lead = item.lead
    if (!lead) return null

    const borderStyle =
      colorCode === 'red' ? 'border-red-500/20 bg-red-500/[0.01]' :
      colorCode === 'yellow' ? 'border-yellow-500/20 bg-yellow-500/[0.01]' :
      colorCode === 'green' ? 'border-emerald-500/20 bg-emerald-500/[0.01]' :
      'border-white/[0.08] bg-white/[0.005]'

    const dotStyle =
      colorCode === 'red' ? 'bg-red-400' :
      colorCode === 'yellow' ? 'bg-yellow-400' :
      colorCode === 'green' ? 'bg-emerald-400' :
      'bg-zinc-400'

    return (
      <div
        key={item.id}
        className={`flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border rounded-2xl gap-4 hover:border-white/12 transition-colors ${borderStyle}`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 pulse-dot ${dotStyle}`} />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{lead.shop_name}</h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 mt-1 font-semibold">
              <span>{lead.category}</span>
              <span>•</span>
              <span>{lead.phone}</span>
              <span>•</span>
              <span className="text-zinc-400 flex items-center gap-1">
                <User className="w-3 h-3 text-zinc-500" /> Rep: {item.employee?.name || 'Unassigned'}
              </span>
            </div>
            {item.follow_up_reminder && (
              <p className="text-xs text-zinc-400 bg-white/[0.01] border border-white/[0.06] px-3 py-2 rounded-xl mt-2 font-medium">
                <span className="text-zinc-600 font-bold text-[10px] uppercase block mb-1">Agenda notes</span>
                {item.follow_up_reminder}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 w-full lg:w-auto justify-end border-t border-white/[0.04] lg:border-0 pt-3 lg:pt-0">
          <div className="text-left lg:text-right">
            <p className="text-xs font-bold text-white flex items-center gap-1.5 lg:justify-end">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              {format(parseISO(item.follow_up_date), 'dd MMM yyyy')}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase flex items-center gap-1 lg:justify-end">
              <Clock className="w-3.5 h-3.5 text-zinc-600" />
              {item.follow_up_time || '12:00'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleCallRedirect(lead.id)}
              className="flex-1 sm:flex-initial btn-primary h-9 px-3 text-xs font-bold rounded-lg"
            >
              <Phone className="w-3.5 h-3.5" /> Dial
            </button>
            <button
              onClick={() => handleOpenReschedule(item)}
              className="flex-1 sm:flex-initial btn-secondary h-9 px-3 text-xs font-bold rounded-lg"
            >
              Reschedule
            </button>
            <button
              onClick={() => handleComplete(item.id)}
              className="flex-1 sm:flex-initial btn-secondary h-9 px-3 text-xs font-bold rounded-lg hover:!text-emerald-400"
              title="Mark Completed"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell page-stack space-y-6">
      {/* Header Info */}
      <div className="panel-card flex items-center gap-3 p-5">
        <CalendarClock className="w-5 h-5 text-red-400" />
        <div>
          <p className="text-sm font-bold text-white">Call Follow-Up Planner</p>
          <p className="text-xs text-zinc-500 mt-0.5">Manage callback scheduling, rescheduled client entries, and commit task completions.</p>
        </div>
      </div>

      {/* OVERDUE QUEUE */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" /> Overdue Tasks ({overdueQueue.length})
        </h3>
        {overdueQueue.length === 0 ? (
          <p className="text-xs text-zinc-500 italic p-6 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.005] font-semibold">No overdue follow-up calls scheduled.</p>
        ) : (
          <div className="space-y-2.5">
            {overdueQueue.map((item) => renderQueueRow(item, 'red'))}
          </div>
        )}
      </div>

      {/* TODAY'S QUEUE */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-500" /> Today's Pipeline ({todayQueue.length})
        </h3>
        {todayQueue.length === 0 ? (
          <p className="text-xs text-zinc-500 italic p-6 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.005] font-semibold">No follow-ups scheduled for today.</p>
        ) : (
          <div className="space-y-2.5">
            {todayQueue.map((item) => renderQueueRow(item, 'yellow'))}
          </div>
        )}
      </div>

      {/* TOMORROW'S QUEUE */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-500" /> Tomorrow ({tomorrowQueue.length})
        </h3>
        {tomorrowQueue.length === 0 ? (
          <p className="text-xs text-zinc-500 italic p-6 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.005] font-semibold">No follow-ups scheduled for tomorrow.</p>
        ) : (
          <div className="space-y-2.5">
            {tomorrowQueue.map((item) => renderQueueRow(item, 'gray'))}
          </div>
        )}
      </div>

      {/* UPCOMING QUEUE */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-600" /> Upcoming Scheduled ({upcomingQueue.length})
        </h3>
        {upcomingQueue.length === 0 ? (
          <p className="text-xs text-zinc-500 italic p-6 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.005] font-semibold">No further upcoming callbacks scheduled.</p>
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
