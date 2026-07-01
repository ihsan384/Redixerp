import { FileText, Clock, CheckCircle2, AlertTriangle, FileSignature, TrendingUp, Layers } from "lucide-react"
import { motion } from "framer-motion"

interface CardDef {
  label: string
  value: number | string
  icon: typeof FileText
  color: string
  prefix?: string
}

interface BillingDashboardCardsProps {
  stats: {
    totalInvoices: number
    pendingInvoices: number
    paidInvoices: number
    overdueInvoices: number
    pendingAgreements: number
    activeAgreements: number
    revenueThisMonth: number
  }
}

export function BillingDashboardCards({ stats }: BillingDashboardCardsProps) {
  const cards: CardDef[] = [
    { label: "Total Invoices",     value: stats.totalInvoices,     icon: FileText,      color: "from-zinc-700/30 to-zinc-800/20 border-white/[0.06]" },
    { label: "Pending",            value: stats.pendingInvoices,   icon: Clock,         color: "from-blue-900/30 to-blue-800/20 border-blue-700/20", },
    { label: "Paid",               value: stats.paidInvoices,      icon: CheckCircle2,  color: "from-green-900/30 to-green-800/20 border-green-700/20" },
    { label: "Overdue",            value: stats.overdueInvoices,   icon: AlertTriangle, color: "from-red-900/30 to-red-800/20 border-red-700/20" },
    { label: "Pending Agreements", value: stats.pendingAgreements, icon: FileSignature, color: "from-yellow-900/30 to-yellow-800/20 border-yellow-700/20" },
    { label: "Active Agreements",  value: stats.activeAgreements,  icon: Layers,        color: "from-purple-900/30 to-purple-800/20 border-purple-700/20" },
    { label: "Revenue This Month", value: stats.revenueThisMonth,  icon: TrendingUp,    color: "from-emerald-900/30 to-emerald-800/20 border-emerald-700/20", prefix: "₹" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon
        const displayValue = card.prefix
          ? `${card.prefix}${(card.value as number).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
          : card.value
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16,1,0.3,1] }}
            className={`bg-gradient-to-br ${card.color} border rounded-2xl p-4 flex flex-col gap-2`}
          >
            <Icon className="w-4 h-4 text-white/50" />
            <div>
              <p className="text-xl font-bold text-white tracking-tight leading-tight">{displayValue}</p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-tight">{card.label}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
