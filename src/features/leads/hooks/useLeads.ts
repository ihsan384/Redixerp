import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Storage } from '@/lib/storage'
import type { Lead, LeadFormData, LeadStatus } from '@/types'

const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                  !import.meta.env.VITE_SUPABASE_URL

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
      if (DEMO_MODE) {
        let leads = Storage.getLeads()
        const employees = Storage.getEmployees()

        // Apply filters
        if (filters?.search) {
          const s = filters.search.toLowerCase()
          leads = leads.filter(
            (l) =>
              l.shop_name.toLowerCase().includes(s) ||
              l.phone.includes(s) ||
              l.category.toLowerCase().includes(s) ||
              (l.website && l.website.toLowerCase().includes(s))
          )
        }
        if (filters?.category && filters.category !== 'all') {
          leads = leads.filter((l) => l.category === filters.category)
        }
        if (filters?.status && filters.status !== 'all') {
          leads = leads.filter((l) => l.status === filters.status)
        }
        if (filters?.assignedTo && filters.assignedTo !== 'all') {
          leads = leads.filter((l) => l.assigned_to === filters.assignedTo)
        }

        // Map assigned employee
        return leads.map((l) => ({
          ...l,
          assigned_employee: employees.find((e) => e.id === l.assigned_to),
        }))
      }

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
      const newLead: Lead = {
        id: DEMO_MODE ? `lead-${Date.now()}` : '',
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (DEMO_MODE) {
        const leads = Storage.getLeads()
        // Duplicate check on phone
        if (leads.some((l) => l.phone === newLead.phone)) {
          throw new Error('A business with this phone number already exists.')
        }
        leads.unshift(newLead)
        Storage.saveLeads(leads)
        return newLead
      }

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
      if (DEMO_MODE) {
        const leads = Storage.getLeads()
        const index = leads.findIndex((l) => l.id === id)
        if (index === -1) throw new Error('Lead not found')
        const updated = { ...leads[index], ...updateData, updated_at: new Date().toISOString() }
        leads[index] = updated
        Storage.saveLeads(leads)
        return updated
      }

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
      if (DEMO_MODE) {
        const existingLeads = Storage.getLeads()
        const existingPhones = new Set(existingLeads.map((l) => l.phone))

        let importedCount = 0
        const leadsToInsert: Lead[] = []

        newLeads.forEach((lead) => {
          if (!existingPhones.has(lead.phone)) {
            leadsToInsert.push({
              ...lead,
              id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            existingPhones.add(lead.phone)
            importedCount++
          }
        })

        Storage.saveLeads([...leadsToInsert, ...existingLeads])
        return importedCount
      }

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
