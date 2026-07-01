// ============================================================
// Enums
// ============================================================

export type LeadStatus =
  | 'new'
  | 'called'
  | 'no_answer'
  | 'busy'
  | 'interested'
  | 'not_interested'
  | 'already_has_website'
  | 'call_later'
  | 'wrong_number'
  | 'owner_not_available'
  | 'meeting_scheduled'
  | 'converted'
  | 'lost'

export type CallOutcome =
  | 'connected'
  | 'busy'
  | 'no_answer'
  | 'rejected'
  | 'switched_off'
  | 'interested'
  | 'very_interested'
  | 'meeting_scheduled'
  | 'demo_booked'
  | 'proposal_sent'
  | 'follow_up_later'
  | 'converted'
  | 'wrong_number'
  | 'spam'
  | 'not_interested'
  | 'already_has_website'
  | 'call_later'
  | 'owner_not_available'

export type EmployeeRole = 'admin' | 'sales_manager' | 'designer' | 'developer' | 'sales_rep' | 'finance' | 'viewer'

export type ActivityType =
  | 'call'
  | 'follow_up'
  | 'note'
  | 'status_change'
  | 'meeting'
  | 'converted'
  | 'import'

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'online' | 'upi' | 'cheque' | 'other'

export type ExpenseCategory =
  | 'office'
  | 'salary'
  | 'internet'
  | 'electricity'
  | 'hosting'
  | 'domain'
  | 'software'
  | 'travel'
  | 'marketing'
  | 'equipment'
  | 'domains'
  | 'advertisements'
  | 'food'
  | 'miscellaneous'

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'

// ============================================================
// Core Entities
// ============================================================

export interface Employee {
  id: string
  name: string
  email: string
  role: EmployeeRole
  avatar_url?: string
  is_active?: boolean
  created_at: string
  updated_at?: string
}

export interface Lead {
  id: string
  shop_name: string
  category: string
  phone: string
  website?: string
  address?: string
  rating?: number
  status: LeadStatus
  assigned_to?: string
  assigned_employee?: Employee
  notes?: string
  created_at: string
  updated_at: string
}

export interface Call {
  id: string
  lead_id: string
  lead?: Lead
  employee_id: string
  employee?: Employee
  start_time: string
  end_time?: string
  duration_seconds?: number
  outcome: CallOutcome
  notes?: string
  follow_up: boolean
  follow_up_date?: string
  follow_up_time?: string
  follow_up_reminder?: string
  direction?: 'incoming' | 'outgoing'
  priority?: 'low' | 'medium' | 'high'
  status?: 'completed' | 'missed' | 'voicemail'
  recording_url?: string
  voice_note_url?: string
  tags?: string[]
  created_at: string
}

export interface Activity {
  id: string
  lead_id: string
  employee_id?: string
  employee?: Employee
  type: ActivityType
  description: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Revenue {
  id: string
  lead_id: string
  lead?: Lead
  package: string
  amount: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  received_date: string
  notes?: string
  created_at: string
  // Extended finance fields (added via finance_migration.sql)
  invoice_number?: string
  total_project_amount?: number
  transaction_id?: string
  received_by?: string
  due_date?: string
}

export interface Expense {
  id: string
  title: string
  category: ExpenseCategory
  amount: number
  payment_method: PaymentMethod
  date: string
  notes?: string
  employee_id?: string
  employee?: Employee
  paid_by?: string
  created_at: string
}

export interface Invoice {
  id: string
  lead_id: string
  lead?: Lead
  invoice_number: string
  issue_date: string
  due_date?: string
  total_amount: number
  discount?: number
  gst?: number
  status: InvoiceStatus
  notes?: string
  created_at: string
}

export interface Partner {
  id: string
  name: string
  share_percentage: number
  share_fixed?: number
  is_active: boolean
  created_at: string
}

export interface PartnerPayout {
  id: string
  partner_id: string
  partner?: Partner
  amount: number
  period_start?: string
  period_end?: string
  status: 'pending' | 'paid'
  paid_date?: string
  notes?: string
  created_at: string
}

export interface ClientFinancialSummary {
  lead: Lead
  totalProjectValue: number
  totalPaid: number
  remainingBalance: number
  lastPaymentDate?: string
  dueDate?: string
  paymentStatus: PaymentStatus
  transactions: Revenue[]
  invoices: Invoice[]
}

// ============================================================
// Dashboard Stats
// ============================================================

export interface DashboardStats {
  totalLeads: number
  todaysCalls: number
  pendingCalls: number
  followUpToday: number
  interestedClients: number
  notInterested: number
  closedDeals: number
  revenueThisMonth: number
  expensesThisMonth: number
  profit: number
}

export interface FinanceDashboardStats {
  grossRevenue: number
  collectedRevenue: number
  outstandingBalance: number
  monthlyExpenses: number
  netProfit: number
  partnerSharePending: number
  overdueInvoices: number
  invoicesThisMonth: number
}

// ============================================================
// Table / Filter Types
// ============================================================

export interface LeadFilters {
  search?: string
  category?: string
  status?: LeadStatus
  assignedTo?: string
  page?: number
  pageSize?: number
}

export interface CallFilters {
  leadId?: string
  employeeId?: string
  outcome?: CallOutcome
  dateFrom?: string
  dateTo?: string
}

// ============================================================
// Form Input Types
// ============================================================

export interface LeadFormData {
  shop_name: string
  category: string
  phone: string
  website?: string
  address?: string
  rating?: number
  status: LeadStatus
  assigned_to?: string
  notes?: string
}

export interface CallFormData {
  lead_id: string
  outcome: CallOutcome
  notes?: string
  follow_up: boolean
  follow_up_date?: string
  follow_up_time?: string
  follow_up_reminder?: string
  duration_seconds?: number
}

export interface ExpenseFormData {
  title: string
  category: ExpenseCategory
  amount: number
  payment_method: PaymentMethod
  date: string
  notes?: string
  paid_by?: string
}

export interface RevenueFormData {
  lead_id: string
  package: string
  amount: number
  total_project_amount?: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  received_date: string
  invoice_number?: string
  transaction_id?: string
  received_by?: string
  due_date?: string
  notes?: string
}

// ============================================================
// Billing Module Types
// ============================================================

export type BillingInvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled'

export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'

export type RecurringFrequency = 'monthly' | 'quarterly' | 'yearly' | 'custom'

export type InvoiceTemplateStyle =
  | 'modern'
  | 'minimal'
  | 'corporate'
  | 'premium_dark'
  | 'agency'

export type AgreementTemplateType =
  | 'website_development'
  | 'software_development'
  | 'erp_development'
  | 'maintenance_contract'
  | 'seo_contract'
  | 'social_media'
  | 'graphic_design'
  | 'video_editing'
  | 'amc'
  | 'custom'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_percent: number
  amount: number
}

export interface InvoiceCompany {
  name: string
  address: string
  gst_number: string
  phone: string
  email: string
  website: string
  bank_name: string
  bank_account: string
  bank_ifsc: string
  upi_id: string
  logo_url?: string
}

export interface InvoiceClient {
  name: string
  company: string
  phone: string
  email: string
  address: string
  gst_number: string
  project_name: string
  lead_id?: string
}

export interface InvoiceSignature {
  type: 'draw' | 'type' | 'upload'
  data: string
  name: string
  signed_at: string
  ip_address?: string
}

export interface BillingInvoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  status: BillingInvoiceStatus
  template_style: InvoiceTemplateStyle
  company: InvoiceCompany
  client: InvoiceClient
  items: InvoiceItem[]
  subtotal: number
  total_discount: number
  total_tax: number
  additional_charges: number
  additional_charges_label: string
  advance_paid: number
  grand_total: number
  balance_due: number
  payment_method?: string
  notes?: string
  terms?: string
  primary_color: string
  secondary_color: string
  font_family: string
  timeline_events: InvoiceTimelineEvent[]
  created_at: string
  updated_at: string
}

export interface InvoiceTimelineEvent {
  id: string
  event: 'created' | 'sent' | 'viewed' | 'reminder_sent' | 'partially_paid' | 'paid' | 'closed' | 'voided'
  timestamp: string
  note?: string
}

export interface AgreementSection {
  id: string
  title: string
  content: string
  order: number
  enabled: boolean
}

export interface Agreement {
  id: string
  agreement_number: string
  template_type: AgreementTemplateType
  client_name: string
  client_company: string
  client_email: string
  client_phone: string
  start_date: string
  end_date: string
  project_value: number
  advance_amount: number
  balance_amount: number
  delivery_timeline: string
  payment_schedule: string
  sections: AgreementSection[]
  company: InvoiceCompany
  client_signature?: InvoiceSignature
  company_signature?: InvoiceSignature
  status: 'draft' | 'sent' | 'signed' | 'expired' | 'terminated'
  created_at: string
  updated_at: string
}

export interface Quotation {
  id: string
  quotation_number: string
  quotation_date: string
  valid_until: string
  status: QuotationStatus
  template_style: InvoiceTemplateStyle
  company: InvoiceCompany
  client: InvoiceClient
  items: InvoiceItem[]
  subtotal: number
  total_discount: number
  total_tax: number
  additional_charges: number
  additional_charges_label: string
  grand_total: number
  notes?: string
  terms?: string
  primary_color: string
  created_at: string
  updated_at: string
}

export interface RecurringInvoice {
  id: string
  name: string
  frequency: RecurringFrequency
  custom_days?: number
  start_date: string
  end_date?: string
  next_generation_date: string
  is_active: boolean
  template: Omit<BillingInvoice, 'id' | 'invoice_number' | 'invoice_date' | 'due_date' | 'created_at' | 'updated_at' | 'timeline_events'>
  generated_count: number
  created_at: string
}

export interface BillingTemplate {
  id: string
  name: string
  description: string
  style: InvoiceTemplateStyle
  primary_color: string
  secondary_color: string
  font_family: string
  is_default: boolean
  is_custom: boolean
  company?: Partial<InvoiceCompany>
  footer_text?: string
}
