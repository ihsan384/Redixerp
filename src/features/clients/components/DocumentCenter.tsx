import { useState } from 'react'
import { FileSignature, Quote, FileText, Receipt, Layers, CheckSquare, ClipboardCheck, Wrench, ShieldAlert, Download, Mail, MessageCircle, Plus, Trash2, Edit3 } from 'lucide-react'
import type { Client } from '@/types'
import { toast } from 'sonner'
import * as pdfDocs from '../utils/pdfDocsGenerator'

interface DocumentCenterProps {
  client: Client
}

const DOCS_LIST = [
  { id: 'agreement', title: 'Website Dev Agreement', icon: FileSignature, color: 'text-red-400', desc: 'Core contract detailing platforms, scope of work deliverables, and digital signatures.' },
  { id: 'quotation', title: 'Pricing Quotation', icon: Quote, color: 'text-blue-400', desc: 'Itemized costs and scope outline with commercial validity limits.' },
  { id: 'invoice', title: 'Commercial Invoice', icon: FileText, color: 'text-green-400', desc: 'Tax invoice with UPI, bank details, and dynamic balance schedules.' },
  { id: 'receipt_adv', title: 'Advance Payment Receipt', icon: Receipt, color: 'text-emerald-400', desc: 'Formal payment acknowledgement of downpayments.' },
  { id: 'receipt_fin', title: 'Final Payment Receipt', icon: Receipt, color: 'text-teal-400', desc: 'Payment receipt clearing all project dues.' },
  { id: 'proposal', title: 'Project Proposal', icon: Layers, color: 'text-purple-400', desc: 'Comprehensive pitch covering cover page, summary, timeline, and pricing.' },
  { id: 'handover', title: 'Handover Certificate', icon: ClipboardCheck, color: 'text-orange-400', desc: 'Delivery documentation handing over credentials and recommendations.' },
  { id: 'maintenance', title: 'Maintenance Agreement', icon: Wrench, color: 'text-amber-400', desc: 'Support SLA terms detailing monthly/annual subscription costs.' },
  { id: 'nda', title: 'Mutual NDA Agreement', icon: ShieldAlert, color: 'text-rose-400', desc: 'Confidentiality agreement protecting corporate proprietary information.' }
]

export function DocumentCenter({ client }: DocumentCenterProps) {
  const [selectedDocId, setSelectedDocId] = useState('agreement')

  // Global default inputs based on Client properties
  const docRef = (prefix: string) => `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

  // 1. Website Agreement States
  const [agreeNo, setAgreeNo] = useState(docRef('AGR'))
  const [platform, setPlatform] = useState('Next.js / React')
  const [agreeScopes, setAgreeScopes] = useState([
    'UI Design', 'Website Development', 'Mobile Responsive', 'SEO Setup', 'Speed Optimization', 'Contact Forms'
  ])
  const [agreeStartDate, setAgreeStartDate] = useState(new Date().toISOString().split('T')[0])
  const [agreeEndDate, setAgreeEndDate] = useState(new Date(Date.now() + 45*24*60*60*1000).toISOString().split('T')[0])
  const [agreeTotalCost, setAgreeTotalCost] = useState(client.total_project_value.toString())
  const [agreeAdvance, setAgreeAdvance] = useState(client.advance_paid.toString())
  const [agreePaySchedule, setAgreePaySchedule] = useState('50% advance payment upfront, 50% upon project completion sign-off.')
  const [agreeRevisions, setAgreeRevisions] = useState('Up to 3 iterations within 14 days of prototype delivery. Additional iterations billed at PKR 5,000/hr.')
  const [agreeSupport, setAgreeSupport] = useState('30-day post-launch technical support SLA covering hosting and bug-fixes.')

  // 2 & 3. Items list for Quotation & Invoice
  const [billNo, setBillNo] = useState(docRef('INV'))
  const [quoteNo, setQuoteNo] = useState(docRef('QTN'))
  const [billItems, setBillItems] = useState<Array<{ service: string; desc: string; qty: number; price: number; taxPercent: number }>>([
    { service: 'Premium Website Development', desc: 'Custom Next.js & Tailwind responsive site', qty: 1, price: client.total_project_value || 120000, taxPercent: 13 }
  ])
  const [billDiscount, setBillDiscount] = useState('0')
  const [billPaid, setBillPaid] = useState(client.advance_paid.toString())
  const [billStatus, setBillStatus] = useState(client.status === 'completed' ? 'Paid' : 'Partially Paid')
  const [quoteValidity, setQuoteValidity] = useState('15 Days from issuance')
  const [quoteTitle, setQuoteTitle] = useState('Website Design & SEO Redesign')

  // 4 & 5. Receipts States
  const [recNo, setRecNo] = useState(docRef('REC'))
  const [recAmount, setRecAmount] = useState(client.advance_paid.toString())
  const [recMode, setRecMode] = useState('Bank Transfer')
  const [recTx, setRecTx] = useState('TXN-PK-88912A')

  // 6. Proposal States
  const [propNo, setPropNo] = useState(docRef('PRP'))
  const [propExec, setPropExec] = useState('REDIX.MEDIA is pleased to submit this proposal for launching a modern web application designed to drive lead capture and brand authority. Our proposed solutions leverage headless Next.js framework for fast loading metrics.')
  const [propScopes, setPropScopes] = useState([
    { title: 'Interactive UX/UI Wireframes', desc: 'Figma mockups representing user flow paths.' },
    { title: 'Responsive Next.js & Tailwind Coding', desc: 'Performance-optimized speed framework frontend development.' }
  ])
  const [propTimeline, setPropTimeline] = useState('6 Weeks')

  // 7. Handover States
  const [handNo, setHandNo] = useState(docRef('HND'))
  const [handDeliverables, setHandDeliverables] = useState([
    'Responsive Frontend Source Code Codebase',
    'Configured Vercel Server Hosting deployment',
    'Custom Domain Name Mapping configurations',
    'Integrated WhatsApp & Contact Lead forms'
  ])
  const [handCreds, setHandCreds] = useState([
    { title: 'Domain Registrar Registrar Account', value: 'GoDaddy (Shared via 1Password)' },
    { title: 'Vercel Deployment URL Portal', value: 'https://admin-cyberdyne.vercel.app' }
  ])
  const [handSupportEnd, setHandSupportEnd] = useState(new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0])
  const [handRecs, setHandRecs] = useState('Ensure monthly backups are triggered. Perform node package security updates quarterly to protect access tokens.')

  // 8. Maintenance SLA
  const [maintNo, setMaintNo] = useState(docRef('MNT'))
  const [maintFee, setMaintFee] = useState('15000')
  const [maintCycle, setMaintCycle] = useState('Monthly')
  const [maintScope, setMaintScope] = useState('Includes domain renewal checks, server uptime checks, security patching, and minor content adjustments up to 3 hours per billing period.')
  const [maintResponse, setMaintResponse] = useState('Critical faults: 4-hours SLA. Standard updates: 24-hours.')

  // 9. NDA
  const [ndaNo, setNdaNo] = useState(docRef('NDA'))
  const [ndaDate, setNdaDate] = useState(new Date().toISOString().split('T')[0])
  const [ndaLaw, setNdaLaw] = useState('Governed under the laws and jurisdiction of Sindh High Court, Pakistan.')

  // Shared Scope Helper
  const toggleAgreeScope = (scope: string) => {
    setAgreeScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope])
  }

  // Shared Items List Helpers
  const addBillItem = () => {
    setBillItems([...billItems, { service: 'Additional Deliverable', desc: 'Description of scope', qty: 1, price: 10000, taxPercent: 13 }])
  }
  const updateBillItem = (idx: number, field: string, val: any) => {
    const updated = [...billItems]
    updated[idx] = { ...updated[idx], [field]: val }
    setBillItems(updated)
  }
  const deleteBillItem = (idx: number) => {
    setBillItems(billItems.filter((_, i) => i !== idx))
  }

  // Handle Export PDF
  const handleExport = async () => {
    try {
      if (selectedDocId === 'agreement') {
        await pdfDocs.generateWebsiteAgreementPDF(client, {
          agreementNo: agreeNo,
          platform,
          scopes: agreeScopes,
          startDate: agreeStartDate,
          endDate: agreeEndDate,
          totalCost: parseFloat(agreeTotalCost) || 0,
          advancePaid: parseFloat(agreeAdvance) || 0,
          paymentSchedule: agreePaySchedule,
          revisions: agreeRevisions,
          responsibilities: 'Client must provide branding kits, high-res assets, copywriting templates, and review comments within 48-hours of draft submissions.',
          ownership: 'All custom CSS, HTML code, React components, and design layouts are handed over to client under a perpetual royalty-free license upon receipt of final due payments.',
          refundPolicy: 'Advance payment holds project slots and is non-refundable. Cancellations prior to testing stage forfeit 50% of outstanding contract value.',
          supportPeriod: agreeSupport
        })
      } else if (selectedDocId === 'quotation') {
        await pdfDocs.generateCustomQuotationPDF(client, {
          quotationNo: quoteNo,
          validity: quoteValidity,
          projectTitle: quoteTitle,
          items: billItems,
          discount: parseFloat(billDiscount) || 0,
          terms: 'Prices are net in PKR. Validity remains for 15 Days. Hosting charges are billed directly by the platform provider.',
          notes: 'Standard customization requests are completed within estimated timelines. Revision loops are capped at 3 cycles.'
        })
      } else if (selectedDocId === 'invoice') {
        await pdfDocs.generateCustomInvoicePDF(client, {
          invoiceNo: billNo,
          invoiceDate: agreeStartDate,
          dueDate: agreeEndDate,
          items: billItems,
          discount: parseFloat(billDiscount) || 0,
          amountPaid: parseFloat(billPaid) || 0,
          paymentStatus: billStatus,
          upiId: 'redix.media@upi',
          bankName: 'Alfalah Bank Limited',
          bankAccount: '1002-99823-1120',
          bankIfsc: 'ALFA-0022831'
        })
      } else if (selectedDocId === 'receipt_adv') {
        await pdfDocs.generatePaymentReceiptPDF(client, {
          receiptNo: recNo,
          receiptType: 'Advance Payment Receipt',
          amountPaid: parseFloat(recAmount) || 0,
          paymentMode: recMode,
          transactionId: recTx,
          receiptDate: agreeStartDate,
          remainingBalance: Math.max(0, (client.total_project_value || 0) - (parseFloat(recAmount) || 0)),
          invoiceLink: billNo
        })
      } else if (selectedDocId === 'receipt_fin') {
        const bal = Math.max(0, (client.total_project_value || 0) - (parseFloat(recAmount) || 0))
        await pdfDocs.generatePaymentReceiptPDF(client, {
          receiptNo: recNo,
          receiptType: 'Final Payment Receipt',
          amountPaid: bal || client.total_project_value - client.advance_paid,
          paymentMode: recMode,
          transactionId: recTx,
          receiptDate: agreeEndDate,
          remainingBalance: 0,
          invoiceLink: billNo
        })
      } else if (selectedDocId === 'proposal') {
        await pdfDocs.generateProjectProposalPDF(client, {
          proposalNo: propNo,
          projectTitle: quoteTitle,
          executiveSummary: propExec,
          scopeList: propScopes,
          timelineWeeks: propTimeline,
          totalCost: parseFloat(agreeTotalCost) || 0,
          deliverablesText: 'Complete responsive system design, Figma visual boards, deployment configurations, CMS control integration, domain mapping.'
        })
      } else if (selectedDocId === 'handover') {
        await pdfDocs.generateHandoverPDF(client, {
          handoverNo: handNo,
          handoverDate: agreeEndDate,
          deliverables: handDeliverables,
          credentials: handCreds,
          supportEnd: handSupportEnd,
          recommendations: handRecs
        })
      } else if (selectedDocId === 'maintenance') {
        await pdfDocs.generateMaintenanceAgreementPDF(client, {
          contractNo: maintNo,
          startDate: handSupportEnd,
          feeAmount: parseFloat(maintFee) || 0,
          billingCycle: maintCycle,
          scopeDetails: maintScope,
          responseTime: maintResponse,
          terms: 'Agreement is active for 12 months. Early termination requires 30-day written notice. Billed cycle sums are payable upfront.'
        })
      } else if (selectedDocId === 'nda') {
        await pdfDocs.generateNdaPDF(client, {
          ndaNo: ndaNo,
          effectiveDate: ndaDate,
          disclosingParty: 'REDIX.MEDIA',
          receivingParty: client.company_name,
          confidentialDefinition: 'Confidential Information includes all trade secrets, React source code files, database credentials, Vercel portal details, brand guidelines, and product roadmap metrics disclosed during the project lifecycle.',
          remedies: 'Unauthorised disclosure of Confidential Information warrants immediate injunctive relief without the necessity of posting bonds, alongside standard direct damage recoveries.',
          governingLaw: ndaLaw
        })
      }
      toast.success('Professional PDF generated successfully!')
    } catch (e) {
      console.error(e)
      toast.error('Failed to export PDF')
    }
  }

  // Sharing links generators
  const getShareText = () => {
    let docTitle = DOCS_LIST.find(d => d.id === selectedDocId)?.title || 'Document'
    let docRefNo = agreeNo
    if (selectedDocId === 'invoice') docRefNo = billNo
    if (selectedDocId === 'quotation') docRefNo = quoteNo
    if (selectedDocId === 'receipt_adv' || selectedDocId === 'receipt_fin') docRefNo = recNo

    return `Hi ${client.contact_person}, your customized document "${docTitle}" (${docRefNo}) from REDIX.MEDIA is ready. Please let us know if you have any questions or are ready to proceed with signature approvals.`
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getShareText())
    const num = client.phone?.replace(/\D/g, '') || ''
    window.open(`https://wa.me/${num}?text=${text}`, '_blank')
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`REDIX.MEDIA - Ready Document: ${selectedDocId.toUpperCase()}`)
    const body = encodeURIComponent(getShareText())
    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, '_blank')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left List of documents */}
      <div className="space-y-3.5">
        <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider pl-1">Document Templates Center</h4>
        <div className="space-y-1.5">
          {DOCS_LIST.map(doc => {
            const active = selectedDocId === doc.id
            const Icon = doc.icon
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                  active
                    ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                    : 'border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] text-zinc-400 hover:text-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                  active ? 'bg-red-500/10 border-red-500/20 ' + doc.color : 'bg-white/[0.02] border-white/[0.08] text-zinc-500'
                }`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-zinc-300'}`}>
                    {doc.title}
                  </p>
                  <p className="text-[9px] text-zinc-500 font-semibold leading-relaxed mt-1">
                    {doc.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Editor & Actions Pane */}
      <div className="md:col-span-2 space-y-4">
        <div className="panel-card p-5 bg-[#111]/40 border border-white/[0.06] backdrop-blur-md space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customize Parameters</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                {DOCS_LIST.find(d => d.id === selectedDocId)?.title}
              </p>
            </div>
            
            {/* Quick Actions Row */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExport}
                className="btn-primary h-9 px-4 text-xs font-bold gap-1.5"
                title="Download Branded PDF"
              >
                <Download className="w-3.5 h-3.5" /> <span>Export PDF</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/20 transition-all"
                title="Share via WhatsApp link"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                onClick={handleShareEmail}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-blue-500/10 text-zinc-500 hover:text-blue-400 hover:border-blue-500/20 transition-all"
                title="Share via Email link"
              >
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DYNAMIC FORMS ACCORDING TO SELECTION */}
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            
            {/* AGREEMENT FORM */}
            {selectedDocId === 'agreement' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Agreement No.</label>
                    <input type="text" value={agreeNo} onChange={e => setAgreeNo(e.target.value)} className="w-full font-mono text-zinc-300" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Selected Platform</label>
                    <input type="text" value={platform} onChange={e => setPlatform(e.target.value)} placeholder="Next.js, WordPress, Custom" className="w-full" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Scope of Work deliverables</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['UI Design', 'Website Development', 'Mobile Responsive', 'SEO Setup', 'Speed Optimization', 'Contact Forms', 'WhatsApp Integration', 'Payment Gateway', 'Admin Panel', 'Blog', 'Booking System', 'Ecommerce'].map(scope => {
                      const checked = agreeScopes.includes(scope)
                      return (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => toggleAgreeScope(scope)}
                          className={`h-8 text-[10px] font-bold border rounded-lg transition-all ${
                            checked ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'border-white/[0.04] bg-white/[0.01] text-zinc-500'
                          }`}
                        >
                          {scope}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Start Date</label>
                    <input type="date" value={agreeStartDate} onChange={e => setAgreeStartDate(e.target.value)} className="w-full text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">End Date</label>
                    <input type="date" value={agreeEndDate} onChange={e => setAgreeEndDate(e.target.value)} className="w-full text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Contract Cost (PKR)</label>
                    <input type="number" value={agreeTotalCost} onChange={e => setAgreeTotalCost(e.target.value)} className="w-full text-xs font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Advance Paid Received (PKR)</label>
                    <input type="number" value={agreeAdvance} onChange={e => setAgreeAdvance(e.target.value)} className="w-full text-xs font-mono" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Payment Schedule Details</label>
                  <input type="text" value={agreePaySchedule} onChange={e => setAgreePaySchedule(e.target.value)} className="w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Revisions Policy SLA</label>
                  <input type="text" value={agreeRevisions} onChange={e => setAgreeRevisions(e.target.value)} className="w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Support SLAs Period</label>
                  <input type="text" value={agreeSupport} onChange={e => setAgreeSupport(e.target.value)} className="w-full" />
                </div>
              </div>
            )}

            {/* QUOTATION OR INVOICE FORM */}
            {(selectedDocId === 'quotation' || selectedDocId === 'invoice') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Document Reference Number</label>
                    {selectedDocId === 'invoice' ? (
                      <input type="text" value={billNo} onChange={e => setBillNo(e.target.value)} className="w-full font-mono text-zinc-300" />
                    ) : (
                      <input type="text" value={quoteNo} onChange={e => setQuoteNo(e.target.value)} className="w-full font-mono text-zinc-300" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      {selectedDocId === 'invoice' ? 'Payment Status' : 'Quotation Validity'}
                    </label>
                    {selectedDocId === 'invoice' ? (
                      <select value={billStatus} onChange={e => setBillStatus(e.target.value)} className="w-full h-11 bg-[#151515] border border-white/[0.08] text-white rounded-xl text-xs px-3">
                        <option value="Paid">Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    ) : (
                      <input type="text" value={quoteValidity} onChange={e => setQuoteValidity(e.target.value)} className="w-full" />
                    )}
                  </div>
                </div>

                {selectedDocId === 'quotation' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Project Proposal Title</label>
                    <input type="text" value={quoteTitle} onChange={e => setQuoteTitle(e.target.value)} className="w-full" />
                  </div>
                )}

                {/* Itemized Table Editor */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Itemized Line Items ({billItems.length})</label>
                    <button type="button" onClick={addBillItem} className="btn-secondary h-7 px-2.5 text-[10px] font-bold rounded-lg flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>

                  <div className="space-y-2 border border-white/[0.06] rounded-2xl p-3 bg-white/[0.01]">
                    {billItems.length === 0 ? (
                      <p className="text-center py-4 text-zinc-500 text-xs italic">No line items. Add a row to calculate totals.</p>
                    ) : (
                      billItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 border-b border-white/[0.04] pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                          <input
                            type="text"
                            value={item.service}
                            onChange={e => updateBillItem(idx, 'service', e.target.value)}
                            placeholder="Service Name"
                            className="col-span-4 h-9 text-xs px-2.5"
                          />
                          <input
                            type="text"
                            value={item.desc}
                            onChange={e => updateBillItem(idx, 'desc', e.target.value)}
                            placeholder="Description"
                            className="col-span-3 h-9 text-xs px-2.5"
                          />
                          <input
                            type="number"
                            value={item.qty}
                            onChange={e => updateBillItem(idx, 'qty', parseInt(e.target.value) || 1)}
                            className="col-span-1 h-9 text-xs text-center px-1 font-mono"
                          />
                          <input
                            type="number"
                            value={item.price}
                            onChange={e => updateBillItem(idx, 'price', parseFloat(e.target.value) || 0)}
                            className="col-span-2 h-9 text-xs text-right px-1 font-mono"
                          />
                          <input
                            type="number"
                            value={item.taxPercent}
                            onChange={e => updateBillItem(idx, 'taxPercent', parseFloat(e.target.value) || 0)}
                            className="col-span-1 h-9 text-xs text-center px-1 font-mono"
                            title="Tax %"
                          />
                          <button
                            type="button"
                            onClick={() => deleteBillItem(idx)}
                            className="col-span-1 h-9 flex items-center justify-center text-zinc-600 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Apply Discount (PKR)</label>
                    <input type="number" value={billDiscount} onChange={e => setBillDiscount(e.target.value)} className="w-full font-mono" />
                  </div>
                  {selectedDocId === 'invoice' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Amount Paid Receipted (PKR)</label>
                      <input type="number" value={billPaid} onChange={e => setBillPaid(e.target.value)} className="w-full font-mono" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RECEIPT FORM */}
            {(selectedDocId === 'receipt_adv' || selectedDocId === 'receipt_fin') && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Receipt No.</label>
                    <input type="text" value={recNo} onChange={e => setRecNo(e.target.value)} className="w-full font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Amount Collected (PKR)</label>
                    <input type="number" value={recAmount} onChange={e => setRecAmount(e.target.value)} className="w-full font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Payment Mode</label>
                    <select value={recMode} onChange={e => setRecMode(e.target.value)} className="w-full h-11 bg-[#151515] border border-white/[0.08] text-white rounded-xl text-xs px-3">
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="Cash Remittance">Cash Remittance</option>
                      <option value="Online Gateway">Online Gateway</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Transaction Ref ID</label>
                    <input type="text" value={recTx} onChange={e => setRecTx(e.target.value)} className="w-full font-mono" />
                  </div>
                </div>
              </div>
            )}

            {/* PROPOSAL FORM */}
            {selectedDocId === 'proposal' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Proposal No.</label>
                    <input type="text" value={propNo} onChange={e => setPropNo(e.target.value)} className="w-full font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Project Timeline</label>
                    <input type="text" value={propTimeline} onChange={e => setPropTimeline(e.target.value)} placeholder="e.g. 6 Weeks" className="w-full" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Executive Proposal Summary</label>
                  <textarea value={propExec} onChange={e => setPropExec(e.target.value)} className="w-full h-24 text-xs py-2" />
                </div>
              </div>
            )}

            {/* HANDOVER CERTIFICATE FORM */}
            {selectedDocId === 'handover' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Handover Ref No.</label>
                    <input type="text" value={handNo} onChange={e => setHandNo(e.target.value)} className="w-full font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Support SLA End Date</label>
                    <input type="date" value={handSupportEnd} onChange={e => setHandSupportEnd(e.target.value)} className="w-full text-xs" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Platform Recommendations</label>
                  <textarea value={handRecs} onChange={e => setHandRecs(e.target.value)} className="w-full h-20 text-xs py-2" />
                </div>
              </div>
            )}

            {/* MAINTENANCE SLA FORM */}
            {selectedDocId === 'maintenance' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Contract SLA No.</label>
                    <input type="text" value={maintNo} onChange={e => setMaintNo(e.target.value)} className="w-full font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">SLA Fee Amount (PKR)</label>
                    <input type="number" value={maintFee} onChange={e => setMaintFee(e.target.value)} className="w-full font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Billing Frequency</label>
                    <select value={maintCycle} onChange={e => setMaintCycle(e.target.value)} className="w-full h-11 bg-[#151515] border border-white/[0.08] text-white rounded-xl text-xs px-2">
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">AMC Scope of Support Services</label>
                  <textarea value={maintScope} onChange={e => setMaintScope(e.target.value)} className="w-full h-24 text-xs py-2" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Incident Response Target SLAs</label>
                  <input type="text" value={maintResponse} onChange={e => setMaintResponse(e.target.value)} className="w-full text-xs" />
                </div>
              </div>
            )}

            {/* NDA FORM */}
            {selectedDocId === 'nda' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">NDA Reference No.</label>
                    <input type="text" value={ndaNo} onChange={e => setNdaNo(e.target.value)} className="w-full font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Effective Signing Date</label>
                    <input type="date" value={ndaDate} onChange={e => setNdaDate(e.target.value)} className="w-full text-xs" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Governing Legal Law</label>
                  <input type="text" value={ndaLaw} onChange={e => setNdaLaw(e.target.value)} className="w-full" />
                </div>
              </div>
            )}

          </div>

          <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Document center powered by REDIX.MEDIA</span>
            <div className="flex gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="btn-secondary h-9 text-xs font-bold flex items-center gap-1.5 border-emerald-500/10 hover:border-emerald-500/30 text-emerald-400"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Link
              </button>
              <button
                onClick={handleShareEmail}
                className="btn-secondary h-9 text-xs font-bold flex items-center gap-1.5 border-blue-500/10 hover:border-blue-500/30 text-blue-400"
              >
                <Mail className="w-3.5 h-3.5" /> Email Document
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
