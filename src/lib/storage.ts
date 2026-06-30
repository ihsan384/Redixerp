import type { Lead, Call, Activity, Revenue, Expense, Employee } from '@/types'

// Setup initial data if not present
const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'demo-user-001', name: 'Ihsan', email: 'ihsan@redix.media', role: 'admin', created_at: new Date().toISOString() }
]

const INITIAL_LEADS: Lead[] = []

const INITIAL_CALLS: Call[] = []

const INITIAL_ACTIVITIES: Activity[] = []

const INITIAL_REVENUE: Revenue[] = []

const INITIAL_EXPENSES: Expense[] = []


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
