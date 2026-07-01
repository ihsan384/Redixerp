import { useState, useCallback } from "react"
import type {
  BillingInvoice,
  Agreement,
  Quotation,
  RecurringInvoice,
  BillingTemplate,
  BillingInvoiceStatus,
  InvoiceTemplateStyle,
  InvoiceCompany,
} from "@/types"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

const KEYS = {
  invoices: "rdx_invoices",
  agreements: "rdx_agreements",
  quotations: "rdx_quotations",
  recurring: "rdx_recurring",
  templates: "rdx_templates",
  counters: "rdx_billing_counters",
}

export const DEFAULT_COMPANY: InvoiceCompany = {
  name: "Redix Media",
  address: "",
  gst_number: "",
  phone: "",
  email: "",
  website: "",
  bank_name: "",
  bank_account: "",
  bank_ifsc: "",
  upi_id: "",
  logo_url: "",
}

export const DEFAULT_TEMPLATES: BillingTemplate[] = [
  { id: "tpl-modern", name: "Modern", description: "Clean lines, vibrant accent, perfect for digital agencies", style: "modern", primary_color: "#e53935", secondary_color: "#1a1a1a", font_family: "helvetica", is_default: true, is_custom: false, footer_text: "Thank you for your business!" },
  { id: "tpl-minimal", name: "Minimal", description: "Understated elegance, white space focused", style: "minimal", primary_color: "#111111", secondary_color: "#f5f5f5", font_family: "helvetica", is_default: false, is_custom: false, footer_text: "Thank you for your business!" },
  { id: "tpl-corporate", name: "Corporate", description: "Professional blue tones for enterprise clients", style: "corporate", primary_color: "#1e40af", secondary_color: "#1e3a5f", font_family: "helvetica", is_default: false, is_custom: false, footer_text: "Thank you for choosing our services." },
  { id: "tpl-premium-dark", name: "Premium Dark", description: "Dark luxury look for high-ticket proposals", style: "premium_dark", primary_color: "#f59e0b", secondary_color: "#0a0a0a", font_family: "helvetica", is_default: false, is_custom: false, footer_text: "Premium service, delivered with excellence." },
  { id: "tpl-agency", name: "Agency Style", description: "Bold creative style for design & marketing agencies", style: "agency", primary_color: "#7c3aed", secondary_color: "#1e1b4b", font_family: "helvetica", is_default: false, is_custom: false, footer_text: "Creating impact, one project at a time." },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {}
  return fallback
}

function save<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function generateNumber(prefix: string, counterKey: string): string {
  const year = new Date().getFullYear()
  const counters = load<Record<string, number>>(KEYS.counters, {})
  const key = `${counterKey}_${year}`
  const next = (counters[key] || 0) + 1
  counters[key] = next
  save(KEYS.counters, counters)
  return `${prefix}-${year}-${String(next).padStart(4, "0")}`
}

export function useBillingStore() {
  const [invoices, setInvoicesState] = useState<BillingInvoice[]>(() => load<BillingInvoice[]>(KEYS.invoices, []))
  const [agreements, setAgreementsState] = useState<Agreement[]>(() => load<Agreement[]>(KEYS.agreements, []))
  const [quotations, setQuotationsState] = useState<Quotation[]>(() => load<Quotation[]>(KEYS.quotations, []))
  const [recurring, setRecurringState] = useState<RecurringInvoice[]>(() => load<RecurringInvoice[]>(KEYS.recurring, []))
  const [templates, setTemplatesState] = useState<BillingTemplate[]>(() => {
    const stored = load<BillingTemplate[]>(KEYS.templates, [])
    if (stored.length === 0) { save(KEYS.templates, DEFAULT_TEMPLATES); return DEFAULT_TEMPLATES }
    return stored
  })

  const persistInvoices = useCallback((list: BillingInvoice[]) => { save(KEYS.invoices, list); setInvoicesState(list) }, [])
  const persistAgreements = useCallback((list: Agreement[]) => { save(KEYS.agreements, list); setAgreementsState(list) }, [])
  const persistQuotations = useCallback((list: Quotation[]) => { save(KEYS.quotations, list); setQuotationsState(list) }, [])
  const persistRecurring = useCallback((list: RecurringInvoice[]) => { save(KEYS.recurring, list); setRecurringState(list) }, [])
  const persistTemplates = useCallback((list: BillingTemplate[]) => { save(KEYS.templates, list); setTemplatesState(list) }, [])

  const createInvoice = useCallback((data: Omit<BillingInvoice, "id"|"invoice_number"|"created_at"|"updated_at"|"timeline_events">) => {
    const now = new Date().toISOString()
    const invoice: BillingInvoice = { ...data, id: generateId(), invoice_number: generateNumber("RDX", "invoice"), created_at: now, updated_at: now, timeline_events: [{ id: generateId(), event: "created", timestamp: now, note: "Invoice created" }] }
    const updated = [invoice, ...invoices]
    persistInvoices(updated)
    return invoice
  }, [invoices, persistInvoices])

  const updateInvoice = useCallback((id: string, data: Partial<BillingInvoice>) => {
    persistInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...data, updated_at: new Date().toISOString() } : inv))
  }, [invoices, persistInvoices])

  const deleteInvoice = useCallback((id: string) => { persistInvoices(invoices.filter(inv => inv.id !== id)) }, [invoices, persistInvoices])

  const duplicateInvoice = useCallback((id: string) => {
    const source = invoices.find(inv => inv.id === id)
    if (!source) return null
    const now = new Date().toISOString()
    const copy: BillingInvoice = { ...source, id: generateId(), invoice_number: generateNumber("RDX", "invoice"), status: "draft" as BillingInvoiceStatus, invoice_date: now.split("T")[0], created_at: now, updated_at: now, timeline_events: [{ id: generateId(), event: "created", timestamp: now, note: `Duplicated from ${source.invoice_number}` }] }
    persistInvoices([copy, ...invoices])
    toast.success(`Duplicated as ${copy.invoice_number}`)
    return copy
  }, [invoices, persistInvoices])

  const markInvoicePaid = useCallback(async (id: string) => {
    const invoice = invoices.find(inv => inv.id === id)
    if (!invoice) return
    const now = new Date().toISOString()
    const updatedInvoices = invoices.map(inv => inv.id === id ? { ...inv, status: "paid" as BillingInvoiceStatus, updated_at: now, timeline_events: [...inv.timeline_events, { id: generateId(), event: "paid" as const, timestamp: now, note: "Marked as fully paid" }] } : inv)
    persistInvoices(updatedInvoices)
    try {
      const payload = { lead_id: invoice.client.lead_id || null, package: invoice.client.project_name || `Invoice ${invoice.invoice_number}`, amount: invoice.grand_total, payment_status: "paid", payment_method: invoice.payment_method || "bank_transfer", received_date: now.split("T")[0], notes: `Auto-synced from Invoice ${invoice.invoice_number}` }
      await supabase.from("revenue").insert(payload as never)
      toast.success(`Invoice ${invoice.invoice_number} marked paid & revenue updated!`)
    } catch { toast.success(`Invoice ${invoice.invoice_number} marked as paid!`) }
  }, [invoices, persistInvoices])

  const createAgreement = useCallback((data: Omit<Agreement, "id"|"agreement_number"|"created_at"|"updated_at">) => {
    const now = new Date().toISOString()
    const agreement: Agreement = { ...data, id: generateId(), agreement_number: generateNumber("AGR", "agreement"), created_at: now, updated_at: now }
    persistAgreements([agreement, ...agreements])
    return agreement
  }, [agreements, persistAgreements])

  const updateAgreement = useCallback((id: string, data: Partial<Agreement>) => {
    persistAgreements(agreements.map(a => a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a))
  }, [agreements, persistAgreements])

  const deleteAgreement = useCallback((id: string) => { persistAgreements(agreements.filter(a => a.id !== id)) }, [agreements, persistAgreements])

  const createQuotation = useCallback((data: Omit<Quotation, "id"|"quotation_number"|"created_at"|"updated_at">) => {
    const now = new Date().toISOString()
    const quotation: Quotation = { ...data, id: generateId(), quotation_number: generateNumber("QTN", "quotation"), created_at: now, updated_at: now }
    persistQuotations([quotation, ...quotations])
    return quotation
  }, [quotations, persistQuotations])

  const updateQuotation = useCallback((id: string, data: Partial<Quotation>) => {
    persistQuotations(quotations.map(q => q.id === id ? { ...q, ...data, updated_at: new Date().toISOString() } : q))
  }, [quotations, persistQuotations])

  const deleteQuotation = useCallback((id: string) => { persistQuotations(quotations.filter(q => q.id !== id)) }, [quotations, persistQuotations])

  const convertQuotationToInvoice = useCallback((id: string) => {
    const q = quotations.find(qu => qu.id === id)
    if (!q) return null
    const now = new Date().toISOString()
    const dueDate = new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0]
    const invoice = createInvoice({ invoice_date: now.split("T")[0], due_date: dueDate, status: "draft", template_style: q.template_style as InvoiceTemplateStyle, company: q.company, client: q.client, items: q.items, subtotal: q.subtotal, total_discount: q.total_discount, total_tax: q.total_tax, additional_charges: q.additional_charges, additional_charges_label: q.additional_charges_label, advance_paid: 0, grand_total: q.grand_total, balance_due: q.grand_total, notes: q.notes, terms: q.terms, primary_color: q.primary_color, secondary_color: "#1a1a1a", font_family: "helvetica" })
    updateQuotation(id, { status: "accepted" })
    toast.success(`Converted to Invoice ${invoice.invoice_number}`)
    return invoice
  }, [quotations, createInvoice, updateQuotation])

  const createRecurring = useCallback((data: Omit<RecurringInvoice, "id"|"created_at"|"generated_count">) => {
    const item: RecurringInvoice = { ...data, id: generateId(), generated_count: 0, created_at: new Date().toISOString() }
    persistRecurring([item, ...recurring])
    return item
  }, [recurring, persistRecurring])

  const updateRecurring = useCallback((id: string, data: Partial<RecurringInvoice>) => {
    persistRecurring(recurring.map(r => r.id === id ? { ...r, ...data } : r))
  }, [recurring, persistRecurring])

  const deleteRecurring = useCallback((id: string) => { persistRecurring(recurring.filter(r => r.id !== id)) }, [recurring, persistRecurring])

  const saveTemplate = useCallback((data: Omit<BillingTemplate, "id">) => {
    const tpl: BillingTemplate = { ...data, id: generateId(), is_custom: true }
    persistTemplates([...templates, tpl])
    return tpl
  }, [templates, persistTemplates])

  const updateTemplate = useCallback((id: string, data: Partial<BillingTemplate>) => {
    persistTemplates(templates.map(t => t.id === id ? { ...t, ...data } : t))
  }, [templates, persistTemplates])

  const deleteTemplate = useCallback((id: string) => { persistTemplates(templates.filter(t => t.id !== id || !t.is_custom)) }, [templates, persistTemplates])

  const billingStats = {
    totalInvoices: invoices.length,
    pendingInvoices: invoices.filter(i => ["sent","viewed","partially_paid"].includes(i.status)).length,
    paidInvoices: invoices.filter(i => i.status === "paid").length,
    overdueInvoices: invoices.filter(i => i.status === "overdue").length,
    pendingAgreements: agreements.filter(a => ["draft","sent"].includes(a.status)).length,
    activeAgreements: agreements.filter(a => a.status === "signed").length,
    revenueThisMonth: invoices.filter(i => { if (i.status !== "paid") return false; const pe = i.timeline_events.find(e => e.event === "paid"); if (!pe) return false; return pe.timestamp.startsWith(new Date().toISOString().slice(0,7)) }).reduce((s,i) => s + i.grand_total, 0),
  }

  return { invoices, agreements, quotations, recurring, templates, billingStats, createInvoice, updateInvoice, deleteInvoice, duplicateInvoice, markInvoicePaid, createAgreement, updateAgreement, deleteAgreement, createQuotation, updateQuotation, deleteQuotation, convertQuotationToInvoice, createRecurring, updateRecurring, deleteRecurring, saveTemplate, updateTemplate, deleteTemplate, DEFAULT_COMPANY, DEFAULT_TEMPLATES }
}
