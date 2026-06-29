export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['employees']['Insert']>
      }
      leads: {
        Row: {
          id: string
          shop_name: string
          category: string
          phone: string
          website: string | null
          address: string | null
          rating: number | null
          status: string
          assigned_to: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      calls: {
        Row: {
          id: string
          lead_id: string
          employee_id: string
          start_time: string
          end_time: string | null
          duration_seconds: number | null
          outcome: string
          notes: string | null
          follow_up: boolean
          follow_up_date: string | null
          follow_up_time: string | null
          follow_up_reminder: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['calls']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['calls']['Insert']>
      }
      activities: {
        Row: {
          id: string
          lead_id: string
          employee_id: string | null
          type: string
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['activities']['Insert']>
      }
      revenue: {
        Row: {
          id: string
          lead_id: string
          package: string
          amount: number
          payment_status: string
          payment_method: string
          received_date: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['revenue']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['revenue']['Insert']>
      }
      expenses: {
        Row: {
          id: string
          title: string
          category: string
          amount: number
          payment_method: string
          date: string
          notes: string | null
          employee_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
