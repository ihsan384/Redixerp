import { useState, useEffect } from 'react'
import {
  UserCheck,
  Plus,
  Users,
  Award,
  Phone,
  TrendingUp,
  Mail,
  Shield,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import type { Employee, Call, Lead, EmployeeRole } from '@/types'
import { EMPLOYEE_ROLE_LABELS } from '@/utils/constants'
import { toast } from 'sonner'

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function AddMemberModal({ isOpen, onClose, onSave }: AddMemberModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<EmployeeRole>('sales_rep')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error('All fields (Name, Email, and Password) are required')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      // Initialize a temporary, non-persisted client to sign up the user
      // so the logged-in administrator's session is not affected.
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      )

      const { error } = await tempSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          },
        },
      })

      if (error) throw error

      toast.success('Team member registered successfully!')
      onSave()
      onClose()
      setName('')
      setEmail('')
      setPassword('')
    } catch (err: unknown) {
      console.error('[AddMemberModal] Error adding employee record:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to add employee record')
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
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Team Member</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-500 hover:text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zain Malik"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. zain@redix.media"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Operational Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as EmployeeRole)}
              className="w-full"
            >
              {Object.entries(EMPLOYEE_ROLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3.5 border-t border-white/[0.06] mt-5">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary h-11 px-4 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary h-11 px-5 text-xs font-bold"
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

  const loadData = async () => {
    try {
      const [{ data: empsData }, { data: callsData }, { data: leadsData }] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('calls').select('*'),
        supabase.from('leads').select('*')
      ])
      setEmployees((empsData || []) as Employee[])
      setCalls((callsData || []) as Call[])
      setLeads((leadsData || []) as Lead[])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load team data')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getEmployeeStats = (empId: string) => {
    const empCalls = calls.filter((c) => c.employee_id === empId)
    const empLeads = leads.filter((l) => l.assigned_to === empId)

    const completed = empCalls.length

    const todayStr = new Date().toISOString().split('T')[0]
    const todayCalls = empCalls.filter((c) => c.start_time.startsWith(todayStr)).length

    const conversions = empLeads.filter((l) => l.status === 'converted').length

    const perfRate = completed > 0 ? Math.round((conversions / completed) * 100) : 0

    return {
      todayCalls,
      completed,
      conversions,
      perfRate,
    }
  }

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
    <div className="page-shell page-stack space-y-6">
      {/* Header Row */}
      <div className="panel-card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-sm font-bold text-white">Team Directory & Performance Indicators</p>
            <p className="text-xs text-zinc-500 mt-0.5">Track employee directory details, roles, conversion ratios, and callback stats.</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-primary h-11 px-4 text-xs font-bold"
        >
          <Plus className="w-4 h-4" /> Add Representative
        </button>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Members */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Active Workforce</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{employees.length} representatives</h3>
          </div>
          <div className="w-10 h-10 bg-neutral-800 border border-white/[0.08] text-white rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Top sales rep */}
        {topPerformer && topPerformer.conversions > -1 && (
          <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pipeline Top Closer</p>
              <h3 className="text-xl font-bold text-white tracking-tight mt-2 truncate max-w-[170px]">
                {topPerformer.employee.name}
              </h3>
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1">{topPerformer.conversions} closed conversions</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/15 text-yellow-500 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Live calls indicator */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Today's Call Activity</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">
              {employees.reduce((acc, emp) => acc + getEmployeeStats(emp.id).todayCalls, 0)} dialed calls
            </h3>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 rounded-xl flex items-center justify-center">
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
                <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-white text-sm font-bold">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{emp.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                    <Shield className="w-3 h-3 text-zinc-600" /> {EMPLOYEE_ROLE_LABELS[emp.role] || emp.role.replace('_', ' ')}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1 truncate">
                    <Mail className="w-3 h-3 text-zinc-600" /> {emp.email}
                  </p>
                </div>
              </div>

              {/* Performance counters grid */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/[0.06] pt-4.5">
                <div className="bg-white/[0.005] p-3 rounded-xl border border-white/[0.04] flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Today's Calls</p>
                  <p className="text-white font-bold mt-1 text-sm">{stats.todayCalls}</p>
                </div>
                <div className="bg-white/[0.005] p-3 rounded-xl border border-white/[0.04] flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Conversions</p>
                  <p className="text-white font-bold mt-1 text-sm">{stats.conversions}</p>
                </div>
                <div className="bg-white/[0.005] p-3 rounded-xl border border-white/[0.04] flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Gross Outbound</p>
                  <p className="text-white font-bold mt-1 text-sm">{stats.completed}</p>
                </div>
                <div className="bg-white/[0.005] p-3 rounded-xl border border-white/[0.04] flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Performance Ratio</p>
                  <p className="text-emerald-400 font-bold mt-1 text-sm flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" /> {stats.perfRate}%
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
