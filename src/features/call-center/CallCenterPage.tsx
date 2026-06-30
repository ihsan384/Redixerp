import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  History,
  MapPin,
  MessageSquare,
  NotebookPen,
  Phone,
  PhoneOff,
  Save,
  Search,
  Star,
  UserRound,
} from 'lucide-react'
import { useLeads } from '../leads/hooks/useLeads'
import { LeadStatusBadge } from '../leads/components/LeadStatusBadge'
import { useAuth } from '../auth/AuthContext'
import { Button, EmptyState, PageHeader } from '@/components/ui/Primitives'
import { Storage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { CALL_OUTCOME_LABELS } from '@/utils/constants'
import type { Activity, Call, CallOutcome, Lead, LeadStatus } from '@/types'
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
  const [queueSearch, setQueueSearch] = useState('')
  const [isCalling, setIsCalling] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [outcome, setOutcome] = useState<CallOutcome>('interested')
  const [callNotes, setCallNotes] = useState('')
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpTime, setFollowUpTime] = useState('12:00')
  const [followUpReminder, setFollowUpReminder] = useState('')

  useEffect(() => {
    if (leads.length === 0) return
    let activeLead = leads[0]
    if (paramLeadId) {
      const found = leads.find((lead) => lead.id === paramLeadId)
      if (found) activeLead = found
    }
    setSelectedLead(activeLead)
  }, [leads, paramLeadId])

  useEffect(() => {
    if (!selectedLead) return
    const leadActivities = Storage.getActivities()
      .filter((activity) => activity.lead_id === selectedLead.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setActivities(leadActivities)
  }, [selectedLead])

  useEffect(() => {
    if (isCalling) {
      setStartTime(new Date())
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((current) => current + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isCalling])

  const visibleLeads = leads.filter((lead) => {
    const query = queueSearch.trim().toLowerCase()
    if (!query) return true
    return lead.shop_name.toLowerCase().includes(query) || lead.phone.includes(query) || lead.category.toLowerCase().includes(query)
  })

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainder = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`
  }

  const resetLogger = () => {
    setIsCalling(false)
    setStartTime(null)
    setDuration(0)
    setCallNotes('')
    setFollowUpRequired(false)
    setFollowUpDate('')
    setFollowUpReminder('')
    setOutcome('interested')
  }

  const handleStartCall = () => {
    if (!selectedLead) return
    setCallNotes('')
    setFollowUpRequired(false)
    setOutcome('interested')
    setIsCalling(true)
    toast.info(`Calling ${selectedLead.shop_name}...`)
  }

  const handleHangUp = () => {
    setIsCalling(false)
    toast.success('Call ended. Add the outcome and save the log.')
  }

  const handleSaveCall = async () => {
    if (!selectedLead || !startTime) return
    if (followUpRequired && !followUpDate) {
      toast.error('Choose a date for the follow-up')
      return
    }

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
      end_time: new Date().toISOString(),
      duration_seconds: duration,
      outcome,
      notes: callNotes,
      follow_up: followUpRequired,
      follow_up_date: followUpRequired ? followUpDate : undefined,
      follow_up_time: followUpRequired ? followUpTime : undefined,
      follow_up_reminder: followUpRequired ? followUpReminder : undefined,
      created_at: new Date().toISOString(),
    }

    try {
      if (DEMO_MODE) {
        const newCall: Call = { id: `call-${Date.now()}`, ...callPayload }
        Storage.saveCalls([newCall, ...Storage.getCalls()])

        const newActivity: Activity = {
          id: `act-${Date.now()}`,
          lead_id: selectedLead.id,
          employee_id: employee?.id || 'emp-1',
          type: outcome === 'converted' ? 'converted' : 'call',
          description: `Called. Outcome: ${CALL_OUTCOME_LABELS[outcome]}. Notes: ${callNotes || 'No notes added.'}`,
          created_at: new Date().toISOString(),
        }
        Storage.saveActivities([newActivity, ...Storage.getActivities()])

        await updateLead({
          id: selectedLead.id,
          data: { status: updatedStatus, notes: callNotes || selectedLead.notes },
        })
      } else {
        const { error: callError } = await supabase.from('calls').insert(callPayload as never)
        if (callError) throw callError

        const activityPayload = {
          lead_id: selectedLead.id,
          employee_id: employee?.id || 'emp-1',
          type: outcome === 'converted' ? 'converted' : 'call',
          description: `Called. Outcome: ${CALL_OUTCOME_LABELS[outcome]}. Notes: ${callNotes || 'No notes added.'}`,
        }
        const { error: activityError } = await supabase.from('activities').insert(activityPayload as never)
        if (activityError) throw activityError

        await updateLead({
          id: selectedLead.id,
          data: { status: updatedStatus, notes: callNotes || selectedLead.notes },
        })
      }

      toast.success('Call logged successfully')
      const currentIndex = leads.findIndex((lead) => lead.id === selectedLead.id)
      const nextLead = leads.slice(currentIndex + 1).find((lead) => lead.status !== 'converted')
      resetLogger()

      if (nextLead) {
        setSelectedLead(nextLead)
        setSearchParams({ leadId: nextLead.id })
      } else {
        const leadActivities = Storage.getActivities()
          .filter((activity) => activity.lead_id === selectedLead.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setActivities(leadActivities)
      }
    } catch (error) {
      toast.error('Failed to log call')
      console.error(error)
    }
  }

  const handleWhatsApp = () => {
    if (!selectedLead) return
    window.open(`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`, '_blank')
  }

  const handleMaps = () => {
    if (!selectedLead) return
    const query = encodeURIComponent(`${selectedLead.shop_name} ${selectedLead.address || ''}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }

  const handleSelectQueueLead = (lead: Lead) => {
    resetLogger()
    setSelectedLead(lead)
    setSearchParams({ leadId: lead.id })
  }

  return (
    <div className="page-shell page-stack">
      <PageHeader
        eyebrow="Sales operations"
        title="Call Center"
        description="Move through the lead queue, capture call outcomes, and schedule follow-ups without losing context."
        actions={
          <div className="status-pill border-emerald-400/15 bg-emerald-500/8 text-emerald-300">
            <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-400" /> Dialer ready
          </div>
        }
      />

      <div className="call-center-grid grid grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <section className="panel-card flex min-h-[460px] flex-col overflow-hidden 2xl:min-h-0" aria-label="Lead queue">
          <div className="border-b border-white/[0.065] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">Lead queue</p>
                <p className="mt-1 text-[11px] text-zinc-600">{visibleLeads.length} available contacts</p>
              </div>
              <span className="status-pill text-zinc-400">{leads.length}</span>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                aria-label="Search call queue"
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
                placeholder="Search queue"
                className="w-full pl-9 pr-3"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {visibleLeads.map((lead) => {
                const isCurrent = selectedLead?.id === lead.id
                return (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectQueueLead(lead)}
                    className={`group flex w-full items-center gap-3 rounded-[14px] p-3 text-left transition ${
                      isCurrent
                        ? 'bg-red-500/10 shadow-[inset_0_0_0_1px_rgba(229,57,53,.16)]'
                        : 'hover:bg-white/[0.035]'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                      isCurrent ? 'border-red-400/20 bg-red-500/12 text-red-200' : 'border-white/[0.06] bg-white/[0.025] text-zinc-500'
                    }`}>
                      {lead.shop_name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-zinc-200">{lead.shop_name}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-zinc-600">{lead.category} · {lead.phone}</span>
                    </span>
                    <ChevronRight className={`h-4 w-4 shrink-0 transition ${isCurrent ? 'translate-x-0.5 text-red-300' : 'text-zinc-700 group-hover:text-zinc-400'}`} />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-white/[0.065] p-4 text-[11px] text-zinc-600">
            Converted leads remain available for account follow-up.
          </div>
        </section>

        <section className="panel-card min-w-0 overflow-hidden">
          {selectedLead ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-white/[0.065] p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-red-400/15 bg-gradient-to-br from-red-500/18 to-white/[0.025] text-xl font-bold text-white">
                      {selectedLead.shop_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-300">Current lead</p>
                      <h2 className="mt-1 truncate text-2xl font-bold tracking-[-0.04em] text-white sm:text-[28px]">{selectedLead.shop_name}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>{selectedLead.category}</span>
                        {selectedLead.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {selectedLead.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <LeadStatusBadge status={selectedLead.status} size="md" />
                </div>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[16px] border border-white/[0.065] bg-white/[0.025] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Phone</p>
                    <p className="mt-2 text-sm font-bold text-white">{selectedLead.phone}</p>
                  </div>
                  <div className="rounded-[16px] border border-white/[0.065] bg-white/[0.025] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Website</p>
                    <p className="mt-2 truncate text-sm font-semibold text-zinc-300">{selectedLead.website || 'Not listed'}</p>
                  </div>
                  <div className="rounded-[16px] border border-white/[0.065] bg-white/[0.025] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Assigned</p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-300">
                      <UserRound className="h-4 w-4 text-zinc-600" /> {selectedLead.assigned_employee?.name || 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-600">Address</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{selectedLead.address || 'No address has been recorded.'}</p>
                </div>

                <div className="rounded-[18px] border border-white/[0.065] bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                    <NotebookPen className="h-4 w-4" /> Previous notes
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{selectedLead.notes || 'No notes have been recorded for this lead.'}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button variant="secondary" onClick={handleWhatsApp} className="w-full">
                    <MessageSquare className="h-4 w-4 text-emerald-300" /> WhatsApp
                  </Button>
                  <Button variant="secondary" onClick={handleMaps} className="w-full">
                    <MapPin className="h-4 w-4 text-blue-300" /> Maps
                  </Button>
                  {selectedLead.website ? (
                    <a href={`https://${selectedLead.website}`} target="_blank" rel="noreferrer" className="btn-secondary w-full">
                      <Globe className="h-4 w-4 text-cyan-300" /> Website
                    </a>
                  ) : (
                    <Button variant="secondary" disabled className="w-full"><Globe className="h-4 w-4" /> Website</Button>
                  )}
                </div>
              </div>

              <div className="border-t border-white/[0.065] bg-black/10 p-5 sm:p-6">
                {!startTime ? (
                  <Button variant="primary" onClick={handleStartCall} className="w-full">
                    <Phone className="h-4 w-4" /> Start dialing {selectedLead.shop_name}
                  </Button>
                ) : isCalling ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex min-h-12 flex-1 items-center justify-between rounded-[14px] border border-emerald-400/15 bg-emerald-500/[0.06] px-4">
                      <span className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                        <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-emerald-400" /> Live call
                      </span>
                      <span className="font-mono text-lg font-bold tabular-nums text-white">{formatDuration(duration)}</span>
                    </div>
                    <Button variant="danger" onClick={handleHangUp} className="px-6"><PhoneOff className="h-4 w-4" /> Hang up</Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex min-h-12 flex-1 items-center justify-between rounded-[14px] border border-white/[0.08] bg-white/[0.035] px-4">
                      <span className="text-xs font-semibold text-zinc-400">Call completed</span>
                      <span className="font-mono text-lg font-bold tabular-nums text-white">{formatDuration(duration)}</span>
                    </div>
                    <Button variant="secondary" onClick={resetLogger}>Reset</Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyState icon={<Phone className="h-6 w-6" />} title="Select a lead" description="Choose a contact from the queue to open the dialing workspace." className="m-5 h-[calc(100%-40px)]" />
          )}
        </section>

        <aside className="call-logger-panel panel-card flex min-h-[600px] flex-col overflow-hidden xl:col-span-2" aria-label="Call notes and history">
          <div className="border-b border-white/[0.065] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-white"><Save className="h-4 w-4 text-red-300" /> Call notes</p>
                <p className="mt-1 text-[11px] text-zinc-600">Capture the outcome while context is fresh.</p>
              </div>
              {startTime && <span className="status-pill text-zinc-400">{isCalling ? 'In progress' : 'Ready to save'}</span>}
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {startTime ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="call-outcome" className="text-[13px] font-semibold text-zinc-300">Call outcome</label>
                  <select id="call-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value as CallOutcome)} className="w-full px-3">
                    {Object.entries(CALL_OUTCOME_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="call-notes" className="text-[13px] font-semibold text-zinc-300">Conversation notes</label>
                  <textarea
                    id="call-notes"
                    rows={5}
                    value={callNotes}
                    onChange={(event) => setCallNotes(event.target.value)}
                    placeholder="Objections, pricing, next steps, and useful context..."
                    className="w-full resize-none px-3 py-3"
                  />
                </div>

                <label htmlFor="followup" className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-white/[0.065] bg-white/[0.025] p-3.5">
                  <input id="followup" type="checkbox" checked={followUpRequired} onChange={(event) => setFollowUpRequired(event.target.checked)} className="mt-0.5 h-4 w-4" />
                  <span>
                    <span className="block text-[13px] font-semibold text-zinc-200">Schedule a follow-up</span>
                    <span className="mt-0.5 block text-[11px] text-zinc-600">Create the next touchpoint in the planner.</span>
                  </span>
                </label>

                {followUpRequired && (
                  <div className="space-y-3 rounded-[18px] border border-red-400/10 bg-red-500/[0.035] p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label htmlFor="followup-date" className="text-xs font-semibold text-zinc-400">Date</label>
                        <input id="followup-date" type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} className="w-full px-2.5" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="followup-time" className="text-xs font-semibold text-zinc-400">Time</label>
                        <input id="followup-time" type="time" value={followUpTime} onChange={(event) => setFollowUpTime(event.target.value)} className="w-full px-2.5" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="followup-reminder" className="text-xs font-semibold text-zinc-400">Reminder</label>
                      <input id="followup-reminder" value={followUpReminder} onChange={(event) => setFollowUpReminder(event.target.value)} placeholder="What should the rep remember?" className="w-full px-3" />
                    </div>
                  </div>
                )}

                <Button variant="primary" onClick={handleSaveCall} disabled={isCalling} className="w-full">
                  <CheckCircle2 className="h-4 w-4" /> Save call log
                </Button>
              </div>
            ) : (
              <div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.018] p-6 text-center">
                <Phone className="mx-auto h-6 w-6 text-zinc-700" />
                <p className="mt-3 text-sm font-bold text-zinc-300">No active call</p>
                <p className="mt-1 text-xs leading-5 text-zinc-600">Start dialing to unlock outcome notes and follow-up scheduling.</p>
              </div>
            )}

            <div className="border-t border-white/[0.065] pt-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-white"><History className="h-4 w-4 text-zinc-500" /> Activity timeline</p>
                <span className="text-[10px] font-semibold text-zinc-600">{activities.length} events</span>
              </div>

              {activities.length > 0 ? (
                <div className="space-y-1">
                  {activities.slice(0, 6).map((activity) => (
                    <div key={activity.id} className="relative flex gap-3 rounded-[14px] p-3 hover:bg-white/[0.025]">
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.065] bg-white/[0.025]">
                        {activity.type === 'follow_up' ? <CalendarClock className="h-3.5 w-3.5 text-amber-300" /> : <Clock className="h-3.5 w-3.5 text-zinc-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs leading-5 text-zinc-400">{activity.description}</p>
                        <p className="mt-1 text-[10px] font-semibold text-zinc-700">{format(new Date(activity.created_at), 'dd MMM · hh:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-[14px] border border-dashed border-white/[0.07] p-4 text-center text-xs text-zinc-700">No activity recorded for this lead.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
