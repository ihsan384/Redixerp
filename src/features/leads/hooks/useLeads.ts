import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Lead, LeadFormData, LeadStatus } from '@/types'

export function useLeads(filters?: {
  search?: string
  category?: string
  status?: LeadStatus
  assignedTo?: string
}) {
  const queryClient = useQueryClient()

  // Fetch Leads Query
  const leadsQuery = useQuery({
    queryKey: ['leads', filters],
    queryFn: async (): Promise<Lead[]> => {
      // Supabase mode
      let query = supabase.from('leads').select('*, assigned_employee:employees(*)')

      if (filters?.search) {
        query = query.or(
          `shop_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
        )
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.assignedTo && filters.assignedTo !== 'all') {
        query = query.eq('assigned_to', filters.assignedTo)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as Lead[]
    },
  })

  // Add Lead Mutation
  const addLeadMutation = useMutation({
    mutationFn: async (formData: LeadFormData): Promise<Lead> => {
      // Supabase
      const { data: duplicate } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', formData.phone)
        .maybeSingle()

      if (duplicate) {
        throw new Error('A business with this phone number already exists.')
      }

      const { data, error } = await supabase.from('leads').insert(formData as never).select().single()
      if (error) throw error
      return data as unknown as Lead
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  // Update Lead Mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: Partial<Lead> }): Promise<Lead> => {
      // Supabase
      const { data, error } = await supabase
        .from('leads')
        .update({ ...updateData, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Lead
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  // Import Leads Bulk Mutation
  const importLeadsMutation = useMutation({
    mutationFn: async (newLeads: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[]): Promise<number> => {
      // Supabase bulk import with duplicate resolution logic
      // First get existing phones
      const { data: existingPhonesData, error: fetchErr } = await supabase
        .from('leads')
        .select('phone')
      if (fetchErr) throw fetchErr

      const existingPhones = new Set(existingPhonesData.map((l) => l.phone))
      const leadsToInsert = newLeads
        .filter((l) => !existingPhones.has(l.phone))
        .map((l) => ({
          ...l,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

      if (leadsToInsert.length === 0) return 0

      const { error } = await supabase.from('leads').insert(leadsToInsert as never)
      if (error) throw error
      return leadsToInsert.length
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  return {
    leads: leadsQuery.data || [],
    isLoading: leadsQuery.isLoading,
    isError: leadsQuery.isError,
    addLead: addLeadMutation.mutateAsync,
    isAdding: addLeadMutation.isPending,
    updateLead: updateLeadMutation.mutateAsync,
    isUpdating: updateLeadMutation.isPending,
    importLeads: importLeadsMutation.mutateAsync,
    isImporting: importLeadsMutation.isPending,
  }
}
