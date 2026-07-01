import type { InvoiceTimelineEvent } from "@/types"
import { FileText, Send, Eye, Bell, CreditCard, CheckCircle2, XCircle, Banknote } from "lucide-react"

const EVENT_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  created:         { label: "Invoice Created",     icon: FileText,      color: "text-zinc-400 border-zinc-700 bg-zinc-900" },
  sent:            { label: "Sent to Client",      icon: Send,          color: "text-blue-400 border-blue-700/40 bg-blue-900/20" },
  viewed:          { label: "Viewed by Client",    icon: Eye,           color: "text-purple-400 border-purple-700/40 bg-purple-900/20" },
  reminder_sent:   { label: "Reminder Sent",       icon: Bell,          color: "text-yellow-400 border-yellow-700/40 bg-yellow-900/20" },
  partially_paid:  { label: "Partially Paid",      icon: CreditCard,    color: "text-orange-400 border-orange-700/40 bg-orange-900/20" },
  paid:            { label: "Fully Paid",          icon: CheckCircle2,  color: "text-green-400 border-green-700/40 bg-green-900/20" },
  closed:          { label: "Closed",              icon: Banknote,      color: "text-green-400 border-green-700/40 bg-green-900/20" },
  voided:          { label: "Voided",              icon: XCircle,       color: "text-red-400 border-red-700/40 bg-red-900/20" },
}

interface InvoiceTimelineProps {
  events: InvoiceTimelineEvent[]
}

export function InvoiceTimeline({ events }: InvoiceTimelineProps) {
  if (!events || events.length === 0) return null
  const sorted = [...events].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return (
    <div className="space-y-1">
      {sorted.map((evt, idx) => {
        const cfg = EVENT_CONFIG[evt.event] || EVENT_CONFIG.created
        const Icon = cfg.icon
        const isLast = idx === sorted.length - 1
        return (
          <div key={evt.id} className="flex gap-3 items-start">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${cfg.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-white/[0.06] mt-1 min-h-[16px]" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-white leading-tight">{cfg.label}</p>
              {evt.note && <p className="text-xs text-zinc-500 mt-0.5">{evt.note}</p>}
              <p className="text-xs text-zinc-600 mt-0.5">
                {new Date(evt.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
