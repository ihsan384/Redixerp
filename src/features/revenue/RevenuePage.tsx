import { useState, useEffect } from 'react'
import {
  TrendingUp,
  DollarSign,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
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

      toast.success('Revenue record created successfully!')
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
        className="modal-panel z-10 w-full max-w-md space-y-4 p-6"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record New Revenue Inflow</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-500 hover:text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Select Converted Client *</label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full"
              required
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.shop_name} ({l.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Package / Deliverable *</label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g. Custom Web Platform"
              className="w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Amount (PKR) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25000"
                className="w-full"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Date Received</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Payment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full"
              >
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online Gateway</option>
                <option value="card">Card Payment</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Transaction Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add payment context notes..."
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

  const CustomChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
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

  return (
    <div className="page-shell page-stack space-y-6">
      {/* Header Row */}
      <div className="panel-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-sm font-bold text-white">Revenue Operations Ledger</p>
            <p className="text-xs text-zinc-500 mt-0.5">Manage customer billing accounts, payments received, and active invoices.</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-primary h-11 px-4 text-xs font-bold"
        >
          <Plus className="w-4 h-4" /> Log Revenue
        </button>
      </div>

      {/* KPI Stats - Redesigned to support premium borders & fonts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gross Revenue */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Gross Billings Inflow</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{formatCurrency(grossInflow)}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 rounded-xl flex items-center justify-center shadow-inner">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Inflow Collected</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{formatCurrency(paidInflow)}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/15 text-blue-400 rounded-xl flex items-center justify-center shadow-inner">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Receivables Pending */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Accounts Receivable</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{formatCurrency(pendingInflow)}</h3>
          </div>
          <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/15 text-yellow-400 rounded-xl flex items-center justify-center shadow-inner">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Chart Row */}
      {chartData.length > 0 && (
        <div className="border border-white/[0.08] bg-[#111111]/60 backdrop-blur-md rounded-2xl p-6 shadow-md">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-500" /> Inflows growth trends
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
                <CartesianGrid stroke="rgba(255, 255, 255, 0.03)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} tick={{ fontWeight: 500 }} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} tick={{ fontWeight: 500 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Structured Ledger Table */}
      <div className="table-shell">
        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Revenue Transaction Logs</h4>
        </div>

        <div className="overflow-x-auto">
          {revenues.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-600 font-bold italic animate-pulse">
              No revenue transactions recorded. Click Log Revenue to add entries.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#111111]/40">
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Client Account</th>
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Package / Deliverable</th>
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Amount</th>
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Date Received</th>
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-zinc-500 tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {revenues.map((rev) => (
                  <tr key={rev.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-4 text-xs font-bold text-white">
                      {rev.lead?.shop_name || 'Generic Client'}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-400 font-medium">{rev.package}</td>
                    <td className="py-3 px-4 text-xs font-bold text-white">
                      {formatCurrency(rev.amount)}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-400 font-medium">{rev.received_date}</td>
                    <td className="py-3 px-4 text-xs">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-[10px] font-bold ${
                          rev.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' :
                          rev.payment_status === 'partial' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/15' :
                          'bg-red-500/10 text-red-400 border-red-500/15'
                        }`}
                      >
                        {rev.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-400 capitalize font-medium">
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
