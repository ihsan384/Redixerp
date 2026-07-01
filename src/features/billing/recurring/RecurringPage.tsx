import { useState } from 'react'
import { Plus, RefreshCw, Trash2, Pause, Play, MoreVertical, Calendar, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBillingStore, DEFAULT_COMPANY } from '../hooks/useBillingStore'
import type { RecurringInvoice, RecurringFrequency, InvoiceClient, InvoiceTemplateStyle } from '@/types'
import { toast } from 'sonner'

const FREQUENCY_CONFIG: Record<RecurringFrequency, { label: string; days: number; color: string }> = {
  monthly:   { label: 'Monthly',   days: 30,  color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  quarterly: { label: 'Quarterly', days: 90,  color: 'text-purple-400 bg-purple-900/20 border-purple-700/30' },
  yearly:    { label: 'Yearly',    days: 365, color: 'text-amber-400 bg-amber-900/20 border-amber-700/30' },
  custom:    { label: 'Custom',    days: 0,   color: 'text-zinc-400 bg-zinc-800/60 border-zinc-700/50' },
}

const COMMON_USES = ['Website Hosting', 'Domain Renewal', 'SEO Monthly', 'Social Media Management', 'AMC Support', 'Software Maintenance', 'Cloud Storage', 'Custom']

function RecurringFormModal({ onSave, onCancel }: {
  onSave: (data: Omit<RecurringInvoice,'id'|'created_at'|'generated_count'>) => void
  onCancel: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly')
  const [customDays, setCustomDays] = useState(30)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [projectName, setProjectName] = useState('')
  const [amount, setAmount] = useState(0)
  const [taxPercent, setTaxPercent] = useState(18)

  const nextDate = (() => {
    const d = new Date(startDate)
    const days = frequency === 'custom' ? customDays : FREQUENCY_CONFIG[frequency].days
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  })()

  const taxAmt = amount * (taxPercent/100)
  const totalAmt = amount + taxAmt

  const handleSave = () => {
    if (!name || !clientName || amount <= 0) { toast.error('Please fill in all required fields'); return }
    const client: InvoiceClient = { name: clientName, company: '', phone: clientPhone, email: clientEmail, address: '', gst_number: '', project_name: projectName }
    const item = { id: `item-1`, description: projectName || name, quantity: 1, unit_price: amount, discount_percent: 0, tax_percent: taxPercent, amount: totalAmt }
    onSave({
      name, frequency, custom_days: frequency === 'custom' ? customDays : undefined,
      start_date: startDate, end_date: endDate || undefined,
      next_generation_date: nextDate, is_active: true,
      template: {
        status: 'draft', template_style: 'modern' as InvoiceTemplateStyle,
        company: DEFAULT_COMPANY, client, items: [item],
        subtotal: amount, total_discount: 0, total_tax: taxAmt,
        additional_charges: 0, additional_charges_label: '',
        advance_paid: 0, grand_total: totalAmt, balance_due: totalAmt,
        payment_method: 'Bank Transfer', primary_color: '#e53935', secondary_color: '#1a1a1a', font_family: 'helvetica',
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onCancel} className="modal-backdrop fixed inset-0" />
      <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
        transition={{ duration:0.3, ease:[0.16,1,0.3,1] }}
        className="relative w-full max-w-md modal-panel" style={{ zIndex:51 }}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-h4 font-bold text-white">New Recurring Invoice</h2>
          <button onClick={onCancel} className="icon-btn"><Plus className="w-4 h-4 rotate-45" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Common Service Types</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_USES.map(u => (
                <button key={u} type="button" onClick={() => { if (u !== 'Custom') setName(u) }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${name===u ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300'}`}>
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Service Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monthly Website Hosting" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Billing Frequency</label>
            <div className="grid grid-cols-4 gap-2">
              {(['monthly','quarterly','yearly','custom'] as RecurringFrequency[]).map(f => (
                <button key={f} type="button" onClick={() => setFrequency(f)}
                  className={`py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${frequency===f ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300'}`}>
                  {FREQUENCY_CONFIG[f].label}
                </button>
              ))}
            </div>
            {frequency === 'custom' && (
              <div className="mt-2">
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Custom Days</label>
                <input type="number" min="1" value={customDays} onChange={e => setCustomDays(Number(e.target.value))} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-zinc-400 mb-1.5">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><label className="block text-xs font-semibold text-zinc-400 mb-1.5">End Date (optional)</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-zinc-400 mb-1.5">Client Name *</label><input type="text" value={clientName} onChange={e => setClientName(e.target.value)} /></div>
            <div><label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email</label><input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} /></div>
            <div><label className="block text-xs font-semibold text-zinc-400 mb-1.5">Phone</label><input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} /></div>
            <div><label className="block text-xs font-semibold text-zinc-400 mb-1.5">Project/Plan</label><input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-zinc-400 mb-1.5">Amount (₹) *</label><input type="number" min="0" value={amount} onChange={e => setAmount(Number(e.target.value))} /></div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">GST %</label>
              <select value={taxPercent} onChange={e => setTaxPercent(Number(e.target.value))}>
                {[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
          </div>

          {amount > 0 && (
            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Base Amount</span><span className="text-white font-semibold">₹{amount.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">GST ({taxPercent}%)</span><span className="text-white font-semibold">₹{taxAmt.toLocaleString('en-IN',{maximumFractionDigits:0})}</span></div>
              <div className="flex justify-between pt-2 border-t border-white/[0.06] mt-2"><span className="text-white font-bold">Per Invoice</span><span className="font-bold text-white">₹{totalAmt.toLocaleString('en-IN',{maximumFractionDigits:0})}</span></div>
              <p className="text-xs text-zinc-500 mt-2">Next generation: {nextDate}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-white/[0.06]">
          <button onClick={onCancel} className="btn-ghost flex-1 h-10">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1 h-10">Create Recurring</button>
        </div>
      </motion.div>
    </div>
  )
}

export function RecurringPage() {
  const { recurring, createRecurring, updateRecurring, deleteRecurring } = useBillingStore()
  const [showForm, setShowForm] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const handleSave = (data: Omit<RecurringInvoice,'id'|'created_at'|'generated_count'>) => {
    createRecurring(data)
    toast.success('Recurring invoice created!')
    setShowForm(false)
  }

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">{recurring.length} recurring invoice{recurring.length !== 1 ? 's' : ''}</p>
          <button onClick={() => setShowForm(true)} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> New Recurring
          </button>
        </div>

        {recurring.length === 0 ? (
          <div className="empty-state">
            <RefreshCw className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-white font-semibold">No recurring invoices</p>
            <p className="text-zinc-500 text-sm mt-1">Automate invoices for hosting, maintenance, SEO & more</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recurring.map((rec, i) => {
              const cfg = FREQUENCY_CONFIG[rec.frequency]
              const daysUntilNext = Math.ceil((new Date(rec.next_generation_date).getTime() - Date.now()) / (1000*60*60*24))
              return (
                <motion.div key={rec.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  className="surface-card flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${rec.is_active ? cfg.color : 'text-zinc-600 bg-zinc-800/60 border-zinc-700/50'}`}>
                    <RefreshCw className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm truncate">{rec.name}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>{cfg.label}</span>
                      {!rec.is_active && <span className="text-xs text-zinc-500 font-semibold">(Paused)</span>}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Client: {rec.template.client.name} · {rec.template.client.email}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-white">{fmt(rec.template.grand_total)}</p>
                    <p className="text-xs text-zinc-500">per invoice</p>
                  </div>

                  <div className="text-right shrink-0 min-w-[120px]">
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      <span className="text-zinc-400">Next:</span>
                      <span className={`font-semibold ${daysUntilNext <= 7 ? 'text-amber-400' : 'text-white'}`}>
                        {rec.next_generation_date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs mt-0.5">
                      <Zap className="w-3 h-3 text-zinc-500" />
                      <span className="text-zinc-500">Generated: {rec.generated_count}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { updateRecurring(rec.id, { is_active: !rec.is_active }); toast.success(rec.is_active ? 'Paused' : 'Activated') }}
                      className={`icon-btn !w-8 !h-8 ${rec.is_active ? 'hover:text-amber-400' : 'hover:text-green-400'}`}
                      title={rec.is_active ? 'Pause' : 'Activate'}
                    >
                      {rec.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === rec.id ? null : rec.id)} className="icon-btn !w-8 !h-8">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      <AnimatePresence>
                        {openMenu === rec.id && (
                          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                            className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                            <button onClick={() => { deleteRecurring(rec.id); setOpenMenu(null); toast.success('Deleted') }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && <RecurringFormModal onSave={handleSave} onCancel={() => setShowForm(false)} />}
      </AnimatePresence>
      {openMenu && <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />}
    </>
  )
}
