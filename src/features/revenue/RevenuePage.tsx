import { useState, useEffect } from 'react'
import {
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  X,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import type { Lead, Revenue, PaymentStatus, PaymentMethod } from '@/types'
import { formatCurrency } from '@/utils/format'
import { toast } from 'sonner'

const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                  !import.meta.env.VITE_SUPABASE_URL

interface AddRevenueModalProps {
  isOpen: boolean
  onClose: () => void
  leads: Lead[]
  onSave: () => void
}

function AddRevenueModal({ isOpen, onClose, leads, onSave }: AddRevenueModalProps) {
  const [leadId, setLeadId] = useState('')
  const [packageName, setPackageName] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<PaymentStatus>('paid')
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (leads.length > 0) {
      setLeadId(leads[0].id)
    }
  }, [leads, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!leadId || !packageName || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please fill in all required fields correctly')
      return
    }

    const payload: Omit<Revenue, 'id' | 'created_at'> = {
      lead_id: leadId,
      package: packageName,
      amount: numAmount,
      payment_status: status,
      payment_method: method,
      received_date: date,
      notes: notes || undefined,
    }

    try {
      if (DEMO_MODE) {
        const current = Storage.getRevenue()
        const newRev: Revenue = {
          id: `rev-${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString(),
        }
        Storage.saveRevenue([newRev, ...current])
      } else {
        const { error } = await supabase.from('revenue').insert(payload as never)
        if (error) throw error
      }

      toast.success('Revenue record created!')
      onSave()
      onClose()
    } catch (err: unknown) {
      toast.error('Failed to save revenue record')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="modal-backdrop" />
      <form
        onSubmit={handleSubmit}
        aria-label="Record new revenue"
        className="modal-panel z-10 w-full max-w-md space-y-4 p-6"
      >
        <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
          <h3 className="text-sm font-semibold text-white">Record New Revenue</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/5 text-[#8c8c8c]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Select Client *</label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-white/20"
              required
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.shop_name} ({l.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Package / Deliverable *</label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g. Custom Web Platform"
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-[#8c8c8c] font-medium">Amount (PKR) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25000"
                className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#8c8c8c] font-medium">Date Received</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-[#8c8c8c] font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-white/20"
              >
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#8c8c8c] font-medium">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-white/20"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online Gateway</option>
                <option value="card">Card Payment</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional notes..."
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
            Save Record
          </button>
        </div>
      </form>
    </div>
  )
}

export function RevenuePage() {
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)

  const loadData = () => {
    const revs = Storage.getRevenue().map((r) => ({
      ...r,
      lead: Storage.getLeads().find((l) => l.id === r.lead_id),
    }))
    setRevenues(revs)
    // Only allow recording revenue against converted leads (clients) or all leads
    setLeads(Storage.getLeads())
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculations
  const grossInflow = revenues.reduce((acc, r) => acc + r.amount, 0)
  const paidInflow = revenues
    .filter((r) => r.payment_status === 'paid')
    .reduce((acc, r) => acc + r.amount, 0)
  const pendingInflow = revenues
    .filter((r) => r.payment_status !== 'paid')
    .reduce((acc, r) => acc + r.amount, 0)

  // Chart aggregation: Monthly Sales Grouping
  const aggregateMonthlySales = () => {
    const monthlyData: Record<string, number> = {}
    revenues.forEach((r) => {
      if (r.received_date) {
        // receivedDate format is YYYY-MM-DD
        const [year, month] = r.received_date.split('-')
        if (month) {
          const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1)
          const monthName = dateObj.toLocaleString('default', { month: 'short' })
          monthlyData[monthName] = (monthlyData[monthName] || 0) + r.amount
        }
      }
    })

    const order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return Object.entries(monthlyData)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
  }

  const chartData = aggregateMonthlySales()

  return (
    <div className="page-shell page-stack">
      {/* Header Row */}
      <div className="panel-card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-white" />
          <div>
            <p className="text-sm font-semibold text-white">Revenue Operations Ledger</p>
            <p className="text-xs text-[#525252] mt-0.5">Manage customer billing accounts, payments received, and invoice statuses.</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-primary px-4 text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Log Revenue
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gross Revenue */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Gross Billings</p>
            <h3 className="text-2xl font-bold text-white mt-1.5">{formatCurrency(grossInflow)}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Total Collected</p>
            <h3 className="text-2xl font-bold text-white mt-1.5">{formatCurrency(paidInflow)}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Receivables Pending */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Accounts Receivable</p>
            <h3 className="text-2xl font-bold text-white mt-1.5">{formatCurrency(pendingInflow)}</h3>
          </div>
          <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Chart Row */}
      {chartData.length > 0 && (
        <div className="border border-[#1f1f1f] bg-[#0d0d0d] rounded-2xl p-6">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#8c8c8c]" /> Billing Collections Growth (Monthly)
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.06} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f1f1f" vertical={false} strokeDasharray="3 3" />
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
                <Area type="monotone" dataKey="amount" stroke="#ffffff" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Structured Ledger Table */}
      <div className="table-shell">
        <div className="px-5 py-4 border-b border-[#1f1f1f] flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Revenue Transaction Logs</h4>
        </div>

        <div className="overflow-x-auto">
          {revenues.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#525252] italic">
              No revenue transactions recorded. Click Log Revenue to add.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1f1f1f] bg-[#111111]/30">
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Client Account</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Package</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Amount</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Date Received</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]">
                {revenues.map((rev) => (
                  <tr key={rev.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-white">
                      {rev.lead?.shop_name || 'Generic Client'}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#8c8c8c]">{rev.package}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-white">
                      {formatCurrency(rev.amount)}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#8c8c8c]">{rev.received_date}</td>
                    <td className="py-3 px-4 text-xs">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${
                          rev.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          rev.payment_status === 'partial' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {rev.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#8c8c8c] capitalize">
                      {rev.payment_method.replace('_', ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <AddRevenueModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        leads={leads}
        onSave={loadData}
      />
    </div>
  )
}
