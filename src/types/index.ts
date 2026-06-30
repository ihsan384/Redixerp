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

export type EmployeeRole = 'admin' | 'sales_manager' | 'designer' | 'developer' | 'sales_rep' | 'finance' | 'viewer'

export type ActivityType =
  | 'call'
  | 'follow_up'
  | 'note'
  | 'status_change'
  | 'meeting'
  | 'converted'
  | 'import'

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'online' | 'other'

export type ExpenseCategory =
  | 'software'
  | 'hosting'
  | 'domains'
  | 'advertisements'
  | 'travel'
  | 'food'
  | 'office'
  | 'salary'
  | 'miscellaneous'

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
  created_at: string
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
}

export interface RevenueFormData {
  lead_id: string
  package: string
  amount: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  received_date: string
  notes?: string
}
