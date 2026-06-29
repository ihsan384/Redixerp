import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useLeads } from '../hooks/useLeads'
import { Storage } from '@/lib/storage'
import { LEAD_CATEGORIES, LEAD_STATUS_LABELS } from '@/utils/constants'
import type { LeadStatus } from '@/types'
import { toast } from 'sonner'

const leadSchema = z.object({
  shop_name: z.string().min(1, 'Business name is required'),
  category: z.string().min(1, 'Category is required'),
  phone: z.string().min(6, 'Phone number must be at least 6 digits'),
  website: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  rating: z.coerce.number().min(0).max(5).optional(),
  status: z.string().min(1) as z.Schema<LeadStatus>,
  assigned_to: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type LeadFormValues = z.infer<typeof leadSchema>

interface AddLeadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddLeadModal({ isOpen, onClose }: AddLeadModalProps) {
  const { addLead, isAdding } = useLeads()
  const employees = Storage.getEmployees()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      shop_name: '',
      category: 'Restaurant',
      phone: '',
      website: '',
      address: '',
      rating: 4.0,
      status: 'new',
      assigned_to: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const onSubmit = async (data: LeadFormValues) => {
    try {
      await addLead({
        shop_name: data.shop_name,
        category: data.category,
        phone: data.phone,
        website: data.website || undefined,
        address: data.address || undefined,
        rating: data.rating || undefined,
        status: data.status,
        assigned_to: data.assigned_to || undefined,
        notes: data.notes || undefined,
      })
      toast.success('Lead added successfully')
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add lead'
      toast.error(message)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative w-full max-w-2xl bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
              <h3 className="text-base font-semibold text-white">Add New Business Lead</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#636363] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Shop Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#8c8c8c]">Business Name *</label>
                  <input
                    type="text"
                    {...register('shop_name')}
                    placeholder="e.g. Cafe Lahore"
                    className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:border-white/20 outline-none transition-colors"
                  />
                  {errors.shop_name && (
                    <p className="text-[11px] text-red-500">{errors.shop_name.message}</p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#8c8c8c]">Category *</label>
                  <select
                    {...register('category')}
                    className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/20 transition-colors"
                  >
                    {LEAD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#8c8c8c]">Phone Number *</label>
                  <input
                    type="text"
                    {...register('phone')}
                    placeholder="e.g. 03001234567"
                    className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:border-white/20 outline-none transition-colors"
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                {/* Website */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#8c8c8c]">Website URL</label>
                  <input
                    type="text"
                    {...register('website')}
                    placeholder="e.g. shopname.com"
                    className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:border-white/20 outline-none transition-colors"
                  />
                </div>

                {/* Google Rating */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#8c8c8c]">Google Rating (0 - 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('rating')}
                    placeholder="e.g. 4.5"
                    className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:border-white/20 outline-none transition-colors"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#8c8c8c]">Status</label>
                  <select
                    {...register('status')}
                    className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/20 transition-colors"
                  >
                    {Object.entries(LEAD_STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned To */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-[#8c8c8c]">Assign Employee</label>
                  <select
                    {...register('assigned_to')}
                    className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/20 transition-colors"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-[#8c8c8c]">Address</label>
                  <input
                    type="text"
                    {...register('address')}
                    placeholder="e.g. Plot 12, Gulberg, Lahore"
                    className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:border-white/20 outline-none transition-colors"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-[#8c8c8c]">Initial Notes</label>
                  <textarea
                    rows={3}
                    {...register('notes')}
                    placeholder="Add brief details about this business..."
                    className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:border-white/20 outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f1f1f]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#1f1f1f] bg-[#111111] text-xs font-medium text-[#8c8c8c] hover:text-white rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 bg-white text-black text-xs font-medium rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center min-w-[80px]"
                >
                  {isAdding ? 'Saving...' : 'Add Lead'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}