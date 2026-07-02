import { useState, useEffect } from 'react'
import { ArrowLeft, User, Briefcase, Mail, Phone, MessageSquare, Globe, ExternalLink, Calendar, HelpCircle, DollarSign, Activity, FileText, ArrowUpRight } from 'lucide-react'
import type { Client, ClientStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/format'
import { toast } from 'sonner'

// Sub-components
import { TimelineTracker } from './TimelineTracker'
import { DocumentCenter } from './DocumentCenter'
import { QuestionnaireTab } from './QuestionnaireTab'
import { FileManager } from './FileManager'
import { NotesTab } from './NotesTab'

interface ClientDetailProps {
  clientId: string
  onBack: () => void
}

const STATUS_DETAILS: Record<ClientStatus, { label: string; class: string; dot: string }> = {
  lead:           { label: 'Lead',           class: 'text-blue-400 bg-blue-500/10 border-blue-500/20',     dot: 'bg-blue-400' },
  discussion:     { label: 'Discussion',     class: 'text-purple-400 bg-purple-500/10 border-purple-500/20', dot: 'bg-purple-400' },
  proposal_sent:  { label: 'Proposal Sent',  class: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-400' },
  active_project: { label: 'Active Project', class: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_6px_rgba(239,68,68,0.1)]', dot: 'bg-red-400' },
  completed:      { label: 'Completed',      class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  cancelled:      { label: 'Cancelled',      class: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',     dot: 'bg-zinc-500' }
}

export function ClientDetail({ clientId, onBack }: ClientDetailProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'documents' | 'questionnaire' | 'files' | 'notes'>('overview')

  const loadClient = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      
      if (error) throw error
      setClient(data as Client)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load client details')
      onBack()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClient()
  }, [clientId])

  const handleUpdateStatus = async (newStatus: ClientStatus) => {
    if (!client) return
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', client.id)
      
      if (error) throw error
      
      // Log activity
      const activityPayload = {
        lead_id: client.id,
        type: 'status_change',
        description: `Client status updated to "${newStatus}".`
      }
      await supabase.from('activities').insert(activityPayload as never)

      toast.success(`Client status updated to ${newStatus.replace('_', ' ')}`)
      loadClient()
    } catch (e) {
      console.error(e)
      toast.error('Failed to update client status')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-400/20 border-t-red-400" />
          <p className="text-xs font-semibold text-zinc-500">Decrypting workspace vaults...</p>
        </div>
      </div>
    )
  }

  if (!client) return null

  const outstandingBalance = Math.max(0, client.total_project_value - client.advance_paid)
  const statusCfg = STATUS_DETAILS[client.status] || STATUS_DETAILS.lead

  const tabs = [
    { id: 'overview', label: 'Overview Profile', icon: User },
    { id: 'timeline', label: 'Timeline SLA', icon: Activity },
    { id: 'documents', label: 'Document Center', icon: FileText },
    { id: 'questionnaire', label: 'Questionnaire Form', icon: HelpCircle },
    { id: 'files', label: 'Files Vault', icon: Briefcase },
    { id: 'notes', label: 'Internal Notes', icon: MessageSquare }
  ] as const

  return (
    <div className="space-y-6">
      {/* Header breadcrumb bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/[0.08] bg-[#111]/30 hover:bg-white/[0.04] text-zinc-400 hover:text-white transition-all shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            <span>Portfolio</span>
            <span>/</span>
            <span className="text-zinc-400 font-semibold">{client.company_name}</span>
          </div>
          <h2 className="text-lg font-bold text-white leading-none mt-1">{client.name}</h2>
        </div>
      </div>

      {/* Main layout container split */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column Profile Sidebar summary card */}
        <div className="xl:col-span-1 space-y-4">
          <div className="panel-card p-5 bg-[#111]/60 border border-white/[0.08] backdrop-blur-2xl space-y-4.5">
            {/* Logo box */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 border border-white/20 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-[0_4px_16px_rgba(239,68,68,0.2)]">
                {client.company_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate leading-snug">{client.company_name}</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{client.industry}</p>
              </div>
            </div>

            {/* Status Selector dropdown */}
            <div className="space-y-1.5 pt-1.5 border-t border-white/[0.04]">
              <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Lifecycle Status</label>
              <select
                value={client.status}
                onChange={e => handleUpdateStatus(e.target.value as ClientStatus)}
                className="w-full h-10 bg-[#151515] border border-white/[0.08] text-white rounded-xl text-xs font-bold uppercase tracking-wider px-3 cursor-pointer"
              >
                <option value="lead">Lead</option>
                <option value="discussion">Discussion</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="active_project">Active Project</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* General Metadata list */}
            <div className="space-y-3 pt-3 border-t border-white/[0.04] text-xs">
              <div className="flex items-center gap-2.5">
                <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Contact Person</p>
                  <p className="text-zinc-300 font-semibold mt-0.5 truncate">{client.contact_person}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Email Address</p>
                  <a href={`mailto:${client.email}`} className="text-red-400 hover:underline font-semibold mt-0.5 truncate block">{client.email}</a>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Outbound Calls Phone</p>
                  <p className="text-zinc-300 font-mono font-semibold mt-0.5">{client.phone}</p>
                </div>
              </div>

              {client.whatsapp && (
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-none">WhatsApp Secure Contact</p>
                    <a href={`https://wa.me/${client.whatsapp}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-semibold mt-0.5 block">
                      Send Text
                    </a>
                  </div>
                </div>
              )}

              {client.website && (
                <div className="flex items-center gap-2.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Website Portal</p>
                    <a href={client.website} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white flex items-center gap-1 font-semibold mt-0.5">
                      <span className="truncate">{client.website.replace('https://', '')}</span> <ArrowUpRight className="w-3 h-3 text-red-500 shrink-0" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Social Coordinates */}
            {(client.social_links?.linkedin || client.social_links?.twitter) && (
              <div className="pt-3.5 border-t border-white/[0.04] flex items-center gap-2">
                {client.social_links.linkedin && (
                  <a
                    href={client.social_links.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-8 text-[10px] font-bold border border-white/[0.06] hover:border-white/12 bg-white/[0.01] hover:bg-white/[0.03] text-zinc-400 hover:text-white rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <span>LinkedIn</span> <ArrowUpRight className="w-2.5 h-2.5" />
                  </a>
                )}
                {client.social_links.twitter && (
                  <a
                    href={client.social_links.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-8 text-[10px] font-bold border border-white/[0.06] hover:border-white/12 bg-white/[0.01] hover:bg-white/[0.03] text-zinc-400 hover:text-white rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <span>Twitter</span> <ArrowUpRight className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column Main content layout with tabs */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Tab Navigation header */}
          <div className="flex border-b border-white/[0.06] bg-white/[0.01] rounded-2xl p-1 overflow-x-auto max-w-full custom-scrollbar">
            {tabs.map(t => {
              const active = activeTab === t.id
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all ${
                    active
                      ? 'bg-red-500/10 border border-red-500/20 text-white font-semibold'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* TAB CONTENTS PANEL */}
          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Financial overview ledger and Progress bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Value */}
                  <div className="border border-white/[0.08] bg-[#111111]/40 rounded-2xl p-5 space-y-2">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Total Contract Value</p>
                    <p className="text-2xl font-bold text-white font-mono">
                      {formatCurrency(client.total_project_value)}
                    </p>
                  </div>

                  {/* Paid Amount */}
                  <div className="border border-white/[0.08] bg-[#111111]/40 rounded-2xl p-5 space-y-2">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Advance Paid Amount</p>
                    <p className="text-2xl font-bold text-emerald-400 font-mono">
                      {formatCurrency(client.advance_paid)}
                    </p>
                  </div>

                  {/* Remaining Balance */}
                  <div className="border border-white/[0.08] bg-[#111111]/40 rounded-2xl p-5 space-y-2">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Outstanding Balance Due</p>
                    <p className={`text-2xl font-bold font-mono ${outstandingBalance > 0 ? 'text-red-400 animate-pulse' : 'text-zinc-500'}`}>
                      {formatCurrency(outstandingBalance)}
                    </p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="panel-card p-5 bg-[#111]/40 border border-white/[0.06] space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Project Milestones Progress</h4>
                      <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Checked milestones completion status</p>
                    </div>
                    <span className="text-lg font-bold text-red-400 font-mono">{client.project_progress}%</span>
                  </div>

                  <div className="w-full bg-white/[0.03] border border-white/[0.06] h-3.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-600 to-red-500 h-full shadow-[0_0_12px_rgba(239,68,68,0.5)] transition-all duration-500" 
                      style={{ width: `${client.project_progress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-white/[0.04]">
                    <div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Pipeline Stage</p>
                      <p className="text-white font-bold capitalize mt-0.5">{client.status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Estimated Launch Date</p>
                      <p className="text-zinc-300 font-semibold mt-0.5">Q3 {new Date().getFullYear()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">GST Assessment</p>
                      <p className="text-zinc-300 font-semibold mt-0.5">{client.gst_number ? 'Taxable (13%)' : 'Exempt / Zero-taxed'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Onboarded stamp</p>
                      <p className="text-zinc-300 font-semibold mt-0.5 font-mono text-[10.5px]">
                        {new Date(client.created_at).toLocaleDateString('en-PK')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Brief onboarding welcome kit details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Welcome details */}
                  <div className="border border-white/[0.06] bg-[#111]/20 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.04] pb-2">Client Communication Guidelines</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed font-medium">Primary outreach is configured via Email and WhatsApp. All core design mockups and Figma reviews are logged under the Documents Center.</p>
                    <div className="flex gap-2">
                      <a href={`mailto:${client.email}`} className="btn-secondary h-9 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> <span>Send Email SLA</span>
                      </a>
                      {client.whatsapp && (
                        <a href={`https://wa.me/${client.whatsapp}`} target="_blank" rel="noreferrer" className="btn-secondary h-9 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 border-emerald-500/10 text-emerald-400">
                          <MessageSquare className="w-3.5 h-3.5" /> <span>WhatsApp Chat</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Core checklist */}
                  <div className="border border-white/[0.06] bg-[#111]/20 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.04] pb-2">Required Assets Checklist</h4>
                    <ul className="text-xs text-zinc-400 space-y-2.5 font-medium">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> Corporate Logo files (SVG/Vector)</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> Branding color guidelines / palette</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> Text Copywriting content and slogans</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> Domain Registrar credentials access</li>
                    </ul>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'timeline' && (
              <TimelineTracker client={client} onRefresh={loadClient} />
            )}

            {activeTab === 'documents' && (
              <DocumentCenter client={client} />
            )}

            {activeTab === 'questionnaire' && (
              <QuestionnaireTab client={client} />
            )}

            {activeTab === 'files' && (
              <FileManager client={client} />
            )}

            {activeTab === 'notes' && (
              <NotesTab client={client} />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
