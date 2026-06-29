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
  '#a3a3a3',
  '#737373',
  '#525252',
  '#404040',
  '#262626',
  '#171717',
  '#a3e635',
  '#38bdf8',
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

      toast.success('Expense record created!')
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
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 shadow-2xl z-10 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
          <h3 className="text-sm font-semibold text-white">Log Expense Outflow</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/5 text-[#8c8c8c]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Expense Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AWS Cloud Server Bill"
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-[#8c8c8c] font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-white/20"
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#8c8c8c] font-medium">Amount (PKR) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-[#8c8c8c] font-medium">Date Paid</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#8c8c8c] font-medium">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-white/20"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online Gateway</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Expense Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Domains for redix.media"
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
            />
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

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between p-4 bg-[#111111]/30 border border-[#1f1f1f] rounded-2xl">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-white" />
          <div>
            <p className="text-sm font-semibold text-white">Expense Outlays</p>
            <p className="text-xs text-[#525252] mt-0.5">Manage domains, servers, salaries, advertisements, and running office costs.</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Log Expense
        </button>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Expense */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">This Month's Spending</p>
            <h3 className="text-2xl font-bold text-white mt-1.5">{formatCurrency(monthlyTotal)}</h3>
          </div>
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Yearly Expense */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Year-to-Date Spend</p>
            <h3 className="text-2xl font-bold text-white mt-1.5">{formatCurrency(yearlyTotal)}</h3>
          </div>
          <div className="w-10 h-10 bg-neutral-800 border border-neutral-700 text-white rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* All-time Spent */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Gross Outflow Logged</p>
            <h3 className="text-2xl font-bold text-white mt-1.5">{formatCurrency(totalAllTime)}</h3>
          </div>
          <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart of category breakdown */}
          <div className="lg:col-span-1 border border-[#1f1f1f] bg-[#0d0d0d] rounded-2xl p-5 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-[#8c8c8c]" /> Spend Breakdown
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
                  <Tooltip
                    contentStyle={{
                      background: '#111111',
                      border: '1px solid #1f1f1f',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legends list */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[#8c8c8c] font-medium border-t border-[#1f1f1f] pt-3.5">
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
          <div className="lg:col-span-2 border border-[#1f1f1f] bg-[#0d0d0d] rounded-2xl p-5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-[#8c8c8c]" /> Month-on-Month Expenditures
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#111111',
                      border: '1px solid #1f1f1f',
                      borderRadius: '12px',
                    }}
                    labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#8c8c8c', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" fill="#ffffff" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table List */}
      <div className="border border-[#1f1f1f] bg-[#0d0d0d] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1f1f1f] flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Outlay Billing Journals</h4>
        </div>

        <div className="overflow-x-auto">
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#525252] italic animate-pulse">
              No expenditures recorded. Click Log Expense to register payments.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1f1f1f] bg-[#111111]/30">
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Expense Item</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Category</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Amount</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Date Paid</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Method</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-4 text-xs font-semibold text-white">{exp.title}</td>
                    <td className="py-3 px-4 text-xs text-[#8c8c8c]">
                      {EXPENSE_CATEGORY_LABELS[exp.category]}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-white">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#8c8c8c]">{exp.date}</td>
                    <td className="py-3 px-4 text-xs text-[#8c8c8c] capitalize">
                      {exp.payment_method}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#525252] truncate max-w-xs">
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
