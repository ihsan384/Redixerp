import { useState, useEffect } from 'react'
import { Receipt, DollarSign, Plus, ArrowUpRight, TrendingDown, PieChart as PieIcon, X } from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types'
import { EXPENSE_CATEGORY_LABELS } from '@/utils/constants'
import { formatCurrency } from '@/utils/format'
import { toast } from 'sonner'

const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                  !import.meta.env.VITE_SUPABASE_URL

const COLORS = [
  '#ffffff',
  '#a1a1aa',
  '#71717a',
  '#e53935',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a78bfa',
]

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function AddExpenseModal({ isOpen, onClose, onSave }: AddExpenseModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('software')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!title || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter valid details')
      return
    }

    const payload: Omit<Expense, 'id' | 'created_at'> = {
      title,
      category,
      amount: numAmount,
      payment_method: method,
      date,
      notes: notes || undefined,
    }

    try {
      if (DEMO_MODE) {
        const current = Storage.getExpenses()
        const newExp: Expense = {
          id: `exp-${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString(),
        }
        Storage.saveExpenses([newExp, ...current])
      } else {
        const { error } = await supabase.from('expenses').insert(payload as never)
        if (error) throw error
      }

      toast.success('Expense record created successfully!')
      onSave()
      onClose()
      // reset
      setTitle('')
      setAmount('')
      setNotes('')
    } catch (err: unknown) {
      toast.error('Failed to save expense record')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="modal-backdrop" />
      <form
        onSubmit={handleSubmit}
        aria-label="Record new expense"
        className="modal-panel z-10 w-full max-w-md space-y-4 p-6"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Expense Outflow</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-500 hover:text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Expense Item / Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AWS Cloud Server Bill"
              className="w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full"
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Amount (PKR) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Date Paid</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online Gateway</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Expense Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Domains for redix.media"
              className="w-full"
            />
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
            Save Outflow
          </button>
        </div>
      </form>
    </div>
  )
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)

  const loadData = () => {
    setExpenses(Storage.getExpenses())
  }

  useEffect(() => {
    loadData()
  }, [])

  // Date constants
  const currentMonthStr = new Date().toISOString().slice(5, 7) // MM
  const currentYearStr = new Date().getFullYear().toString() // YYYY

  // Filter calculations
  const monthlyTotal = expenses
    .filter((e) => e.date.includes(`-${currentMonthStr}-`) || e.date.startsWith(`${currentYearStr}-${currentMonthStr}`))
    .reduce((acc, e) => acc + e.amount, 0)

  const yearlyTotal = expenses
    .filter((e) => e.date.startsWith(currentYearStr))
    .reduce((acc, e) => acc + e.amount, 0)

  const totalAllTime = expenses.reduce((acc, e) => acc + e.amount, 0)

  // Chart data: Group by Category
  const aggregateCategoryExpenses = () => {
    const categoriesMap: Record<string, number> = {}
    expenses.forEach((e) => {
      const label = EXPENSE_CATEGORY_LABELS[e.category] || e.category
      categoriesMap[label] = (categoriesMap[label] || 0) + e.amount
    })

    return Object.entries(categoriesMap).map(([name, value]) => ({ name, value }))
  }

  const categoryChartData = aggregateCategoryExpenses()

  // Monthly trends data
  const aggregateMonthlyExpenses = () => {
    const monthlyMap: Record<string, number> = {}
    expenses.forEach((e) => {
      const [year, month] = e.date.split('-')
      if (month) {
        const dObj = new Date(parseInt(year), parseInt(month) - 1, 1)
        const name = dObj.toLocaleString('default', { month: 'short' })
        monthlyMap[name] = (monthlyMap[name] || 0) + e.amount
      }
    })

    const order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return Object.entries(monthlyMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
  }

  const trendChartData = aggregateMonthlyExpenses()

  const CustomTrendTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111]/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-sm font-bold text-white">PKR {payload[0].value.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/[0.08] bg-[#111111]/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{payload[0].name}</p>
          <p className="text-sm font-bold text-white">PKR {payload[0].value.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="page-shell page-stack space-y-6">
      {/* Header Row */}
      <div className="panel-card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-sm font-bold text-white">Expense Outlays</p>
            <p className="text-xs text-zinc-500 mt-0.5">Manage hosting plans, SaaS software licensing, running office costs, and operations salaries.</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-primary h-11 px-4 text-xs font-bold"
        >
          <Plus className="w-4 h-4" /> Log Expense
        </button>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Expense */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">This Month's Spend</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{formatCurrency(monthlyTotal)}</h3>
          </div>
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/15 text-red-400 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Yearly Expense */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Year-to-Date Outflow</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{formatCurrency(yearlyTotal)}</h3>
          </div>
          <div className="w-10 h-10 bg-neutral-800 border border-white/[0.08] text-white rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* All-time Spent */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Gross Outflow Logged</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{formatCurrency(totalAllTime)}</h3>
          </div>
          <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/15 text-yellow-400 rounded-xl flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart of category breakdown */}
          <div className="lg:col-span-1 border border-white/[0.08] bg-[#111111]/60 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between shadow-md">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-zinc-500" /> Spend Breakdown
            </h4>

            <div className="h-52 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legends list */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-bold border-t border-white/[0.06] pt-3.5">
              {categoryChartData.map((d, idx) => (
                <div key={d.name} className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="truncate">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart of Monthly trends */}
          <div className="lg:col-span-2 border border-white/[0.08] bg-[#111111]/60 backdrop-blur-md rounded-2xl p-5 shadow-md">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-zinc-500" /> Month-on-Month Expenditures
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} tick={{ fontWeight: 500 }} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} tick={{ fontWeight: 500 }} />
                  <Tooltip content={<CustomTrendTooltip />} />
                  <Bar dataKey="amount" fill="#ffffff" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table List */}
      <div className="table-shell">
        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Outlay Billing Journals</h4>
        </div>

        <div className="overflow-x-auto">
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-600 font-bold italic animate-pulse">
              No expenditures recorded. Click Log Expense to register payments.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#111111]/40">
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Expense Item</th>
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Category</th>
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Amount</th>
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Date Paid</th>
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Method</th>
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-4 text-xs font-bold text-white">{exp.title}</td>
                    <td className="py-3 px-4 text-xs text-zinc-400 font-medium">
                      {EXPENSE_CATEGORY_LABELS[exp.category]}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-white">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-400 font-medium">{exp.date}</td>
                    <td className="py-3 px-4 text-xs text-zinc-400 capitalize font-medium">
                      {exp.payment_method}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-500 truncate max-w-xs font-medium">
                      {exp.notes || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Expense Form Dialog */}
      <AddExpenseModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={loadData} />
    </div>
  )
}
