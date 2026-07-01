import { useState, useMemo } from 'react'
import { Plus, Search, Filter, FileText, MoreVertical, Download, Copy, CheckCircle2, Send, Trash2, Eye, Mail, MessageCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBillingStore } from '../hooks/useBillingStore'
import { InvoiceForm } from './InvoiceForm'
import { InvoiceTimeline } from '../components/InvoiceTimeline'
import { generateInvoicePDF } from '../utils/pdfGenerator'
import type { BillingInvoice, BillingInvoiceStatus } from '@/types'
import { toast } from 'sonner'

const STATUS_CONFIG: Record<BillingInvoiceStatus, { label: string; class: string; dot: string }> = {
  draft:          { label: 'Draft',          class: 'text-zinc-400 bg-zinc-800/60 border-zinc-700/50',        dot: 'bg-zinc-500'   },
  sent:           { label: 'Sent',           class: 'text-blue-400 bg-blue-900/30 border-blue-700/30',         dot: 'bg-blue-400'   },
  viewed:         { label: 'Viewed',         class: 'text-purple-400 bg-purple-900/30 border-purple-700/30',   dot: 'bg-purple-400' },
  paid:           { label: 'Paid',           class: 'text-green-400 bg-green-900/30 border-green-700/30',      dot: 'bg-green-400'  },
  partially_paid: { label: 'Partially Paid', class: 'text-orange-400 bg-orange-900/30 border-orange-700/30',   dot: 'bg-orange-400' },
  overdue:        { label: 'Overdue',        class: 'text-red-400 bg-red-900/30 border-red-700/30',            dot: 'bg-red-400'    },
  cancelled:      { label: 'Cancelled',      class: 'text-zinc-500 bg-zinc-900/60 border-zinc-800/50',         dot: 'bg-zinc-600'   },
}

function StatusPill({ status }: { status: BillingInvoiceStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.class}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

const ALL_STATUSES: (BillingInvoiceStatus | 'all')[] = ['all', 'draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled']

export function InvoicesPage() {
  const { invoices, createInvoice, updateInvoice, deleteInvoice, duplicateInvoice, markInvoicePaid } = useBillingStore()
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<BillingInvoice | undefined>()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<BillingInvoiceStatus | 'all'>('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [viewTimeline, setViewTimeline] = useState<string | null>(null)

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (filterStatus !== 'all' && inv.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        return inv.invoice_number.toLowerCase().includes(q) ||
          inv.client.name.toLowerCase().includes(q) ||
          inv.client.company.toLowerCase().includes(q) ||
          inv.client.project_name.toLowerCase().includes(q)
      }
      return true
    })
  }, [invoices, search, filterStatus])

  const handleSave = (data: BillingInvoice) => {
    if (editingInvoice) {
      updateInvoice(editingInvoice.id, data)
      toast.success('Invoice updated!')
    } else {
      createInvoice(data)
      toast.success('Invoice created!')
    }
    setShowForm(false)
    setEditingInvoice(undefined)
  }

  const handleSendEmail = (inv: BillingInvoice) => {
    window.open(`mailto:${inv.client.email}?subject=Invoice ${inv.invoice_number} from ${inv.company.name}&body=Dear ${inv.client.name},%0D%0A%0D%0APlease find attached your invoice ${inv.invoice_number} for ₹${inv.grand_total.toLocaleString('en-IN')}.%0D%0A%0D%0ARegards,%0D%0A${inv.company.name}`)
    toast.success('Email client opened')
  }

  const handleSendWhatsApp = (inv: BillingInvoice) => {
    const msg = encodeURIComponent(`Hi ${inv.client.name}, your invoice *${inv.invoice_number}* for *₹${inv.grand_total.toLocaleString('en-IN')}* is ready. Due: ${inv.due_date}. Please let me know if you have any questions.`)
    window.open(`https://wa.me/${inv.client.phone?.replace(/\D/g,'')}?text=${msg}`)
  }

  const handleVoid = (id: string) => {
    updateInvoice(id, { status: 'cancelled' })
    toast.success('Invoice voided')
    setOpenMenu(null)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search invoices..." className="!pl-9 w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-x-auto max-w-xs">
              {ALL_STATUSES.slice(0,5).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 h-7 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filterStatus===s ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {s === 'all' ? 'All' : STATUS_CONFIG[s as BillingInvoiceStatus].label}
                </button>
              ))}
            </div>
            <button onClick={() => { setEditingInvoice(undefined); setShowForm(true) }} className="btn-primary gap-2">
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <FileText className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-white font-semibold">No invoices found</p>
            <p className="text-zinc-500 text-sm mt-1">Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="table-shell">
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th className="text-left">Invoice</th>
                    <th className="text-left">Client</th>
                    <th className="text-left">Project</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Balance</th>
                    <th className="text-left">Due Date</th>
                    <th className="text-left">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((inv, i) => (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <td>
                          <div>
                            <p className="font-semibold text-white text-sm">{inv.invoice_number}</p>
                            <p className="text-xs text-zinc-500">{inv.invoice_date}</p>
                          </div>
                        </td>
                        <td>
                          <div>
                            <p className="font-semibold text-white text-sm">{inv.client.name}</p>
                            <p className="text-xs text-zinc-500">{inv.client.company}</p>
                          </div>
                        </td>
                        <td className="text-sm text-zinc-400 max-w-[160px] truncate">{inv.client.project_name}</td>
                        <td className="text-right font-semibold text-white">{fmt(inv.grand_total)}</td>
                        <td className="text-right">
                          <span className={inv.balance_due > 0 ? 'font-bold text-red-400' : 'font-bold text-green-400'}>
                            {fmt(inv.balance_due)}
                          </span>
                        </td>
                        <td className="text-sm text-zinc-400">{inv.due_date}</td>
                        <td><StatusPill status={inv.status} /></td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setViewTimeline(viewTimeline === inv.id ? null : inv.id)} className="icon-btn !w-8 !h-8" title="Timeline">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => generateInvoicePDF(inv)} className="icon-btn !w-8 !h-8" title="Download PDF">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <div className="relative">
                              <button onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)} className="icon-btn !w-8 !h-8">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                              <AnimatePresence>
                                {openMenu === inv.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a1a] border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden z-50"
                                  >
                                    {[
                                      { icon: FileText, label: 'Edit', action: () => { setEditingInvoice(inv); setShowForm(true); setOpenMenu(null) }},
                                      { icon: Copy, label: 'Duplicate', action: () => { duplicateInvoice(inv.id); setOpenMenu(null) }},
                                      { icon: Mail, label: 'Send Email', action: () => { handleSendEmail(inv); setOpenMenu(null) }},
                                      { icon: MessageCircle, label: 'Send WhatsApp', action: () => { handleSendWhatsApp(inv); setOpenMenu(null) }},
                                      { icon: CheckCircle2, label: 'Mark Paid', action: () => { markInvoicePaid(inv.id); setOpenMenu(null) }},
                                      { icon: Send, label: 'Mark Sent', action: () => { updateInvoice(inv.id, { status: 'sent' }); setOpenMenu(null) }},
                                      { icon: AlertTriangle, label: 'Void Invoice', action: () => handleVoid(inv.id) },
                                      { icon: Trash2, label: 'Delete', action: () => { deleteInvoice(inv.id); setOpenMenu(null); toast.success('Invoice deleted') }, danger: true },
                                    ].map(item => (
                                      <button key={item.label} onClick={item.action}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${(item as any).danger ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-300 hover:bg-white/[0.05]'}`}>
                                        <item.icon className="w-3.5 h-3.5" /> {item.label}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Timeline Panel */}
        <AnimatePresence>
          {viewTimeline && (() => {
            const inv = invoices.find(i => i.id === viewTimeline)
            if (!inv) return null
            return (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="surface-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-sm">Invoice Timeline – {inv.invoice_number}</h3>
                  <button onClick={() => setViewTimeline(null)} className="text-zinc-500 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
                </div>
                <InvoiceTimeline events={inv.timeline_events} />
              </motion.div>
            )
          })()}
        </AnimatePresence>
      </div>

      {/* Invoice Form Modal */}
      <AnimatePresence>
        {showForm && (
          <InvoiceForm
            invoice={editingInvoice}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingInvoice(undefined) }}
          />
        )}
      </AnimatePresence>

      {/* Close menu on outside click */}
      {openMenu && <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />}
    </>
  )
}
