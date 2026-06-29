import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Employee } from '@/types'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  employee: Employee | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo mode: when Supabase is not configured, use a mock user
const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                  !import.meta.env.VITE_SUPABASE_URL

const DEMO_EMPLOYEE: Employee = {
  id: 'demo-user-001',
  name: 'Ihsan',
  email: 'ihsan@redix.media',
  role: 'admin',
  created_at: new Date().toISOString(),
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (DEMO_MODE) {
      // Auto-login in demo mode
      setEmployee(DEMO_EMPLOYEE)
      setIsLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchEmployee(s.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchEmployee(s.user.id)
      } else {
        setEmployee(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchEmployee(userId: string) {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('id', userId)
      .single()
    setEmployee(data as Employee | null)
    setIsLoading(false)
  }

  async function signIn(email: string, password: string) {
    if (DEMO_MODE) {
      setEmployee(DEMO_EMPLOYEE)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  async function signUp(email: string, password: string, name: string, role = 'sales_rep') {
    if (DEMO_MODE) {
      setEmployee(DEMO_EMPLOYEE)
      return { error: null }
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      await supabase.from('employees').insert({
        id: data.user.id,
        name,
        email,
        role,
      } as never)
    }
    return { error: error as Error | null }
  }

  async function signOut() {
    if (DEMO_MODE) {
      // In demo mode, do nothing — keep logged in
      return
    }
    await supabase.auth.signOut()
    setEmployee(null)
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, employee, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
