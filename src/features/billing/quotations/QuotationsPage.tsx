import { useState, useMemo } from 'react'
import { Plus, Quote, Trash2, ArrowRight, CheckCircle2, XCircle, MoreVertical, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBillingStore, DEFAULT_COMPANY } from '../hooks/useBillingStore'
import type { Quotation, QuotationStatus, InvoiceItem, InvoiceClient, InvoiceTemplateStyle } from '@/types'
import { toast } from 'sonner'
import { generateInvoicePDF } from '../utils/pdfGenerator'

const STATUS_CONFIG: Record<QuotationStatus, { label: string; class: string }> = {
  draft:    { label: 'Draft',    class: 'text-zinc-400 bg-zinc-800/60 border-zinc-700/50' },
  sent:     { label: 'Sent',     class: 'text-blue-400 bg-blue-900/30 border-blue-700/30' },
  accepted: { label: 'Accepted', class: 'text-green-400 bg-green-900/30 border-green-700/30' },
  rejected: { label: 'Rejected', class: 'text-red-400 bg-red-900/30 border-red-700/30' },
  expired:  { label: 'Expired',  class: 'text-orange-400 bg-orange-900/30 border-orange-700/30' },
}

function genItemId() { return `item-${Date.now()}-${Math.random().toString(36).substr(2,6)}` }
function emptyItem(): InvoiceItem { return { id: genItemId(), description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 18, amount: 0 } }
function calcItem(item: InvoiceItem): InvoiceItem {
  const base = item.quantity * item.unit_price
  const d = base * (item.discount_percent/100)
  const t = (base-d) * (item.tax_percent/100)
  return { ...item, amount: Math.round((base-d+t)*100)/100 }
}

function QuotationFormModal({ quotation, onSave, onCancel }: {
  quotation?: Quotation
  onSave: (data: Omit<Quotation,'id'|'quotation_number'|'created_at'|'updated_at'>) => void
  onCancel: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const validDefault = new Date(Date.now()+30*24*60*60*1000).toISOString().split('T')[0]

  const [quotDate, setQuotDate] = useState(quotation?.quotation_date ?? today)
  const [validUntil, setValidUntil] = useState(quotation?.valid_until ?? validDefault)
  const [client, setClient] = useState<InvoiceClient>(quotation?.client ?? { name:'', company:'', phone:'', email:'', address:'', gst_number:'', project_name:'' })
  const [items, setItems] = useState<InvoiceItem[]>(quotation?.items ?? [emptyItem()])
  const [additionalCharges, setAdditionalCharges] = useState(quotation?.additional_charges ?? 0)
  const [notes, setNotes] = useState(quotation?.notes ?? '')

  const updateItem = (id: string, field: keyof InvoiceItem, value: number|string) => {
    setItems(prev => prev.map(it => it.id === id ? calcItem({...it,[field]:value}) : it))
  }
  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id))

  const subtotal = items.reduce((s,it)=>s+it.quantity*it.unit_price, 0)
  const totalDiscount = items.reduce((s,it)=>s+it.quantity*it.unit_price*(it.discount_percent/100), 0)
  const totalTax = items.reduce((s,it)=>{const b=it.quantity*it.unit_price; return s+(b-b*(it.discount_percent/100))*(it.tax_percent/100)}, 0)
  const grandTotal = subtotal - totalDiscount + totalTax + additionalCharges

  const fmt = (n:number) => `₹${n.toLocaleString('en-IN',{maximumFractionDigits:0})}`

  const handleSave = () => {
    if (!client.name) { toast.error('Client name is required'); return }
    onSave({ quotation_date: quotDate, valid_until: validUntil, status: 'draft', template_style: 'modern' as InvoiceTemplateStyle, company: DEFAULT_COMPANY, client, items, subtotal, total_discount: totalDiscount, total_tax: totalTax, additional_charges: additionalCharges, additional_charges_label: 'Additional Charges', grand_total: grandTotal, notes, primary_color: '#e53935' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div onClick={onCancel} className="modal-backdrop fixed inset-0" />
      <motion.div initial={{ opacity:0, scale:0.96, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0 }}
        transition={{ duration:0.3, ease:[0.16,1,0.3,1] }} className="relative w-full max-w-3xl" style={{ zIndex:51 }}>
        <div className="modal-panel">
          <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
            <h2 className="text-h4 font-bold text-white">{quotation ? 'Edit Quotation' : 'Create Quotation'}</h2>
            <button onClick={onCancel} className="icon-btn"><Plus className="w-4 h-4 rotate-45" /></button>
          </div>

          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-zinc-400 mb-1.5">Quotation Date</label><input type="date" value={quotDate} onChange={e => setQuotDate(e.target.value)} /></div>
              <div><label className="block text-xs font-semibold text-zinc-400 mb-1.5">Valid Until</label><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} /></div>
              {(['name','company','phone','email'] as const).map(f => (
                <div key={f}><label className="block text-xs font-semibold text-zinc-400 mb-1.5 capitalize">{f === 'name' ? 'Client Name' : f}</label>
                  <input type="text" value={client[f]} onChange={e => setClient(p=>({...p,[f]:e.target.value}))} />
                </div>
              ))}
              <div className="col-span-2"><label className="block text-xs font-semibold text-zinc-400 mb-1.5">Project Name</label>
                <input type="text" value={client.project_name} onChange={e => setClient(p=>({...p,project_name:e.target.value}))} />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white">Services</h3>
              {items.map(item => (
                <div key={item.id} className="grid grid-cols-[1fr_70px_100px_70px_70px_90px_32px] gap-2 items-center p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <input type="text" value={item.description} placeholder="Description" onChange={e => updateItem(item.id,'description',e.target.value)} className="!min-h-[36px] !h-[36px] !rounded-lg !text-sm" />
                  <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id,'quantity',Number(e.target.value))} className="!min-h-[36px] !h-[36px] !rounded-lg !text-sm text-center" />
                  <input type="number" min="0" value={item.unit_price} onChange={e => updateItem(item.id,'unit_price',Number(e.target.value))} className="!min-h-[36px] !h-[36px] !rounded-lg !text-sm" />
                  <select value={item.discount_percent} onChange={e => updateItem(item.id,'discount_percent',Number(e.target.value))} className="!min-h-[36px] !h-[36px] !rounded-lg !text-sm">
                    {[0,5,10,15,20].map(r=><option key={r} value={r}>{r}%</option>)}
                  </select>
                  <select value={item.tax_percent} onChange={e => updateItem(item.id,'tax_percent',Number(e.target.value))} className="!min-h-[36px] !h-[36px] !rounded-lg !text-sm">
                    {[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}
                  </select>
                  <span className="text-sm font-semibold text-white text-right">{fmt(item.amount)}</span>
                  <button type="button" onClick={() => removeItem(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addItem} className="btn-secondary w-full h-9 gap-2 text-sm">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-2">
              <div className="flex justify-between text-sm"><span className="text-zinc-400">Subtotal</span><span className="text-white font-semibold">{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-400">Discount</span><span className="text-green-400 font-semibold">-{fmt(totalDiscount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-400">Tax</span><span className="text-white font-semibold">{fmt(totalTax)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-400">Additional</span>
                <input type="number" min="0" value={additionalCharges} onChange={e => setAdditionalCharges(Number(e.target.value))} className="!h-7 !min-h-[28px] w-28 text-right !text-sm !rounded-lg" />
              </div>
              <div className="flex justify-between pt-2 border-t border-white/[0.06]"><span className="text-white font-bold">Grand Total</span><span className="text-xl font-bold text-white">{fmt(grandTotal)}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Notes</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." />
            </div>
          </div>

          <div className="flex items-center justify-between p-6 border-t border-white/[0.06]">
            <span className="text-sm text-zinc-500">Grand Total: <span className="text-white font-bold">{fmt(grandTotal)}</span></span>
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-ghost h-10 px-4">Cancel</button>
              <button onClick={handleSave} className="btn-primary h-10 px-6">{quotation ? 'Update' : 'Create Quotation'}</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function QuotationsPage() {
  const { quotations, createQuotation, updateQuotation, deleteQuotation, convertQuotationToInvoice } = useBillingStore()
  const [showForm, setShowForm] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | undefined>()
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const handleSave = (data: Omit<Quotation,'id'|'quotation_number'|'created_at'|'updated_at'>) => {
    if (editingQuotation) { updateQuotation(editingQuotation.id, data); toast.success('Quotation updated!') }
    else { createQuotation(data); toast.success('Quotation created!') }
    setShowForm(false); setEditingQuotation(undefined)
  }

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">{quotations.length} quotation{quotations.length !== 1 ? 's' : ''}</p>
          <button onClick={() => { setEditingQuotation(undefined); setShowForm(true) }} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> New Quotation
          </button>
        </div>

        {quotations.length === 0 ? (
          <div className="empty-state">
            <Quote className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-white font-semibold">No quotations yet</p>
            <p className="text-zinc-500 text-sm mt-1">Create quotations before converting to invoices</p>
          </div>
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Quotation</th>
                  <th className="text-left">Client</th>
                  <th className="text-right">Total</th>
                  <th className="text-left">Valid Until</th>
                  <th className="text-left">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q, i) => {
                  const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.draft
                  return (
                    <motion.tr key={q.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}>
                      <td>
                        <p className="font-semibold text-white text-sm">{q.quotation_number}</p>
                        <p className="text-xs text-zinc-500">{q.quotation_date}</p>
                      </td>
                      <td>
                        <p className="font-semibold text-white text-sm">{q.client.name}</p>
                        <p className="text-xs text-zinc-500">{q.client.project_name}</p>
                      </td>
                      <td className="text-right font-bold text-white">{fmt(q.grand_total)}</td>
                      <td className="text-sm text-zinc-400">{q.valid_until}</td>
                      <td><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.class}`}>{cfg.label}</span></td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => convertQuotationToInvoice(q.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-colors"
                            title="Convert to Invoice"
                          >
                            <ArrowRight className="w-3 h-3" /> Invoice
                          </button>
                          <div className="relative">
                            <button onClick={() => setOpenMenu(openMenu === q.id ? null : q.id)} className="icon-btn !w-8 !h-8">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            <AnimatePresence>
                              {openMenu === q.id && (
                                <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                                  className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                  <button onClick={() => { setEditingQuotation(q); setShowForm(true); setOpenMenu(null) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05]">Edit</button>
                                  <button onClick={() => { updateQuotation(q.id, { status: 'sent' }); setOpenMenu(null); toast.success('Marked as sent') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05]"><CheckCircle2 className="w-3.5 h-3.5" /> Mark Sent</button>
                                  <button onClick={() => { updateQuotation(q.id, { status: 'rejected' }); setOpenMenu(null); toast.success('Marked as rejected') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05]"><XCircle className="w-3.5 h-3.5" /> Mark Rejected</button>
                                  <button onClick={() => { deleteQuotation(q.id); setOpenMenu(null); toast.success('Deleted') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <QuotationFormModal
            quotation={editingQuotation}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingQuotation(undefined) }}
          />
        )}
      </AnimatePresence>
      {openMenu && <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />}
    </>
  )
}
