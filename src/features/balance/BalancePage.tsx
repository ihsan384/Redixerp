import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  IndianRupee, Search, Download, RefreshCw,
  AlertCircle, CheckCircle2, Clock, XCircle,
  ChevronDown, ChevronUp, X, TrendingDown,
  Calendar, Phone, ExternalLink, Filter,
  Wallet, ArrowUpRight, ArrowDownLeft,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Lead, Revenue, PaymentStatus } from '@/types'
import { formatCurrency } from '@/utils/format'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcStatus(paid: number, total: number, dueDate?: string): PaymentStatus {
  if (total <= 0) return 'pending'
  if (paid >= total) return 'paid'
  if (paid > 0) {
    if (dueDate && new Date(dueDate) < new Date()) return 'overdue'
    return 'partial'
  }
  if (dueDate && new Date(dueDate) < new Date()) return 'overdue'
  return 'pending'
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'dd MMM yyyy') } catch { return '—' }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientBalance {
  lead: Lead
  totalProjectValue: number
  totalCollected: number
  outstanding: number
  status: PaymentStatus
  lastPaymentDate?: string
  lastDueDate?: string
  transactionCount: number
  transactions: Revenue[]
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<PaymentStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  paid:      { label: 'Paid',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="w-3 h-3" /> },
  partial:   { label: 'Partial',  cls: 'bg-yellow-500/10  text-yellow-400  border-yellow-500/20',  icon: <Clock        className="w-3 h-3" /> },
  pending:   { label: 'Pending',  cls: 'bg-red-500/10     text-red-400     border-red-500/20',     icon: <AlertCircle  className="w-3 h-3" /> },
  overdue:   { label: 'Overdue',  cls: 'bg-orange-500/10  text-orange-400  border-orange-500/20',  icon: <AlertCircle  className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled',cls: 'bg-zinc-700/40    text-zinc-400    border-zinc-600/20',    icon: <XCircle      className="w-3 h-3" /> },
  refunded:  { label: 'Refunded', cls: 'bg-blue-500/10    text-blue-400    border-blue-500/20',    icon: <RefreshCw    className="w-3 h-3" /> },
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: string; icon: React.ReactNode
}) {
  return (
    <div className="bg-[#111]/70 border border-white/[0.07] rounded-2xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-white leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Payment History Row ──────────────────────────────────────────────────────

function PaymentRow({ txn }: { txn: Revenue }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
        <ArrowDownLeft className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{txn.package || 'Payment'}</p>
        <p className="text-[10px] text-zinc-500">{fmtDate(txn.received_date)} · {txn.payment_method?.replace(/_/g,' ')}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-emerald-400">{formatCurrency(txn.amount)}</p>
        {txn.invoice_number && (
          <p className="text-[9px] text-zinc-600">{txn.invoice_number}</p>
        )}
      </div>
    </div>
  )
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function BalanceDrawer({ client, onClose }: { client: ClientBalance; onClose: () => void }) {
  const navigate = useNavigate()
  const pct = client.totalProjectValue > 0
    ? Math.round((client.totalCollected / client.totalProjectValue) * 100)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex" style={{ animation: 'fadeIn 0.15s ease-out' }}>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="w-full max-w-[440px] h-full bg-[#0c0c0c] border-l border-white/[0.08] flex flex-col shadow-2xl"
        style={{ animation: 'slideInRight 0.22s ease-out' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{client.lead.shop_name}</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">{client.lead.category} · {client.lead.phone}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-white/[0.08] hover:border-white/15 text-zinc-500 hover:text-white flex items-center justify-center transition-all shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status + Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={client.status} />
            {client.lastDueDate && (
              <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                <Calendar className="w-3 h-3" /> Due: {fmtDate(client.lastDueDate)}
              </span>
            )}
          </div>

          {/* Finance Summary */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Financial Summary</p>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-zinc-500">Collection Progress</span>
                <span className="font-bold text-white">{pct}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: pct >= 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
            </div>

            {[
              { label: 'Total Project Value', value: formatCurrency(client.totalProjectValue), color: 'text-white' },
              { label: 'Total Collected',     value: formatCurrency(client.totalCollected),    color: 'text-emerald-400' },
              { label: 'Outstanding Balance', value: formatCurrency(client.outstanding),       color: client.outstanding > 0 ? 'text-red-400' : 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">{label}</span>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}

            <div className="flex justify-between items-center text-xs pt-1 border-t border-white/[0.05]">
              <span className="text-zinc-500">Payments Made</span>
              <span className="font-bold text-white">{client.transactionCount} transaction{client.transactionCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/call-center?leadId=${client.lead.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 text-xs font-bold transition-all"
            >
              <Phone className="w-3.5 h-3.5" /> Call Client
            </button>
            <button
              onClick={() => navigate(`/revenue`)}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.06] text-xs font-bold transition-all"
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Log Payment
            </button>
          </div>

          {/* Payment History */}
          <div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-3">
              Payment History ({client.transactionCount})
            </p>
            {client.transactions.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-6">No payments recorded yet</p>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-1">
                {client.transactions.map(t => <PaymentRow key={t.id} txn={t} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sort button ─────────────────────────────────────────────────────────────

type SortKey = 'name' | 'outstanding' | 'collected' | 'project' | 'status'

function SortBtn({ col, sortKey, sortDir, onSort }: {
  col: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc'
  onSort: (k: SortKey) => void
}) {
  const active = sortKey === col
  return (
    <button onClick={() => onSort(col)} className="flex items-center gap-0.5 text-left group">
      <span className={active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}>
        {col === 'name' ? 'Client' : col === 'outstanding' ? 'Outstanding' : col === 'collected' ? 'Collected' : col === 'project' ? 'Project Value' : 'Status'}
      </span>
      {active
        ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-red-400 ml-0.5" /> : <ChevronDown className="w-3 h-3 text-red-400 ml-0.5" />
        : <ChevronDown className="w-3 h-3 text-zinc-700 ml-0.5" />
      }
    </button>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function BalancePage() {
  const [balances, setBalances]   = useState<ClientBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatus>('all')
  const [showFilters, setShowFilters]   = useState(false)

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('outstanding')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Drawer
  const [selected, setSelected] = useState<ClientBalance | null>(null)

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [{ data: revenues, error: rErr }, { data: leads, error: lErr }] = await Promise.all([
        supabase.from('revenue').select('*, lead:leads(*)').order('received_date', { ascending: false }),
        supabase.from('leads').select('*').eq('status', 'converted'),
      ])

      if (rErr) throw rErr
      if (lErr) throw lErr

      // Group revenues by lead_id
      const revenueMap = new Map<string, Revenue[]>()
      for (const rev of (revenues ?? []) as Revenue[]) {
        const arr = revenueMap.get(rev.lead_id) ?? []
        arr.push(rev)
        revenueMap.set(rev.lead_id, arr)
      }

      // Build ClientBalance for each converted lead
      const allLeads = (leads ?? []) as Lead[]
      const result: ClientBalance[] = allLeads.map(lead => {
        const txns = revenueMap.get(lead.id) ?? []
        const totalProjectValue = txns.reduce((s, r) => {
          const tpa = r.total_project_amount ?? 0
          return s + tpa
        }, 0) || (lead.fixed_project_value ?? 0)

        const totalCollected = txns.reduce((s, r) => s + (r.amount ?? 0), 0)
        const outstanding = Math.max(0, totalProjectValue - totalCollected)
        const lastDueDate = txns.find(r => r.due_date)?.due_date
        const lastPaymentDate = txns[0]?.received_date
        const status = calcStatus(totalCollected, totalProjectValue, lastDueDate)

        return {
          lead,
          totalProjectValue,
          totalCollected,
          outstanding,
          status,
          lastPaymentDate,
          lastDueDate,
          transactionCount: txns.length,
          transactions: txns,
        }
      })

      // Also include non-converted leads that have revenue entries
      const leadIds = new Set(allLeads.map(l => l.id))
      for (const [leadId, txns] of revenueMap.entries()) {
        if (leadIds.has(leadId)) continue
        // Find lead info from revenue.lead
        const leadInfo = (txns[0] as any)?.lead as Lead | undefined
        if (!leadInfo) continue

        const totalProjectValue = txns.reduce((s, r) => {
          return s + (r.total_project_amount ?? 0)
        }, 0) || (leadInfo.fixed_project_value ?? 0)
        const totalCollected = txns.reduce((s, r) => s + (r.amount ?? 0), 0)
        const outstanding = Math.max(0, totalProjectValue - totalCollected)
        const lastDueDate = txns.find(r => r.due_date)?.due_date
        const status = calcStatus(totalCollected, totalProjectValue, lastDueDate)

        result.push({
          lead: leadInfo,
          totalProjectValue,
          totalCollected,
          outstanding,
          status,
          lastPaymentDate: txns[0]?.received_date,
          lastDueDate,
          transactionCount: txns.length,
          transactions: txns,
        })
      }

      setBalances(result)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load balance data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Sort handler ────────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...balances]
    if (filterStatus !== 'all') list = list.filter(c => c.status === filterStatus)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c =>
        c.lead.shop_name?.toLowerCase().includes(s) ||
        c.lead.phone?.includes(s) ||
        c.lead.category?.toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0
      if (sortKey === 'name')        { va = a.lead.shop_name ?? ''; vb = b.lead.shop_name ?? '' }
      if (sortKey === 'outstanding') { va = a.outstanding;          vb = b.outstanding }
      if (sortKey === 'collected')   { va = a.totalCollected;       vb = b.totalCollected }
      if (sortKey === 'project')     { va = a.totalProjectValue;    vb = b.totalProjectValue }
      if (sortKey === 'status')      { va = a.status;               vb = b.status }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [balances, filterStatus, search, sortKey, sortDir])

  const stats = useMemo(() => {
    const totalOutstanding   = balances.reduce((s, c) => s + c.outstanding, 0)
    const totalCollected     = balances.reduce((s, c) => s + c.totalCollected, 0)
    const totalProjectValue  = balances.reduce((s, c) => s + c.totalProjectValue, 0)
    const overdueCount       = balances.filter(c => c.status === 'overdue').length
    const pendingCount       = balances.filter(c => c.status === 'pending').length
    const paidCount          = balances.filter(c => c.status === 'paid').length
    return { totalOutstanding, totalCollected, totalProjectValue, overdueCount, pendingCount, paidCount }
  }, [balances])

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    try {
      const headers = ['Client', 'Category', 'Phone', 'Project Value', 'Collected', 'Outstanding', 'Status', 'Last Payment', 'Due Date']
      const rows = filtered.map(c => [
        c.lead.shop_name,
        c.lead.category,
        c.lead.phone,
        c.totalProjectValue,
        c.totalCollected,
        c.outstanding,
        c.status,
        fmtDate(c.lastPaymentDate),
        fmtDate(c.lastDueDate),
      ])
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      a.download = `redix_balance_${Date.now()}.csv`
      a.click()
      toast.success('Balance sheet exported')
    } catch { toast.error('Export failed') }
  }

  // ── Skeleton ────────────────────────────────────────────────────────────────
  function SkeletonRow() {
    return (
      <tr className="border-b border-white/[0.04] animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <td key={i} className="px-4 py-4">
            <div className="h-3 bg-white/[0.06] rounded" style={{ width: `${40 + (i * 11) % 50}%` }} />
          </td>
        ))}
      </tr>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="page-shell page-stack space-y-5 max-w-full">

      {/* HEADER */}
      <div className="panel-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Client Balance Sheet</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Outstanding dues, collected payments & project value per client · {balances.length} clients
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="w-9 h-9 rounded-xl border border-white/[0.08] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-white flex items-center justify-center transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 h-9 border border-white/[0.08] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] text-white text-[11px] font-bold rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Outstanding"  value={formatCurrency(stats.totalOutstanding)}  sub="unpaid balance"  color="bg-red-500/10 border border-red-500/20 text-red-400"      icon={<TrendingDown className="w-4 h-4" />} />
        <StatCard label="Total Collected"    value={formatCurrency(stats.totalCollected)}    sub="payments in"    color="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" icon={<ArrowDownLeft className="w-4 h-4" />} />
        <StatCard label="Total Project Value" value={formatCurrency(stats.totalProjectValue)} sub="total contracted" color="bg-blue-500/10 border border-blue-500/20 text-blue-400"  icon={<IndianRupee className="w-4 h-4" />} />
        <StatCard label="Overdue Clients"    value={String(stats.overdueCount)}             sub="need attention" color="bg-orange-500/10 border border-orange-500/20 text-orange-400" icon={<AlertCircle className="w-4 h-4" />} />
        <StatCard label="Pending Clients"    value={String(stats.pendingCount)}             sub="not yet paid"   color="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400" icon={<Clock className="w-4 h-4" />} />
        <StatCard label="Fully Paid"         value={String(stats.paidCount)}               sub="settled"        color="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" icon={<CheckCircle2 className="w-4 h-4" />} />
      </div>

      {/* SEARCH + FILTERS */}
      <div className="bg-[#111]/60 border border-white/[0.07] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by client name, phone or category…"
              className="w-full pl-10 pr-4 h-10 bg-white/[0.02] border border-white/[0.08] focus:border-red-500/60 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-colors"
            />
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.07] p-1 rounded-xl shrink-0 overflow-x-auto">
            {(['all', 'pending', 'partial', 'overdue', 'paid'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                  filterStatus === s ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_CFG[s as PaymentStatus].label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 h-10 px-3 rounded-xl border text-[11px] font-bold transition-all shrink-0 ${
              showFilters ? 'border-red-500/40 text-red-400 bg-red-500/5' : 'border-white/[0.08] text-zinc-400 hover:text-white bg-white/[0.02]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" /> Sort
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#111]/70 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[860px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="px-4 py-3.5"><SortBtn col="name"        sortKey={sortKey} sortDir={sortDir} onSort={handleSort} /></th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5"><SortBtn col="project"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} /></th>
                <th className="px-4 py-3.5"><SortBtn col="collected"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} /></th>
                <th className="px-4 py-3.5"><SortBtn col="outstanding" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} /></th>
                <th className="px-4 py-3.5"><SortBtn col="status"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} /></th>
                <th className="px-4 py-3.5">Last Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Wallet className="w-10 h-10 text-zinc-700" />
                          <p className="text-sm font-bold text-zinc-500">No balance records found</p>
                          <p className="text-xs text-zinc-600 max-w-xs">
                            Log revenue payments in the Revenue module to see client balances here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )
                  : filtered.map(client => {
                    const pct = client.totalProjectValue > 0
                      ? Math.round((client.totalCollected / client.totalProjectValue) * 100)
                      : 0

                    return (
                      <tr
                        key={client.lead.id}
                        onClick={() => setSelected(client)}
                        className="group hover:bg-white/[0.025] cursor-pointer transition-colors"
                      >
                        {/* Client */}
                        <td className="px-4 py-3.5 max-w-[180px]">
                          <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate">
                            {client.lead.shop_name}
                          </p>
                          {/* Mini progress bar */}
                          <div className="mt-1 h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                backgroundColor: pct >= 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] text-zinc-400">{client.lead.category || '—'}</span>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3.5 text-xs font-mono text-zinc-400 whitespace-nowrap">
                          {client.lead.phone || '—'}
                        </td>

                        {/* Project Value */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold text-zinc-200">
                            {client.totalProjectValue > 0 ? formatCurrency(client.totalProjectValue) : '—'}
                          </span>
                        </td>

                        {/* Collected */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold text-emerald-400">
                            {formatCurrency(client.totalCollected)}
                          </span>
                          {client.transactionCount > 0 && (
                            <span className="text-[9px] text-zinc-600 ml-1">({client.transactionCount})</span>
                          )}
                        </td>

                        {/* Outstanding */}
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-bold ${client.outstanding > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {formatCurrency(client.outstanding)}
                          </span>
                          {client.outstanding > 0 && client.totalProjectValue > 0 && (
                            <span className="text-[9px] text-zinc-600 ml-1">({pct}% paid)</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={client.status} />
                        </td>

                        {/* Last Payment */}
                        <td className="px-4 py-3.5 text-[10px] text-zinc-500 whitespace-nowrap">
                          {fmtDate(client.lastPaymentDate)}
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.05] bg-white/[0.005]">
            <p className="text-[10px] text-zinc-600">
              Showing <span className="text-zinc-400 font-bold">{filtered.length}</span> of{' '}
              <span className="text-zinc-400 font-bold">{balances.length}</span> clients
            </p>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="text-zinc-600">
                Total outstanding: <span className="text-red-400 font-bold">{formatCurrency(filtered.reduce((s, c) => s + c.outstanding, 0))}</span>
              </span>
              <span className="text-zinc-600">
                Total collected: <span className="text-emerald-400 font-bold">{formatCurrency(filtered.reduce((s, c) => s + c.totalCollected, 0))}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DRAWER */}
      {selected && <BalanceDrawer client={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
