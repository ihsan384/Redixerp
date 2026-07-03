import { useState, useEffect, useCallback, ReactNode } from 'react'
import {
  TrendingUp, DollarSign, Plus, X, Users, FileText, BarChart3,
  ArrowDownLeft, ArrowUpRight, AlertCircle, CheckCircle2,
  Clock, XCircle, RefreshCw, CreditCard, Wallet, Building2,
  Search, Filter, Download, ChevronDown, ChevronUp,
  PieChart as PieIcon, Receipt, UserCheck, Banknote,
  TrendingDown, Eye, Edit3, Trash2, Send, Printer,
  IndianRupee, CalendarDays, Hash, User, StickyNote,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import type { Lead, Revenue, Expense, Invoice, Partner, ClientFinancialSummary, PaymentStatus, PaymentMethod, InvoiceStatus } from '@/types'
import { formatCurrency } from '@/utils/format'
import { PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS, EXPENSE_CATEGORY_LABELS } from '@/utils/constants'
import { toast } from 'sonner'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genInvoiceNumber() {
  const now = new Date()
  const yr = now.getFullYear().toString().slice(-2)
  const mo = String(now.getMonth() + 1).padStart(2, '0')
  const rnd = Math.floor(Math.random() * 900) + 100
  return `INV-${yr}${mo}-${rnd}`
}

function calcPaymentStatus(paid: number, total: number, dueDate?: string): PaymentStatus {
  if (paid <= 0 && total > 0) {
    if (dueDate && new Date(dueDate) < new Date()) return 'overdue'
    return 'pending'
  }
  if (paid >= total) return 'paid'
  if (dueDate && new Date(dueDate) < new Date()) return 'overdue'
  return 'partial'
}

function CircleProgress({ pct, color = '#e53935', size = 64 }: { pct: number; color?: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  return (
    <div className="fin-circle-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <span className="circle-text" style={{ fontSize: size < 56 ? 9 : 11 }}>{Math.round(pct)}%</span>
    </div>
  )
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const colorMap: Record<PaymentStatus, string> = {
    paid:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    partial:    'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    pending:    'bg-red-500/15 text-red-400 border-red-500/20',
    overdue:    'bg-orange-500/15 text-orange-400 border-orange-500/20',
    cancelled:  'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    refunded:   'bg-blue-500/15 text-blue-400 border-blue-500/20',
  }
  const iconMap: Record<PaymentStatus, ReactNode> = {
    paid:       <CheckCircle2 className="w-3 h-3" />,
    partial:    <Clock className="w-3 h-3" />,
    pending:    <AlertCircle className="w-3 h-3" />,
    overdue:    <AlertCircle className="w-3 h-3" />,
    cancelled:  <XCircle className="w-3 h-3" />,
    refunded:   <RefreshCw className="w-3 h-3" />,
  }
  return (
    <span className={`fin-badge ${colorMap[status]}`}>
      {iconMap[status]}
      {PAYMENT_STATUS_LABELS[status] || status}
    </span>
  )
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const m: Record<InvoiceStatus, string> = {
    draft:      'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    pending:    'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    paid:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    overdue:    'bg-orange-500/15 text-orange-400 border-orange-500/20',
    cancelled:  'bg-red-500/15 text-red-400 border-red-500/20',
  }
  return <span className={`fin-badge ${m[status]}`}>{status.toUpperCase()}</span>
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#111111]/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  )
}

// ─── Log Revenue Modal ────────────────────────────────────────────────────────

interface LogRevenueModalProps {
  isOpen: boolean; onClose: () => void; leads: Lead[]; onSave: () => void
}

function LogRevenueModal({ isOpen, onClose, leads, onSave }: LogRevenueModalProps) {
  const [leadId, setLeadId] = useState('')
  const [pkg, setPkg] = useState('')
  const [invoiceNum, setInvoiceNum] = useState(genInvoiceNumber())
  const [totalAmt, setTotalAmt] = useState('')
  const [received, setReceived] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer')
  const [txnId, setTxnId] = useState('')
  const [receivedBy, setReceivedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (leads.length > 0 && !leadId) setLeadId(leads[0].id)
    if (isOpen) setInvoiceNum(genInvoiceNumber())
  }, [leads, isOpen])

  // Pre-fill fixed project value if it exists for the selected client
  useEffect(() => {
    if (leadId) {
      const selectedLead = leads.find(l => l.id === leadId)
      if (selectedLead && selectedLead.fixed_project_value !== undefined && selectedLead.fixed_project_value !== null) {
        setTotalAmt(selectedLead.fixed_project_value.toString())
      } else {
        setTotalAmt('')
      }
    }
  }, [leadId, leads])

  if (!isOpen) return null

  const total = parseFloat(totalAmt) || 0
  const rcvd = parseFloat(received) || 0
  const balance = Math.max(0, total - rcvd)
  const autoStatus = calcPaymentStatus(rcvd, total, dueDate)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadId || !pkg || !received) { toast.error('Please fill required fields'); return }
    setSaving(true)
    try {
      const payload = {
        lead_id: leadId, package: pkg, amount: rcvd,
        payment_status: autoStatus, payment_method: method,
        received_date: date,
        invoice_number: invoiceNum || null,
        total_project_amount: total || null,
        transaction_id: txnId || null,
        received_by: receivedBy || null,
        due_date: dueDate || null,
        notes: notes || null,
      }
      const { error } = await supabase.from('revenue').insert(payload as never)
      if (error) throw error

      // Update fixed project value on lead if total is provided
      if (total > 0) {
        await supabase
          .from('leads')
          .update({ fixed_project_value: total })
          .eq('id', leadId)
      }

      toast.success(`Revenue logged! Balance: ${formatCurrency(balance)}`)
      onSave(); onClose()
    } catch { toast.error('Failed to save revenue record') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="modal-backdrop" />
      <form onSubmit={handleSubmit} className="modal-panel z-10 w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-white">Log Revenue</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Record a payment received from a client</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn w-8 h-8"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 130px)' }}>
          {/* Client & Project */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><Users className="w-3 h-3" /> Client</label>
              <select value={leadId} onChange={e => setLeadId(e.target.value)} className="w-full" required>
                {leads.map(l => <option key={l.id} value={l.id}>{l.shop_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-3 h-3" /> Project / Package</label>
              <input type="text" value={pkg} onChange={e => setPkg(e.target.value)} placeholder="Website & Hosting" className="w-full" required />
            </div>
          </div>

          {/* Invoice & Due */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><Hash className="w-3 h-3" /> Invoice Number</label>
              <input type="text" value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} className="w-full" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full" />
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><IndianRupee className="w-3 h-3" /> Total Project Amount</label>
              <input type="number" value={totalAmt} onChange={e => setTotalAmt(e.target.value)} placeholder="50000" className="w-full" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><ArrowDownLeft className="w-3 h-3" /> Amount Received *</label>
              <input type="number" value={received} onChange={e => setReceived(e.target.value)} placeholder="25000" className="w-full" required />
            </div>
          </div>

          {/* Auto-calculated summary */}
          {(total > 0 || rcvd > 0) && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Total</p>
                <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(total)}</p>
              </div>
              <div className="text-center border-x border-white/[0.06]">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Received</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatCurrency(rcvd)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Balance</p>
                <p className="text-sm font-bold text-yellow-400 mt-0.5">{formatCurrency(balance)}</p>
              </div>
            </div>
          )}

          {/* Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> Payment Method</label>
              <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="w-full">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card Payment</option>
                <option value="online">Online Gateway</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> Payment Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full" required />
            </div>
          </div>

          {/* TXN ID & Received By */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><Hash className="w-3 h-3" /> Transaction ID</label>
              <input type="text" value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="TXN123456" className="w-full" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><User className="w-3 h-3" /> Received By</label>
              <input type="text" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} placeholder="Ihsan" className="w-full" />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><StickyNote className="w-3 h-3" /> Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Advance payment, balance due on delivery" className="w-full" />
          </div>

          {/* Auto status */}
          {rcvd > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span>Auto-calculated status:</span>
              <StatusBadge status={autoStatus} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button type="button" onClick={onClose} className="btn-secondary h-10 px-4 text-xs font-bold">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary h-10 px-5 text-xs font-bold">
            {saving ? 'Saving...' : 'Log Revenue'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Add Invoice Modal ────────────────────────────────────────────────────────

function AddInvoiceModal({ isOpen, onClose, leads, onSave }: { isOpen: boolean; onClose: () => void; leads: Lead[]; onSave: () => void }) {
  const [leadId, setLeadId] = useState('')
  const [invNum, setInvNum] = useState(genInvoiceNumber())
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [total, setTotal] = useState('')
  const [discount, setDiscount] = useState('')
  const [gst, setGst] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (leads.length > 0 && !leadId) setLeadId(leads[0].id)
    if (isOpen) setInvNum(genInvoiceNumber())
  }, [leads, isOpen])

  if (!isOpen) return null

  const totalAmt = parseFloat(total) || 0
  const discountAmt = parseFloat(discount) || 0
  const gstAmt = parseFloat(gst) || 0
  const finalAmt = totalAmt - discountAmt + (totalAmt * gstAmt / 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadId || !total) { toast.error('Client and amount are required'); return }
    setSaving(true)
    try {
      const payload = {
        lead_id: leadId, invoice_number: invNum, issue_date: issueDate,
        due_date: dueDate || null, total_amount: finalAmt,
        discount: discountAmt, gst: gstAmt, status: 'pending', notes: notes || null,
      }
      const { error } = await supabase.from('invoices').insert(payload as never)
      if (error) throw error
      toast.success('Invoice created!')
      onSave(); onClose()
    } catch { toast.error('Failed to create invoice') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="modal-backdrop" />
      <form onSubmit={handleSubmit} className="modal-panel z-10 w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-white">Create Invoice</h3>
          <button type="button" onClick={onClose} className="icon-btn w-8 h-8"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Client</label>
            <select value={leadId} onChange={e => setLeadId(e.target.value)} className="w-full" required>
              {leads.map(l => <option key={l.id} value={l.id}>{l.shop_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Invoice #</label>
              <input type="text" value={invNum} onChange={e => setInvNum(e.target.value)} className="w-full" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Issue Date</label>
              <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Amount (₹)</label>
              <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="50000" className="w-full" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Discount (₹)</label>
              <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" className="w-full" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">GST (%)</label>
              <input type="number" value={gst} onChange={e => setGst(e.target.value)} placeholder="18" className="w-full" />
            </div>
          </div>
          {totalAmt > 0 && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex justify-between">
              <span className="text-xs text-zinc-400">Final Amount</span>
              <span className="text-sm font-bold text-white">{formatCurrency(finalAmt)}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." className="w-full" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button type="button" onClick={onClose} className="btn-secondary h-10 px-4 text-xs font-bold">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary h-10 px-5 text-xs font-bold">
            {saving ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Add Partner Modal ────────────────────────────────────────────────────────

function AddPartnerModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState('')
  const [pct, setPct] = useState('')
  const [fixed, setFixed] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) { toast.error('Partner name required'); return }
    setSaving(true)
    try {
      const payload = { name, share_percentage: parseFloat(pct) || 0, share_fixed: parseFloat(fixed) || null, is_active: true }
      const { error } = await supabase.from('partners').insert(payload as never)
      if (error) throw error
      toast.success('Partner added!'); onSave(); onClose(); setName(''); setPct(''); setFixed('')
    } catch { toast.error('Failed to add partner') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="modal-backdrop" />
      <form onSubmit={handleSubmit} className="modal-panel z-10 w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-white">Add Partner</h3>
          <button type="button" onClick={onClose} className="icon-btn w-8 h-8"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Partner Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ihsan" className="w-full" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Share %</label>
              <input type="number" value={pct} onChange={e => setPct(e.target.value)} placeholder="60" min="0" max="100" className="w-full" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Fixed Amount (optional)</label>
              <input type="number" value={fixed} onChange={e => setFixed(e.target.value)} placeholder="0" className="w-full" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button type="button" onClick={onClose} className="btn-secondary h-10 px-4 text-xs font-bold">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary h-10 px-5 text-xs font-bold">
            {saving ? 'Adding...' : 'Add Partner'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Client Ledger Panel ──────────────────────────────────────────────────────

function ClientLedger({ summary, onClose, onSave }: { summary: ClientFinancialSummary; onClose: () => void; onSave: () => void }) {
  const [fixedVal, setFixedVal] = useState(summary.lead.fixed_project_value?.toString() || '')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    setFixedVal(summary.lead.fixed_project_value?.toString() || '')
  }, [summary.lead.fixed_project_value])

  const handleSaveFixedValue = async () => {
    setUpdating(true)
    try {
      const val = fixedVal === '' ? null : parseFloat(fixedVal)
      if (val !== null && isNaN(val)) {
        toast.error('Please enter a valid number')
        return
      }
      const { error } = await supabase
        .from('leads')
        .update({ fixed_project_value: val })
        .eq('id', summary.lead.id)
      
      if (error) throw error
      toast.success('Fixed project value updated!')
      onSave()
    } catch {
      toast.error('Failed to update project value')
    } finally {
      setUpdating(false)
    }
  }

  const pct = summary.totalProjectValue > 0 ? (summary.totalPaid / summary.totalProjectValue) * 100 : 0

  const timelineItems = [
    { label: 'Client Added', date: summary.lead.created_at, type: 'system' },
    ...summary.transactions.map(t => ({
      label: `${formatCurrency(t.amount)} received`,
      date: t.received_date, type: 'payment',
      sub: `via ${PAYMENT_METHOD_LABELS[t.payment_method] || t.payment_method}${t.notes ? ` — ${t.notes}` : ''}`,
    })),
    ...summary.invoices.map(inv => ({
      label: `Invoice ${inv.invoice_number} generated`,
      date: inv.issue_date, type: 'invoice',
      sub: `${formatCurrency(inv.total_amount)} — ${inv.status}`,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="modal-backdrop" />
      <div className="modal-panel z-10 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-white">{summary.lead.shop_name}</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Client Financial Ledger</p>
          </div>
          <button onClick={onClose} className="icon-btn w-8 h-8"><X className="w-4 h-4" /></button>
        </div>

        {/* Running Balance */}
        <div className="grid grid-cols-3 gap-0 border-b border-white/[0.06]">
          {[
            { label: 'Total Project', val: summary.totalProjectValue, color: 'text-white' },
            { label: 'Paid', val: summary.totalPaid, color: 'text-emerald-400' },
            { label: 'Balance', val: summary.remainingBalance, color: 'text-yellow-400' },
          ].map((item, i) => (
            <div key={i} className={`p-4 text-center ${i < 2 ? 'border-r border-white/[0.06]' : ''}`}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.label}</p>
              <p className={`text-base font-bold mt-1 ${item.color}`}>{formatCurrency(item.val)}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Payment Progress</span>
            <StatusBadge status={summary.paymentStatus} />
          </div>
          <div className="fin-progress-wrap">
            <div className="fin-progress-bar bg-emerald-500" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">{Math.round(pct)}% collected</p>
        </div>

        {/* Fixed Project Value Settings */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Fixed Project Value</label>
            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
              {summary.lead.fixed_project_value !== null && summary.lead.fixed_project_value !== undefined
                ? `Locked at ${formatCurrency(summary.lead.fixed_project_value)}`
                : 'Dynamic (calculated from payments)'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="number"
              value={fixedVal}
              onChange={e => setFixedVal(e.target.value)}
              placeholder="Set fixed value"
              className="w-28 h-8 text-xs px-2.5 bg-[#151515] border border-white/[0.08] text-white rounded-lg focus:outline-none focus:border-red-500"
            />
            <button
              onClick={handleSaveFixedValue}
              disabled={updating}
              className="btn-primary h-8 px-3 text-xs font-bold rounded-lg"
            >
              {updating ? '...' : 'Set'}
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: '320px' }}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-4">Transaction Timeline</p>
          {timelineItems.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">No transactions yet.</p>
          ) : (
            <div className="fin-timeline">
              {timelineItems.map((item, i) => (
                <div key={i} className="fin-timeline-item">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs font-bold ${item.type === 'payment' ? 'text-emerald-400' : item.type === 'invoice' ? 'text-blue-400' : 'text-white'}`}>
                        {item.label}
                      </p>
                      {'sub' in item && item.sub && (
                        <p className="text-[10px] text-zinc-500 mt-0.5">{item.sub}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600 whitespace-nowrap">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PDF Invoice Generator ────────────────────────────────────────────────────

async function downloadInvoicePDF(invoice: Invoice & { lead?: Lead }) {
  try {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, 210, 297, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('REDIX CRM', 20, 25)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('Finance & Revenue Management', 20, 32)
    doc.setDrawColor(229, 57, 53)
    doc.setLineWidth(0.5)
    doc.line(20, 38, 190, 38)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 150, 25)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(`# ${invoice.invoice_number}`, 150, 32)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.text('Bill To:', 20, 52)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(invoice.lead?.shop_name || 'Client', 20, 60)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    if (invoice.lead?.phone) doc.text(invoice.lead.phone, 20, 67)
    doc.setTextColor(255, 255, 255)
    doc.text(`Issue Date: ${invoice.issue_date}`, 130, 52)
    if (invoice.due_date) doc.text(`Due Date: ${invoice.due_date}`, 130, 59)
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 130, 66)
    doc.setDrawColor(50, 50, 50)
    doc.setLineWidth(0.3)
    doc.line(20, 80, 190, 80)
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text('Description', 20, 92)
    doc.text('Amount', 170, 92)
    doc.line(20, 96, 190, 96)
    doc.setTextColor(255, 255, 255)
    doc.text('Project Total Amount', 20, 108)
    doc.text(`INR ${(invoice.total_amount + (invoice.discount || 0)).toLocaleString('en-IN')}`, 150, 108)
    if (invoice.discount) {
      doc.setTextColor(100, 200, 100)
      doc.text('Discount', 20, 118)
      doc.text(`- INR ${invoice.discount.toLocaleString('en-IN')}`, 150, 118)
    }
    if (invoice.gst) {
      doc.setTextColor(150, 180, 255)
      doc.text(`GST (${invoice.gst}%)`, 20, 128)
      const gstAmt = (invoice.total_amount / (1 + invoice.gst / 100)) * (invoice.gst / 100)
      doc.text(`+ INR ${Math.round(gstAmt).toLocaleString('en-IN')}`, 150, 128)
    }
    doc.setDrawColor(229, 57, 53)
    doc.line(20, 140, 190, 140)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL', 20, 152)
    doc.text(`INR ${invoice.total_amount.toLocaleString('en-IN')}`, 140, 152)
    if (invoice.notes) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Notes: ${invoice.notes}`, 20, 170)
    }
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    doc.text('Thank you for your business! — Redix CRM', 105, 285, { align: 'center' })
    doc.save(`${invoice.invoice_number}.pdf`)
    toast.success('Invoice PDF downloaded!')
  } catch (err) {
    console.error(err)
    toast.error('Failed to generate PDF')
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'clients' | 'entries' | 'invoices' | 'partners'

export function RevenuePage() {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals
  const [isLogRevenueOpen, setIsLogRevenueOpen] = useState(false)
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false)
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [revsRes, leadsRes, expsRes, invsRes, partnersRes] = await Promise.all([
        supabase.from('revenue').select('*').order('received_date', { ascending: false }),
        supabase.from('leads').select('*').order('shop_name'),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('partners').select('*').order('name'),
      ])
      setRevenues((revsRes.data || []) as Revenue[])
      setLeads((leadsRes.data || []) as Lead[])
      setExpenses((expsRes.data || []) as Expense[])
      // invoices table may not exist yet — handle gracefully
      if (!invsRes.error) setInvoices((invsRes.data || []) as Invoice[])
      if (!partnersRes.error) setPartners((partnersRes.data || []) as Partner[])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load finance data')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ─ Client Accounts / Summaries ─────────────────────────────────────────────

  const clientSummaries: ClientFinancialSummary[] = leads
    .filter(l => revenues.some(r => r.lead_id === l.id) || invoices.some(inv => inv.lead_id === l.id))
    .map(lead => {
      const txns = revenues.filter(r => r.lead_id === lead.id)
      const invs = invoices.filter(inv => inv.lead_id === lead.id)
      const totalProjectValue = lead.fixed_project_value !== null && lead.fixed_project_value !== undefined
        ? Number(lead.fixed_project_value)
        : (txns.reduce((s, r) => s + (r.total_project_amount || r.amount), 0) || invs.reduce((s, inv) => s + inv.total_amount, 0))
      const totalPaid = txns.reduce((s, r) => s + r.amount, 0)
      const remainingBalance = Math.max(0, totalProjectValue - totalPaid)
      const lastTxn = txns.sort((a, b) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime())[0]
      const dueDate = txns.find(r => r.due_date)?.due_date
      return {
        lead, totalProjectValue, totalPaid, remainingBalance,
        lastPaymentDate: lastTxn?.received_date,
        dueDate, transactions: txns, invoices: invs,
        paymentStatus: calcPaymentStatus(totalPaid, totalProjectValue, dueDate),
      }
    })

  const activeSummary = clientSummaries.find(s => s.lead.id === selectedClientId)

  const filteredClients = clientSummaries.filter(s => {
    const matchSearch = !searchQuery || s.lead.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.paymentStatus === statusFilter
    return matchSearch && matchStatus
  })

  // ─ Core Calculations ───────────────────────────────────────────────────────

  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const collectedRevenue = revenues.filter(r => r.payment_status === 'paid').reduce((s, r) => s + r.amount, 0)
  const allPaidRevenue = revenues.reduce((s, r) => s + r.amount, 0)

  // Gross = sum of client project values
  const grossRevenue = clientSummaries.reduce((s, c) => s + c.totalProjectValue, 0)
  const outstandingBalance = Math.max(0, grossRevenue - allPaidRevenue)

  const monthlyExpenses = expenses
    .filter(e => e.date.startsWith(monthStr))
    .reduce((s, e) => s + e.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = allPaidRevenue - totalExpenses

  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue' || (inv.due_date && new Date(inv.due_date) < now && inv.status !== 'paid')).length
  const invoicesThisMonth = invoices.filter(inv => inv.issue_date.startsWith(monthStr)).length

  // Partner share pending
  const partnerSharePending = partners.reduce((sum, p) => {
    const share = p.share_percentage > 0 ? (netProfit * p.share_percentage / 100) : (p.share_fixed || 0)
    return sum + Math.max(0, share)
  }, 0)

  const kpiCards = [
    { label: 'Gross Revenue', val: grossRevenue, icon: <IndianRupee className="w-5 h-5" />, color: '#22c55e', accent: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
    { label: 'Collected Revenue', val: collectedRevenue, icon: <ArrowDownLeft className="w-5 h-5" />, color: '#3b82f6', accent: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
    { label: 'Outstanding Balance', val: outstandingBalance, icon: <ArrowUpRight className="w-5 h-5" />, color: '#f59e0b', accent: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
    { label: 'Monthly Expenses', val: monthlyExpenses, icon: <TrendingDown className="w-5 h-5" />, color: '#ef4444', accent: 'bg-red-500/10 border-red-500/20 text-red-400' },
    { label: 'Net Profit', val: netProfit, icon: <TrendingUp className="w-5 h-5" />, color: '#a78bfa', accent: netProfit >= 0 ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-red-500/10 border-red-500/20 text-red-400' },
    { label: 'Partner Share Pending', val: partnerSharePending, icon: <UserCheck className="w-5 h-5" />, color: '#f97316', accent: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
    { label: 'Overdue Invoices', val: overdueInvoices, isCount: true, icon: <AlertCircle className="w-5 h-5" />, color: '#ef4444', accent: 'bg-red-500/10 border-red-500/20 text-red-400' },
    { label: 'Invoices This Month', val: invoicesThisMonth, isCount: true, icon: <FileText className="w-5 h-5" />, color: '#06b6d4', accent: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
  ]

  // ─ Chart Data ─────────────────────────────────────────────────────────────

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyChartData = MONTHS.map((name, idx) => {
    const rev = revenues.filter(r => new Date(r.received_date).getMonth() === idx).reduce((s, r) => s + r.amount, 0)
    const exp = expenses.filter(e => new Date(e.date).getMonth() === idx).reduce((s, e) => s + e.amount, 0)
    return { name, Revenue: rev, Expenses: exp, Profit: Math.max(0, rev - exp) }
  }).filter(d => d.Revenue > 0 || d.Expenses > 0)

  const methodDistribution = Object.entries(
    revenues.reduce((acc, r) => { acc[r.payment_method] = (acc[r.payment_method] || 0) + r.amount; return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: PAYMENT_METHOD_LABELS[name as PaymentMethod] || name, value }))

  const PIE_COLORS = ['#e53935', '#3b82f6', '#22c55e', '#f59e0b', '#a78bfa', '#f97316', '#06b6d4']

  const topClients = [...clientSummaries]
    .sort((a, b) => b.totalPaid - a.totalPaid)
    .slice(0, 5)

  // ─ Render ─────────────────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'clients', label: 'Client Accounts', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'entries', label: 'Revenue Entries', icon: <IndianRupee className="w-3.5 h-3.5" /> },
    { id: 'invoices', label: 'Invoices', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'partners', label: 'Partner Share', icon: <UserCheck className="w-3.5 h-3.5" /> },
  ]

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-400/20 border-t-red-400" />
          <p className="text-sm font-semibold text-zinc-500">Loading Finance Hub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell page-stack space-y-6">
      {/* Header */}
      <div className="panel-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Finance Hub</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Complete financial management — revenue, expenses, invoices & partner share</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsAddInvoiceOpen(true)} className="btn-secondary h-10 px-4 text-xs font-bold">
              <FileText className="w-4 h-4" /> New Invoice
            </button>
            <button onClick={() => setIsLogRevenueOpen(true)} className="btn-primary h-10 px-4 text-xs font-bold">
              <Plus className="w-4 h-4" /> Log Revenue
            </button>
          </div>
        </div>

        {/* Sticky mini summary */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Collected', val: formatCurrency(collectedRevenue), color: 'text-emerald-400' },
            { label: 'Outstanding', val: formatCurrency(outstandingBalance), color: 'text-yellow-400' },
            { label: 'Net Profit', val: formatCurrency(netProfit), color: netProfit >= 0 ? 'text-purple-400' : 'text-red-400' },
            { label: 'Total Expenses', val: formatCurrency(totalExpenses), color: 'text-red-400' },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.label}</p>
              <p className={`text-sm font-bold mt-0.5 fin-counter ${item.color}`}>{item.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="fin-tabs">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`fin-tab ${tab === t.id ? 'active' : ''}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {/* 8 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpiCards.map((card, i) => (
              <div key={i} className="fin-kpi-card">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-tight">{card.label}</p>
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${card.accent}`}>
                    {card.icon}
                  </div>
                </div>
                <p className="text-xl font-bold text-white fin-counter">
                  {card.isCount ? card.val : formatCurrency(card.val as number)}
                </p>
                {!card.isCount && grossRevenue > 0 && (
                  <div className="fin-progress-wrap">
                    <div className="fin-progress-bar" style={{
                      width: `${Math.min(100, ((card.val as number) / grossRevenue) * 100)}%`,
                      background: card.color,
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Charts */}
          {monthlyChartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue vs Expenses - 2/3 */}
              <div className="lg:col-span-2 border border-white/[0.08] bg-[#111111]/60 backdrop-blur-md rounded-2xl p-6">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-zinc-500" /> Revenue vs Expenses
                </h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '12px' }} />
                      <Area type="monotone" dataKey="Revenue" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth={2} />
                      <Bar dataKey="Expenses" fill="rgba(239,68,68,0.6)" radius={[3, 3, 0, 0]} maxBarSize={24} />
                      <Line type="monotone" dataKey="Profit" stroke="#a78bfa" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Method Distribution - 1/3 */}
              <div className="border border-white/[0.08] bg-[#111111]/60 backdrop-blur-md rounded-2xl p-6">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-zinc-500" /> Payment Methods
                </h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={methodDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                        {methodDistribution.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatCurrency(Number(val || 0))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {methodDistribution.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[10px] text-zinc-400">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Paying Clients */}
          {topClients.length > 0 && (
            <div className="border border-white/[0.08] bg-[#111111]/60 backdrop-blur-md rounded-2xl p-6">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-500" /> Top Paying Clients
              </h4>
              <div className="space-y-3">
                {topClients.map((client, i) => {
                  const pct = client.totalProjectValue > 0 ? (client.totalPaid / client.totalProjectValue) * 100 : 100
                  return (
                    <div key={client.lead.id} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-zinc-600 w-4">#{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{client.lead.shop_name}</span>
                          <span className="text-xs font-bold text-emerald-400">{formatCurrency(client.totalPaid)}</span>
                        </div>
                        <div className="fin-progress-wrap" style={{ marginTop: 0 }}>
                          <div className="fin-progress-bar bg-emerald-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                      <StatusBadge status={client.paymentStatus} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Profit Formula Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Revenue Collected', val: allPaidRevenue, icon: <Wallet className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Total Expenses', val: totalExpenses, icon: <Receipt className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
              { label: 'Net Profit', val: netProfit, icon: <TrendingUp className="w-5 h-5" />, color: netProfit >= 0 ? 'text-purple-400' : 'text-red-400', bg: netProfit >= 0 ? 'bg-purple-500/10 border-purple-500/20' : 'bg-red-500/10 border-red-500/20' },
            ].map((item, i) => (
              <div key={i} className={`fin-kpi-card border ${item.bg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} border ${item.color}`}>{item.icon}</div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.label}</p>
                    <p className={`text-lg font-bold fin-counter ${item.color}`}>{formatCurrency(item.val)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: CLIENT ACCOUNTS ── */}
      {tab === 'clients' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search clients..." className="w-full pl-9" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="sm:w-44">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {filteredClients.length === 0 ? (
            <div className="empty-state">
              <Users className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-sm font-bold text-zinc-500">No client accounts yet</p>
              <p className="text-xs text-zinc-600 mt-1">Log revenue entries to create client financial accounts</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredClients.map(summary => {
                const pct = summary.totalProjectValue > 0 ? Math.min(100, (summary.totalPaid / summary.totalProjectValue) * 100) : 0
                return (
                  <div key={summary.lead.id} className="fin-client-card">
                    {/* Card Header */}
                    <div className="p-4 border-b border-white/[0.06] flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">{summary.lead.shop_name}</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{summary.lead.category}</p>
                      </div>
                      <StatusBadge status={summary.paymentStatus} />
                    </div>

                    {/* Amounts */}
                    <div className="grid grid-cols-3 gap-0 border-b border-white/[0.06]">
                      {[
                        { label: 'Project Value', val: summary.totalProjectValue, color: 'text-white' },
                        { label: 'Paid', val: summary.totalPaid, color: 'text-emerald-400' },
                        { label: 'Balance', val: summary.remainingBalance, color: 'text-yellow-400' },
                      ].map((item, i) => (
                        <div key={i} className={`p-3 text-center ${i < 2 ? 'border-r border-white/[0.06]' : ''}`}>
                          <p className="text-[9px] text-zinc-500 uppercase">{item.label}</p>
                          <p className={`text-xs font-bold mt-0.5 ${item.color}`}>{formatCurrency(item.val)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Progress */}
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <CircleProgress pct={pct} size={44} color={summary.paymentStatus === 'paid' ? '#22c55e' : summary.paymentStatus === 'partial' ? '#f59e0b' : '#ef4444'} />
                        <div className="flex-1">
                          <div className="fin-progress-wrap" style={{ marginTop: 0 }}>
                            <div className="fin-progress-bar" style={{
                              width: `${pct}%`,
                              background: summary.paymentStatus === 'paid' ? '#22c55e' : summary.paymentStatus === 'partial' ? '#f59e0b' : '#ef4444',
                            }} />
                          </div>
                          {summary.lastPaymentDate && (
                            <p className="text-[10px] text-zinc-600 mt-1">Last payment: {summary.lastPaymentDate}</p>
                          )}
                          {summary.dueDate && (
                            <p className="text-[10px] text-zinc-600">Due: {summary.dueDate}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedClientId(summary.lead.id)}
                        className="w-full mt-3 btn-ghost h-8 text-xs gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Ledger
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: REVENUE ENTRIES ── */}
      {tab === 'entries' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search entries..." className="w-full pl-9" />
            </div>
            <button onClick={() => setIsLogRevenueOpen(true)} className="btn-primary h-10 px-4 text-xs font-bold">
              <Plus className="w-4 h-4" /> Log Revenue
            </button>
          </div>

          <div className="table-shell">
            <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Revenue Transactions ({revenues.length})</h4>
            </div>
            <div className="overflow-x-auto">
              {revenues.length === 0 ? (
                <div className="p-10 text-center">
                  <IndianRupee className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-xs text-zinc-500 font-bold">No revenue entries. Click "Log Revenue" to get started.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      {['Client', 'Project', 'Invoice #', 'Total', 'Received', 'Balance', 'Method', 'Date', 'Status'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {revenues.filter(r => {
                      const lead = leads.find(l => l.id === r.lead_id)
                      return !searchQuery || lead?.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.package.toLowerCase().includes(searchQuery.toLowerCase())
                    }).map(rev => {
                      const lead = leads.find(l => l.id === rev.lead_id)
                      const total = rev.total_project_amount || rev.amount
                      const balance = Math.max(0, total - rev.amount)
                      return (
                        <tr key={rev.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="text-xs font-bold text-white">{lead?.shop_name || '—'}</td>
                          <td className="text-xs text-zinc-400 font-medium max-w-[120px] truncate">{rev.package}</td>
                          <td className="text-xs text-zinc-500 font-mono">{rev.invoice_number || '—'}</td>
                          <td className="text-xs font-bold text-white">{formatCurrency(total)}</td>
                          <td className="text-xs font-bold text-emerald-400">{formatCurrency(rev.amount)}</td>
                          <td className="text-xs font-bold text-yellow-400">{formatCurrency(balance)}</td>
                          <td className="text-xs text-zinc-400 capitalize">{PAYMENT_METHOD_LABELS[rev.payment_method] || rev.payment_method}</td>
                          <td className="text-xs text-zinc-400">{rev.received_date}</td>
                          <td><StatusBadge status={rev.payment_status} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: INVOICES ── */}
      {tab === 'invoices' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search invoices..." className="w-full pl-9" />
            </div>
            <button onClick={() => setIsAddInvoiceOpen(true)} className="btn-primary h-10 px-4 text-xs font-bold">
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          </div>

          {/* Invoice Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total', count: invoices.length, color: 'text-white' },
              { label: 'Paid', count: invoices.filter(i => i.status === 'paid').length, color: 'text-emerald-400' },
              { label: 'Pending', count: invoices.filter(i => i.status === 'pending').length, color: 'text-yellow-400' },
              { label: 'Overdue', count: overdueInvoices, color: 'text-red-400' },
            ].map((item, i) => (
              <div key={i} className="fin-kpi-card text-center py-3">
                <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          {invoices.length === 0 ? (
            <div className="empty-state">
              <FileText className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-sm font-bold text-zinc-500">No invoices yet</p>
              <p className="text-xs text-zinc-600 mt-1">Run the database migration first, then create invoices</p>
              <button onClick={() => setIsAddInvoiceOpen(true)} className="btn-primary h-9 px-4 text-xs mt-4">
                <Plus className="w-3.5 h-3.5" /> Create Invoice
              </button>
            </div>
          ) : (
            <div className="table-shell">
              <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">All Invoices ({invoices.length})</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      {['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Amount', 'Status', 'Actions'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {invoices
                      .filter(inv => {
                        const lead = leads.find(l => l.id === inv.lead_id)
                        return !searchQuery || inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || lead?.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
                      })
                      .map(inv => {
                        const lead = leads.find(l => l.id === inv.lead_id)
                        const invWithLead = { ...inv, lead }
                        const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.status !== 'paid'
                        const effectiveStatus: InvoiceStatus = isOverdue ? 'overdue' : inv.status
                        return (
                          <tr key={inv.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="text-xs font-mono font-bold text-white">{inv.invoice_number}</td>
                            <td className="text-xs font-bold text-white">{lead?.shop_name || '—'}</td>
                            <td className="text-xs text-zinc-400">{inv.issue_date}</td>
                            <td className="text-xs text-zinc-400">{inv.due_date || '—'}</td>
                            <td className="text-xs font-bold text-white">{formatCurrency(inv.total_amount)}</td>
                            <td><InvoiceStatusBadge status={effectiveStatus} /></td>
                            <td>
                              <div className="flex items-center gap-1">
                                <button onClick={() => downloadInvoicePDF(invWithLead)} className="icon-btn w-7 h-7 text-zinc-400 hover:text-white" title="Download PDF">
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    const newStatus: InvoiceStatus = inv.status === 'paid' ? 'pending' : 'paid'
                                    await supabase.from('invoices').update({ status: newStatus } as never).eq('id', inv.id)
                                    toast.success(`Invoice marked as ${newStatus}`)
                                    loadData()
                                  }}
                                  className="icon-btn w-7 h-7 text-zinc-400 hover:text-emerald-400" title="Toggle Status"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: PARTNER SHARE ── */}
      {tab === 'partners' && (
        <div className="space-y-5">
          {/* Profit Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Revenue Collected', val: allPaidRevenue, color: 'text-emerald-400', icon: <ArrowDownLeft className="w-5 h-5" /> },
              { label: 'Total Expenses', val: totalExpenses, color: 'text-red-400', icon: <TrendingDown className="w-5 h-5" /> },
              { label: 'Distributable Profit', val: netProfit, color: netProfit >= 0 ? 'text-purple-400' : 'text-red-400', icon: <Banknote className="w-5 h-5" /> },
            ].map((item, i) => (
              <div key={i} className="fin-kpi-card">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400">{item.icon}</div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.label}</p>
                    <p className={`text-lg font-bold fin-counter ${item.color}`}>{formatCurrency(item.val)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Partner Accounts</h3>
            <button onClick={() => setIsAddPartnerOpen(true)} className="btn-primary h-9 px-4 text-xs font-bold">
              <Plus className="w-4 h-4" /> Add Partner
            </button>
          </div>

          {partners.length === 0 ? (
            <div className="empty-state">
              <UserCheck className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-sm font-bold text-zinc-500">No partners added yet</p>
              <p className="text-xs text-zinc-600 mt-1">Run the database migration, then add partners</p>
              <button onClick={() => setIsAddPartnerOpen(true)} className="btn-primary h-9 px-4 text-xs mt-4">
                <Plus className="w-3.5 h-3.5" /> Add Partner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partners.map(partner => {
                const shareAmt = partner.share_percentage > 0
                  ? Math.max(0, netProfit * partner.share_percentage / 100)
                  : (partner.share_fixed || 0)
                const pct = partner.share_percentage > 0 ? partner.share_percentage : 0
                return (
                  <div key={partner.id} className="fin-partner-card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar w-12 h-12 text-base">{partner.name[0]?.toUpperCase()}</div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{partner.name}</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {partner.share_percentage > 0 ? `${partner.share_percentage}% profit share` : `Fixed: ${formatCurrency(partner.share_fixed || 0)}`}
                          </p>
                        </div>
                      </div>
                      <span className={`fin-badge ${partner.is_active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'}`}>
                        {partner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Share %</p>
                        <p className="text-lg font-bold text-white mt-0.5">{pct}%</p>
                      </div>
                      <div className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/[0.12] p-3">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Share Amount</p>
                        <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatCurrency(shareAmt)}</p>
                      </div>
                    </div>

                    {pct > 0 && (
                      <div className="fin-progress-wrap mb-4">
                        <div className="fin-progress-bar bg-red-500" style={{ width: `${pct}%` }} />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const newStatus = !partner.is_active
                          await supabase.from('partners').update({ is_active: newStatus } as never).eq('id', partner.id)
                          toast.success(`${partner.name} marked ${newStatus ? 'active' : 'inactive'}`)
                          loadData()
                        }}
                        className="flex-1 btn-secondary h-8 text-xs font-bold"
                      >
                        {partner.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete partner ${partner.name}?`)) {
                            await supabase.from('partners').delete().eq('id', partner.id)
                            toast.success('Partner removed')
                            loadData()
                          }
                        }}
                        className="icon-btn h-8 w-8 text-red-400/60 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Partner Distribution Summary */}
          {partners.length > 0 && netProfit > 0 && (
            <div className="border border-white/[0.08] bg-[#111111]/60 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Profit Distribution Summary</h4>
              <div className="space-y-3">
                {partners.filter(p => p.is_active).map(p => {
                  const share = p.share_percentage > 0 ? Math.max(0, netProfit * p.share_percentage / 100) : (p.share_fixed || 0)
                  const pct = netProfit > 0 ? (share / netProfit) * 100 : 0
                  return (
                    <div key={p.id} className="flex items-center gap-4">
                      <div className="avatar w-7 h-7 text-[10px]">{p.name[0]?.toUpperCase()}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{p.name}</span>
                          <span className="text-xs font-bold text-emerald-400">{formatCurrency(share)}</span>
                        </div>
                        <div className="fin-progress-wrap" style={{ marginTop: 0 }}>
                          <div className="fin-progress-bar bg-red-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-zinc-500 w-10 text-right">{Math.round(pct)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <LogRevenueModal isOpen={isLogRevenueOpen} onClose={() => setIsLogRevenueOpen(false)} leads={leads} onSave={loadData} />
      <AddInvoiceModal isOpen={isAddInvoiceOpen} onClose={() => setIsAddInvoiceOpen(false)} leads={leads} onSave={loadData} />
      <AddPartnerModal isOpen={isAddPartnerOpen} onClose={() => setIsAddPartnerOpen(false)} onSave={loadData} />
      {selectedClientId && activeSummary && (
        <ClientLedger summary={activeSummary} onClose={() => setSelectedClientId(null)} onSave={loadData} />
      )}
    </div>
  )
}
