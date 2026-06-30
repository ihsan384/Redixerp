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
  AlertCircle,
  ChevronRight,
  User,
  History,
  PhoneOff,
  Star,
} from 'lucide-react'
import { useLeads } from '../leads/hooks/useLeads'
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { CALL_OUTCOME_LABELS, LEAD_STATUS_COLORS } from '@/utils/constants'
import { LeadStatusBadge } from '../leads/components/LeadStatusBadge'
import type { Lead, Call, Activity, CallOutcome, LeadStatus } from '@/types'
import { format } from 'date-fns'
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
    toast.success('Call ended. Please log the call details.')
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

      toast.success('Call logged successfully!')
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
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
      {/* LEFT COLUMN: Leads Queue (1/4 width) */}
      <div className="xl:col-span-1 border border-[#1f1f1f] bg-[#0d0d0d] rounded-2xl flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b border-[#1f1f1f] bg-[#111111]/30">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8c8c8c]" /> Call Queue ({leads.length})
          </h3>
          <p className="text-[10px] text-[#525252] mt-1">Select a business from your active leads to start dialer.</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#1f1f1f]">
          {leads.map((lead) => {
            const isCurrent = selectedLead?.id === lead.id
            return (
              <button
                key={lead.id}
                onClick={() => handleSelectQueueLead(lead)}
                className={`w-full flex items-center justify-between p-3.5 text-left transition-all duration-150 ${
                  isCurrent ? 'bg-white/[0.04] text-white' : 'text-[#8c8c8c] hover:bg-white/[0.02]'
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-medium text-white truncate">{lead.shop_name}</p>
                  <p className="text-[10px] text-[#525252] truncate mt-0.5">{lead.category}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    lead.status === 'converted' ? 'bg-emerald-400' :
                    lead.status === 'interested' ? 'bg-green-400' :
                    lead.status === 'not_interested' ? 'bg-red-400' :
                    lead.status === 'new' ? 'bg-blue-400' :
                    'bg-gray-400'
                  }`} />
                  <ChevronRight className={`w-3 h-3 text-[#525252] transition-transform ${isCurrent ? 'translate-x-0.5 text-white' : ''}`} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Caller Workspace (3/4 width) */}
      <div className="xl:col-span-3 flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
        {selectedLead ? (
          <>
            {/* Lead Stats Card & Actions */}
            <div className="flex-1 border border-[#1f1f1f] bg-[#0d0d0d] rounded-2xl p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white">{selectedLead.shop_name}</h2>
                      <p className="text-xs text-[#8c8c8c] font-medium mt-0.5">{selectedLead.category}</p>
                    </div>
                    <LeadStatusBadge status={selectedLead.status} size="md" />
                  </div>

                  {selectedLead.rating && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-[#8c8c8c]">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span>{selectedLead.rating.toFixed(1)} Google Rating</span>
                    </div>
                  )}
                </div>

                {/* Details list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-t border-[#1f1f1f] pt-5">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-semibold text-[#525252]">Phone Number</p>
                    <p className="text-white text-sm font-semibold">{selectedLead.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-semibold text-[#525252]">Website</p>
                    {selectedLead.website ? (
                      <a
                        href={`https://${selectedLead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white hover:underline flex items-center gap-1"
                      >
                        {selectedLead.website} <Globe className="w-3 h-3 text-[#636363]" />
                      </a>
                    ) : (
                      <p className="text-[#525252] italic">None listed</p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] uppercase font-semibold text-[#525252]">Address</p>
                    <p className="text-[#8c8c8c] leading-relaxed">{selectedLead.address || 'No address logged'}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] uppercase font-semibold text-[#525252]">Previous Notes</p>
                    <p className="text-[#8c8c8c] leading-relaxed bg-[#111111]/30 border border-[#1f1f1f] p-3 rounded-xl">
                      {selectedLead.notes || 'No notes registered.'}
                    </p>
                  </div>
                </div>

                {/* Quick actions row */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-[#1f1f1f] bg-[#111111]/30 hover:border-white/10 text-xs font-semibold text-[#8c8c8c] hover:text-white transition-all"
                  >
                    <MessageSquare className="w-4 h-4 text-green-400" /> WhatsApp
                  </button>
                  <button
                    onClick={handleMaps}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-[#1f1f1f] bg-[#111111]/30 hover:border-white/10 text-xs font-semibold text-[#8c8c8c] hover:text-white transition-all"
                  >
                    <MapPin className="w-4 h-4 text-blue-400" /> Google Maps
                  </button>
                  {selectedLead.website ? (
                    <a
                      href={`https://${selectedLead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-[#1f1f1f] bg-[#111111]/30 hover:border-white/10 text-xs font-semibold text-[#8c8c8c] hover:text-white transition-all"
                    >
                      <Globe className="w-4 h-4 text-cyan-400" /> Website
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-[#1f1f1f] bg-[#111111]/10 text-xs font-semibold text-[#4b5563] cursor-not-allowed"
                    >
                      <Globe className="w-4 h-4" /> Website
                    </button>
                  )}
                </div>
              </div>

              {/* Dialer dial out buttons */}
              <div className="border-t border-[#1f1f1f] pt-5 mt-6">
                {!isCalling && !startTime ? (
                  <button
                    onClick={handleStartCall}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-neutral-200 text-black text-sm font-bold rounded-xl transition-all"
                  >
                    <Phone className="w-4 h-4 text-black" /> Start Dialing Call
                  </button>
                ) : isCalling ? (
                  <div className="flex gap-3">
                    <div className="flex-1 bg-white/[0.04] border border-[#1f1f1f] rounded-xl px-4 py-3 flex items-center justify-between text-xs">
                      <span className="text-[#8c8c8c] flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" /> Live Call Timer
                      </span>
                      <span className="font-bold text-white font-mono text-sm">{formatDuration(duration)}</span>
                    </div>
                    <button
                      onClick={handleHangUp}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <PhoneOff className="w-4 h-4" /> Hang Up
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
                      <span className="text-[#8c8c8c]">Call Completed</span>
                      <span className="font-bold text-white font-mono text-sm">{formatDuration(duration)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setStartTime(null)
                        setIsCalling(false)
                      }}
                      className="px-4 py-3 border border-[#1f1f1f] bg-[#111111] hover:border-white/10 text-xs font-bold rounded-xl text-[#8c8c8c] hover:text-white transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Call Logger Logging panel (expanded once call is started/ended) */}
            <div className="w-full lg:w-[420px] border border-[#1f1f1f] bg-[#0d0d0d] rounded-2xl p-5 flex flex-col justify-between h-full overflow-y-auto">
              <div className="space-y-5">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Save className="w-4 h-4 text-[#8c8c8c]" /> Call Logging Panel
                </h3>

                {startTime ? (
                  <div className="space-y-4 pt-1">
                    {/* Outcome dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#8c8c8c]">Call Outcome</label>
                      <select
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value as CallOutcome)}
                        className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                      >
                        {Object.entries(CALL_OUTCOME_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#8c8c8c]">Call Notes</label>
                      <textarea
                        rows={5}
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        placeholder="Log detailed call summaries, quotes, objections, pricing, etc..."
                        className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2 text-xs text-white placeholder-[#4b5563] focus:border-white/20 outline-none resize-none"
                      />
                    </div>

                    {/* Follow-up Required Checkbox */}
                    <div className="flex items-center gap-2.5 p-1">
                      <input
                        type="checkbox"
                        id="followup"
                        checked={followUpRequired}
                        onChange={(e) => setFollowUpRequired(e.target.checked)}
                        className="rounded border-[#2a2a2a] bg-[#141414] text-white focus:ring-0 w-3.5 h-3.5"
                      />
                      <label htmlFor="followup" className="text-xs text-[#8c8c8c] font-medium cursor-pointer">
                        Schedule Next Follow-Up Call
                      </label>
                    </div>

                    {/* Follow-up Fields conditional */}
                    {followUpRequired && (
                      <div className="space-y-3 bg-[#111111]/50 border border-[#1f1f1f] p-4 rounded-xl">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="text-[10px] text-[#636363] uppercase font-semibold">Date</label>
                            <input
                              type="date"
                              value={followUpDate}
                              onChange={(e) => setFollowUpDate(e.target.value)}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-[#636363] uppercase font-semibold">Time</label>
                            <input
                              type="time"
                              value={followUpTime}
                              onChange={(e) => setFollowUpTime(e.target.value)}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-[#636363] uppercase font-semibold">Reminder Notes</label>
                          <input
                            type="text"
                            value={followUpReminder}
                            onChange={(e) => setFollowUpReminder(e.target.value)}
                            placeholder="e.g. Ask for owner Kashif"
                            className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#4b5563] focus:border-white/20 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center border border-[#1f1f1f] border-dashed rounded-2xl bg-[#111111]/10 text-[#4b5563]">
                    <Phone className="w-7 h-7 mb-2" />
                    <p className="text-xs font-semibold text-[#8c8c8c]">No call active</p>
                    <p className="text-[10px] mt-0.5">Click Start Dialing Call to begin log entries.</p>
                  </div>
                )}
              </div>

              {startTime && (
                <button
                  onClick={handleSaveCall}
                  disabled={isCalling}
                  className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 bg-white disabled:bg-[#1f1f1f] text-black disabled:text-[#636363] text-xs font-bold rounded-xl transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Call Log
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border border-[#1f1f1f] border-dashed rounded-3xl bg-[#0d0d0d]">
            <Clock className="w-10 h-10 text-[#4b5563] mb-3" />
            <p className="text-sm font-semibold text-white">Select a Lead to Call</p>
            <p className="text-xs text-[#525252] mt-1">Double click a lead in the queue lists to begin calling operations.</p>
          </div>
        )}
      </div>
    </div>
  )
}
