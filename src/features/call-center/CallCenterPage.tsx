import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Phone,
  Globe,
  MessageSquare,
  MapPin,
  Clock,
  Save,
  CheckCircle2,
  Calendar,
  ChevronRight,
  PhoneOff,
  Star,
  Activity as ActivityIcon,
} from 'lucide-react'
import { useLeads } from '../leads/hooks/useLeads'
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { CALL_OUTCOME_LABELS } from '@/utils/constants'
import { LeadStatusBadge } from '../leads/components/LeadStatusBadge'
import type { Lead, Call, Activity, CallOutcome, LeadStatus } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                  !import.meta.env.VITE_SUPABASE_URL

export function CallCenterPage() {
  const { employee } = useAuth()
  const { leads, updateLead } = useLeads()
  const [searchParams, setSearchParams] = useSearchParams()
  const paramLeadId = searchParams.get('leadId')

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])

  // Call States
  const [isCalling, setIsCalling] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Call Logging Form States
  const [outcome, setOutcome] = useState<CallOutcome>('interested')
  const [callNotes, setCallNotes] = useState('')
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpTime, setFollowUpTime] = useState('12:00')
  const [followUpReminder, setFollowUpReminder] = useState('')

  // Load Lead details
  useEffect(() => {
    if (leads.length > 0) {
      let activeLead = leads[0]
      if (paramLeadId) {
        const found = leads.find((l) => l.id === paramLeadId)
        if (found) activeLead = found
      }
      setSelectedLead(activeLead)
    }
  }, [leads, paramLeadId])

  // Load selected lead activities
  useEffect(() => {
    if (selectedLead) {
      const acts = Storage.getActivities()
        .filter((a) => a.lead_id === selectedLead.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setActivities(acts)
    }
  }, [selectedLead])

  // Call Timer Effect
  useEffect(() => {
    if (isCalling) {
      setStartTime(new Date())
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isCalling])

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartCall = () => {
    if (!selectedLead) return
    setIsCalling(true)
    setCallNotes('')
    setFollowUpRequired(false)
    setOutcome('interested')
    toast.info(`Calling ${selectedLead.shop_name}...`)
  }

  const handleHangUp = () => {
    setIsCalling(false)
    toast.success('Call ended. Please enter logs and outcome below.')
  }

  const handleSaveCall = async () => {
    if (!selectedLead || !startTime) return

    const endTime = new Date()
    const finalDuration = duration

    // Map call outcome to lead status
    let updatedStatus: LeadStatus = 'called'
    if (outcome === 'converted') updatedStatus = 'converted'
    else if (outcome === 'meeting_scheduled') updatedStatus = 'meeting_scheduled'
    else if (outcome === 'no_answer') updatedStatus = 'no_answer'
    else if (outcome === 'busy') updatedStatus = 'busy'
    else if (outcome === 'interested') updatedStatus = 'interested'
    else if (outcome === 'not_interested') updatedStatus = 'not_interested'
    else if (outcome === 'already_has_website') updatedStatus = 'already_has_website'
    else if (outcome === 'call_later') updatedStatus = 'call_later'
    else if (outcome === 'wrong_number') updatedStatus = 'wrong_number'
    else if (outcome === 'owner_not_available') updatedStatus = 'owner_not_available'

    const callPayload: Omit<Call, 'id'> = {
      lead_id: selectedLead.id,
      employee_id: employee?.id || 'emp-1',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_seconds: finalDuration,
      outcome: outcome,
      notes: callNotes,
      follow_up: followUpRequired,
      follow_up_date: followUpRequired ? followUpDate : undefined,
      follow_up_time: followUpRequired ? followUpTime : undefined,
      follow_up_reminder: followUpRequired ? followUpReminder : undefined,
      created_at: new Date().toISOString(),
    }

    try {
      if (DEMO_MODE) {
        // Save Call in storage
        const calls = Storage.getCalls()
        const newCall: Call = {
          id: `call-${Date.now()}`,
          ...callPayload,
        }
        Storage.saveCalls([newCall, ...calls])

        // Save Activity log
        const acts = Storage.getActivities()
        const newAct: Activity = {
          id: `act-${Date.now()}`,
          lead_id: selectedLead.id,
          employee_id: employee?.id || 'emp-1',
          type: outcome === 'converted' ? 'converted' : 'call',
          description: `Called. Outcome: ${CALL_OUTCOME_LABELS[outcome]}. Notes: ${callNotes || 'No notes added.'}`,
          created_at: new Date().toISOString(),
        }
        Storage.saveActivities([newAct, ...acts])

        // Update Lead Details
        await updateLead({
          id: selectedLead.id,
          data: {
            status: updatedStatus,
            notes: callNotes || selectedLead.notes,
          },
        })
      } else {
        // Supabase Save Call
        const { data: callData, error: callErr } = await supabase
          .from('calls')
          .insert(callPayload as never)
          .select()
          .single()
        if (callErr) throw callErr

        // Save Activity
        const activityPayload = {
          lead_id: selectedLead.id,
          employee_id: employee?.id || 'emp-1',
          type: outcome === 'converted' ? 'converted' : 'call',
          description: `Called. Outcome: ${CALL_OUTCOME_LABELS[outcome]}. Notes: ${callNotes || 'No notes added.'}`,
        }
        await supabase.from('activities').insert(activityPayload as never)

        // Update Lead details
        await updateLead({
          id: selectedLead.id,
          data: {
            status: updatedStatus,
            notes: callNotes || selectedLead.notes,
          },
        })
      }

      toast.success('Call log entry saved successfully!')
      setIsCalling(false)
      setStartTime(null)

      // Refresh activity list
      const acts = Storage.getActivities()
        .filter((a) => a.lead_id === selectedLead.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setActivities(acts)

      // Load next lead in list that is not converted
      const currentIndex = leads.findIndex((l) => l.id === selectedLead.id)
      const nextLeads = leads.slice(currentIndex + 1).filter((l) => l.status !== 'converted')
      if (nextLeads.length > 0) {
        setSelectedLead(nextLeads[0])
        setSearchParams({ leadId: nextLeads[0].id })
      }
    } catch (err: unknown) {
      toast.error('Failed to log call')
      console.error(err)
    }
  }

  // Quick redirects
  const handleWhatsApp = () => {
    if (!selectedLead) return
    const formatted = selectedLead.phone.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${formatted}`, '_blank')
  }

  const handleMaps = () => {
    if (!selectedLead) return
    const query = encodeURIComponent(`${selectedLead.shop_name} ${selectedLead.address || ''}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }

  const handleSelectQueueLead = (lead: Lead) => {
    setSelectedLead(lead)
    setSearchParams({ leadId: lead.id })
    setIsCalling(false)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-120px)] page-shell py-4">
      
      {/* LEFT COLUMN: Leads Outbound Queue (1/4 width) */}
      <div className="xl:col-span-1 border border-white/[0.08] bg-[#111111]/85 backdrop-blur-md rounded-2xl flex flex-col overflow-hidden h-full shadow-lg">
        <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" /> Outbound Queue ({leads.length})
          </h3>
          <p className="text-[10.5px] text-[#A1A1AA] mt-1 font-medium">Select a prospect from your active campaigns queue.</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] custom-scrollbar">
          {leads.map((lead) => {
            const isCurrent = selectedLead?.id === lead.id
            return (
              <button
                key={lead.id}
                onClick={() => handleSelectQueueLead(lead)}
                className={`w-full flex items-center justify-between p-3.5 text-left transition-all duration-150 border-l-2 ${
                  isCurrent ? 'bg-white/[0.04] text-white border-red-500' : 'text-zinc-400 hover:bg-white/[0.02] border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-bold text-white truncate">{lead.shop_name}</p>
                  <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5">{lead.category}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    lead.status === 'converted' ? 'bg-emerald-400' :
                    lead.status === 'interested' ? 'bg-green-400' :
                    lead.status === 'not_interested' ? 'bg-red-400' :
                    lead.status === 'new' ? 'bg-blue-400' :
                    'bg-zinc-500'
                  }`} />
                  <ChevronRight className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${isCurrent ? 'translate-x-0.5 text-white' : ''}`} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* MIDDLE & RIGHT COLUMNS (3/4 width) */}
      <div className="xl:col-span-3 flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
        {selectedLead ? (
          <>
            {/* MIDDLE PANEL: Active Dialer workspace */}
            <div className="flex-1 border border-white/[0.08] bg-[#111111]/85 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar shadow-lg">
              <div className="space-y-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-h2 font-bold tracking-tight text-white">{selectedLead.shop_name}</h2>
                      <p className="text-xs text-[#A1A1AA] font-bold mt-1 uppercase tracking-wider">{selectedLead.category}</p>
                    </div>
                    <LeadStatusBadge status={selectedLead.status} />
                  </div>

                  {selectedLead.rating && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-zinc-400 font-medium">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{selectedLead.rating.toFixed(1)} Google Rating</span>
                    </div>
                  )}
                </div>

                {/* Details list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-t border-white/[0.06] pt-5">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Dialer Phone Number</p>
                    <p className="text-white text-sm font-bold">{selectedLead.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Website URL</p>
                    {selectedLead.website ? (
                      <a
                        href={`https://${selectedLead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 font-semibold"
                      >
                        {selectedLead.website} <Globe className="w-3.5 h-3.5 text-zinc-500" />
                      </a>
                    ) : (
                      <p className="text-zinc-600 font-semibold italic">No website URL logged</p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Location Address</p>
                    <p className="text-[#A1A1AA] leading-relaxed font-semibold">{selectedLead.address || 'No address logged'}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Previous Contact Notes</p>
                    <p className="text-zinc-400 leading-relaxed bg-white/[0.01] border border-white/[0.06] p-3.5 rounded-xl font-medium">
                      {selectedLead.notes || 'No prospect contact history registered.'}
                    </p>
                  </div>
                </div>

                {/* Quick actions row - redesigned for enterprise polish */}
                <div className="grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-5">
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04] text-xs font-bold text-[#A1A1AA] hover:text-white transition-all shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4 text-green-400 shrink-0" /> <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={handleMaps}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04] text-xs font-bold text-[#A1A1AA] hover:text-white transition-all shadow-sm"
                  >
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0" /> <span>Google Maps</span>
                  </button>
                  {selectedLead.website ? (
                    <a
                      href={`https://${selectedLead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04] text-xs font-bold text-[#A1A1AA] hover:text-white transition-all shadow-sm"
                    >
                      <Globe className="w-4 h-4 text-cyan-400 shrink-0" /> <span>Website</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/[0.08] bg-white/[0.005] text-zinc-700 text-xs font-semibold cursor-not-allowed"
                    >
                      <Globe className="w-4 h-4 shrink-0" /> <span>Website</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Outbound Dialer Controls */}
              <div className="border-t border-white/[0.06] pt-5 mt-6">
                {!isCalling && !startTime ? (
                  <button
                    onClick={handleStartCall}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition-all shadow-md"
                  >
                    <Phone className="w-4 h-4 text-black fill-black" /> Initiate Outbound Call
                  </button>
                ) : isCalling ? (
                  <div className="flex gap-3">
                    <div className="flex-1 bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3 flex items-center justify-between text-xs animate-pulse">
                      <span className="text-red-400 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full" /> Connection Line Active
                      </span>
                      <span className="font-bold text-white font-mono text-sm">{formatDuration(duration)}</span>
                    </div>
                    <button
                      onClick={handleHangUp}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-md"
                    >
                      <PhoneOff className="w-4 h-4" /> Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex-1 bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-semibold">Call Ended</span>
                      <span className="font-bold text-white font-mono text-sm">{formatDuration(duration)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setStartTime(null)
                        setIsCalling(false)
                      }}
                      className="px-4 py-3 border border-white/[0.08] bg-[#111111] hover:border-white/12 text-xs font-bold rounded-xl text-[#A1A1AA] hover:text-white transition-colors"
                    >
                      Reset Line
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL: Outbound Logging and Outcome Scheduler */}
            <div className="w-full lg:w-[400px] border border-white/[0.08] bg-[#111111]/85 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between h-full overflow-y-auto custom-scrollbar shadow-lg">
              <div className="space-y-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/[0.04]">
                  <Save className="w-4 h-4 text-zinc-500" /> Log Outcome entry
                </h3>

                {startTime ? (
                  <div className="space-y-4 pt-1">
                    {/* Outcome drop box */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Outbound Call Outcome</label>
                      <select
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value as CallOutcome)}
                        className="w-full"
                      >
                        {Object.entries(CALL_OUTCOME_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Outcome notes */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Interaction Notes</label>
                      <textarea
                        rows={4}
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        placeholder="Type summaries, pricing proposals, customer feedback or next action details..."
                        className="w-full"
                      />
                    </div>

                    {/* Follow up checkbox */}
                    <div className="flex items-center gap-3 p-1">
                      <input
                        type="checkbox"
                        id="followup"
                        checked={followUpRequired}
                        onChange={(e) => setFollowUpRequired(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="followup" className="text-xs text-[#A1A1AA] font-bold cursor-pointer select-none">
                        Schedule Next Callback
                      </label>
                    </div>

                    {/* Follow up schedules scheduler */}
                    {followUpRequired && (
                      <div className="space-y-3.5 bg-white/[0.01] border border-white/[0.06] p-4 rounded-xl">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Date</label>
                            <input
                              type="date"
                              value={followUpDate}
                              onChange={(e) => setFollowUpDate(e.target.value)}
                              className="w-full !min-h-10 !h-10 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Time</label>
                            <input
                              type="time"
                              value={followUpTime}
                              onChange={(e) => setFollowUpTime(e.target.value)}
                              className="w-full !min-h-10 !h-10 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Task Agenda</label>
                          <input
                            type="text"
                            value={followUpReminder}
                            onChange={(e) => setFollowUpReminder(e.target.value)}
                            placeholder="e.g. Discuss Q3 proposal details"
                            className="w-full !min-h-10 !h-10 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Timeline Log section */}
                    {activities.length > 0 && (
                      <div className="space-y-2 border-t border-white/[0.06] pt-4.5">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <ActivityIcon className="w-3.5 h-3.5" /> Recent Contact Timeline
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {activities.map((act) => (
                            <div key={act.id} className="text-[11px] p-2 bg-white/[0.01] border border-white/[0.04] rounded-lg">
                              <p className="text-zinc-400 leading-snug">{act.description}</p>
                              <span className="text-[9px] text-zinc-600 block mt-1 font-bold">{formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 py-16 text-center border border-white/[0.08] border-dashed rounded-2xl bg-white/[0.005] text-zinc-600">
                    <Phone className="w-8 h-8 mb-2" />
                    <p className="text-xs font-bold text-zinc-400">Call center line idle</p>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">Initiate outbound dialer call to populate this logging canvas.</p>
                  </div>
                )}
              </div>

              {startTime && (
                <button
                  onClick={handleSaveCall}
                  disabled={isCalling}
                  className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 bg-white disabled:bg-white/[0.02] text-black disabled:text-zinc-600 text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Commit Logs Entry
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border border-white/[0.08] border-dashed rounded-2xl bg-[#111111]/45">
            <Clock className="w-12 h-12 text-zinc-600 mb-3" />
            <p className="text-sm font-bold text-white">Select a Lead to Dial</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center leading-relaxed">Choose a lead from the campaign outreach queue to load workspace.</p>
          </div>
        )}
      </div>
    </div>
  )
}
