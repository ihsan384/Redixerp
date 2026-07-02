import { createClient as supabaseCreateClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { Storage } from './storage'

export type DbMode = 'local' | 'supabase'

export function getDbMode(): DbMode {
  return (localStorage.getItem('redix_db_mode') as DbMode) || 'local'
}

export function setDbMode(mode: DbMode) {
  localStorage.setItem('redix_db_mode', mode)
}

export function getCustomSupabaseConfig() {
  return {
    url: localStorage.getItem('redix_supabase_url') || '',
    anonKey: localStorage.getItem('redix_supabase_anon_key') || '',
  }
}

export function setCustomSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem('redix_supabase_url', url)
  localStorage.setItem('redix_supabase_anon_key', anonKey)
}

// Check environment defaults
const envUrl = import.meta.env.VITE_SUPABASE_URL as string
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export function getActiveSupabaseUrl(): string {
  if (getDbMode() === 'local') {
    return 'https://dnzhkytalvlkpyiyexwt.supabase.co'
  }
  const custom = getCustomSupabaseConfig()
  return custom.url || envUrl || 'https://dnzhkytalvlkpyiyexwt.supabase.co'
}

// Mock Query Builder for localStorage
class MockBuilder {
  private tableName: string
  private filters: Array<(item: any) => boolean> = []
  private sortCol: string | null = null
  private sortAscending: boolean = true
  private limitCount: number | null = null

  constructor(tableName: string) {
    this.tableName = tableName
  }

  private getStorageData(): any[] {
    switch (this.tableName) {
      case 'leads': return Storage.getLeads()
      case 'calls': return Storage.getCalls()
      case 'activities': return Storage.getActivities()
      case 'revenue': return Storage.getRevenue()
      case 'expenses': return Storage.getExpenses()
      case 'employees': return Storage.getEmployees()
      default: return []
    }
  }

  private saveStorageData(data: any[]) {
    switch (this.tableName) {
      case 'leads': Storage.saveLeads(data); break
      case 'calls': Storage.saveCalls(data); break
      case 'activities': Storage.saveActivities(data); break
      case 'revenue': Storage.saveRevenue(data); break
      case 'expenses': Storage.saveExpenses(data); break
      case 'employees': Storage.saveEmployees(data); break
    }
  }

  select(columns?: string) {
    return this
  }

  eq(column: string, value: any) {
    this.filters.push((item) => {
      const itemVal = item[column]
      if (itemVal === undefined || itemVal === null) {
        return value === undefined || value === null
      }
      return String(itemVal) === String(value)
    })
    return this
  }

  neq(column: string, value: any) {
    this.filters.push((item) => {
      const itemVal = item[column]
      if (itemVal === undefined || itemVal === null) {
        return value !== undefined && value !== null
      }
      return String(itemVal) !== String(value)
    })
    return this
  }

  ilike(column: string, pattern: string) {
    const cleanPattern = pattern.replace(/%/g, '').toLowerCase()
    this.filters.push((item) => {
      const val = item[column]
      if (val === undefined || val === null) return false
      return String(val).toLowerCase().includes(cleanPattern)
    })
    return this
  }

  or(expr: string) {
    const parts = expr.split(',')
    const conditions = parts.map(part => {
      const subparts = part.split('.')
      const col = subparts[0]?.trim()
      const op = subparts[1]?.trim()
      const val = subparts[2]?.trim()?.replace(/%/g, '') || ''
      return { col, op, val }
    })

    this.filters.push((item) => {
      return conditions.some(cond => {
        const itemVal = item[cond.col]
        if (itemVal === undefined || itemVal === null) return false
        const strVal = String(itemVal).toLowerCase()
        const matchVal = cond.val.toLowerCase()
        if (cond.op === 'ilike') {
          return strVal.includes(matchVal)
        } else if (cond.op === 'eq') {
          return strVal === matchVal
        }
        return false
      })
    })
    return this
  }

  order(column: string, { ascending = true } = {}) {
    this.sortCol = column
    this.sortAscending = ascending
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  async insert(data: any | any[]) {
    const list = this.getStorageData()
    const records = Array.isArray(data) ? data : [data]
    const insertedRecords = records.map(record => {
      const newRecord = {
        id: record.id || `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: record.created_at || new Date().toISOString(),
        updated_at: record.updated_at || new Date().toISOString(),
        ...record
      }
      list.push(newRecord)
      return newRecord
    })

    this.saveStorageData(list)
    
    const responseData = Array.isArray(data) ? insertedRecords : insertedRecords[0]
    return {
      data: responseData,
      error: null,
      select: () => ({
        single: async () => ({ data: Array.isArray(responseData) ? responseData[0] : responseData, error: null }),
        maybeSingle: async () => ({ data: Array.isArray(responseData) ? responseData[0] : responseData, error: null }),
      }),
      single: async () => ({ data: Array.isArray(responseData) ? responseData[0] : responseData, error: null }),
      maybeSingle: async () => ({ data: Array.isArray(responseData) ? responseData[0] : responseData, error: null }),
    } as any
  }

  async update(updateData: any) {
    const list = this.getStorageData()
    let updatedRecord: any = null
    const updatedList = list.map(item => {
      if (this.filters.every(filter => filter(item))) {
        updatedRecord = {
          ...item,
          ...updateData,
          updated_at: new Date().toISOString()
        }
        return updatedRecord
      }
      return item
    })
    this.saveStorageData(updatedList)

    return {
      data: updatedRecord,
      error: null,
      select: () => ({
        single: async () => ({ data: updatedRecord, error: null }),
        maybeSingle: async () => ({ data: updatedRecord, error: null }),
      }),
      single: async () => ({ data: updatedRecord, error: null }),
      maybeSingle: async () => ({ data: updatedRecord, error: null }),
    } as any
  }

  async delete() {
    const list = this.getStorageData()
    const remaining = list.filter(item => !this.filters.every(filter => filter(item)))
    this.saveStorageData(remaining)
    return { data: null, error: null }
  }

  async maybeSingle() {
    const result = await this.execute()
    return { data: result.data[0] || null, error: null }
  }

  async single() {
    const result = await this.execute()
    if (result.data.length === 0) {
      return { data: null, error: { code: 'PGRST116', message: 'No rows found' } }
    }
    return { data: result.data[0], error: null }
  }

  then(onfulfilled?: (value: { data: any[]; error: any }) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute() {
    let list = this.getStorageData()
    for (const filter of this.filters) {
      list = list.filter(filter)
    }
    if (this.sortCol) {
      list.sort((a, b) => {
        const valA = a[this.sortCol!]
        const valB = b[this.sortCol!]
        if (valA === undefined || valA === null) return 1
        if (valB === undefined || valB === null) return -1
        if (valA < valB) return this.sortAscending ? -1 : 1
        if (valA > valB) return this.sortAscending ? 1 : -1
        return 0
      })
    }
    if (this.limitCount !== null) {
      list = list.slice(0, this.limitCount)
    }
    return { data: list, error: null }
  }
}

// Mock Auth system
class MockAuth {
  private listeners: Set<(event: string, session: any) => void> = new Set()

  constructor() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'redix_auth_session') {
        const session = this.getCurrentSession()
        this.notify(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
      }
    })
  }

  private getCurrentSession() {
    const raw = localStorage.getItem('redix_auth_session')
    return raw ? JSON.parse(raw) : null
  }

  private setCurrentSession(session: any) {
    if (session) {
      localStorage.setItem('redix_auth_session', JSON.stringify(session))
    } else {
      localStorage.removeItem('redix_auth_session')
    }
  }

  async getSession() {
    const session = this.getCurrentSession()
    return { data: { session }, error: null }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.add(callback)
    const session = this.getCurrentSession()
    setTimeout(() => callback('INITIAL_SESSION', session), 0)
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback)
          }
        }
      }
    }
  }

  private notify(event: string, session: any) {
    this.listeners.forEach(cb => cb(event, session))
  }

  async signInWithPassword({ email }: { email: string }) {
    const employees = Storage.getEmployees()
    const employee = employees.find(e => e.email.toLowerCase() === email.toLowerCase())
    if (!employee) {
      return { data: { user: null, session: null }, error: new Error('Invalid login credentials') }
    }
    
    const mockUser = {
      id: employee.id,
      email: employee.email,
      user_metadata: {
        full_name: employee.name,
        role: employee.role
      }
    }
    const mockSession = {
      access_token: 'mock-token',
      user: mockUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600
    }
    this.setCurrentSession(mockSession)
    this.notify('SIGNED_IN', mockSession)
    return { data: { user: mockUser, session: mockSession }, error: null }
  }

  async signUp({ email, options }: any) {
    const name = options?.data?.full_name || email.split('@')[0] || 'User'
    const role = options?.data?.role || 'sales_rep'
    const employees = Storage.getEmployees()
    
    if (employees.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      return { data: { user: null }, error: new Error('User already registered') }
    }

    const newEmployee = {
      id: `emp-${Date.now()}`,
      name,
      email,
      role,
      created_at: new Date().toISOString()
    }
    employees.push(newEmployee)
    Storage.saveEmployees(employees)

    const mockUser = {
      id: newEmployee.id,
      email: newEmployee.email,
      user_metadata: {
        full_name: newEmployee.name,
        role: newEmployee.role
      }
    }
    const mockSession = {
      access_token: 'mock-token',
      user: mockUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600
    }
    this.setCurrentSession(mockSession)
    this.notify('SIGNED_IN', mockSession)
    return { data: { user: mockUser, session: mockSession }, error: null }
  }

  async signOut() {
    this.setCurrentSession(null)
    this.notify('SIGNED_OUT', null)
    return { error: null }
  }

  async resetPasswordForEmail() {
    return { data: {}, error: null }
  }

  async updateUser() {
    return { data: { user: {} }, error: null }
  }
}

// Proxy wrapper for the Supabase Client
class ProxySupabase {
  private mockAuth = new MockAuth()

  get auth() {
    if (getDbMode() === 'local') {
      return this.mockAuth
    }
    return getRealSupabase().auth
  }

  from(tableName: string) {
    if (getDbMode() === 'local') {
      return new MockBuilder(tableName)
    }
    return getRealSupabase().from(tableName)
  }
}

let realSupabaseClient: any = null

function getRealSupabase() {
  if (realSupabaseClient) return realSupabaseClient

  const customConfig = getCustomSupabaseConfig()
  const url = customConfig.url || envUrl || 'https://dnzhkytalvlkpyiyexwt.supabase.co'
  const anonKey = customConfig.anonKey || envAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuemhreXRhbHZsa3B5aXlleHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDYyOTYsImV4cCI6MjA5ODMyMjI5Nn0.HT1oSQnrLQXTUG9TXJjhM7T1E8pMF1OoKP8WX7dfKeA'

  realSupabaseClient = supabaseCreateClient<Database>(url, anonKey)
  return realSupabaseClient
}

export const supabase = new ProxySupabase() as any

// Custom createClient function that returns our proxy or delegates to real client creator
export function createClient(supabaseUrl: string, supabaseAnonKey: string, options?: any) {
  if (getDbMode() === 'local') {
    return new ProxySupabase() as any
  }
  return supabaseCreateClient<Database>(supabaseUrl, supabaseAnonKey, options)
}
