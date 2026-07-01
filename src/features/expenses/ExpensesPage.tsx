import { useState, useEffect } from 'react'
import {
  Receipt, DollarSign, Plus, ArrowUpRight, TrendingDown,
  PieChart as PieIcon, X, Search, BarChart3, Tag,
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types'
import { EXPENSE_CATEGORY_LABELS } from '@/utils/constants'
import { formatCurrency } from '@/utils/format'
import { toast } from 'sonner'

const PIE_COLORS = [
  '#e53935', '#3b82f6', '#22c55e', '#f59e0b', '#a78bfa',
  '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#14b8a6',
]

const ALL_CATEGORIES: ExpenseCategory[] = [
  'office', 'salary', 'internet', 'electricity', 'hosting',
  'domain', 'software', 'travel', 'marketing', 'equipment',
  'domains', 'advertisements', 'food', 'miscellaneous',
]

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function AddExpenseModal({ isOpen, onClose, onSave }: AddExpenseModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('office')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paidBy, setPaidBy] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!title || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter valid details')
      return
    }
    setSaving(true)
    const payload = {
      title, category, amount: numAmount,
      payment_method: method, date,
      paid_by: paidBy || null,
      notes: notes || null,
    }
    try {
      const { error } = await supabase.from('expenses').insert(payload as never)
      if (error) throw error
      toast.success('Expense recorded!')
      onSave(); onClose()
      setTitle(''); setAmount(''); setNotes(''); setPaidBy('')
    } catch { toast.error('Failed to save expense record') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="modal-backdrop" />
      <form onSubmit={handleSubmit} className="modal-panel z-10 w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-white">Record Expense</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Log an outgoing payment or expense</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn w-8 h-8"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Expense Title *</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. AWS Server Hosting" className="w-full" required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="w-full">
                {ALL_CATEGORIES.map(c => (
                  <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c] || c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Amount (₹) *</label>
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="5000" className="w-full" required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Payment Method</label>
              <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="w-full">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card Payment</option>
                <option value="online">Online</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Expense Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Paid By</label>
            <input
              type="text" value={paidBy} onChange={e => setPaidBy(e.target.value)}
              placeholder="e.g. Ihsan" className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Notes</label>
            <input
              type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes..." className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button type="button" onClick={onClose} className="btn-secondary h-10 px-4 text-xs font-bold">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary h-10 px-5 text-xs font-bold">
            {saving ? 'Saving...' : 'Record Expense'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#111111]/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#111111]/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{payload[0].name}</p>
      <p className="text-sm font-bold text-white">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const loadData = async () => {
    try {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false })
      if (error) throw error
      setExpenses((data || []) as Expense[])
    } catch {
      toast.error('Failed to load expenses')
    }
  }

  useEffect(() => { loadData() }, [])

  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const yearStr = now.getFullYear().toString()

  const monthlyTotal = expenses.filter(e => e.date.startsWith(monthStr)).reduce((s, e) => s + e.amount, 0)
  const yearlyTotal = expenses.filter(e => e.date.startsWith(yearStr)).reduce((s, e) => s + e.amount, 0)
  const totalAllTime = expenses.reduce((s, e) => s + e.amount, 0)

  // Category breakdown
  const categoryData = Object.entries(
    expenses.reduce((acc, e) => {
      const label = EXPENSE_CATEGORY_LABELS[e.category] || e.category
      acc[label] = (acc[label] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  // Monthly trend
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyData = MONTHS.map((name, idx) => ({
    name,
    amount: expenses.filter(e => new Date(e.date).getMonth() === idx).reduce((s, e) => s + e.amount, 0),
  })).filter(d => d.amount > 0)

  const filteredExpenses = expenses.filter(e => {
    const matchSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === 'all' || e.category === categoryFilter
    return matchSearch && matchCat
  })

  return (
    <div className="page-shell page-stack space-y-6">
      {/* Header */}
      <div className="panel-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Operating Expense Ledger</p>
            <p className="text-xs text-zinc-500 mt-0.5">Track all outgoing payments, subscriptions, and operational costs</p>
          </div>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary h-10 px-4 text-xs font-bold">
          <Plus className="w-4 h-4" /> Log Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="fin-kpi-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">This Month</p>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white fin-counter">{formatCurrency(monthlyTotal)}</p>
          <div className="fin-progress-wrap">
            <div className="fin-progress-bar bg-red-500" style={{ width: totalAllTime > 0 ? `${(monthlyTotal / totalAllTime) * 100}%` : '0%' }} />
          </div>
        </div>

        <div className="fin-kpi-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">This Year</p>
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white fin-counter">{formatCurrency(yearlyTotal)}</p>
          <div className="fin-progress-wrap">
            <div className="fin-progress-bar bg-zinc-500" style={{ width: totalAllTime > 0 ? `${(yearlyTotal / totalAllTime) * 100}%` : '0%' }} />
          </div>
        </div>

        <div className="fin-kpi-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">All Time</p>
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white fin-counter">{formatCurrency(totalAllTime)}</p>
          <div className="fin-progress-wrap">
            <div className="fin-progress-bar bg-zinc-500" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Charts */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie */}
          <div className="border border-white/[0.08] bg-[#111111]/60 backdrop-blur-md rounded-2xl p-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-zinc-500" /> By Category
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<PieTooltip />} />
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {categoryData.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[10px] text-zinc-400 truncate max-w-[100px]">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-white">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Bar */}
          <div className="lg:col-span-2 border border-white/[0.08] bg-[#111111]/60 backdrop-blur-md rounded-2xl p-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-zinc-500" /> Monthly Expense Trend
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="amount" fill="#e53935" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Expense Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search expenses..." className="w-full pl-9"
            />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="sm:w-48">
            <option value="all">All Categories</option>
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c] || c}</option>
            ))}
          </select>
        </div>

        <div className="table-shell">
          <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Expense Ledger ({filteredExpenses.length})
            </h4>
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[10px] text-zinc-600 font-bold">{categoryData.length} categories</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredExpenses.length === 0 ? (
              <div className="p-10 text-center">
                <Receipt className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-xs text-zinc-500 font-bold">No expenses recorded yet.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr>
                    {['Expense', 'Category', 'Amount', 'Method', 'Date', 'Paid By', 'Notes'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="text-xs font-bold text-white">{exp.title}</td>
                      <td>
                        <span className="fin-badge bg-zinc-500/10 text-zinc-400 border-zinc-500/20">
                          {EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}
                        </span>
                      </td>
                      <td className="text-xs font-bold text-red-400">{formatCurrency(exp.amount)}</td>
                      <td className="text-xs text-zinc-400 capitalize">{exp.payment_method?.replace('_', ' ')}</td>
                      <td className="text-xs text-zinc-400">{exp.date}</td>
                      <td className="text-xs text-zinc-500">{(exp as Expense & { paid_by?: string }).paid_by || '—'}</td>
                      <td className="text-xs text-zinc-500 max-w-[140px] truncate">{exp.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <AddExpenseModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={loadData} />
    </div>
  )
}
