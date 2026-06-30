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
  forgotPassword: (email: string) => Promise<{ error: Error | null }>
  resetPassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchOrCreateEmployee(s.user)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchOrCreateEmployee(s.user)
      } else {
        setEmployee(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchOrCreateEmployee(authUser: User) {
    try {
      // Try to fetch existing profile
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (data) {
        setEmployee(data as Employee)
      } else if (error && error.code === 'PGRST116') {
        // Profile doesn't exist — auto-create (fallback if trigger didn't fire)
        const name = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
        const newProfile = {
          id: authUser.id,
          name,
          email: authUser.email ?? '',
          role: 'sales_rep',
        }
        const { data: created, error: insertErr } = await supabase
          .from('employees')
          .insert(newProfile as never)
          .select()
          .single()
        if (insertErr) {
          console.error('Failed to create employee profile:', insertErr)
        }
        setEmployee(created as Employee | null)
      } else if (error) {
        console.error('Failed to fetch employee:', error)
      }
    } catch (err) {
      console.error('Auth profile error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  async function signUp(email: string, password: string, name: string, role = 'sales_rep') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role },
      },
    })
    if (!error && data.user) {
      // The trigger should create the profile automatically.
      // If not, fetchOrCreateEmployee will handle it on next auth state change.
    }
    return { error: error as Error | null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setEmployee(null)
    setUser(null)
    setSession(null)
  }

  async function forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error as Error | null }
  }

  async function resetPassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error as Error | null }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, employee, isLoading, signIn, signUp, signOut, forgotPassword, resetPassword }}
    >
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
