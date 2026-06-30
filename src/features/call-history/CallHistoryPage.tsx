import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Phone,
  Globe,
  MessageSquare,
  MapPin,
  Clock,
  Save,
  CheckCircle2,
  Calendar,
  ChevronRight,
  PhoneOff,
  Star,
  Activity as ActivityIcon,
  Search,
  Download,
  FileText,
  SlidersHorizontal,
  Volume2,
  Play,
  Pause,
  User,
  MoreVertical,
  Trash2,
  Briefcase,
  ArrowRight,
  ChevronLeft,
  ListFilter,
  Tag,
  ExternalLink,
  Mail,
  X,
  History,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { useLeads } from '../leads/hooks/useLeads'
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { CALL_OUTCOME_LABELS, LEAD_CATEGORIES } from '@/utils/constants'
import { LeadStatusBadge } from '../leads/components/LeadStatusBadge'
import type { Lead, Call, Activity, CallOutcome, LeadStatus, Employee } from '@/types'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                  !import.meta.env.VITE_SUPABASE_URL

export function CallHistoryPage() {
  const { employee } = useAuth()
  const navigate = useNavigate()
  const { leads, updateLead } = useLeads()

  // State lists
  const [calls, setCalls] = useState<Call[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedOutcome, setSelectedOutcome] = useState('all')
  const [selectedDuration, setSelectedDuration] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dateFilter, setDateFilter] = useState('all') // all, today, yesterday, 7days, 30days

  // Drawer
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'details' | 'notes' | 'timeline' | 'history'>('details')

  // Drawer notes edit
  const [editingNotes, setEditingNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Drawer lead assignment edit
  const [editingAssignee, setEditingAssignee] = useState('')

  // Mock Players State
  const [isPlayingRecording, setIsPlayingRecording] = useState(false)
  const [isPlayingVoiceNote, setIsPlayingVoiceNote] = useState(false)

  // Load basic configurations
  useEffect(() => {
    if (DEMO_MODE) {
      setEmployees(Storage.getEmployees())
    } else {
      supabase.from('employees').select('*').then(({ data }) => {
        if (data) setEmployees(data as Employee[])
      })
    }
  }, [])

  // Load Calls Data (Supabase or Demo Storage)
  const fetchCalls = async () => {
    setIsLoading(true)
    try {
      if (DEMO_MODE) {
        let allCalls = Storage.getCalls()
        const allLeads = Storage.getLeads()
        const allEmps = Storage.getEmployees()

        // Attach joins in memory
        let joinedCalls = allCalls.map((c) => ({
          ...c,
          lead: allLeads.find((l) => l.id === c.lead_id),
          employee: allEmps.find((e) => e.id === c.employee_id),
        }))

        // Search Filter
        if (search) {
          const s = search.toLowerCase()
          joinedCalls = joinedCalls.filter(
            (c) =>
              c.lead?.shop_name.toLowerCase().includes(s) ||
              c.lead?.phone.includes(s) ||
              c.employee?.name.toLowerCase().includes(s) ||
              c.notes?.toLowerCase().includes(s)
          )
        }

        // Employee filter
        if (selectedEmployee !== 'all') {
          joinedCalls = joinedCalls.filter((c) => c.employee_id === selectedEmployee)
        }

        // Outcome filter
        if (selectedOutcome !== 'all') {
          joinedCalls = joinedCalls.filter((c) => c.outcome === selectedOutcome)
        }

        // Priority filter
        if (selectedPriority !== 'all') {
          joinedCalls = joinedCalls.filter((c) => (c.priority || 'medium') === selectedPriority)
        }

        // Status filter
        if (selectedStatus !== 'all') {
          joinedCalls = joinedCalls.filter((c) => (c.status || 'completed') === selectedStatus)
        }

        // Category filter
        if (selectedCategory !== 'all') {
          joinedCalls = joinedCalls.filter((c) => c.lead?.category === selectedCategory)
        }

        // Duration Filter
        if (selectedDuration !== 'all') {
          joinedCalls = joinedCalls.filter((c) => {
            const secs = c.duration_seconds || 0
            if (selectedDuration === 'short') return secs < 60
            if (selectedDuration === 'medium') return secs >= 60 && secs <= 300
            if (selectedDuration === 'long') return secs > 300
            return true
          })
        }

        // Date Filter
        if (dateFilter !== 'all') {
          const now = new Date()
          joinedCalls = joinedCalls.filter((c) => {
            const callDate = new Date(c.start_time)
            const diffTime = Math.abs(now.getTime() - callDate.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (dateFilter === 'today') {
              return callDate.toDateString() === now.toDateString()
            }
            if (dateFilter === 'yesterday') {
              const yesterday = new Date(now)
              yesterday.setDate(now.getDate() - 1)
              return callDate.toDateString() === yesterday.toDateString()
            }
            if (dateFilter === '7days') return diffDays <= 7
            if (dateFilter === '30days') return diffDays <= 30
            return true
          })
        }

        setTotalCount(joinedCalls.length)

        // Paginate & Sort (Newest first)
        joinedCalls.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
        const start = (page - 1) * pageSize
        const paginated = joinedCalls.slice(start, start + pageSize)

        setCalls(paginated)
      } else {
        // Supabase mode
        let query = supabase
          .from('calls')
          .select('*, lead:leads!inner(*), employee:employees!inner(*)', { count: 'exact' })

        // Apply filters
        if (search) {
          query = query.or(
            `notes.ilike.%${search}%,lead.shop_name.ilike.%${search}%,lead.phone.ilike.%${search}%,employee.name.ilike.%${search}%`
          )
        }

        if (selectedEmployee !== 'all') {
          query = query.eq('employee_id', selectedEmployee)
        }

        if (selectedOutcome !== 'all') {
          query = query.eq('outcome', selectedOutcome)
        }

        if (selectedPriority !== 'all') {
          query = query.eq('priority', selectedPriority)
        }

        if (selectedStatus !== 'all') {
          query = query.eq('status', selectedStatus)
        }

        if (selectedCategory !== 'all') {
          query = query.eq('lead.category', selectedCategory)
        }

        if (selectedDuration !== 'all') {
          if (selectedDuration === 'short') query = query.lt('duration_seconds', 60)
          else if (selectedDuration === 'medium') query = query.gte('duration_seconds', 60).lte('duration_seconds', 300)
          else if (selectedDuration === 'long') query = query.gt('duration_seconds', 300)
        }

        if (dateFilter !== 'all') {
          const now = new Date()
          if (dateFilter === 'today') {
            const startToday = new Date(now.setHours(0,0,0,0)).toISOString()
            query = query.gte('start_time', startToday)
          } else if (dateFilter === 'yesterday') {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const startYesterday = new Date(yesterday.setHours(0,0,0,0)).toISOString()
            const endYesterday = new Date(yesterday.setHours(23,59,59,999)).toISOString()
            query = query.gte('start_time', startYesterday).lte('start_time', endYesterday)
          } else if (dateFilter === '7days') {
            const start7 = new Date(now.setDate(now.getDate() - 7)).toISOString()
            query = query.gte('start_time', start7)
          } else if (dateFilter === '30days') {
            const start30 = new Date(now.setDate(now.getDate() - 30)).toISOString()
            query = query.gte('start_time', start30)
          }
        }

        // Pagination & Ordering
        query = query.order('start_time', { ascending: false })
        query = query.range((page - 1) * pageSize, page * pageSize - 1)

        const { data, count, error } = await query
        if (error) throw error

        setCalls(data as Call[])
        setTotalCount(count || 0)
      }
    } catch (err: unknown) {
      toast.error('Failed to fetch call logs')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCalls()
  }, [page, pageSize, search, selectedEmployee, selectedOutcome, selectedDuration, selectedStatus, selectedPriority, selectedCategory, dateFilter])

  // Lead details loader in drawer
  const loadDrawerTimelineAndHistory = async (leadId: string) => {
    try {
      if (DEMO_MODE) {
        const acts = Storage.getActivities()
          .filter((a) => a.lead_id === leadId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setActivities(acts)
      } else {
        const { data, error } = await supabase
          .from('activities')
          .select('*, employee:employees(*)')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
        if (error) throw error
        setActivities(data as Activity[])
      }
    } catch (err) {
      console.error('Failed to load lead timeline', err)
    }
  }

  useEffect(() => {
    if (selectedCall?.lead_id) {
      loadDrawerTimelineAndHistory(selectedCall.lead_id)
    }
  }, [selectedCall])

  // Analytics KPI Stats
  const stats = useMemo(() => {
    // If empty load from memory, otherwise aggregate
    let allFilteredCalls = calls
    if (DEMO_MODE) {
      allFilteredCalls = Storage.getCalls()
    } else {
      // In Supabase, if pagination is applied we can fetch a general aggregate or compute on local state
      // For simplicity, we calculate based on overall calls lists
    }

    const total = allFilteredCalls.length
    const todayStr = new Date().toISOString().split('T')[0]
    const today = allFilteredCalls.filter((c) => c.start_time.startsWith(todayStr)).length
    
    const connected = allFilteredCalls.filter((c) => 
      ['connected', 'interested', 'very_interested', 'meeting_scheduled', 'demo_booked', 'proposal_sent', 'converted'].includes(c.outcome)
    ).length
    
    const missed = allFilteredCalls.filter((c) => 
      ['no_answer', 'busy', 'rejected', 'switched_off'].includes(c.outcome)
    ).length

    const durations = allFilteredCalls.map((c) => c.duration_seconds || 0).filter(Boolean)
    const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
    const longestCall = durations.length ? Math.max(...durations) : 0

    const converted = allFilteredCalls.filter((c) => c.outcome === 'converted').length
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0

    return {
      total,
      today,
      connected,
      missed,
      avgDuration,
      longestCall,
      conversionRate,
    }
  }, [calls])

  // Notes update handler
  const handleSaveNotes = async () => {
    if (!selectedCall) return
    setIsSavingNotes(true)
    try {
      if (DEMO_MODE) {
        const allCalls = Storage.getCalls()
        const index = allCalls.findIndex((c) => c.id === selectedCall.id)
        if (index !== -1) {
          allCalls[index].notes = editingNotes
          Storage.saveCalls(allCalls)
        }
        // Save activity log
        const acts = Storage.getActivities()
        const newAct: Activity = {
          id: `act-${Date.now()}`,
          lead_id: selectedCall.lead_id,
          employee_id: employee?.id || 'emp-1',
          type: 'note',
          description: `Call notes updated: ${editingNotes.slice(0, 60)}...`,
          created_at: new Date().toISOString(),
        }
        Storage.saveActivities([newAct, ...acts])
        toast.success('Call notes updated successfully')
        fetchCalls()
      } else {
        const { error } = await supabase
          .from('calls')
          .update({ notes: editingNotes } as never)
          .eq('id', selectedCall.id)
        if (error) throw error

        const activityPayload = {
          lead_id: selectedCall.lead_id,
          employee_id: employee?.id || 'emp-1',
          type: 'note',
          description: `Call notes updated: ${editingNotes.slice(0, 60)}...`,
        }
        await supabase.from('activities').insert(activityPayload as never)

        toast.success('Call notes updated successfully')
        fetchCalls()
      }
      setSelectedCall((prev) => prev ? { ...prev, notes: editingNotes } : null)
    } catch (err) {
      toast.error('Failed to update notes')
      console.error(err)
    } finally {
      setIsSavingNotes(false)
    }
  }

  // Employee assignment handler
  const handleAssignEmployee = async (empId: string) => {
    if (!selectedCall?.lead_id) return
    try {
      await updateLead({
        id: selectedCall.lead_id,
        data: { assigned_to: empId || undefined }
      })
      toast.success('Lead assignment updated successfully')
      
      // Update local state details
      const selectedEmp = employees.find((e) => e.id === empId)
      setSelectedCall((prev) => 
        prev && prev.lead 
          ? { ...prev, lead: { ...prev.lead, assigned_to: empId, assigned_employee: selectedEmp } } 
          : prev
      )
      fetchCalls()
    } catch (err) {
      toast.error('Failed to update assignment')
    }
  }

  // Delete call log record
  const handleDeleteRecord = async (callId: string) => {
    if (!window.confirm('Are you sure you want to delete this call record permanently?')) return
    try {
      if (DEMO_MODE) {
        const allCalls = Storage.getCalls().filter((c) => c.id !== callId)
        Storage.saveCalls(allCalls)
        toast.success('Call record deleted successfully')
        setIsDrawerOpen(false)
        fetchCalls()
      } else {
        const { error } = await supabase.from('calls').delete().eq('id', callId)
        if (error) throw error
        toast.success('Call record deleted successfully')
        setIsDrawerOpen(false)
        fetchCalls()
      }
    } catch (err) {
      toast.error('Failed to delete call record')
    }
  }

  // Export handlers
  const handleExportCSV = () => {
    try {
      const headers = ['Call ID', 'Lead Name', 'Business Name', 'Phone', 'Employee', 'Date', 'Outcome', 'Duration', 'Direction', 'Status', 'Notes']
      const rows = calls.map((c) => [
        c.id,
        c.lead?.shop_name || 'N/A', // Business Name
        c.lead?.shop_name || 'N/A', // Lead Name placeholder
        c.lead?.phone || 'N/A',
        c.employee?.name || 'N/A',
        c.start_time ? format(new Date(c.start_time), 'yyyy-MM-dd HH:mm') : 'N/A',
        CALL_OUTCOME_LABELS[c.outcome] || c.outcome,
        c.duration_seconds ? `${Math.floor(c.duration_seconds / 60)}m ${c.duration_seconds % 60}s` : '0s',
        c.direction || 'outgoing',
        c.status || 'completed',
        c.notes || '',
      ])

      const csvContent = [headers.join(','), ...rows.map((r) => r.map((val) => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.setAttribute('download', `redix_call_history_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('CSV exported successfully')
    } catch (err) {
      toast.error('Failed to export CSV')
    }
  }

  const handleExportExcel = () => {
    try {
      const data = calls.map((c) => ({
        'Call ID': c.id,
        'Business Name': c.lead?.shop_name || 'N/A',
        'Phone Number': c.lead?.phone || 'N/A',
        'Sales Rep': c.employee?.name || 'N/A',
        'Date Placed': c.start_time ? format(new Date(c.start_time), 'yyyy-MM-dd HH:mm') : 'N/A',
        'Call Outcome': CALL_OUTCOME_LABELS[c.outcome] || c.outcome,
        'Duration (Secs)': c.duration_seconds || 0,
        'Call Direction': c.direction || 'outgoing',
        'Log Status': c.status || 'completed',
        'Rich Notes': c.notes || '',
      }))

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Calls Logs')
      XLSX.writeFile(wb, `redix_call_history_${Date.now()}.xlsx`)
      toast.success('Excel report downloaded successfully')
    } catch (err) {
      toast.error('Failed to export Excel')
    }
  }

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()

      doc.setFillColor(15, 15, 15)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('REDIX CRM - Call History Logs', 15, 20)
      
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 40)

      const tableData = calls.map((c) => [
        c.lead?.shop_name || 'N/A',
        c.lead?.phone || 'N/A',
        c.employee?.name || 'N/A',
        c.start_time ? format(new Date(c.start_time), 'MM-dd HH:mm') : 'N/A',
        CALL_OUTCOME_LABELS[c.outcome] || c.outcome,
        c.duration_seconds ? `${Math.floor(c.duration_seconds / 60)}m ${c.duration_seconds % 60}s` : '0s',
        c.direction || 'outgoing',
      ])

      autoTable(doc, {
        head: [['Business Name', 'Phone', 'Employee', 'Date/Time', 'Outcome', 'Duration', 'Direction']],
        body: tableData,
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: [30, 30, 30] },
      })

      doc.save(`redix_call_history_${Date.now()}.pdf`)
      toast.success('PDF report downloaded successfully!')
    } catch (err) {
      toast.error('Failed to generate PDF')
      console.error(err)
    }
  }

  const formatDurationText = (sec?: number) => {
    if (!sec) return '0s'
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <div className="page-shell page-stack space-y-6 !max-w-7xl">
      {/* Header Panel */}
      <div className="panel-card flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Call History Registers</p>
            <p className="text-xs text-zinc-500 mt-0.5">Permanent communication logs, voice recordings, and audit trails for all outbound pipelines.</p>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-white/[0.08] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] text-white text-[11px] font-bold rounded-xl transition-all h-9"
          >
            <FileText className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 border border-white/[0.08] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] text-white text-[11px] font-bold rounded-xl transition-all h-9"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 border border-white/[0.08] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] text-white text-[11px] font-bold rounded-xl transition-all h-9"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Calls</p>
          <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{stats.total}</h3>
          <span className="text-[10px] text-zinc-600 block mt-1">Lifetime phone calls logged</span>
        </div>
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Today's Volume</p>
          <h3 className="text-2xl font-bold text-red-400 tracking-tight mt-2">{stats.today}</h3>
          <span className="text-[10px] text-red-500/80 block mt-1">Calls logged today</span>
        </div>
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Connected / Missed</p>
          <h3 className="text-2xl font-bold text-emerald-400 tracking-tight mt-2">
            {stats.connected} <span className="text-sm text-zinc-500">/ {stats.missed}</span>
          </h3>
          <span className="text-[10px] text-emerald-500/80 block mt-1">Answered vs No Answer</span>
        </div>
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Avg / Max Duration</p>
          <h3 className="text-xl font-bold text-white tracking-tight mt-2">
            {formatDurationText(stats.avgDuration)} <span className="text-sm text-zinc-500">/ {formatDurationText(stats.longestCall)}</span>
          </h3>
          <span className="text-[10px] text-zinc-600 block mt-1">Conversion: {stats.conversionRate}%</span>
        </div>
      </div>

      {/* Filters and Search Panel */}
      <div className="border border-white/[0.08] bg-[#111111]/40 rounded-2xl p-5 space-y-4 shadow-md">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by lead name, business, phone, rep or notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 bg-white/[0.02] border border-white/[0.08] focus:border-red-500 text-xs rounded-xl h-10 text-white placeholder-zinc-500 transition-colors"
            />
          </div>

          {/* Quick Filters Toggles */}
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.08] p-1 rounded-xl">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${dateFilter === 'all' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${dateFilter === 'today' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilter('yesterday')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${dateFilter === 'yesterday' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                Yesterday
              </button>
              <button
                onClick={() => setDateFilter('7days')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${dateFilter === '7days' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                7 Days
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Filters row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Employee */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Representative</label>
            <select
              value={selectedEmployee}
              onChange={(e) => {
                setSelectedEmployee(e.target.value)
                setPage(1)
              }}
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-red-500 text-xs rounded-lg h-9 px-2 text-white"
            >
              <option value="all">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* Call Outcome */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Outcome</label>
            <select
              value={selectedOutcome}
              onChange={(e) => {
                setSelectedOutcome(e.target.value)
                setPage(1)
              }}
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-red-500 text-xs rounded-lg h-9 px-2 text-white"
            >
              <option value="all">All Outcomes</option>
              {Object.entries(CALL_OUTCOME_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Call Duration */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Duration</label>
            <select
              value={selectedDuration}
              onChange={(e) => {
                setSelectedDuration(e.target.value)
                setPage(1)
              }}
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-red-500 text-xs rounded-lg h-9 px-2 text-white"
            >
              <option value="all">Any Duration</option>
              <option value="short">Short (&lt; 1 min)</option>
              <option value="medium">Medium (1-5 min)</option>
              <option value="long">Long (&gt; 5 min)</option>
            </select>
          </div>

          {/* Call Status */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Log Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(1)
              }}
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-red-500 text-xs rounded-lg h-9 px-2 text-white"
            >
              <option value="all">Any Status</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="voicemail">Voicemail</option>
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value)
                setPage(1)
              }}
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-red-500 text-xs rounded-lg h-9 px-2 text-white"
            >
              <option value="all">Any Priority</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setPage(1)
              }}
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-red-500 text-xs rounded-lg h-9 px-2 text-white"
            >
              <option value="all">All Categories</option>
              {LEAD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500/20 border-t-red-500" />
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Fetching logs list...</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="p-20 text-center space-y-3">
            <PhoneOff className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Call History Records</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">No call reports found matching your current filter presets. Complete call logs from the Call Center to generate logs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.01] text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="px-5 py-4">Call ID</th>
                  <th className="px-5 py-4">Lead Name</th>
                  <th className="px-5 py-4">Business Name</th>
                  <th className="px-5 py-4">Phone Number</th>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Date & Time</th>
                  <th className="px-5 py-4 text-center">Duration</th>
                  <th className="px-5 py-4">Direction</th>
                  <th className="px-5 py-4">Outcome</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {calls.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => {
                      setSelectedCall(c)
                      setEditingNotes(c.notes || '')
                      setEditingAssignee(c.lead?.assigned_to || '')
                      setDrawerTab('details')
                      setIsDrawerOpen(true)
                    }}
                    className="group hover:bg-white/[0.02] cursor-pointer text-xs transition-colors"
                  >
                    {/* ID */}
                    <td className="px-5 py-4.5 font-mono text-[10px] text-zinc-500 group-hover:text-white transition-colors">
                      {c.id.slice(0, 8)}...
                    </td>

                    {/* Lead/Contact Name */}
                    <td className="px-5 py-4.5 font-bold text-white">
                      {c.lead?.shop_name ? c.lead.shop_name.split(' ')[0] + ' Manager' : 'N/A'}
                    </td>

                    {/* Business Name */}
                    <td className="px-5 py-4.5 font-bold text-white group-hover:text-red-400 transition-colors">
                      {c.lead?.shop_name || 'N/A'}
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-4.5 font-medium text-zinc-400">
                      {c.lead?.phone || 'N/A'}
                    </td>

                    {/* Employee */}
                    <td className="px-5 py-4.5 text-zinc-400 font-semibold">
                      {c.employee?.name || 'N/A'}
                    </td>

                    {/* Date/Time */}
                    <td className="px-5 py-4.5 text-zinc-400">
                      {c.start_time ? format(new Date(c.start_time), 'MMM dd, hh:mm a') : 'N/A'}
                    </td>

                    {/* Duration */}
                    <td className="px-5 py-4.5 text-center font-mono text-[11px] text-zinc-400">
                      {formatDurationText(c.duration_seconds)}
                    </td>

                    {/* Direction */}
                    <td className="px-5 py-4.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        (c.direction || 'outgoing') === 'incoming' 
                          ? 'bg-blue-500/10 text-blue-400' 
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {c.direction || 'outgoing'}
                      </span>
                    </td>

                    {/* Outcome Badge */}
                    <td className="px-5 py-4.5">
                      <span className={`inline-flex items-center px-2.5 py-1 border rounded-lg text-[10px] font-bold leading-none ${
                        c.outcome === 'converted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        c.outcome === 'meeting_scheduled' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        c.outcome === 'demo_booked' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        c.outcome === 'interested' || c.outcome === 'very_interested' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        ['no_answer', 'busy', 'rejected', 'switched_off'].includes(c.outcome) ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-zinc-800 text-zinc-400 border-white/[0.08]'
                      }`}>
                        {CALL_OUTCOME_LABELS[c.outcome] || c.outcome}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-4.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                        (c.priority || 'medium') === 'high' ? 'text-red-400' :
                        (c.priority || 'medium') === 'medium' ? 'text-amber-400' :
                        'text-zinc-500'
                      }`}>
                        <Star className={`w-3 h-3 fill-current ${(c.priority || 'medium') === 'high' ? 'text-red-400' : (c.priority || 'medium') === 'medium' ? 'text-amber-400' : 'text-transparent border border-zinc-500'}`} />
                        {c.priority || 'medium'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                        (c.status || 'completed') === 'completed' ? 'text-emerald-400' :
                        (c.status || 'completed') === 'voicemail' ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          (c.status || 'completed') === 'completed' ? 'bg-emerald-400' :
                          (c.status || 'completed') === 'voicemail' ? 'bg-amber-400' :
                          'bg-red-400'
                        }`} />
                        {c.status || 'completed'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/call-center?leadId=${c.lead_id}`)}
                          title="Call Lead Again"
                          className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 flex items-center justify-center transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(c.id)}
                          title="Delete Record"
                          className="w-8 h-8 rounded-lg bg-white/[0.02] hover:bg-red-500/10 text-zinc-500 hover:text-red-400 border border-white/[0.08] hover:border-red-500/20 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.08] bg-white/[0.01]">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount} Records
          </span>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 text-[11px] font-semibold">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="bg-transparent border-0 text-white font-bold outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-white/12 flex items-center justify-center text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage((p) => p + 1)}
                className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-white/12 flex items-center justify-center text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Right Drawer */}
      {isDrawerOpen && selectedCall && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          {/* Backdrop close */}
          <div className="flex-1" onClick={() => setIsDrawerOpen(false)} />

          {/* Drawer container */}
          <div className="w-full max-w-[500px] h-full bg-[#0a0a0a] border-l border-white/[0.08] flex flex-col justify-between shadow-2xl relative animate-slideLeft">
            
            {/* Header info */}
            <div className="p-6 border-b border-white/[0.08] flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 flex items-center justify-center">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white truncate max-w-[280px]">
                    {selectedCall.lead?.shop_name || 'Business Details'}
                  </h4>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold mt-0.5">
                    Call Record ID: {selectedCall.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-white/15 text-zinc-500 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Select buttons */}
            <div className="flex border-b border-white/[0.06] bg-white/[0.005] px-4">
              {['details', 'notes', 'timeline', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab as never)}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                    drawerTab === tab
                      ? 'border-red-500 text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Tab 1: Details */}
              {drawerTab === 'details' && (
                <div className="space-y-6">
                  {/* Lead Info */}
                  <div className="space-y-3.5">
                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Business Contacts</h5>
                    <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-4.5 space-y-3 text-xs leading-relaxed">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Business Title:</span>
                        <span className="text-white font-semibold">{selectedCall.lead?.shop_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Phone Number:</span>
                        <span className="text-white font-semibold">{selectedCall.lead?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Domain Category:</span>
                        <span className="text-white font-semibold">{selectedCall.lead?.category || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Office Address:</span>
                        <span className="text-white text-right max-w-[240px] truncate">{selectedCall.lead?.address || 'N/A'}</span>
                      </div>
                      {selectedCall.lead?.website && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-medium">Website:</span>
                          <a href={`https://${selectedCall.lead.website}`} target="_blank" rel="noreferrer" className="text-red-400 font-semibold hover:underline inline-flex items-center gap-1">
                            {selectedCall.lead.website} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call Parameters */}
                  <div className="space-y-3.5">
                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Call Summary</h5>
                    <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-4.5 space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Representative:</span>
                        <span className="text-white font-semibold">{selectedCall.employee?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Placed Time:</span>
                        <span className="text-white">{selectedCall.start_time ? format(new Date(selectedCall.start_time), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Outcome Badge:</span>
                        <span className="text-white font-bold">{CALL_OUTCOME_LABELS[selectedCall.outcome] || selectedCall.outcome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Duration:</span>
                        <span className="text-white font-mono">{formatDurationText(selectedCall.duration_seconds)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Call Direction:</span>
                        <span className="text-white uppercase font-bold text-[10px] tracking-wider text-red-400">{selectedCall.direction || 'outgoing'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Log Status:</span>
                        <span className="text-white font-bold">{selectedCall.status || 'completed'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lead Assignment */}
                  <div className="space-y-3.5">
                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Assigned representative</h5>
                    <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-4.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs text-white font-semibold">
                          {selectedCall.lead?.assigned_employee?.name || 'Unassigned'}
                        </span>
                      </div>

                      <select
                        value={editingAssignee}
                        onChange={(e) => {
                          setEditingAssignee(e.target.value)
                          handleAssignEmployee(e.target.value)
                        }}
                        className="bg-transparent border border-white/[0.08] rounded-lg text-xs py-1 px-2 text-white outline-none focus:border-red-500"
                      >
                        <option value="">Choose Rep</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Future-Ready Audio Recordings & Voice Notes Players */}
                  <div className="space-y-3.5">
                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Call Recordings (Future-Ready)</h5>
                    <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-4.5 space-y-4">
                      
                      {/* Call Recording */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> Call Audio Recording</span>
                          <span className="text-zinc-600 font-mono">03:42</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] p-2.5 rounded-xl">
                          <button
                            onClick={() => setIsPlayingRecording(!isPlayingRecording)}
                            className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/15 transition-all"
                          >
                            {isPlayingRecording ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          </button>
                          
                          {/* Seek bar track */}
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                            <div className="absolute top-0 left-0 bottom-0 bg-red-400 transition-all duration-300" style={{ width: isPlayingRecording ? '45%' : '0%' }} />
                          </div>

                          <button
                            onClick={() => toast.info('Downloading call recording file...')}
                            className="w-7 h-7 bg-white/[0.02] border border-white/[0.08] hover:border-white/12 text-zinc-400 hover:text-white rounded-lg flex items-center justify-center transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Employee Voice Note */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> Uploaded Voice Memo</span>
                          <span className="text-zinc-600 font-mono">00:45</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] p-2.5 rounded-xl">
                          <button
                            onClick={() => setIsPlayingVoiceNote(!isPlayingVoiceNote)}
                            className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/15 transition-all"
                          >
                            {isPlayingVoiceNote ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          </button>
                          
                          {/* Seek bar track */}
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                            <div className="absolute top-0 left-0 bottom-0 bg-red-400 transition-all duration-300" style={{ width: isPlayingVoiceNote ? '15%' : '0%' }} />
                          </div>

                          <button
                            onClick={() => toast.info('Voice memo player downloading file...')}
                            className="w-7 h-7 bg-white/[0.02] border border-white/[0.08] hover:border-white/12 text-zinc-400 hover:text-white rounded-lg flex items-center justify-center transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Notes */}
              {drawerTab === 'notes' && (
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rich Call Notes</h5>
                  <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-4.5 space-y-4.5">
                    <textarea
                      rows={8}
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      placeholder="Add rich details about this call (e.g. customer questions, package pricing discussed, meeting details)..."
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-red-500 text-xs rounded-xl p-3 text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-red-500 transition-all"
                    />

                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes || editingNotes === (selectedCall.notes || '')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-md h-11"
                    >
                      <Save className="w-4 h-4 text-white" />
                      <span>{isSavingNotes ? 'Saving...' : 'Save Updated Notes'}</span>
                    </button>
                  </div>

                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex items-start gap-2.5 text-zinc-400 text-xs leading-relaxed">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <p>
                      Editing these notes will update this call record's database entries and append a log statement to the customer's permanent pipeline timeline feed.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Timeline */}
              {drawerTab === 'timeline' && (
                <div className="space-y-4.5">
                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Lead Activity Timeline</h5>
                  {activities.length === 0 ? (
                    <p className="text-zinc-500 text-xs text-center py-6">No activity records logged for this lead.</p>
                  ) : (
                    <div className="relative pl-6 border-l border-white/[0.06] space-y-6 ml-2.5 pt-2">
                      {activities.map((act) => (
                        <div key={act.id} className="relative space-y-1">
                          {/* Dot indicator */}
                          <span className={`absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full border border-[#0a0a0a] flex items-center justify-center text-white ${
                            act.type === 'call' ? 'bg-red-400' :
                            act.type === 'note' ? 'bg-amber-400' :
                            act.type === 'converted' ? 'bg-emerald-400' :
                            'bg-zinc-500'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          </span>

                          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            <span>{act.type} Logged</span>
                            <span>{act.created_at ? format(new Date(act.created_at), 'yyyy-MM-dd') : ''}</span>
                          </div>
                          <p className="text-xs text-white leading-relaxed">{act.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Previous Calls */}
              {drawerTab === 'history' && (
                <div className="space-y-4.5">
                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Historical Logs</h5>
                  <div className="space-y-3">
                    {calls
                      .filter((c) => c.lead_id === selectedCall.lead_id && c.id !== selectedCall.id)
                      .map((c) => (
                        <div key={c.id} className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-4 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-bold">
                              {c.start_time ? format(new Date(c.start_time), 'yyyy-MM-dd HH:mm') : ''}
                            </span>
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                              {CALL_OUTCOME_LABELS[c.outcome] || c.outcome}
                            </span>
                          </div>
                          {c.notes && <p className="text-zinc-400 leading-relaxed">{c.notes}</p>}
                        </div>
                      ))}
                    
                    {calls.filter((c) => c.lead_id === selectedCall.lead_id && c.id !== selectedCall.id).length === 0 && (
                      <p className="text-zinc-500 text-xs text-center py-6">No other historical calls logged for this client.</p>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Quick Actions Drawer Footer */}
            <div className="p-6 border-t border-white/[0.08] bg-white/[0.01] space-y-4.5">
              <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Client Quick Actions</h5>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false)
                    navigate(`/call-center?leadId=${selectedCall.lead_id}`)
                  }}
                  className="flex flex-col items-center justify-center p-2.5 border border-white/[0.08] bg-white/[0.01] hover:border-red-500/30 rounded-xl text-center text-[10px] font-bold text-white hover:bg-red-500/5 transition-all gap-1"
                >
                  <Phone className="w-4 h-4 text-red-400" />
                  <span>Call Again</span>
                </button>

                <a
                  href={`https://wa.me/${selectedCall.lead?.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center p-2.5 border border-white/[0.08] bg-white/[0.01] hover:border-emerald-500/30 rounded-xl text-center text-[10px] font-bold text-white hover:bg-emerald-500/5 transition-all gap-1"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>

                {selectedCall.lead?.phone && (
                  <a
                    href={`tel:${selectedCall.lead.phone}`}
                    className="flex flex-col items-center justify-center p-2.5 border border-white/[0.08] bg-white/[0.01] hover:border-blue-500/30 rounded-xl text-center text-[10px] font-bold text-white hover:bg-blue-500/5 transition-all gap-1"
                  >
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span>Dial Phone</span>
                  </a>
                )}

                {selectedCall.lead?.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCall.lead.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center p-2.5 border border-white/[0.08] bg-white/[0.01] hover:border-amber-500/30 rounded-xl text-center text-[10px] font-bold text-white hover:bg-amber-500/5 transition-all gap-1"
                  >
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>Maps Pin</span>
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
