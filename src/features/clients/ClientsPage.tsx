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
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import type { Lead, Revenue, PaymentStatus, PaymentMethod } from '@/types'
import { formatCurrency } from '@/utils/format'
import { toast } from 'sonner'

const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                  !import.meta.env.VITE_SUPABASE_URL

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
      if (DEMO_MODE) {
        const currentRev = Storage.getRevenue()
        const newRev: Revenue = {
          id: `rev-${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString(),
        }
        Storage.saveRevenue([newRev, ...currentRev])

        const newAct = {
          id: `act-${Date.now()}`,
          lead_id: client.id,
          type: 'converted' as const,
          description: `Received payment of ${formatCurrency(numAmount)} for ${packageName}.`,
          created_at: new Date().toISOString(),
        }
        Storage.saveActivities([newAct, ...Storage.getActivities()])
      } else {
        const { error } = await supabase.from('revenue').insert(payload as never)
        if (error) throw error

        const newAct = {
          lead_id: client.id,
          type: 'converted' as const,
          description: `Received payment of ${formatCurrency(numAmount)} for ${packageName}.`,
        }
        await supabase.from('activities').insert(newAct as never)
      }

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

  const loadData = () => {
    const allLeads = Storage.getLeads()
    const allRevenues = Storage.getRevenue()
    setClients(allLeads.filter((l) => l.status === 'converted'))
    setRevenues(allRevenues)
  }

  useEffect(() => {
    loadData()
  }, [])

  const totalClients = clients.length
  const totalValueGenerated = revenues.reduce((acc, r) => acc + r.amount, 0)
  const averageDealValue = totalClients > 0 ? totalValueGenerated / totalClients : 0

  const handleCallRedirect = (leadId: string) => {
    navigate(`/call-center?leadId=${leadId}`)
  }

  const handleWhatsApp = (phone: string) => {
    const formatted = phone.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${formatted}`, '_blank')
  }

  return (
    <div className="page-shell page-stack space-y-6">
      {/* KPI Stats Cards - Redesigned matching dark border & shadow theme */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Converted Clients */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Converted Partners</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{totalClients} accounts</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Total Generated Value */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Gross Value Generated</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{formatCurrency(totalValueGenerated)}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/15 text-blue-400 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Average Deal Value */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Average Account Size</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{formatCurrency(averageDealValue)}</h3>
          </div>
          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/15 text-purple-400 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 p-3.5 bg-white/[0.01] border border-white/[0.06] rounded-2xl">
          <Briefcase className="w-4.5 h-4.5 text-zinc-400" />
          <p className="text-xs font-bold text-white uppercase tracking-wider">Partners ledger directory</p>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/[0.08] rounded-3xl bg-white/[0.01]">
            <Briefcase className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-white">No active partner directories yet.</p>
            <p className="text-[10px] text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">Prospect lists updated to 'Converted' in Call Center are filed here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {clients.map((client) => {
              const clientPayments = revenues.filter((r) => r.lead_id === client.id)
              const clientTotal = clientPayments.reduce((acc, r) => acc + r.amount, 0)

              return (
                <div
                  key={client.id}
                  className="surface-card flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white tracking-tight">{client.shop_name}</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{client.category}</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-lg">
                        Active Client
                      </span>
                    </div>

                    <div className="mt-4 bg-white/[0.01] border border-white/[0.06] p-4 rounded-xl space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Total Billed:</span>
                        <span className="text-white font-bold">{formatCurrency(clientTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Packages Registered:</span>
                        <span className="text-white font-bold truncate max-w-[200px]">
                          {clientPayments.map((p) => p.package).join(', ') || 'No billable projects registered'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCallRedirect(client.id)}
                        className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/12 text-white hover:bg-white/[0.04] transition-all"
                        title="Dial Client"
                      >
                        <Phone className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => handleWhatsApp(client.phone)}
                        className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/12 text-white hover:bg-white/[0.04] transition-all"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4 text-green-400" />
                      </button>
                      <button
                        onClick={() => {
                          const query = encodeURIComponent(`${client.shop_name} ${client.address || ''}`)
                          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
                        }}
                        className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/12 text-white hover:bg-white/[0.04] transition-all"
                        title="Google Maps Location"
                      >
                        <MapPin className="w-4 h-4 text-blue-400" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedClient(client)
                        setIsRecordOpen(true)
                      }}
                      className="btn-primary h-10 px-4 text-xs font-bold rounded-xl"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log Payment
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
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
