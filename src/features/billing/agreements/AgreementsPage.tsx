import { useState } from 'react'
import { Plus, FileSignature, Trash2, Download, Edit, CheckCircle2, Clock, Send, MoreVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBillingStore, DEFAULT_COMPANY } from '../hooks/useBillingStore'
import { SignaturePad } from '../components/SignaturePad'
import { generateAgreementPDF } from '../utils/pdfGenerator'
import type { Agreement, AgreementTemplateType, AgreementSection, InvoiceSignature } from '@/types'
import { toast } from 'sonner'

const AGREEMENT_TEMPLATES: Record<AgreementTemplateType, string> = {
  website_development:  'Website Development',
  software_development: 'Software Development',
  erp_development:      'ERP Development',
  maintenance_contract: 'Maintenance Contract',
  seo_contract:         'SEO Contract',
  social_media:         'Social Media Management',
  graphic_design:       'Graphic Design',
  video_editing:        'Video Editing',
  amc:                  'Annual Maintenance Contract (AMC)',
  custom:               'Custom Agreement',
}

const DEFAULT_SECTIONS: AgreementSection[] = [
  { id: 's1',  order: 1,  enabled: true,  title: 'Project Scope',             content: 'The service provider agrees to deliver the services as described in this agreement to the best of their ability within the agreed timeline.' },
  { id: 's2',  order: 2,  enabled: true,  title: 'Deliverables',              content: 'The deliverables include all items explicitly mentioned in this agreement and any approved change orders.' },
  { id: 's3',  order: 3,  enabled: true,  title: 'Timeline',                  content: 'The project will be completed within the agreed delivery timeline from the date of signing this agreement and receipt of advance payment.' },
  { id: 's4',  order: 4,  enabled: true,  title: 'Client Responsibilities',   content: 'The client agrees to provide all necessary content, feedback, and access required for project completion within 3 business days of each request.' },
  { id: 's5',  order: 5,  enabled: true,  title: 'Developer Responsibilities',content: 'The service provider will maintain regular communication, provide progress updates, and deliver quality work as per industry standards.' },
  { id: 's6',  order: 6,  enabled: true,  title: 'Revision Policy',           content: 'This agreement includes up to 3 rounds of revisions. Additional revisions will be billed at ₹1,500 per hour.' },
  { id: 's7',  order: 7,  enabled: true,  title: 'Payment Terms',             content: 'Payment is due as per the schedule mentioned above. Late payments beyond 7 days will attract a 2% monthly interest charge.' },
  { id: 's8',  order: 8,  enabled: true,  title: 'Cancellation Policy',       content: 'If the client cancels after work has commenced, the advance payment is non-refundable. The client is responsible for all completed work up to the cancellation date.' },
  { id: 's9',  order: 9,  enabled: true,  title: 'Confidentiality',           content: 'Both parties agree to keep all project-related information, trade secrets, and business data strictly confidential.' },
  { id: 's10', order: 10, enabled: true,  title: 'Ownership',                 content: 'Upon full payment, all intellectual property rights for the project deliverables transfer to the client.' },
  { id: 's11', order: 11, enabled: true,  title: 'Support & Warranty',        content: 'The service provider offers 30 days of free support after project delivery for bug fixes. Feature additions are billed separately.' },
  { id: 's12', order: 12, enabled: false, title: 'Termination',               content: 'Either party may terminate this agreement with 30 days written notice. All outstanding payments become immediately due upon termination.' },
  { id: 's13', order: 13, enabled: true,  title: 'Jurisdiction',              content: 'This agreement shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in the city of signing.' },
]

const STATUS_CONFIG = {
  draft:      { label: 'Draft',      class: 'text-zinc-400 bg-zinc-800/60 border-zinc-700/50' },
  sent:       { label: 'Sent',       class: 'text-blue-400 bg-blue-900/30 border-blue-700/30' },
  signed:     { label: 'Signed',     class: 'text-green-400 bg-green-900/30 border-green-700/30' },
  expired:    { label: 'Expired',    class: 'text-orange-400 bg-orange-900/30 border-orange-700/30' },
  terminated: { label: 'Terminated', class: 'text-red-400 bg-red-900/30 border-red-700/30' },
}

function AgreementFormModal({ agreement, onSave, onCancel }: {
  agreement?: Agreement
  onSave: (data: Omit<Agreement,'id'|'agreement_number'|'created_at'|'updated_at'>) => void
  onCancel: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const endDefault = new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]

  const [templateType, setTemplateType] = useState<AgreementTemplateType>(agreement?.template_type ?? 'website_development')
  const [clientName, setClientName] = useState(agreement?.client_name ?? '')
  const [clientCompany, setClientCompany] = useState(agreement?.client_company ?? '')
  const [clientEmail, setClientEmail] = useState(agreement?.client_email ?? '')
  const [clientPhone, setClientPhone] = useState(agreement?.client_phone ?? '')
  const [startDate, setStartDate] = useState(agreement?.start_date ?? today)
  const [endDate, setEndDate] = useState(agreement?.end_date ?? endDefault)
  const [projectValue, setProjectValue] = useState(agreement?.project_value ?? 0)
  const [advanceAmount, setAdvanceAmount] = useState(agreement?.advance_amount ?? 0)
  const [deliveryTimeline, setDeliveryTimeline] = useState(agreement?.delivery_timeline ?? '4-6 weeks')
  const [paymentSchedule, setPaymentSchedule] = useState(agreement?.payment_schedule ?? '50% advance, 50% on delivery')
  const [sections, setSections] = useState<AgreementSection[]>(agreement?.sections ?? DEFAULT_SECTIONS)
  const [clientSig, setClientSig] = useState<InvoiceSignature | undefined>(agreement?.client_signature)
  const [companySig, setCompanySig] = useState<InvoiceSignature | undefined>(agreement?.company_signature)
  const [activeTab, setActiveTab] = useState<'details'|'sections'|'signatures'>('details')

  const balanceAmount = projectValue - advanceAmount

  const handleSave = () => {
    if (!clientName) { toast.error('Client name is required'); return }
    onSave({
      template_type: templateType,
      client_name: clientName, client_company: clientCompany,
      client_email: clientEmail, client_phone: clientPhone,
      start_date: startDate, end_date: endDate,
      project_value: projectValue, advance_amount: advanceAmount, balance_amount: balanceAmount,
      delivery_timeline: deliveryTimeline, payment_schedule: paymentSchedule,
      sections, company: DEFAULT_COMPANY,
      client_signature: clientSig, company_signature: companySig,
      status: clientSig && companySig ? 'signed' : 'draft',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div onClick={onCancel} className="modal-backdrop fixed inset-0" />
      <motion.div initial={{ opacity:0, scale:0.96, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0 }}
        transition={{ duration:0.3, ease:[0.16,1,0.3,1] }} className="relative w-full max-w-3xl" style={{ zIndex: 51 }}>
        <div className="modal-panel">
          <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
            <div>
              <h2 className="text-h4 font-bold text-white">{agreement ? 'Edit Agreement' : 'Create Agreement'}</h2>
            </div>
            <button onClick={onCancel} className="icon-btn"><Plus className="w-4 h-4 rotate-45" /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06]">
            {(['details','sections','signatures'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold capitalize transition-colors border-b-2 ${activeTab===tab ? 'text-white border-red-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
            {activeTab === 'details' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">Agreement Template</label>
                  <select value={templateType} onChange={e => setTemplateType(e.target.value as AgreementTemplateType)}>
                    {Object.entries(AGREEMENT_TEMPLATES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Client Name',       val: clientName,       set: setClientName       },
                    { label: 'Company',           val: clientCompany,    set: setClientCompany    },
                    { label: 'Email',             val: clientEmail,      set: setClientEmail      },
                    { label: 'Phone',             val: clientPhone,      set: setClientPhone      },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{f.label}</label>
                      <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.label} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Project Value (₹)</label>
                    <input type="number" min="0" value={projectValue} onChange={e => setProjectValue(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Advance Amount (₹)</label>
                    <input type="number" min="0" value={advanceAmount} onChange={e => setAdvanceAmount(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Balance Amount (₹)</label>
                    <input type="number" value={balanceAmount} readOnly className="opacity-60" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Delivery Timeline</label>
                    <input type="text" value={deliveryTimeline} onChange={e => setDeliveryTimeline(e.target.value)} placeholder="e.g. 4-6 weeks" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Payment Schedule</label>
                    <input type="text" value={paymentSchedule} onChange={e => setPaymentSchedule(e.target.value)} placeholder="e.g. 50% advance, 50% on delivery" />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'sections' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">Enable/disable and edit contract sections. You can customize the content of each section.</p>
                {sections.map((sec, idx) => (
                  <div key={sec.id} className={`border rounded-xl p-4 transition-colors ${sec.enabled ? 'border-white/[0.10] bg-white/[0.02]' : 'border-white/[0.04] opacity-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={sec.enabled} onChange={e => setSections(prev => prev.map(s => s.id === sec.id ? {...s, enabled: e.target.checked} : s))} />
                        <span className="font-semibold text-white text-sm">{sec.title}</span>
                      </div>
                    </div>
                    {sec.enabled && (
                      <textarea
                        rows={3}
                        value={sec.content}
                        onChange={e => setSections(prev => prev.map(s => s.id === sec.id ? {...s, content: e.target.value} : s))}
                        className="text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'signatures' && (
              <div className="space-y-6">
                <SignaturePad label="Client Signature" value={clientSig} onChange={setClientSig} />
                <div className="border-t border-white/[0.06]" />
                <SignaturePad label="Company Representative Signature" value={companySig} onChange={setCompanySig} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 p-6 border-t border-white/[0.06]">
            <div className="text-sm text-zinc-500">
              Value: <span className="text-white font-bold">₹{projectValue.toLocaleString('en-IN')}</span>
              {' '} · Balance: <span className="text-red-400 font-bold">₹{balanceAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-ghost h-10 px-4">Cancel</button>
              <button onClick={handleSave} className="btn-primary h-10 px-6">
                {agreement ? 'Update Agreement' : 'Create Agreement'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function AgreementsPage() {
  const { agreements, createAgreement, updateAgreement, deleteAgreement } = useBillingStore()
  const [showForm, setShowForm] = useState(false)
  const [editingAgreement, setEditingAgreement] = useState<Agreement | undefined>()
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const handleSave = (data: Omit<Agreement,'id'|'agreement_number'|'created_at'|'updated_at'>) => {
    if (editingAgreement) {
      updateAgreement(editingAgreement.id, data)
      toast.success('Agreement updated!')
    } else {
      createAgreement(data)
      toast.success('Agreement created!')
    }
    setShowForm(false)
    setEditingAgreement(undefined)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">{agreements.length} agreement{agreements.length !== 1 ? 's' : ''}</p>
          <button onClick={() => { setEditingAgreement(undefined); setShowForm(true) }} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> New Agreement
          </button>
        </div>

        {agreements.length === 0 ? (
          <div className="empty-state">
            <FileSignature className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-white font-semibold">No agreements yet</p>
            <p className="text-zinc-500 text-sm mt-1">Create professional agreements with digital signatures</p>
          </div>
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Agreement</th>
                  <th className="text-left">Client</th>
                  <th className="text-left">Type</th>
                  <th className="text-right">Value</th>
                  <th className="text-left">Duration</th>
                  <th className="text-left">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agreements.map((agr, i) => {
                  const cfg = STATUS_CONFIG[agr.status] || STATUS_CONFIG.draft
                  return (
                    <motion.tr key={agr.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.03 }}>
                      <td>
                        <p className="font-semibold text-white text-sm">{agr.agreement_number}</p>
                        <p className="text-xs text-zinc-500">{agr.start_date}</p>
                      </td>
                      <td>
                        <p className="font-semibold text-white text-sm">{agr.client_name}</p>
                        <p className="text-xs text-zinc-500">{agr.client_company}</p>
                      </td>
                      <td className="text-sm text-zinc-400">{AGREEMENT_TEMPLATES[agr.template_type]}</td>
                      <td className="text-right font-semibold text-white">₹{agr.project_value.toLocaleString('en-IN')}</td>
                      <td className="text-sm text-zinc-400">{agr.delivery_timeline}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.class}`}>{cfg.label}</span>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => generateAgreementPDF(agr)} className="icon-btn !w-8 !h-8" title="Download PDF">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <div className="relative">
                            <button onClick={() => setOpenMenu(openMenu === agr.id ? null : agr.id)} className="icon-btn !w-8 !h-8">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            <AnimatePresence>
                              {openMenu === agr.id && (
                                <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                                  className="absolute right-0 top-full mt-1 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                  <button onClick={() => { setEditingAgreement(agr); setShowForm(true); setOpenMenu(null) }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05]">
                                    <Edit className="w-3.5 h-3.5" /> Edit
                                  </button>
                                  <button onClick={() => { updateAgreement(agr.id, { status: 'sent' }); setOpenMenu(null); toast.success('Marked as sent') }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05]">
                                    <Send className="w-3.5 h-3.5" /> Mark Sent
                                  </button>
                                  <button onClick={() => { updateAgreement(agr.id, { status: 'signed' }); setOpenMenu(null); toast.success('Marked as signed') }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05]">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Signed
                                  </button>
                                  <button onClick={() => { deleteAgreement(agr.id); setOpenMenu(null); toast.success('Deleted') }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
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
          <AgreementFormModal
            agreement={editingAgreement}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingAgreement(undefined) }}
          />
        )}
      </AnimatePresence>
      {openMenu && <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />}
    </>
  )
}
