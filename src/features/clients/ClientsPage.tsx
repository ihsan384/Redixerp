import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Phone,
  MessageSquare,
  MapPin,
  Plus,
  DollarSign,
  Award,
  TrendingUp,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Lead, Revenue, PaymentStatus, PaymentMethod } from '@/types'
import { formatCurrency } from '@/utils/format'
import { toast } from 'sonner'

interface RecordRevenueModalProps {
  isOpen: boolean
  onClose: () => void
  client: Lead | null
  onSave: () => void
}

function RecordRevenueModal({ isOpen, onClose, client, onSave }: RecordRevenueModalProps) {
  const [packageName, setPackageName] = useState('Premium Website & SEO')
  const [amount, setAmount] = useState('25000')
  const [status, setStatus] = useState<PaymentStatus>('paid')
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer')
  const [notes, setNotes] = useState('')

  if (!isOpen || !client) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    const payload: Omit<Revenue, 'id' | 'created_at'> = {
      lead_id: client.id,
      package: packageName,
      amount: numAmount,
      payment_status: status,
      payment_method: method,
      received_date: new Date().toISOString().split('T')[0],
      notes: notes || undefined,
    }

    try {
      const { error } = await supabase.from('revenue').insert(payload as never)
      if (error) throw error

      const newAct = {
        lead_id: client.id,
        type: 'converted' as const,
        description: `Received payment of ${formatCurrency(numAmount)} for ${packageName}.`,
      }
      await supabase.from('activities').insert(newAct as never)

      toast.success('Payment transaction saved successfully!')
      onSave()
      onClose()
    } catch (err: unknown) {
      toast.error('Failed to record payment')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="modal-backdrop" />
      <form
        onSubmit={handleSubmit}
        aria-label="Record client payment"
        className="modal-panel z-10 w-full max-w-md space-y-4 p-6"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record Invoice / Payment</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-500 hover:text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Partner Account</label>
            <p className="text-xs font-bold text-white bg-white/[0.01] p-3 rounded-xl border border-white/[0.06]">
              {client.shop_name}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Package / Deliverable</label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g. Starter Package Website"
              className="w-full"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Amount (PKR)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Status</label>
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
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online Payment Gateway</option>
              <option value="card">Credit/Debit Card</option>
              <option value="cash">Cash</option>
              <option value="other">Other Method</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Transaction Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Downpayment 50%"
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
            Save Transaction
          </button>
        </div>
      </form>
    </div>
  )
}

export function ClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Lead[]>([])
  const [revenues, setRevenues] = useState<Revenue[]>([])

  // Modal controls
  const [selectedClient, setSelectedClient] = useState<Lead | null>(null)
  const [isRecordOpen, setIsRecordOpen] = useState(false)

  const loadData = async () => {
    try {
      const [{ data: leadsData }, { data: revsData }] = await Promise.all([
        supabase.from('leads').select('*').eq('status', 'converted'),
        supabase.from('revenue').select('*')
      ])
      setClients((leadsData || []) as Lead[])
      setRevenues((revsData || []) as Revenue[])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load clients / revenue records')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const totalClients = clients.length
  const totalValueGenerated = revenues.reduce((acc, r) => acc + r.amount, 0)

  const handleRecordPayment = (client: Lead) => {
    setSelectedClient(client)
    setIsRecordOpen(true)
  }

  return (
    <div className="page-shell page-stack space-y-6">
      {/* Header Info */}
      <div className="panel-card flex items-center gap-3 p-5">
        <Briefcase className="w-5 h-5 text-red-400" />
        <div>
          <p className="text-sm font-bold text-white">Client Portfolio</p>
          <p className="text-xs text-zinc-500 mt-0.5">Manage converted accounts, issue invoice lines, and review closed deal values.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-5 space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Converted Accounts</p>
          <p className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-red-400" /> {totalClients} Clients
          </p>
        </div>
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-5 space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Closed Contract Value</p>
          <p className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" /> {formatCurrency(totalValueGenerated)}
          </p>
        </div>
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-5 space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Average Deal Size</p>
          <p className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-zinc-500" />{' '}
            {totalClients > 0 ? formatCurrency(totalValueGenerated / totalClients) : 'PKR 0'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                <th className="px-5 py-3">Business Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Address</th>
                <th className="px-5 py-3">Invoice Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-zinc-500 italic font-semibold">
                    No converted clients registered. Convert leads from the leads pipeline.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const clientRevenues = revenues.filter((r) => r.lead_id === client.id)
                  const hasPaid = clientRevenues.some((r) => r.payment_status === 'paid')
                  const hasPartial = clientRevenues.some((r) => r.payment_status === 'partial')
                  const hasOverdue = clientRevenues.some((r) => r.payment_status === 'overdue')

                  let badge = <span className="text-[10px] font-bold text-zinc-500 bg-zinc-500/10 px-2.5 py-1 border border-zinc-500/20 rounded-lg">Uninvoiced</span>
                  if (hasOverdue) {
                    badge = <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2.5 py-1 border border-red-500/20 rounded-lg">Overdue Invoice</span>
                  } else if (hasPartial) {
                    badge = <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 border border-amber-500/20 rounded-lg">Partial Payments</span>
                  } else if (hasPaid) {
                    badge = <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded-lg">Fully Paid</span>
                  } else if (clientRevenues.length > 0) {
                    badge = <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 border border-blue-500/20 rounded-lg">Invoice Sent</span>
                  }

                  return (
                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 font-bold text-white">{client.shop_name}</td>
                      <td className="px-5 py-4 text-zinc-400">{client.category}</td>
                      <td className="px-5 py-4 font-mono text-zinc-400">{client.phone}</td>
                      <td className="px-5 py-4 text-zinc-400 max-w-xs truncate">{client.address || '—'}</td>
                      <td className="px-5 py-4">{badge}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleRecordPayment(client)}
                          className="btn-primary h-8 px-3 text-[11px] font-bold rounded-lg flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> <span>Invoice / Pay</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record payment modal */}
      <RecordRevenueModal
        isOpen={isRecordOpen}
        onClose={() => {
          setIsRecordOpen(false)
          setSelectedClient(null)
        }}
        client={selectedClient}
        onSave={loadData}
      />
    </div>
  )
}
