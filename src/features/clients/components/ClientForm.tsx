import { useState } from 'react'
import { X, Briefcase, User, Mail, Phone, Globe, MessageSquare, Shield, DollarSign } from 'lucide-react'
import type { Client, ClientStatus } from '@/types'
import { toast } from 'sonner'

interface ClientFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => void
  client?: Client
}

const INDUSTRIES = [
  'Technology', 'Ecommerce', 'Healthcare', 'Robotics', 'Real Estate',
  'Defense & Energy', 'Finance', 'Logistics', 'Retail', 'Education', 'Other'
]

const STATUSES: { value: ClientStatus; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'active_project', label: 'Active Project' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

export function ClientForm({ isOpen, onClose, onSave, client }: ClientFormProps) {
  const [name, setName] = useState(client?.name || '')
  const [companyName, setCompanyName] = useState(client?.company_name || '')
  const [contactPerson, setContactPerson] = useState(client?.contact_person || '')
  const [email, setEmail] = useState(client?.email || '')
  const [phone, setPhone] = useState(client?.phone || '')
  const [whatsapp, setWhatsapp] = useState(client?.whatsapp || '')
  const [address, setAddress] = useState(client?.address || '')
  const [gstNumber, setGstNumber] = useState(client?.gst_number || '')
  const [website, setWebsite] = useState(client?.website || '')
  const [linkedin, setLinkedin] = useState(client?.social_links?.linkedin || '')
  const [twitter, setTwitter] = useState(client?.social_links?.twitter || '')
  const [industry, setIndustry] = useState(client?.industry || 'Technology')
  const [status, setStatus] = useState<ClientStatus>(client?.status || 'lead')
  const [totalProjectValue, setTotalProjectValue] = useState(client?.total_project_value?.toString() || '0')
  const [advancePaid, setAdvancePaid] = useState(client?.advance_paid?.toString() || '0')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !companyName || !email || !phone) {
      toast.error('Please fill out all required fields')
      return
    }

    const payload = {
      id: client?.id,
      name,
      company_name: companyName,
      contact_person: contactPerson || name,
      email,
      phone,
      whatsapp: whatsapp || undefined,
      address: address || undefined,
      gst_number: gstNumber || undefined,
      website: website || undefined,
      social_links: {
        linkedin: linkedin || undefined,
        twitter: twitter || undefined
      },
      industry,
      status,
      project_progress: client?.project_progress || 0,
      total_project_value: parseFloat(totalProjectValue) || 0,
      advance_paid: parseFloat(advancePaid) || 0
    }

    onSave(payload)
    toast.success(client ? 'Client updated successfully' : 'Client created successfully')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="modal-backdrop" />
      <form
        onSubmit={handleSubmit}
        className="modal-panel z-10 w-full max-w-2xl space-y-4 p-6 overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {client ? 'Edit Client Record' : 'Create Client Profile'}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-500 hover:text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Details */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400">Corporate Details</h4>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Company Name *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="pl-9 w-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Industry *</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full h-11 bg-[#151515] border border-white/[0.08] text-white rounded-xl text-xs font-semibold px-3"
              >
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">GST Number / NTN</label>
              <input
                type="text"
                value={gstNumber}
                onChange={e => setGstNumber(e.target.value)}
                placeholder="e.g. GST-PK-98120"
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Website URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="pl-9 w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Physical Address</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Office location details"
                className="w-full h-20 text-xs py-2"
              />
            </div>
          </div>

          {/* Primary Contact Person */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400">Primary Representative</h4>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Contact Person Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="pl-9 w-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Corporate Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="pl-9 w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+92 300 000"
                    className="pl-9 w-full"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">WhatsApp Link</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="923000000000"
                    className="pl-9 w-full"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">LinkedIn URL</label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Twitter URL</label>
                <input
                  type="url"
                  value={twitter}
                  onChange={e => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="w-full"
                />
              </div>
            </div>

            {/* Financial Parameters */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.04]">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Contract Value (PKR)</label>
                <input
                  type="number"
                  value={totalProjectValue}
                  onChange={e => setTotalProjectValue(e.target.value)}
                  className="w-full font-mono text-zinc-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Advance Paid (PKR)</label>
                <input
                  type="number"
                  value={advancePaid}
                  onChange={e => setAdvancePaid(e.target.value)}
                  className="w-full font-mono text-zinc-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Stage */}
        <div className="space-y-1.5 pt-3 border-t border-white/[0.06]">
          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Pipeline Stage status *</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STATUSES.map(st => {
              const active = status === st.value
              return (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setStatus(st.value)}
                  className={`h-9 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition-all duration-200 ${
                    active
                      ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                      : 'border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:text-white hover:border-white/12'
                  }`}
                >
                  {st.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-3.5 border-t border-white/[0.06] mt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary h-11 px-4 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary h-11 px-5 text-xs font-bold"
          >
            {client ? 'Update Profile' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  )
}
