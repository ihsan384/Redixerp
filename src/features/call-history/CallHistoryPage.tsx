import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Phone, PhoneOff,
  Search, Download, FileText, FileSpreadsheet,
  Volume2, Play, Pause,
  User, Users, Trash2, Edit3, Save, X,
  ChevronLeft, ChevronRight,
  ExternalLink, MessageSquare, MapPin, Globe,
  History, Clock, Calendar, CalendarClock,
  Star,
  AlertCircle, CheckCircle2,
  Activity as ActivityIcon,
  Tag, RefreshCw,
  ChevronDown, Filter,
  Loader2,
} from 'lucide-react'
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useLeads } from '../leads/hooks/useLeads'
import { CALL_OUTCOME_LABELS, LEAD_CATEGORIES } from '@/utils/constants'
import type { Lead, Call, Activity, CallOutcome, Employee } from '@/types'
import { format, formatDistanceToNow, isToday, isYesterday, parseISO, isPast } from 'date-fns'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ── DEMO MODE ────────────────────────────────────────────────
const DEMO_MODE =
  import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
  !import.meta.env.VITE_SUPABASE_URL

// ── HELPERS ──────────────────────────────────────────────────
const fmtDur = (sec?: number) => {
  if (!sec || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const fmtDate = (iso?: string) => {
  if (!iso) return '—'
  try {
    const d = parseISO(iso)
    if (isToday(d)) return `Today ${format(d, 'hh:mm a')}`
    if (isYesterday(d)) return `Yesterday ${format(d, 'hh:mm a')}`
    return format(d, 'MMM dd, hh:mm a')
  } catch { return '—' }
}

const fmtShort = (iso?: string) => {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'MMM dd yyyy') } catch { return '—' }
}

// ── OUTCOME COLORS ───────────────────────────────────────────
const OUTCOME_COLORS: Record<CallOutcome, { bg: string; text: string; border: string }> = {
  connected:         { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20' },
  busy:              { bg: 'bg-orange-500/10',   text: 'text-orange-400',  border: 'border-orange-500/20' },
  no_answer:         { bg: 'bg-yellow-500/10',   text: 'text-yellow-400',  border: 'border-yellow-500/20' },
  rejected:          { bg: 'bg-red-500/10',      text: 'text-red-400',     border: 'border-red-500/20' },
  switched_off:      { bg: 'bg-zinc-700/40',     text: 'text-zinc-400',    border: 'border-zinc-600/30' },
  interested:        { bg: 'bg-blue-500/10',     text: 'text-blue-400',    border: 'border-blue-500/20' },
  very_interested:   { bg: 'bg-indigo-500/10',   text: 'text-indigo-400',  border: 'border-indigo-500/20' },
  meeting_scheduled: { bg: 'bg-purple-500/10',   text: 'text-purple-400',  border: 'border-purple-500/20' },
  demo_booked:       { bg: 'bg-violet-500/10',   text: 'text-violet-400',  border: 'border-violet-500/20' },
  proposal_sent:     { bg: 'bg-cyan-500/10',     text: 'text-cyan-400',    border: 'border-cyan-500/20' },
  follow_up_later:   { bg: 'bg-amber-500/10',    text: 'text-amber-400',   border: 'border-amber-500/20' },
  converted:         { bg: 'bg-emerald-500/10',  text: 'text-emerald-400', border: 'border-emerald-500/20' },
  wrong_number:      { bg: 'bg-red-500/10',      text: 'text-red-400',     border: 'border-red-500/20' },
  spam:              { bg: 'bg-zinc-700/40',     text: 'text-zinc-500',    border: 'border-zinc-600/30' },
  not_interested:    { bg: 'bg-rose-500/10',     text: 'text-rose-400',    border: 'border-rose-500/20' },
}

const PRIORITY_CFG = {
  high:   { label: 'High',   dot: 'bg-red-400',    text: 'text-red-400'   },
  medium: { label: 'Medium', dot: 'bg-amber-400',  text: 'text-amber-400' },
  low:    { label: 'Low',    dot: 'bg-zinc-500',   text: 'text-zinc-500'  },
}

// ── OUTCOME BADGE ─────────────────────────────────────────────
function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  const c = OUTCOME_COLORS[outcome] ?? { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${c.bg} ${c.text} ${c.border}`}>
      {CALL_OUTCOME_LABELS[outcome] ?? outcome}
    </span>
  )
}

// ── SKELETON ROW ─────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-white/[0.04] animate-pulse">
      {Array.from({ length: 14 }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3 bg-white/[0.06] rounded" style={{ width: `${35 + (i * 13) % 55}%` }} />
        </td>
      ))}
    </tr>
  )
}

// ── AUDIO PLAYER ─────────────────────────────────────────────
function AudioPlayer({ label, duration: dur }: { label: string; duration: string }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const toggle = () => {
    if (playing) {
      setPlaying(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
    } else {
      setPlaying(true)
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setPlaying(false)
            if (intervalRef.current) clearInterval(intervalRef.current)
            return 0
          }
          return p + 0.4
        })
      }, 100)
    }
  }
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
          <Volume2 className="w-3 h-3" /> {label}
        </span>
        <span className="text-[10px] font-mono text-zinc-600">{dur}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <button onClick={toggle}
          className="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center justify-center transition-all shrink-0">
          {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
        </button>
        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <button onClick={() => toast.info('Download started')}
          className="w-6 h-6 rounded-lg border border-white/[0.07] text-zinc-500 hover:text-white flex items-center justify-center transition-all">
          <Download className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ── TIMELINE ITEM ─────────────────────────────────────────────
function TimelineItem({ act }: { act: Activity }) {
  const cfg: Record<string, { icon: React.ReactNode; color: string }> = {
    call:          { icon: <Phone className="w-3 h-3" />,         color: 'bg-blue-500/20 text-blue-400' },
    follow_up:     { icon: <CalendarClock className="w-3 h-3" />, color: 'bg-amber-500/20 text-amber-400' },
    note:          { icon: <Edit3 className="w-3 h-3" />,         color: 'bg-zinc-700 text-zinc-400' },
    status_change: { icon: <RefreshCw className="w-3 h-3" />,     color: 'bg-purple-500/20 text-purple-400' },
    meeting:       { icon: <Calendar className="w-3 h-3" />,      color: 'bg-indigo-500/20 text-indigo-400' },
    converted:     { icon: <CheckCircle2 className="w-3 h-3" />,  color: 'bg-emerald-500/20 text-emerald-400' },
    import:        { icon: <Download className="w-3 h-3" />,      color: 'bg-zinc-700 text-zinc-400' },
  }
  const c = cfg[act.type] ?? { icon: <ActivityIcon className="w-3 h-3" />, color: 'bg-zinc-700 text-zinc-400' }
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${c.color}`}>{c.icon}</div>
        <div className="w-px flex-1 bg-white/[0.05] mt-1" />
      </div>
      <div className="pb-4 min-w-0 flex-1">
        <p className="text-xs text-white leading-relaxed">{act.description}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          {act.created_at ? formatDistanceToNow(parseISO(act.created_at), { addSuffix: true }) : ''}
        </p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export function CallHistoryPage() {
  const { employee } = useAuth()
  const navigate = useNavigate()
  const { updateLead } = useLeads()

  // State
  const [calls, setCalls] = useState<Call[]>([])
  const [allCalls, setAllCalls] = useState<Call[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [leadCalls, setLeadCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Pagination
  const PAGE_SIZE = 15
  const [page, setPage] = useState(1)

  // Filters
  const [search, setSearch] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('all')
  const [filterOutcome, setFilterOutcome] = useState('all')
  const [filterDuration, setFilterDuration] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Drawer
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'details' | 'notes' | 'timeline' | 'history'>('details')

  // Notes
  const [notesEdit, setNotesEdit] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Follow-up
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpTime, setFollowUpTime] = useState('10:00')
  const [savingFollowUp, setSavingFollowUp] = useState(false)

  // Tags
  const [tagInput, setTagInput] = useState('')

  // ── Load Employees ─────────────────────────────────────────
  useEffect(() => {
    if (DEMO_MODE) setEmployees(Storage.getEmployees())
    else supabase.from('employees').select('*').then(({ data }) => { if (data) setEmployees(data as Employee[]) })
  }, [])

  // ── Fetch Calls ────────────────────────────────────────────
  const fetchCalls = useCallback(async () => {
    setIsLoading(true)
    try {
      if (DEMO_MODE) {
        const raw = Storage.getCalls()
        const rawLeads = Storage.getLeads()
        const rawEmps = Storage.getEmployees()

        let joined = raw.map(c => ({
          ...c,
          lead: rawLeads.find(l => l.id === c.lead_id),
          employee: rawEmps.find(e => e.id === c.employee_id),
        }))

        if (search) {
          const s = search.toLowerCase()
          joined = joined.filter(c =>
            c.lead?.shop_name?.toLowerCase().includes(s) ||
            c.lead?.phone?.includes(s) ||
            c.employee?.name?.toLowerCase().includes(s) ||
            c.notes?.toLowerCase().includes(s)
          )
        }
        if (filterEmployee !== 'all') joined = joined.filter(c => c.employee_id === filterEmployee)
        if (filterOutcome !== 'all') joined = joined.filter(c => c.outcome === filterOutcome)
        if (filterStatus !== 'all') joined = joined.filter(c => (c.status ?? 'completed') === filterStatus)
        if (filterPriority !== 'all') joined = joined.filter(c => (c.priority ?? 'medium') === filterPriority)
        if (filterCategory !== 'all') joined = joined.filter(c => c.lead?.category === filterCategory)
        if (filterDuration !== 'all') {
          joined = joined.filter(c => {
            const s = c.duration_seconds ?? 0
            if (filterDuration === 'short') return s < 60
            if (filterDuration === 'medium') return s >= 60 && s <= 300
            if (filterDuration === 'long') return s > 300
            return true
          })
        }
        if (filterDate !== 'all') {
          const now = new Date()
          joined = joined.filter(c => {
            try {
              const d = parseISO(c.start_time)
              if (filterDate === 'today') return isToday(d)
              if (filterDate === 'yesterday') return isYesterday(d)
              if (filterDate === '7d') return (now.getTime() - d.getTime()) < 7 * 86400000
              if (filterDate === '30d') return (now.getTime() - d.getTime()) < 30 * 86400000
            } catch { return false }
            return true
          })
        }

        joined.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
        setAllCalls(joined)
        setTotalCount(joined.length)
        setCalls(joined.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE))
      } else {
        let query = supabase
          .from('calls')
          .select('*, lead:leads(*), employee:employees(*)', { count: 'exact' })
          .order('start_time', { ascending: false })

        if (filterEmployee !== 'all') query = query.eq('employee_id', filterEmployee)
        if (filterOutcome !== 'all') query = query.eq('outcome', filterOutcome)
        if (filterStatus !== 'all') query = query.eq('status', filterStatus)
        if (filterPriority !== 'all') query = query.eq('priority', filterPriority)
        if (filterDuration !== 'all') {
          if (filterDuration === 'short') query = query.lt('duration_seconds', 60)
          if (filterDuration === 'medium') query = query.gte('duration_seconds', 60).lte('duration_seconds', 300)
          if (filterDuration === 'long') query = query.gt('duration_seconds', 300)
        }
        if (filterDate !== 'all') {
          const dates: Record<string, string> = {
            today: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
            '7d': new Date(Date.now() - 7 * 86400000).toISOString(),
            '30d': new Date(Date.now() - 30 * 86400000).toISOString(),
          }
          if (dates[filterDate]) query = query.gte('start_time', dates[filterDate])
        }

        const { data, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
        if (error) throw error
        setCalls(data as Call[])
        setAllCalls(data as Call[])
        setTotalCount(count ?? 0)
      }
    } catch (err) {
      toast.error('Failed to load call logs')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, filterEmployee, filterOutcome, filterDuration, filterStatus, filterPriority, filterCategory, filterDate])

  useEffect(() => { fetchCalls() }, [fetchCalls])
  useEffect(() => { setPage(1) }, [search, filterEmployee, filterOutcome, filterDuration, filterStatus, filterPriority, filterCategory, filterDate])

  // ── Open Drawer ────────────────────────────────────────────
  const openDrawer = useCallback(async (call: Call) => {
    setSelectedCall(call)
    setNotesEdit(call.notes ?? '')
    setFollowUpDate(call.follow_up_date ?? '')
    setFollowUpTime(call.follow_up_time ?? '10:00')
    setDrawerTab('details')
    setDrawerOpen(true)
    if (!call.lead_id) return
    try {
      if (DEMO_MODE) {
        const acts = Storage.getActivities()
          .filter(a => a.lead_id === call.lead_id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setActivities(acts)
        const emps = Storage.getEmployees()
        const prev = Storage.getCalls()
          .filter(c => c.lead_id === call.lead_id && c.id !== call.id)
          .map(c => ({ ...c, employee: emps.find(e => e.id === c.employee_id) }))
          .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
        setLeadCalls(prev)
      } else {
        const [{ data: acts }, { data: prev }] = await Promise.all([
          supabase.from('activities').select('*, employee:employees(*)').eq('lead_id', call.lead_id).order('created_at', { ascending: false }),
          supabase.from('calls').select('*, employee:employees(*)').eq('lead_id', call.lead_id).neq('id', call.id).order('start_time', { ascending: false }),
        ])
        setActivities((acts ?? []) as Activity[])
        setLeadCalls((prev ?? []) as Call[])
      }
    } catch (err) { console.error(err) }
  }, [])

  // ── Analytics ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const src = DEMO_MODE ? Storage.getCalls() : allCalls
    const todayStr = new Date().toDateString()
    const total = src.length
    const today = src.filter(c => { try { return new Date(c.start_time).toDateString() === todayStr } catch { return false } }).length
    const connected = src.filter(c => ['connected', 'interested', 'very_interested', 'meeting_scheduled', 'demo_booked', 'proposal_sent', 'converted'].includes(c.outcome)).length
    const missed = src.filter(c => ['no_answer', 'busy', 'rejected', 'switched_off'].includes(c.outcome)).length
    const converted = src.filter(c => c.outcome === 'converted').length
    const durations = src.map(c => c.duration_seconds ?? 0).filter(Boolean)
    const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
    const longest = durations.length ? Math.max(...durations) : 0
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0
    return { total, today, connected, missed, avg, longest, rate }
  }, [allCalls])

  // ── Save Notes ─────────────────────────────────────────────
  const handleSaveNotes = async () => {
    if (!selectedCall) return
    setSavingNotes(true)
    try {
      if (DEMO_MODE) {
        const all = Storage.getCalls()
        const idx = all.findIndex(c => c.id === selectedCall.id)
        if (idx !== -1) { all[idx].notes = notesEdit; Storage.saveCalls(all) }
        Storage.saveActivities([{
          id: `act-${Date.now()}`, lead_id: selectedCall.lead_id,
          employee_id: employee?.id ?? 'emp-1', type: 'note',
          description: `Notes updated: "${notesEdit.slice(0, 80)}"`, created_at: new Date().toISOString(),
        }, ...Storage.getActivities()])
      } else {
        const { error } = await supabase.from('calls').update({ notes: notesEdit } as never).eq('id', selectedCall.id)
        if (error) throw error
        await supabase.from('activities').insert({ lead_id: selectedCall.lead_id, employee_id: employee?.id, type: 'note', description: `Notes updated: "${notesEdit.slice(0, 80)}"` } as never)
      }
      setSelectedCall(prev => prev ? { ...prev, notes: notesEdit } : null)
      toast.success('Notes saved')
      fetchCalls()
    } catch { toast.error('Failed to save notes') }
    finally { setSavingNotes(false) }
  }

  // ── Save Follow-up ─────────────────────────────────────────
  const handleSaveFollowUp = async () => {
    if (!selectedCall || !followUpDate) return
    setSavingFollowUp(true)
    const patch = { follow_up: true, follow_up_date: followUpDate, follow_up_time: followUpTime }
    try {
      if (DEMO_MODE) {
        const all = Storage.getCalls()
        const idx = all.findIndex(c => c.id === selectedCall.id)
        if (idx !== -1) { Object.assign(all[idx], patch); Storage.saveCalls(all) }
        Storage.saveActivities([{
          id: `act-${Date.now()}`, lead_id: selectedCall.lead_id,
          employee_id: employee?.id ?? 'emp-1', type: 'follow_up',
          description: `Follow-up scheduled for ${followUpDate} at ${followUpTime}`, created_at: new Date().toISOString(),
        }, ...Storage.getActivities()])
      } else {
        const { error } = await supabase.from('calls').update(patch as never).eq('id', selectedCall.id)
        if (error) throw error
        await supabase.from('activities').insert({ lead_id: selectedCall.lead_id, employee_id: employee?.id, type: 'follow_up', description: `Follow-up scheduled for ${followUpDate} at ${followUpTime}` } as never)
      }
      setSelectedCall(prev => prev ? { ...prev, ...patch } : null)
      toast.success('Follow-up scheduled!')
      fetchCalls()
    } catch { toast.error('Failed to schedule follow-up') }
    finally { setSavingFollowUp(false) }
  }

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this call record permanently?')) return
    try {
      if (DEMO_MODE) Storage.saveCalls(Storage.getCalls().filter(c => c.id !== id))
      else { const { error } = await supabase.from('calls').delete().eq('id', id); if (error) throw error }
      toast.success('Record deleted')
      setDrawerOpen(false)
      fetchCalls()
    } catch { toast.error('Failed to delete') }
  }

  // ── Assign Employee ────────────────────────────────────────
  const handleAssign = async (empId: string) => {
    if (!selectedCall?.lead_id) return
    try {
      await updateLead({ id: selectedCall.lead_id, data: { assigned_to: empId || undefined } })
      const emp = employees.find(e => e.id === empId)
      setSelectedCall(prev => prev?.lead ? { ...prev, lead: { ...prev.lead, assigned_to: empId, assigned_employee: emp } } : prev)
      toast.success('Assignment updated')
    } catch { toast.error('Failed to update') }
  }

  // ── Exports ────────────────────────────────────────────────
  const exportCSV = () => {
    try {
      const src = DEMO_MODE ? allCalls : calls
      const headers = ['ID', 'Business', 'Phone', 'Employee', 'Date', 'Start', 'End', 'Duration', 'Direction', 'Outcome', 'Follow-up Date', 'Priority', 'Status', 'Notes']
      const rows = src.map(c => [
        c.id.slice(0, 8), c.lead?.shop_name ?? '', c.lead?.phone ?? '',
        c.employee?.name ?? '', fmtShort(c.start_time),
        c.start_time ? format(parseISO(c.start_time), 'HH:mm') : '',
        c.end_time ? format(parseISO(c.end_time), 'HH:mm') : '',
        fmtDur(c.duration_seconds), c.direction ?? 'outgoing',
        CALL_OUTCOME_LABELS[c.outcome] ?? c.outcome,
        c.follow_up_date ?? '', c.priority ?? 'medium', c.status ?? 'completed', c.notes ?? '',
      ])
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      a.download = `redix_calls_${Date.now()}.csv`
      a.click()
      toast.success('CSV exported')
    } catch { toast.error('Export failed') }
  }

  const exportExcel = () => {
    try {
      const src = DEMO_MODE ? allCalls : calls
      const data = src.map(c => ({
        ID: c.id.slice(0, 8), Business: c.lead?.shop_name ?? '', Phone: c.lead?.phone ?? '',
        Employee: c.employee?.name ?? '', Date: fmtShort(c.start_time),
        Start: c.start_time ? format(parseISO(c.start_time), 'HH:mm') : '',
        End: c.end_time ? format(parseISO(c.end_time), 'HH:mm') : '',
        'Duration (s)': c.duration_seconds ?? 0, Direction: c.direction ?? 'outgoing',
        Outcome: CALL_OUTCOME_LABELS[c.outcome] ?? c.outcome,
        'Follow-up': c.follow_up_date ?? '', Priority: c.priority ?? 'medium',
        Status: c.status ?? 'completed', Notes: c.notes ?? '',
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Call Logs')
      XLSX.writeFile(wb, `redix_calls_${Date.now()}.xlsx`)
      toast.success('Excel exported')
    } catch { toast.error('Export failed') }
  }

  const exportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFillColor(10, 10, 10)
      doc.rect(0, 0, 297, 20, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(255, 255, 255)
      doc.text('REDIX CRM — Call History Audit Log', 14, 13)
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text(`Generated: ${new Date().toLocaleString()} · ${totalCount} total records`, 14, 18)
      const src = DEMO_MODE ? allCalls : calls
      autoTable(doc, {
        startY: 24,
        head: [['Business', 'Phone', 'Employee', 'Date', 'Start', 'End', 'Duration', 'Direction', 'Outcome', 'Priority', 'Status']],
        body: src.map(c => [
          c.lead?.shop_name ?? '—', c.lead?.phone ?? '—', c.employee?.name ?? '—',
          fmtShort(c.start_time),
          c.start_time ? format(parseISO(c.start_time), 'HH:mm') : '—',
          c.end_time ? format(parseISO(c.end_time), 'HH:mm') : '—',
          fmtDur(c.duration_seconds), c.direction ?? 'outgoing',
          CALL_OUTCOME_LABELS[c.outcome] ?? c.outcome, c.priority ?? 'medium', c.status ?? 'completed',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [25, 25, 25], fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7 },
      })
      doc.save(`redix_calls_${Date.now()}.pdf`)
      toast.success('PDF exported')
    } catch (e) { toast.error('PDF failed'); console.error(e) }
  }

  const isOverdue = (call: Call) => {
    if (!call.follow_up || !call.follow_up_date) return false
    try { return isPast(parseISO(`${call.follow_up_date}T${call.follow_up_time ?? '23:59'}`)) } catch { return false }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // ══════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="page-shell page-stack space-y-5 max-w-full">

      {/* HEADER */}
      <div className="panel-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Call History</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">Permanent audit trail of every customer interaction · {totalCount} total records</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchCalls} className="w-9 h-9 rounded-xl border border-white/[0.08] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-white flex items-center justify-center transition-all" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 h-9 border border-white/[0.08] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] text-white text-[11px] font-bold rounded-xl transition-all">
            <FileText className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 h-9 border border-white/[0.08] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] text-white text-[11px] font-bold rounded-xl transition-all">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 h-9 border border-white/[0.08] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] text-white text-[11px] font-bold rounded-xl transition-all">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* ANALYTICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        {([
          { label: 'Total Calls',   value: stats.total,           sub: 'lifetime',    color: 'text-white'        },
          { label: "Today's",       value: stats.today,           sub: 'calls today', color: 'text-red-400'      },
          { label: 'Connected',     value: stats.connected,       sub: 'answered',    color: 'text-sky-400'      },
          { label: 'Missed',        value: stats.missed,          sub: 'no answer',   color: 'text-orange-400'   },
          { label: 'Avg Duration',  value: fmtDur(stats.avg),     sub: 'per call',    color: 'text-amber-400'    },
          { label: 'Longest Call',  value: fmtDur(stats.longest), sub: 'recorded',    color: 'text-purple-400'   },
          { label: 'Conversion',    value: `${stats.rate}%`,      sub: 'converted',   color: 'text-emerald-400'  },
        ] as const).map(card => (
          <div key={card.label} className="bg-[#111]/70 border border-white/[0.07] rounded-2xl p-4 space-y-1.5">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{card.label}</p>
            <p className={`text-xl font-bold leading-none ${card.color}`}>{card.value}</p>
            <p className="text-[9px] text-zinc-600">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTERS */}
      <div className="bg-[#111]/60 border border-white/[0.07] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by business, phone, employee or notes…"
              className="w-full pl-10 pr-4 h-10 bg-white/[0.02] border border-white/[0.08] focus:border-red-500/60 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.07] p-1 rounded-xl shrink-0 overflow-x-auto">
            {([['all','All'],['today','Today'],['yesterday','Yesterday'],['7d','7 Days'],['30d','30 Days']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFilterDate(v)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${filterDate === v ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 h-10 px-3 rounded-xl border text-[11px] font-bold transition-all shrink-0 ${showFilters ? 'border-red-500/40 text-red-400 bg-red-500/5' : 'border-white/[0.08] text-zinc-400 hover:text-white bg-white/[0.02]'}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filters <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2 border-t border-white/[0.05]">
            {[
              { label: 'Employee', value: filterEmployee, set: setFilterEmployee, opts: [['all','All Reps'], ...employees.map(e => [e.id, e.name])] },
              { label: 'Outcome', value: filterOutcome, set: setFilterOutcome, opts: [['all','All'], ...Object.entries(CALL_OUTCOME_LABELS)] },
              { label: 'Duration', value: filterDuration, set: setFilterDuration, opts: [['all','Any'],['short','<1 min'],['medium','1–5 min'],['long','>5 min']] },
              { label: 'Status', value: filterStatus, set: setFilterStatus, opts: [['all','Any'],['completed','Completed'],['missed','Missed'],['voicemail','Voicemail']] },
              { label: 'Priority', value: filterPriority, set: setFilterPriority, opts: [['all','Any'],['high','High'],['medium','Medium'],['low','Low']] },
              { label: 'Category', value: filterCategory, set: setFilterCategory, opts: [['all','All'], ...LEAD_CATEGORIES.map(c => [c, c])] },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">{f.label}</label>
                <select value={f.value} onChange={e => f.set(e.target.value)}
                  className="w-full h-9 px-2 bg-white/[0.02] border border-white/[0.08] rounded-lg text-xs text-white outline-none focus:border-red-500/60">
                  {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-[#111]/70 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1200px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                {['Call ID','Business Name','Contact','Phone','Employee','Date','Start–End','Duration','Direction','Outcome','Next Follow-up','Priority','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : calls.length === 0
                  ? (
                    <tr>
                      <td colSpan={14} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <PhoneOff className="w-10 h-10 text-zinc-700" />
                          <p className="text-sm font-bold text-zinc-500">No call records found</p>
                          <p className="text-xs text-zinc-600 max-w-xs">Complete calls from the Call Center to populate this log.</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : calls.map(call => (
                    <tr key={call.id} onClick={() => openDrawer(call)}
                      className="group hover:bg-white/[0.025] cursor-pointer transition-colors">

                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors">{call.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[150px]">
                        <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate">{call.lead?.shop_name ?? '—'}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{call.lead?.category ?? ''}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-zinc-400 whitespace-nowrap">
                        {call.lead?.shop_name ? call.lead.shop_name.split(' ')[0] : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-zinc-400 whitespace-nowrap">{call.lead?.phone ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-red-500/15 text-red-400 text-[8px] font-bold flex items-center justify-center shrink-0">
                            {call.employee?.name?.[0] ?? '?'}
                          </div>
                          <span className="text-xs text-zinc-300 font-semibold truncate max-w-[90px]">{call.employee?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-zinc-400 whitespace-nowrap">{fmtShort(call.start_time)}</td>
                      <td className="px-4 py-3.5 text-[10px] font-mono text-zinc-500 whitespace-nowrap">
                        {call.start_time ? format(parseISO(call.start_time), 'HH:mm') : '—'}
                        {' – '}
                        {call.end_time ? format(parseISO(call.end_time), 'HH:mm') : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-zinc-400 whitespace-nowrap">{fmtDur(call.duration_seconds)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold ${(call.direction ?? 'outgoing') === 'incoming' ? 'text-blue-400' : 'text-zinc-500'}`}>
                          {(call.direction ?? 'outgoing') === 'incoming' ? '↙ In' : '↗ Out'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><OutcomeBadge outcome={call.outcome} /></td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {call.follow_up && call.follow_up_date ? (
                          <span className={`text-[10px] font-semibold flex items-center gap-1 ${isOverdue(call) ? 'text-red-400' : 'text-amber-400'}`}>
                            <CalendarClock className="w-3 h-3" />
                            {fmtShort(call.follow_up_date)}
                            {isOverdue(call) && <span className="text-[9px] font-bold text-red-500">OVERDUE</span>}
                          </span>
                        ) : <span className="text-zinc-700 text-[10px]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {(() => {
                          const p = (call.priority ?? 'medium') as keyof typeof PRIORITY_CFG
                          const c = PRIORITY_CFG[p] ?? PRIORITY_CFG.medium
                          return (
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                              <span className={`text-[10px] font-bold ${c.text}`}>{c.label}</span>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold uppercase ${
                          (call.status ?? 'completed') === 'completed' ? 'text-emerald-400' :
                          (call.status ?? 'completed') === 'missed' ? 'text-red-400' : 'text-amber-400'
                        }`}>{call.status ?? 'completed'}</span>
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => navigate(`/call-center?leadId=${call.lead_id}`)}
                            className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 flex items-center justify-center transition-all" title="Call Again">
                            <Phone className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(call.id)}
                            className="w-7 h-7 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 border border-white/[0.06] flex items-center justify-center transition-all" title="Delete">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.05] bg-white/[0.005]">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            {isLoading ? 'Loading…' : `${Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount}`}
          </p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] text-white disabled:opacity-30 flex items-center justify-center transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-zinc-400 min-w-[70px] text-center">Page {page} / {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] text-white disabled:opacity-30 flex items-center justify-center transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          DETAILS DRAWER
      ════════════════════════════════════════════════════ */}
      {drawerOpen && selectedCall && (
        <div className="fixed inset-0 z-50 flex" style={{ animation: 'fadeIn 0.15s ease-out' }}>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="w-full max-w-[480px] h-full bg-[#0c0c0c] border-l border-white/[0.08] flex flex-col shadow-2xl"
            style={{ animation: 'slideInRight 0.22s ease-out' }}>

            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between bg-white/[0.01] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{selectedCall.lead?.shop_name ?? 'Call Details'}</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{selectedCall.lead?.phone ?? ''} · ID {selectedCall.id.slice(0, 8)}</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg border border-white/[0.08] hover:border-white/15 text-zinc-500 hover:text-white flex items-center justify-center transition-all shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.06] bg-black/20 shrink-0">
              {(['details','notes','timeline','history'] as const).map(tab => (
                <button key={tab} onClick={() => setDrawerTab(tab)}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${drawerTab === tab ? 'border-red-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">

              {/* ── DETAILS ──────────────────────────── */}
              {drawerTab === 'details' && (
                <div className="p-5 space-y-5">
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    <OutcomeBadge outcome={selectedCall.outcome} />
                    {(() => {
                      const p = (selectedCall.priority ?? 'medium') as keyof typeof PRIORITY_CFG
                      const c = PRIORITY_CFG[p]
                      return <span className={`text-[10px] font-bold ${c.text} border border-white/[0.08] px-2 py-0.5 rounded-md`}><Star className="w-2.5 h-2.5 inline mr-1" />{c.label}</span>
                    })()}
                    {isOverdue(selectedCall) && (
                      <span className="text-[10px] font-bold text-red-400 border border-red-500/20 bg-red-500/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> Overdue
                      </span>
                    )}
                  </div>

                  {/* Business Info */}
                  <section>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Business Information</p>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2.5 text-xs">
                      {([
                        ['Business', selectedCall.lead?.shop_name],
                        ['Category', selectedCall.lead?.category],
                        ['Phone', selectedCall.lead?.phone],
                        ['Address', selectedCall.lead?.address],
                        ['Lead Status', selectedCall.lead?.status],
                      ] as [string, string | undefined][]).map(([k, v]) => v && (
                        <div key={k} className="flex justify-between gap-4">
                          <span className="text-zinc-500 font-medium shrink-0">{k}:</span>
                          <span className="text-white font-semibold text-right">{v}</span>
                        </div>
                      ))}
                      {selectedCall.lead?.website && (
                        <div className="flex justify-between gap-4">
                          <span className="text-zinc-500 font-medium shrink-0">Website:</span>
                          <a href={`https://${selectedCall.lead.website}`} target="_blank" rel="noreferrer"
                            className="text-red-400 hover:underline flex items-center gap-1 font-semibold">
                            {selectedCall.lead.website} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Call Summary */}
                  <section>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Call Summary</p>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2.5 text-xs">
                      {([
                        ['Employee', selectedCall.employee?.name],
                        ['Start Time', selectedCall.start_time ? format(parseISO(selectedCall.start_time), 'yyyy-MM-dd HH:mm:ss') : '—'],
                        ['End Time', selectedCall.end_time ? format(parseISO(selectedCall.end_time), 'HH:mm:ss') : '—'],
                        ['Duration', fmtDur(selectedCall.duration_seconds)],
                        ['Direction', selectedCall.direction ?? 'outgoing'],
                        ['Status', selectedCall.status ?? 'completed'],
                      ] as [string, string][]).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4">
                          <span className="text-zinc-500 font-medium shrink-0">{k}:</span>
                          <span className="text-white font-semibold capitalize">{v}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Tags */}
                  <section>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(selectedCall.tags ?? []).length === 0
                        ? <p className="text-[11px] text-zinc-600">No tags</p>
                        : (selectedCall.tags ?? []).map(t => (
                          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.03] border border-white/[0.08] rounded-md text-[10px] text-zinc-300 font-semibold">
                            <Tag className="w-2.5 h-2.5 text-zinc-500" /> {t}
                          </span>
                        ))}
                    </div>
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          const newTags = [...(selectedCall.tags ?? []), tagInput.trim()]
                          setSelectedCall(prev => prev ? { ...prev, tags: newTags } : null)
                          setTagInput('')
                        }
                      }}
                      placeholder="Type tag + Enter"
                      className="w-full h-8 px-2.5 bg-white/[0.02] border border-white/[0.08] rounded-lg text-xs text-white placeholder-zinc-600 outline-none focus:border-red-500/60"
                    />
                  </section>

                  {/* Assign Manager */}
                  <section>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Assigned Manager</p>
                    <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 border border-red-500/15 flex items-center justify-center text-xs font-bold shrink-0">
                        {selectedCall.lead?.assigned_employee?.name?.[0] ?? '?'}
                      </div>
                      <span className="text-xs text-white font-semibold flex-1">{selectedCall.lead?.assigned_employee?.name ?? 'Unassigned'}</span>
                      <select onChange={e => handleAssign(e.target.value)} defaultValue=""
                        className="bg-transparent border border-white/[0.08] rounded-lg text-[11px] py-1 px-2 text-white outline-none focus:border-red-500/60">
                        <option value="">Reassign…</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  </section>

                  {/* Recordings */}
                  <section>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Call Recording</p>
                    <AudioPlayer label="Call Recording" duration="03:42" />
                  </section>
                  <section>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Voice Note</p>
                    <AudioPlayer label="Voice Memo" duration="00:45" />
                  </section>
                </div>
              )}

              {/* ── NOTES ────────────────────────────── */}
              {drawerTab === 'notes' && (
                <div className="p-5 space-y-4">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Call Notes</p>
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex gap-2 text-xs text-zinc-400">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p>Saving notes will log an entry on this lead's activity timeline.</p>
                  </div>
                  <textarea
                    rows={11}
                    value={notesEdit}
                    onChange={e => setNotesEdit(e.target.value)}
                    placeholder={"• Customer asked about Premium website package\n• Interested in 5-page design\n• Call back Friday after 3 PM\n• Follow up on pricing quote"}
                    className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-red-500/60 rounded-xl p-4 text-xs text-white placeholder-zinc-700 outline-none resize-none transition-colors leading-relaxed"
                  />
                  <button onClick={handleSaveNotes}
                    disabled={savingNotes || notesEdit === (selectedCall.notes ?? '')}
                    className="w-full flex items-center justify-center gap-2 h-11 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all">
                    {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {savingNotes ? 'Saving…' : 'Save Notes'}
                  </button>
                </div>
              )}

              {/* ── TIMELINE ─────────────────────────── */}
              {drawerTab === 'timeline' && (
                <div className="p-5 space-y-5">
                  {/* This Call Events */}
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-3">This Call</p>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
                      {[
                        { time: selectedCall.start_time, label: 'Call Started', color: 'bg-blue-500/20 text-blue-400', icon: <Phone className="w-3 h-3" /> },
                        ...(selectedCall.end_time ? [{ time: selectedCall.end_time, label: 'Call Ended', color: 'bg-zinc-700 text-zinc-400', icon: <PhoneOff className="w-3 h-3" /> }] : []),
                        ...(selectedCall.notes ? [{ time: selectedCall.created_at, label: 'Notes Added', color: 'bg-amber-500/20 text-amber-400', icon: <Edit3 className="w-3 h-3" /> }] : []),
                        ...(selectedCall.follow_up && selectedCall.follow_up_date ? [{ time: selectedCall.follow_up_date, label: `Follow-up: ${selectedCall.follow_up_date}`, color: 'bg-purple-500/20 text-purple-400', icon: <CalendarClock className="w-3 h-3" /> }] : []),
                      ].map((ev, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${ev.color}`}>{ev.icon}</div>
                          <div>
                            <p className="text-white font-semibold">{ev.label}</p>
                            <p className="text-[10px] font-mono text-zinc-500">{ev.time ? format(parseISO(ev.time), 'hh:mm a') : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Follow-up */}
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Schedule Follow-up</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                        className="h-9 px-2.5 bg-white/[0.02] border border-white/[0.08] rounded-lg text-xs text-white outline-none focus:border-red-500/60" />
                      <input type="time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)}
                        className="h-9 px-2.5 bg-white/[0.02] border border-white/[0.08] rounded-lg text-xs text-white outline-none focus:border-red-500/60" />
                    </div>
                    <button onClick={handleSaveFollowUp} disabled={!followUpDate || savingFollowUp}
                      className="w-full h-9 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-xl transition-all disabled:opacity-40">
                      {savingFollowUp ? 'Scheduling…' : 'Schedule Follow-up'}
                    </button>
                  </div>

                  {/* Lead Activity Feed */}
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Lead Activity Feed</p>
                    {activities.length === 0
                      ? <p className="text-xs text-zinc-600 text-center py-4">No activity yet</p>
                      : activities.map(act => <TimelineItem key={act.id} act={act} />)}
                  </div>
                </div>
              )}

              {/* ── HISTORY ──────────────────────────── */}
              {drawerTab === 'history' && (
                <div className="p-5 space-y-4">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Previous Calls — {selectedCall.lead?.shop_name}</p>
                  {leadCalls.length === 0
                    ? <p className="text-xs text-zinc-600 text-center py-8">No other calls for this client</p>
                    : leadCalls.map(c => (
                      <div key={c.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">{fmtDate(c.start_time)}</span>
                          <OutcomeBadge outcome={c.outcome} />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                          <span><Clock className="w-3 h-3 inline mr-1" />{fmtDur(c.duration_seconds)}</span>
                          <span><User className="w-3 h-3 inline mr-1" />{c.employee?.name ?? '—'}</span>
                        </div>
                        {c.notes && <p className="text-xs text-zinc-400 leading-relaxed border-t border-white/[0.05] pt-2">{c.notes}</p>}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 border-t border-white/[0.07] bg-white/[0.01] shrink-0">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Call Again', icon: <Phone className="w-3.5 h-3.5" />,         color: 'text-red-400 border-red-500/15 hover:bg-red-500/10',         action: () => { setDrawerOpen(false); navigate(`/call-center?leadId=${selectedCall.lead_id}`) } },
                  { label: 'WhatsApp',   icon: <MessageSquare className="w-3.5 h-3.5" />,  color: 'text-emerald-400 border-emerald-500/15 hover:bg-emerald-500/10', action: () => window.open(`https://wa.me/${selectedCall.lead?.phone?.replace(/\D/g,'')}`, '_blank') },
                  { label: 'Website',    icon: <Globe className="w-3.5 h-3.5" />,           color: 'text-sky-400 border-sky-500/15 hover:bg-sky-500/10',         action: () => selectedCall.lead?.website && window.open(`https://${selectedCall.lead.website}`, '_blank') },
                  { label: 'Maps',       icon: <MapPin className="w-3.5 h-3.5" />,          color: 'text-amber-400 border-amber-500/15 hover:bg-amber-500/10',   action: () => selectedCall.lead?.address && window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedCall.lead.address)}`, '_blank') },
                  { label: 'Notes',      icon: <Edit3 className="w-3.5 h-3.5" />,           color: 'text-zinc-400 border-white/[0.08] hover:bg-white/[0.05]',    action: () => setDrawerTab('notes') },
                  { label: 'Timeline',   icon: <ActivityIcon className="w-3.5 h-3.5" />,   color: 'text-purple-400 border-purple-500/15 hover:bg-purple-500/10', action: () => setDrawerTab('timeline') },
                  { label: 'Assign',     icon: <Users className="w-3.5 h-3.5" />,           color: 'text-indigo-400 border-indigo-500/15 hover:bg-indigo-500/10', action: () => setDrawerTab('details') },
                  { label: 'Delete',     icon: <Trash2 className="w-3.5 h-3.5" />,          color: 'text-rose-500 border-rose-500/15 hover:bg-rose-500/10',     action: () => handleDelete(selectedCall.id) },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.action}
                    className={`flex flex-col items-center gap-1 p-2 border rounded-xl text-[9px] font-bold transition-all ${btn.color}`}>
                    {btn.icon}
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}
