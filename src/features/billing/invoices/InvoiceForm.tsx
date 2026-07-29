import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2, ChevronDown, Building2, User, FileText, CreditCard, Settings2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BillingInvoice, InvoiceItem, InvoiceCompany, InvoiceClient, BillingInvoiceStatus, InvoiceTemplateStyle } from '@/types'
import { supabase } from '@/lib/supabase'
import { DEFAULT_COMPANY } from '../hooks/useBillingStore'
import { toast } from 'sonner'

const TAX_RATES = [0, 5, 12, 18, 28]
const DISCOUNT_RATES = [0, 5, 10, 15, 20, 25]

function genItemId() { return `item-${Date.now()}-${Math.random().toString(36).substr(2,6)}` }

function calcItem(item: InvoiceItem): InvoiceItem {
  const base = item.quantity * item.unit_price
  const discountAmt = base * (item.discount_percent / 100)
  const afterDiscount = base - discountAmt
  const taxAmt = afterDiscount * (item.tax_percent / 100)
  return { ...item, amount: Math.round((afterDiscount + taxAmt) * 100) / 100 }
}

function calcTotals(items: InvoiceItem[], additionalCharges: number, advancePaid: number) {
  const subtotal = items.reduce((s, it) => {
    const base = it.quantity * it.unit_price
    return s + base
  }, 0)
  const totalDiscount = items.reduce((s, it) => {
    const base = it.quantity * it.unit_price
    return s + base * (it.discount_percent / 100)
  }, 0)
  const totalTax = items.reduce((s, it) => {
    const base = it.quantity * it.unit_price
    const afterDisc = base - base * (it.discount_percent / 100)
    return s + afterDisc * (it.tax_percent / 100)
  }, 0)
  const grandTotal = subtotal - totalDiscount + totalTax + additionalCharges
  const balanceDue = grandTotal - advancePaid
  return { subtotal, totalDiscount, totalTax, grandTotal, balanceDue }
}

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card']

interface InvoiceFormProps {
  invoice?: BillingInvoice
  onSave: (invoice: BillingInvoice) => void
  onCancel: () => void
}

type Section = 'invoice' | 'company' | 'client' | 'services' | 'summary' | 'payment' | 'settings'

const SECTIONS: { id: Section; label: string; icon: typeof FileText }[] = [
  { id: 'invoice',  label: 'Invoice Info',    icon: FileText    },
  { id: 'company',  label: 'Company Info',    icon: Building2   },
  { id: 'client',   label: 'Client Info',     icon: User        },
  { id: 'services', label: 'Services',        icon: Plus        },
  { id: 'summary',  label: 'Summary',         icon: CreditCard  },
  { id: 'payment',  label: 'Payment',         icon: CreditCard  },
  { id: 'settings', label: 'Template',        icon: Settings2   },
]

const emptyItem = (): InvoiceItem => ({
  id: genItemId(), description: '', quantity: 1, unit_price: 0,
  discount_percent: 0, tax_percent: 18, amount: 0
})

const emptyCompany = (): InvoiceCompany => ({ ...DEFAULT_COMPANY })

const emptyClient = (): InvoiceClient => ({
  name: '', company: '', phone: '', email: '', address: '', gst_number: '', project_name: ''
})

export function InvoiceForm({ invoice, onSave, onCancel }: InvoiceFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const dueDateDefault = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]

  const [activeSection, setActiveSection] = useState<Section>('invoice')
  const [status, setStatus] = useState<BillingInvoiceStatus>(invoice?.status ?? 'draft')
  const [invoiceDate, setInvoiceDate] = useState(invoice?.invoice_date ?? today)
  const [dueDate, setDueDate] = useState(invoice?.due_date ?? dueDateDefault)
  const [company, setCompany] = useState<InvoiceCompany>(invoice?.company ?? emptyCompany())
  const [client, setClient] = useState<InvoiceClient>(invoice?.client ?? emptyClient())
  const [items, setItems] = useState<InvoiceItem[]>(invoice?.items ?? [emptyItem()])
  const [additionalCharges, setAdditionalCharges] = useState(invoice?.additional_charges ?? 0)
  const [additionalChargesLabel, setAdditionalChargesLabel] = useState(invoice?.additional_charges_label ?? 'Additional Charges')
  const [advancePaid, setAdvancePaid] = useState(invoice?.advance_paid ?? 0)
  const [paymentMethod, setPaymentMethod] = useState(invoice?.payment_method ?? 'Bank Transfer')
  const [notes, setNotes] = useState(invoice?.notes ?? '')
  const [terms, setTerms] = useState(invoice?.terms ?? 'Payment is due within 30 days of invoice date.\nLate payments are subject to a 1.5% monthly interest charge.')
  const [templateStyle, setTemplateStyle] = useState<InvoiceTemplateStyle>(invoice?.template_style ?? 'modern')
  const [primaryColor, setPrimaryColor] = useState(invoice?.primary_color ?? '#e53935')
  const [leads, setLeads] = useState<{ id: string; shop_name: string; phone: string; address?: string }[]>([])

  const totals = calcTotals(items, additionalCharges, advancePaid)

  useEffect(() => {
    supabase.from('leads').select('id,shop_name,phone,address').eq('status','converted').limit(100)
      .then(({ data }: { data: any }) => { if (data) setLeads(data) })
  }, [])

  const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: number | string) => {
    setItems(prev => prev.map(it => it.id === id ? calcItem({ ...it, [field]: value }) : it))
  }, [])

  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id))

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    setClient(prev => ({ ...prev, name: lead.shop_name, phone: lead.phone, address: lead.address ?? '', lead_id: leadId }))
  }

  const handleSave = () => {
    if (!client.name) { toast.error('Please enter client name'); return }
    if (items.length === 0) { toast.error('Please add at least one service'); return }

    const data: Omit<BillingInvoice, 'id'|'invoice_number'|'created_at'|'updated_at'|'timeline_events'> = {
      invoice_date: invoiceDate, due_date: dueDate, status, template_style: templateStyle,
      company, client, items,
      subtotal: totals.subtotal, total_discount: totals.totalDiscount, total_tax: totals.totalTax,
      additional_charges: additionalCharges, additional_charges_label: additionalChargesLabel,
      advance_paid: advancePaid, grand_total: totals.grandTotal, balance_due: totals.balanceDue,
      payment_method: paymentMethod, notes, terms, primary_color: primaryColor, secondary_color: '#1a1a1a', font_family: 'helvetica',
    }
    onSave(data as BillingInvoice)
  }

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const TEMPLATE_STYLES: { id: InvoiceTemplateStyle; label: string; color: string }[] = [
    { id: 'modern',       label: 'Modern',       color: '#e53935' },
    { id: 'minimal',      label: 'Minimal',      color: '#111111' },
    { id: 'corporate',    label: 'Corporate',    color: '#1e40af' },
    { id: 'premium_dark', label: 'Premium Dark', color: '#f59e0b' },
    { id: 'agency',       label: 'Agency',       color: '#7c3aed' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div onClick={onCancel} className="modal-backdrop fixed inset-0" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}
        className="relative w-full max-w-5xl"
        style={{ zIndex: 51 }}
      >
        <div className="modal-panel">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
            <div>
              <h2 className="text-h4 font-bold text-white">{invoice ? 'Edit Invoice' : 'Create Invoice'}</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Fill in the sections below to generate a professional invoice</p>
            </div>
            <button onClick={onCancel} className="icon-btn"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex min-h-[600px]">
            {/* Section Nav */}
            <div className="w-44 shrink-0 border-r border-white/[0.06] p-3 flex flex-col gap-0.5">
              {SECTIONS.map(sec => {
                const Icon = sec.icon
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all text-left ${
                      activeSection === sec.id ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {sec.label}
                  </button>
                )
              })}
            </div>

            {/* Section Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >

                  {/* Invoice Info */}
                  {activeSection === 'invoice' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Invoice Date</label>
                          <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Due Date</label>
                          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Status</label>
                        <div className="flex flex-wrap gap-2">
                          {(['draft','sent','viewed','paid','partially_paid','overdue','cancelled'] as BillingInvoiceStatus[]).map(s => (
                            <button key={s} type="button" onClick={() => setStatus(s)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${status === s ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300'}`}>
                              {s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Company Info */}
                  {activeSection === 'company' && (
                    <div className="grid grid-cols-2 gap-4">
                      {([
                        ['name','Company Name'],['address','Address'],['gst_number','GST Number'],
                        ['phone','Phone'],['email','Email'],['website','Website'],
                        ['bank_name','Bank Name'],['bank_account','Account Number'],['bank_ifsc','IFSC Code'],['upi_id','UPI ID'],
                      ] as [keyof InvoiceCompany, string][]).map(([key, lbl]) => (
                        <div key={key} className={key === 'address' ? 'col-span-2' : ''}>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{lbl}</label>
                          {key === 'address'
                            ? <textarea rows={2} value={(company[key] as string) ?? ''} onChange={e => setCompany(p => ({...p,[key]:e.target.value}))} placeholder={lbl} />
                            : <input type="text" value={(company[key] as string) ?? ''} onChange={e => setCompany(p => ({...p,[key]:e.target.value}))} placeholder={lbl} />
                          }
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Client Info */}
                  {activeSection === 'client' && (
                    <>
                      {leads.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Auto-load from Clients</label>
                          <div className="relative">
                            <select onChange={e => handleLeadSelect(e.target.value)} className="w-full pr-10">
                              <option value="">— Select a client —</option>
                              {leads.map(l => <option key={l.id} value={l.id}>{l.shop_name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {([
                          ['name','Client Name'],['company','Company'],['phone','Phone'],['email','Email'],
                          ['gst_number','GST Number'],['project_name','Project Name'],
                        ] as [keyof InvoiceClient, string][]).map(([key, lbl]) => (
                          <div key={key}>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{lbl}</label>
                            <input type="text" value={client[key] as string} onChange={e => setClient(p => ({...p,[key]:e.target.value}))} placeholder={lbl} />
                          </div>
                        ))}
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Address</label>
                          <textarea rows={2} value={client.address} onChange={e => setClient(p => ({...p,address:e.target.value}))} placeholder="Client address" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Services */}
                  {activeSection === 'services' && (
                    <div className="space-y-3">
                      <div className="hidden lg:grid grid-cols-[1fr_80px_110px_90px_80px_110px_36px] gap-2 px-3">
                        {['Description','Qty','Unit Price','Disc%','Tax%','Amount',''].map(h => (
                          <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">{h}</span>
                        ))}
                      </div>
                      {items.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-[1fr_80px_110px_90px_80px_110px_36px] gap-2 items-center p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl"
                        >
                          <input
                            type="text" value={item.description} placeholder={`Service ${idx+1}`}
                            onChange={e => updateItem(item.id, 'description', e.target.value)}
                            className="!min-h-[36px] !h-[36px] !rounded-lg !text-sm"
                          />
                          <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id,'quantity',Number(e.target.value))} className="!min-h-[36px] !h-[36px] !rounded-lg !text-sm text-center" />
                          <input type="number" min="0" value={item.unit_price} onChange={e => updateItem(item.id,'unit_price',Number(e.target.value))} className="!min-h-[36px] !h-[36px] !rounded-lg !text-sm" />
                          <select value={item.discount_percent} onChange={e => updateItem(item.id,'discount_percent',Number(e.target.value))} className="!min-h-[36px] !h-[36px] !rounded-lg !text-sm">
                            {DISCOUNT_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                          <select value={item.tax_percent} onChange={e => updateItem(item.id,'tax_percent',Number(e.target.value))} className="!min-h-[36px] !h-[36px] !rounded-lg !text-sm">
                            {TAX_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                          <span className="text-sm font-semibold text-white text-right">{fmt(item.amount)}</span>
                          <button type="button" onClick={() => removeItem(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                      <button type="button" onClick={addItem} className="btn-secondary w-full h-10 gap-2">
                        <Plus className="w-4 h-4" /> Add Service / Item
                      </button>
                    </div>
                  )}

                  {/* Summary */}
                  {activeSection === 'summary' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-3">
                        {[
                          { label: 'Subtotal',      value: totals.subtotal    },
                          { label: 'Total Discount',value: totals.totalDiscount, neg: true },
                          { label: 'Total Tax',     value: totals.totalTax    },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between text-sm">
                            <span className="text-zinc-400">{row.label}</span>
                            <span className={`font-semibold ${row.neg ? 'text-green-400' : 'text-white'}`}>
                              {row.neg ? '-' : ''}{fmt(row.value)}
                            </span>
                          </div>
                        ))}

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Additional Charges Label</label>
                            <input type="text" value={additionalChargesLabel} onChange={e => setAdditionalChargesLabel(e.target.value)} className="!min-h-[36px] !h-[36px] !rounded-lg" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Amount</label>
                            <input type="number" min="0" value={additionalCharges} onChange={e => setAdditionalCharges(Number(e.target.value))} className="!min-h-[36px] !h-[36px] !rounded-lg" />
                          </div>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">Additional Charges</span>
                          <span className="font-semibold text-white">{fmt(additionalCharges)}</span>
                        </div>

                        <div className="pt-2 border-t border-white/[0.06]">
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Advance Paid</label>
                          <input type="number" min="0" value={advancePaid} onChange={e => setAdvancePaid(Number(e.target.value))} className="!min-h-[36px] !h-[36px] !rounded-lg" />
                        </div>

                        <div className="flex justify-between pt-2 border-t border-white/[0.06]">
                          <span className="text-white font-bold">Grand Total</span>
                          <span className="text-xl font-bold text-white">{fmt(totals.grandTotal)}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <span className="text-red-400 font-bold">Balance Due</span>
                          <span className="text-xl font-bold text-red-400">{fmt(totals.balanceDue)}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Notes</label>
                        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes to show on invoice..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Terms & Conditions</label>
                        <textarea rows={4} value={terms} onChange={e => setTerms(e.target.value)} placeholder="Payment terms, late fee policy..." />
                      </div>
                    </div>
                  )}

                  {/* Payment */}
                  {activeSection === 'payment' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-2">Payment Method</label>
                        <div className="flex flex-wrap gap-2">
                          {PAYMENT_METHODS.map(m => (
                            <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${paymentMethod === m ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300'}`}>
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-3">
                        <h3 className="text-sm font-bold text-white">Payment Details Shown on Invoice</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            ['bank_name','Bank Name'],['bank_account','Account Number'],
                            ['bank_ifsc','IFSC Code'],['upi_id','UPI ID'],
                          ].map(([key,lbl]) => (
                            <div key={key}>
                              <label className="block text-xs text-zinc-500 mb-1">{lbl}</label>
                              <input type="text" value={(company as unknown as Record<string,string>)[key] ?? ''} onChange={e => setCompany(p => ({...p,[key]:e.target.value}))} placeholder={lbl} className="!min-h-[36px] !h-[36px] !rounded-lg" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Template Settings */}
                  {activeSection === 'settings' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-2">Invoice Template</label>
                        <div className="grid grid-cols-5 gap-2">
                          {TEMPLATE_STYLES.map(tpl => (
                            <button key={tpl.id} type="button" onClick={() => { setTemplateStyle(tpl.id); setPrimaryColor(tpl.color) }}
                              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${templateStyle === tpl.id ? 'border-white/30 bg-white/[0.08]' : 'border-white/[0.06] hover:border-white/15'}`}
                            >
                              <div className="w-8 h-8 rounded-lg" style={{ background: tpl.color }} />
                              <span className="text-xs font-semibold text-zinc-300 text-center">{tpl.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Primary Color</label>
                        <div className="flex items-center gap-3">
                          <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                            className="!w-12 !h-10 !min-h-[40px] !p-1 !rounded-xl cursor-pointer" />
                          <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="!h-10 !min-h-[40px] w-32" />
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 p-6 border-t border-white/[0.06]">
            <div className="text-sm text-zinc-500">
              Grand Total: <span className="text-white font-bold">{fmt(totals.grandTotal)}</span>
              {' '} · Balance: <span className="text-red-400 font-bold">{fmt(totals.balanceDue)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-ghost h-10 px-4">Cancel</button>
              <button onClick={handleSave} className="btn-primary h-10 px-6">
                {invoice ? 'Update Invoice' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
