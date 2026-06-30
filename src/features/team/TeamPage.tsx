import { useState, useEffect } from 'react'
import {
  UserCheck,
  Plus,
  Users,
  Award,
  Phone,
  Handshake,
  TrendingUp,
  Mail,
  Shield,
  X,
} from 'lucide-react'
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import type { Employee, Call, Lead, EmployeeRole } from '@/types'
import { EMPLOYEE_ROLE_LABELS } from '@/utils/constants'
import { toast } from 'sonner'

const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                  !import.meta.env.VITE_SUPABASE_URL

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function AddMemberModal({ isOpen, onClose, onSave }: AddMemberModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<EmployeeRole>('sales_rep')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      toast.error('Name and Email are required')
      return
    }

    const payload: Omit<Employee, 'id' | 'created_at'> = {
      name,
      email,
      role,
    }

    try {
      if (DEMO_MODE) {
        const current = Storage.getEmployees()
        const newEmp: Employee = {
          id: `emp-${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString(),
        }
        Storage.saveEmployees([...current, newEmp])
      } else {
        const { error } = await supabase.from('employees').insert(payload as never)
        if (error) throw error
      }

      toast.success('Team member added successfully!')
      onSave()
      onClose()
      // reset
      setName('')
      setEmail('')
    } catch (err: unknown) {
      toast.error('Failed to add employee record')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="modal-backdrop" />
      <form
        onSubmit={handleSubmit}
        aria-label="Add team member"
        className="modal-panel z-10 w-full max-w-md space-y-4 p-6"
      >
        <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
          <h3 className="text-sm font-semibold text-white">Add Team Member</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/5 text-[#8c8c8c]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zain Malik"
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. zain@redix.media"
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Operational Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as EmployeeRole)}
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-white/20"
            >
              {Object.entries(EMPLOYEE_ROLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1f1f1f]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-[#1f1f1f] bg-[#111111] text-xs font-semibold rounded-lg text-[#8c8c8c] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200"
          >
            Add Member
          </button>
        </div>
      </form>
    </div>
  )
}

export function TeamPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [calls, setCalls] = useState<Call[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)

  const loadData = () => {
    setEmployees(Storage.getEmployees())
    setCalls(Storage.getCalls())
    setLeads(Storage.getLeads())
  }

  useEffect(() => {
    loadData()
  }, [])

  // Aggregate stats per employee
  const getEmployeeStats = (empId: string) => {
    const empCalls = calls.filter((c) => c.employee_id === empId)
    const empLeads = leads.filter((l) => l.assigned_to === empId)

    const completed = empCalls.length

    // Today's calls
    const todayStr = new Date().toISOString().split('T')[0]
    const todayCalls = empCalls.filter((c) => c.start_time.startsWith(todayStr)).length

    // Conversions & Pending
    const conversions = empLeads.filter((l) => l.status === 'converted').length
    const pending = empLeads.filter((l) =>
      ['new', 'called', 'no_answer', 'busy', 'call_later', 'meeting_scheduled'].includes(l.status)
    ).length

    // Performance Ratio
    const perfRate = completed > 0 ? Math.round((conversions / completed) * 100) : 0

    return {
      todayCalls,
      completed,
      pending,
      conversions,
      perfRate,
    }
  };

  // Top performers list
  const getTopPerformer = () => {
    if (employees.length === 0) return null
    let topEmp = employees[0]
    let maxConversions = -1

    employees.forEach((emp) => {
      const stats = getEmployeeStats(emp.id)
      if (stats.conversions > maxConversions) {
        maxConversions = stats.conversions
        topEmp = emp
      }
    })

    return { employee: topEmp, conversions: maxConversions }
  }

  const topPerformer = getTopPerformer()

  return (
    <div className="page-shell page-stack">
      {/* Header Row */}
      <div className="panel-card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-white" />
          <div>
            <p className="text-sm font-semibold text-white">REDIX Team Directory & KPIs</p>
            <p className="text-xs text-[#525252] mt-0.5">Track employee profiles, sales commissions, conversion rates, and live dialing counts.</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-primary px-4 text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Add Member
        </button>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Members */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Total Workforce</p>
            <h3 className="text-2xl font-bold text-white mt-1.5">{employees.length} reps</h3>
          </div>
          <div className="w-10 h-10 bg-neutral-800 border border-neutral-700 text-white rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Top sales rep */}
        {topPerformer && (
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Top Closer</p>
              <h3 className="text-xl font-bold text-white mt-1.5 truncate max-w-[180px]">
                {topPerformer.employee.name}
              </h3>
              <p className="text-[10px] text-[#525252] mt-0.5">{topPerformer.conversions} closed deals</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Live calls indicator */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Today's Total calls</p>
            <h3 className="text-2xl font-bold text-white mt-1.5">
              {employees.reduce((acc, emp) => acc + getEmployeeStats(emp.id).todayCalls, 0)} calls
            </h3>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Employees Grid Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employees.map((emp) => {
          const stats = getEmployeeStats(emp.id)

          return (
            <div
              key={emp.id}
              className="surface-card flex flex-col justify-between space-y-4"
            >
              {/* Profile Top info */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-[#1f1f1f] flex items-center justify-center text-white text-sm font-bold">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{emp.name}</h4>
                  <p className="text-[10px] text-[#525252] font-medium flex items-center gap-1.5 mt-0.5">
                    <Shield className="w-3 h-3 text-[#525252]" /> {EMPLOYEE_ROLE_LABELS[emp.role] || emp.role}
                  </p>
                  <p className="text-[10px] text-[#525252] truncate font-medium flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-[#525252]" /> {emp.email}
                  </p>
                </div>
              </div>

              {/* Performance counters grid */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#1f1f1f] pt-4">
                <div className="bg-[#111111]/30 p-2.5 rounded-xl border border-[#1f1f1f] flex flex-col items-center justify-center">
                  <p className="text-[9px] uppercase font-bold text-[#525252] tracking-wider">Today's Calls</p>
                  <p className="text-white font-bold mt-1 text-sm">{stats.todayCalls}</p>
                </div>
                <div className="bg-[#111111]/30 p-2.5 rounded-xl border border-[#1f1f1f] flex flex-col items-center justify-center">
                  <p className="text-[9px] uppercase font-bold text-[#525252] tracking-wider">Conversions</p>
                  <p className="text-white font-bold mt-1 text-sm">{stats.conversions}</p>
                </div>
                <div className="bg-[#111111]/30 p-2.5 rounded-xl border border-[#1f1f1f] flex flex-col items-center justify-center">
                  <p className="text-[9px] uppercase font-bold text-[#525252] tracking-wider">Completed Calls</p>
                  <p className="text-white font-bold mt-1 text-sm">{stats.completed}</p>
                </div>
                <div className="bg-[#111111]/30 p-2.5 rounded-xl border border-[#1f1f1f] flex flex-col items-center justify-center">
                  <p className="text-[9px] uppercase font-bold text-[#525252] tracking-wider">Performance %</p>
                  <p className="text-emerald-400 font-bold mt-1 text-sm flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> {stats.perfRate}%
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add member Form Modal */}
      <AddMemberModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={loadData} />
    </div>
  )
}
