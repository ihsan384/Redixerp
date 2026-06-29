import type { Lead, Call, Activity, Revenue, Expense, Employee } from '@/types'

// Setup initial data if not present
const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Ihsan', email: 'ihsan@redix.media', role: 'admin', created_at: new Date().toISOString() },
  { id: 'emp-2', name: 'Zain', email: 'zain@redix.media', role: 'sales_manager', created_at: new Date().toISOString() },
  { id: 'emp-3', name: 'Ayesha', email: 'ayesha@redix.media', role: 'sales_rep', created_at: new Date().toISOString() },
  { id: 'emp-4', name: 'Hamza', email: 'hamza@redix.media', role: 'sales_rep', created_at: new Date().toISOString() }
]

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    shop_name: 'Lahore Broast',
    category: 'Restaurant',
    phone: '03001234567',
    website: 'lahorebroast.com',
    address: 'Gulberg III, Lahore',
    rating: 4.2,
    status: 'new',
    assigned_to: 'emp-3',
    notes: 'Needs a new modern website and Google Maps integration.',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'lead-2',
    shop_name: 'Metro Dental Clinic',
    category: 'Healthcare',
    phone: '03219876543',
    website: '',
    address: 'DHA Phase 5, Lahore',
    rating: 4.8,
    status: 'interested',
    assigned_to: 'emp-4',
    notes: 'Interested in booking system. Sent initial proposal.',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'lead-3',
    shop_name: 'FitGym Premium',
    category: 'Fitness & Gym',
    phone: '03124567890',
    website: 'fitgympremium.pk',
    address: 'Johar Town, Lahore',
    rating: 3.9,
    status: 'meeting_scheduled',
    assigned_to: 'emp-3',
    notes: 'Meeting scheduled for tomorrow at 3:00 PM to finalize contract.',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'lead-4',
    shop_name: 'Kashif Motors',
    category: 'Automotive',
    phone: '03335554433',
    website: 'kashifmotors.com.pk',
    address: 'Saddar, Karachi',
    rating: 4.0,
    status: 'converted',
    assigned_to: 'emp-2',
    notes: 'Converted! Starter package signed. Payment received.',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'lead-5',
    shop_name: 'Glamour Beauty Salon',
    category: 'Beauty & Salon',
    phone: '03009998877',
    website: '',
    address: 'Clifton, Karachi',
    rating: 4.5,
    status: 'no_answer',
    assigned_to: 'emp-4',
    notes: 'Called twice. No answer. Need to call again.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'lead-6',
    shop_name: 'Superior Academy',
    category: 'Education',
    phone: '03456789012',
    website: 'superior.edu.pk',
    address: 'Faisal Town, Lahore',
    rating: 4.1,
    status: 'call_later',
    assigned_to: 'emp-3',
    notes: 'Owner is busy with exams. Asked to call back next week.',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'lead-7',
    shop_name: 'Urban Co-Working',
    category: 'Other',
    phone: '03013334444',
    website: 'urbancowork.pk',
    address: 'Gulberg II, Lahore',
    rating: 4.6,
    status: 'not_interested',
    assigned_to: 'emp-4',
    notes: 'Already has an in-house developer doing their tech work.',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const INITIAL_CALLS: Call[] = [
  {
    id: 'call-1',
    lead_id: 'lead-1',
    employee_id: 'emp-3',
    start_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 3600000).toISOString(),
    end_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 3400000).toISOString(),
    duration_seconds: 200,
    outcome: 'no_answer',
    notes: 'First call, no answer.',
    follow_up: true,
    follow_up_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 3600000).toISOString()
  },
  {
    id: 'call-2',
    lead_id: 'lead-2',
    employee_id: 'emp-4',
    start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 1800000).toISOString(),
    end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 1500000).toISOString(),
    duration_seconds: 180,
    outcome: 'interested',
    notes: 'Interested in website and booking app. Sent proposal deck.',
    follow_up: true,
    follow_up_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow
    follow_up_time: '14:00',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 1800000).toISOString()
  }
]

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    lead_id: 'lead-1',
    employee_id: 'emp-3',
    type: 'call',
    description: 'Call placed. Outcome: No Answer.',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'act-2',
    lead_id: 'lead-2',
    employee_id: 'emp-4',
    type: 'call',
    description: 'Call placed. Outcome: Interested. Proposal sent.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'act-3',
    lead_id: 'lead-4',
    employee_id: 'emp-2',
    type: 'converted',
    description: 'Lead status updated to Converted.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const INITIAL_REVENUE: Revenue[] = [
  {
    id: 'rev-1',
    lead_id: 'lead-4',
    package: 'Starter Package Website',
    amount: 25000,
    payment_status: 'paid',
    payment_method: 'bank_transfer',
    received_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Down payment for Kashif Motors.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'Vercel Pro Plan',
    category: 'hosting',
    amount: 5600, // in PKR roughly
    payment_method: 'card',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Hosting and deployments platform.',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'exp-2',
    title: 'Cursor AI Subscription',
    category: 'software',
    amount: 5600,
    payment_method: 'card',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'AI Copilot for development.',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
]

function getStorageItem<T>(key: string, initialData: T): T {
  const item = localStorage.getItem(key)
  if (!item) {
    localStorage.setItem(key, JSON.stringify(initialData))
    return initialData
  }
  return JSON.parse(item)
}

function setStorageItem<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const Storage = {
  getEmployees: () => getStorageItem<Employee[]>('redix_employees', INITIAL_EMPLOYEES),
  getLeads: () => getStorageItem<Lead[]>('redix_leads', INITIAL_LEADS),
  getCalls: () => getStorageItem<Call[]>('redix_calls', INITIAL_CALLS),
  getActivities: () => getStorageItem<Activity[]>('redix_activities', INITIAL_ACTIVITIES),
  getRevenue: () => getStorageItem<Revenue[]>('redix_revenue', INITIAL_REVENUE),
  getExpenses: () => getStorageItem<Expense[]>('redix_expenses', INITIAL_EXPENSES),

  saveLeads: (leads: Lead[]) => setStorageItem('redix_leads', leads),
  saveCalls: (calls: Call[]) => setStorageItem('redix_calls', calls),
  saveActivities: (activities: Activity[]) => setStorageItem('redix_activities', activities),
  saveRevenue: (revenue: Revenue[]) => setStorageItem('redix_revenue', revenue),
  saveExpenses: (expenses: Expense[]) => setStorageItem('redix_expenses', expenses),
  saveEmployees: (employees: Employee[]) => setStorageItem('redix_employees', employees)
}
