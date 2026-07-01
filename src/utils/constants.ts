import type { LeadStatus, CallOutcome, EmployeeRole, ExpenseCategory, PaymentStatus, PaymentMethod } from '@/types'

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  called: 'Called',
  no_answer: 'No Answer',
  busy: 'Busy',
  interested: 'Interested',
  not_interested: 'Not Interested',
  already_has_website: 'Has Website',
  call_later: 'Call Later',
  wrong_number: 'Wrong Number',
  owner_not_available: 'Owner Unavailable',
  meeting_scheduled: 'Meeting Scheduled',
  converted: 'Converted',
  lost: 'Lost',
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  called: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  no_answer: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  busy: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  interested: 'bg-green-500/10 text-green-400 border-green-500/20',
  not_interested: 'bg-red-500/10 text-red-400 border-red-500/20',
  already_has_website: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  call_later: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  wrong_number: 'bg-red-500/10 text-red-400 border-red-500/20',
  owner_not_available: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  meeting_scheduled: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  converted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  lost: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  connected: 'Connected',
  busy: 'Busy',
  no_answer: 'No Answer',
  rejected: 'Rejected',
  switched_off: 'Switched Off',
  interested: 'Interested',
  very_interested: 'Very Interested',
  meeting_scheduled: 'Meeting Scheduled',
  demo_booked: 'Demo Booked',
  proposal_sent: 'Proposal Sent',
  follow_up_later: 'Follow Up Later',
  converted: 'Converted',
  wrong_number: 'Wrong Number',
  spam: 'Spam',
  not_interested: 'Not Interested',
  already_has_website: 'Has Website',
  call_later: 'Call Later',
  owner_not_available: 'Owner Unavailable',
}

export const EMPLOYEE_ROLE_LABELS: Record<EmployeeRole, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  designer: 'Designer',
  developer: 'Developer',
  sales_rep: 'Sales Rep',
  finance: 'Finance',
  viewer: 'Viewer',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  office: 'Office',
  salary: 'Salary',
  internet: 'Internet',
  electricity: 'Electricity',
  hosting: 'Hosting',
  domain: 'Domain',
  software: 'Software Subscription',
  travel: 'Travel',
  marketing: 'Marketing',
  equipment: 'Equipment',
  domains: 'Domains',
  advertisements: 'Advertisements',
  food: 'Food',
  miscellaneous: 'Miscellaneous',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  partial: 'Partial Payment',
  pending: 'Pending',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  partial: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  pending: 'bg-red-500/15 text-red-400 border-red-500/20',
  overdue: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  cancelled: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  refunded: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  card: 'Card Payment',
  online: 'Online Gateway',
  other: 'Other',
}

export const LEAD_CATEGORIES = [
  'Restaurant',
  'Retail',
  'Healthcare',
  'Real Estate',
  'Education',
  'Technology',
  'Construction',
  'Automotive',
  'Beauty & Salon',
  'Fitness & Gym',
  'Legal',
  'Finance',
  'Travel & Tourism',
  'Food & Beverage',
  'Manufacturing',
  'E-commerce',
  'Consulting',
  'Other',
]

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/' },
  { id: 'leads', label: 'Leads', icon: 'Users', path: '/leads' },
  { id: 'call-center', label: 'Call Center', icon: 'Phone', path: '/call-center' },
  { id: 'call-history', label: 'Call History', icon: 'History', path: '/call-history' },
  { id: 'followups', label: 'Follow Ups', icon: 'CalendarClock', path: '/follow-ups' },
  { id: 'clients', label: 'Clients', icon: 'Briefcase', path: '/clients' },
  { id: 'revenue', label: 'Finance Hub', icon: 'Landmark', path: '/revenue' },
  { id: 'expenses', label: 'Expenses', icon: 'Receipt', path: '/expenses' },
  { id: 'reports', label: 'Reports', icon: 'BarChart3', path: '/reports' },
  { id: 'team', label: 'Team', icon: 'UserCheck', path: '/team' },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
]
