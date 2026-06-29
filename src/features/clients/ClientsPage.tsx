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
  Receipt,
  X,
  Calendar,
} from 'lucide-react'
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import type { Lead, Revenue, PaymentStatus, PaymentMethod } from '@/types'
import { formatCurrency } from '@/utils/format'
import { format } from 'date-fns'
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

        // Add Activity Log
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

      toast.success('Payment recorded successfully!')
      onSave()
      onClose()
    } catch (err: unknown) {
      toast.error('Failed to record payment')
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
          <h3 className="text-sm font-semibold text-white">Record Invoice / Payment</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/5 text-[#8c8c8c]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Client / Business</label>
            <p className="text-xs font-semibold text-white bg-[#111111] p-2.5 rounded-lg border border-[#1f1f1f]">
              {client.shop_name}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Package / Deliverable</label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g. Starter Package Website"
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-[#8c8c8c] font-medium">Amount (PKR)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                required
              />
            </div>
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
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-white/20"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online Payment Gateway</option>
              <option value="card">Credit/Debit Card</option>
              <option value="cash">Cash</option>
              <option value="other">Other Method</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#8c8c8c] font-medium">Transaction Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Downpayment 50%"
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
    <div className="space-y-6">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Converted Clients */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Total Active Clients</p>
            <h3 className="text-2xl font-bold text-white mt-1.5">{totalClients}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Total Generated Value */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Gross Deal Value</p>
            <h3 className="text-2xl font-bold text-white mt-1.5">{formatCurrency(totalValueGenerated)}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Average Deal Value */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Average Deal size</p>
            <h3 className="text-2xl font-bold text-white mt-1.5">{formatCurrency(averageDealValue)}</h3>
          </div>
          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-[#111111]/30 border border-[#1f1f1f] rounded-2xl">
          <Briefcase className="w-4 h-4 text-white" />
          <p className="text-xs font-semibold text-white">REDIX Partners & Converted Accounts</p>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-20 border border-[#1f1f1f] border-dashed rounded-3xl bg-[#111111]/10">
            <Briefcase className="w-8 h-8 text-[#4b5563] mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">No active converted clients yet.</p>
            <p className="text-[10px] text-[#4b5563] mt-0.5">Calls marked as 'Converted' in Call Center will show up here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {clients.map((client) => {
              const clientPayments = revenues.filter((r) => r.lead_id === client.id)
              const clientTotal = clientPayments.reduce((acc, r) => acc + r.amount, 0)

              return (
                <div
                  key={client.id}
                  className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 hover:border-white/10 transition-colors flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">{client.shop_name}</h4>
                        <p className="text-[10px] text-[#8c8c8c] mt-0.5 font-medium">{client.category}</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-lg">
                        Active Partner
                      </span>
                    </div>

                    <div className="mt-3.5 bg-[#111111]/30 border border-[#1f1f1f] p-3 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#525252]">Total Paid:</span>
                        <span className="text-white font-bold">{formatCurrency(clientTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#525252]">Registered Packages:</span>
                        <span className="text-white font-medium">
                          {clientPayments.map((p) => p.package).join(', ') || 'No package logged'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-[#1f1f1f] pt-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCallRedirect(client.id)}
                        className="p-2 rounded-lg bg-[#141414] border border-[#1f1f1f] hover:border-white/10 text-white"
                        title="Call Client"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleWhatsApp(client.phone)}
                        className="p-2 rounded-lg bg-[#141414] border border-[#1f1f1f] hover:border-white/10 text-white"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const query = encodeURIComponent(`${client.shop_name} ${client.address || ''}`)
                          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
                        }}
                        className="p-2 rounded-lg bg-[#141414] border border-[#1f1f1f] hover:border-white/10 text-white"
                        title="Maps"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedClient(client)
                        setIsRecordOpen(true)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition-all"
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
