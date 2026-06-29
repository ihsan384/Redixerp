import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Globe, MessageSquare, MapPin, Star, Calendar, CalendarClock, History, Edit3, Save } from 'lucide-react'
import type { Lead, Activity, Employee } from '@/types'
import { Storage } from '@/lib/storage'
import { LEAD_CATEGORIES, LEAD_STATUS_LABELS } from '@/utils/constants'
import { LeadStatusBadge } from './LeadStatusBadge'
import { useLeads } from '../hooks/useLeads'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface LeadDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead | null
}

export function LeadDetailDrawer({ isOpen, onClose, lead }: LeadDetailDrawerProps) {
  const navigate = useNavigate()
  const { updateLead } = useLeads()
  const [activities, setActivities] = useState<Activity[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isEditing, setIsEditing] = useState(false)

  // Edit states
  const [shopName, setShopName] = useState('')
  const [category, setCategory] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')
  const [rating, setRating] = useState(0)
  const [assignedTo, setAssignedTo] = useState('')

  useEffect(() => {
    if (lead) {
      // Load details
      setShopName(lead.shop_name)
      setCategory(lead.category)
      setPhone(lead.phone)
      setWebsite(lead.website || '')
      setAddress(lead.address || '')
      setRating(lead.rating || 0)
      setAssignedTo(lead.assigned_to || '')
      setIsEditing(false)

      // Fetch activities & employees
      const acts = Storage.getActivities()
        .filter((a) => a.lead_id === lead.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setActivities(acts)
      setEmployees(Storage.getEmployees())
    }
  }, [lead, isOpen])

  if (!lead) return null

  const handleSave = async () => {
    try {
      await updateLead({
        id: lead.id,
        data: {
          shop_name: shopName,
          category,
          phone,
          website: website || undefined,
          address: address || undefined,
          rating: rating || undefined,
          assigned_to: assignedTo || undefined,
        },
      })
      toast.success('Lead details updated successfully')
      setIsEditing(false)

      // Log status change activity if changed (implicitly or explicitly handled, but here just log edit)
      const newAct: Activity = {
        id: `act-${Date.now()}`,
        lead_id: lead.id,
        type: 'note',
        description: `Lead details updated manually.`,
        created_at: new Date().toISOString(),
      }
      const allActs = [newAct, ...Storage.getActivities()]
      Storage.saveActivities(allActs)
      setActivities(allActs.filter((a) => a.lead_id === lead.id))
    } catch (err: unknown) {
      toast.error('Failed to update lead')
    }
  }

  // Quick Action triggers
  const handleCall = () => {
    onClose()
    navigate(`/call-center?leadId=${lead.id}`)
  }

  const handleWhatsApp = () => {
    const formattedPhone = phone.replace(/[^0-9]/g, '')
    // Standard Pakistan phone redirect or general whatsapp api
    window.open(`https://wa.me/${formattedPhone}`, '_blank')
  }

  const handleMaps = () => {
    const query = encodeURIComponent(`${shopName} ${address}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Sheet container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-lg bg-[#0d0d0d] border-l border-[#1f1f1f] text-white flex flex-col h-full shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#1f1f1f] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <LeadStatusBadge status={lead.status} size="sm" />
                  <span className="text-xs text-[#636363]">Lead Details</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 rounded-lg bg-[#141414] border border-[#1f1f1f] hover:border-white/20 text-[#8c8c8c] hover:text-white transition-colors"
                    title={isEditing ? 'Cancel Edit' : 'Edit Lead'}
                  >
                    {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/5 text-[#8c8c8c] hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Details Section */}
                <div className="space-y-4 bg-[#111111]/30 border border-[#1f1f1f] rounded-2xl p-5">
                  {isEditing ? (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-semibold text-[#636363]">Shop Name</label>
                        <input
                          type="text"
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-semibold text-[#636363]">Category</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-2 py-1.5 text-xs text-white outline-none focus:border-white/20"
                          >
                            {LEAD_CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-semibold text-[#636363]">Phone</label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-semibold text-[#636363]">Website</label>
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-semibold text-[#636363]">Address</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-semibold text-[#636363]">Google Rating</label>
                          <input
                            type="number"
                            step="0.1"
                            value={rating}
                            onChange={(e) => setRating(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-semibold text-[#636363]">Assign Employee</label>
                          <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-2 py-1.5 text-xs text-white outline-none focus:border-white/20"
                          >
                            <option value="">Unassigned</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={handleSave}
                        className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-white text-black text-xs font-semibold rounded-xl hover:bg-neutral-200 transition-all"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-white mb-1">{lead.shop_name}</h3>
                      <p className="text-xs text-[#8c8c8c] font-medium">{lead.category}</p>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-y-4 mt-6 text-xs border-t border-[#1f1f1f] pt-4">
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-[#525252] mb-1">Phone</p>
                          <p className="text-white font-medium">{lead.phone}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-[#525252] mb-1">Rating</p>
                          <p className="text-white font-medium flex items-center gap-1">
                            {lead.rating ? (
                              <>
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span>{lead.rating.toFixed(1)} / 5.0</span>
                              </>
                            ) : (
                              '--'
                            )}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase font-semibold text-[#525252] mb-1">Website</p>
                          {lead.website ? (
                            <a
                              href={`https://${lead.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-white hover:underline flex items-center gap-1"
                            >
                              {lead.website} <Globe className="w-3 h-3 text-[#636363]" />
                            </a>
                          ) : (
                            <p className="text-[#636363]">No website configured</p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase font-semibold text-[#525252] mb-1">Address</p>
                          <p className="text-white leading-relaxed">{lead.address || 'No address logged'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-[#525252] mb-1">Assigned Employee</p>
                          <p className="text-white font-medium">
                            {employees.find((e) => e.id === lead.assigned_to)?.name || 'Unassigned'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-[#525252] mb-1">Date Created</p>
                          <p className="text-white font-medium">
                            {format(new Date(lead.created_at), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions Panel */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={handleCall}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#1f1f1f] bg-[#111111]/40 hover:border-white/10 text-white transition-all gap-1.5"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] text-[#8c8c8c]">Call</span>
                  </button>
                  <button
                    onClick={handleWhatsApp}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#1f1f1f] bg-[#111111]/40 hover:border-white/10 text-white transition-all gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] text-[#8c8c8c]">WhatsApp</span>
                  </button>
                  <button
                    onClick={handleMaps}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#1f1f1f] bg-[#111111]/40 hover:border-white/10 text-white transition-all gap-1.5"
                  >
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] text-[#8c8c8c]">Maps</span>
                  </button>
                  {lead.website ? (
                    <a
                      href={`https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#1f1f1f] bg-[#111111]/40 hover:border-white/10 text-white transition-all gap-1.5 text-center"
                    >
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] text-[#8c8c8c]">Website</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#1f1f1f] bg-[#111111]/10 text-[#4b5563] cursor-not-allowed gap-1.5"
                    >
                      <Globe className="w-4 h-4" />
                      <span className="text-[10px]">Website</span>
                    </button>
                  )}
                </div>

                {/* Timeline Feed */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#8c8c8c]" /> Interaction Timeline
                  </h4>

                  {activities.length === 0 ? (
                    <p className="text-xs text-[#525252] italic p-4 text-center border border-[#1f1f1f] rounded-xl border-dashed">
                      No interactions recorded yet. Put a call to start tracking history.
                    </p>
                  ) : (
                    <div className="relative border-l border-[#1f1f1f] ml-2.5 pl-6 space-y-5">
                      {activities.map((act) => (
                        <div key={act.id} className="relative">
                          {/* Dot indicator */}
                          <div className={`absolute -left-[30px] w-2.5 h-2.5 rounded-full border bg-[#0d0d0d] ${
                            act.type === 'converted' ? 'border-emerald-500 bg-emerald-500/20' :
                            act.type === 'call' ? 'border-blue-500 bg-blue-500/20' :
                            act.type === 'follow_up' ? 'border-yellow-500 bg-yellow-500/20' :
                            'border-[#636363] bg-[#141414]'
                          }`} />

                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-white capitalize">{act.type.replace('_', ' ')}</span>
                              <span className="text-[10px] text-[#525252]">
                                {format(new Date(act.created_at), 'dd MMM hh:mm a')}
                              </span>
                            </div>
                            <p className="text-xs text-[#8c8c8c] leading-relaxed">{act.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
