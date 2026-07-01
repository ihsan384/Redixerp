import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || supabaseUrl === 'https://dnzhkytalvlkpyiyexwt.supabase.co') {
  console.warn(
    '[REDIX CRM] Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  )
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://dnzhkytalvlkpyiyexwt.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuemhreXRhbHZsa3B5aXlleHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDYyOTYsImV4cCI6MjA5ODMyMjI5Nn0.HT1oSQnrLQXTUG9TXJjhM7T1E8pMF1OoKP8WX7dfKeA'
)
