import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  Handshake,
  Phone,
  PhoneOff,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { DailyCallsChart, ConversionChart, RevenueChart } from './components/Charts'
import { RecentActivityFeed, UpcomingFollowUps } from './components/ActivityFeed'
import { Button, PageHeader, StatCard } from '@/components/ui/Primitives'
import { useAuth } from '@/features/auth/AuthContext'
import { formatCurrency } from '@/utils/format'
import { Storage } from '@/lib/storage'
import type { Activity, Call, Expense, Lead, Revenue } from '@/types'

export function DashboardPage() {
  const navigate = useNavigate()
  const { employee } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [calls, setCalls] = useState<Call[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    setLeads(Storage.getLeads())
    setCalls(Storage.getCalls())
    setActivities(Storage.getActivities())
    setRevenues(Storage.getRevenue())
    setExpenses(Storage.getExpenses())
  }, [])

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().toISOString().slice(0, 7)
    const revenueThisMonth = revenues
      .filter((revenue) => revenue.received_date.startsWith(currentMonth))
      .reduce((total, revenue) => total + revenue.amount, 0)
    const expensesThisMonth = expenses
      .filter((expense) => expense.date.startsWith(currentMonth))
      .reduce((total, expense) => total + expense.amount, 0)
    const closedDeals = leads.filter((lead) => lead.status === 'converted').length
    const conversionRate = leads.length > 0 ? Math.round((closedDeals / leads.length) * 100) : 0
    const profit = revenueThisMonth - expensesThisMonth

    return {
      totalLeads: leads.length,
      todaysCalls: calls.filter((call) => call.start_time.startsWith(today)).length,
      pendingCalls: leads.filter((lead) => ['new', 'called', 'no_answer', 'busy', 'call_later'].includes(lead.status)).length,
      followUpToday: calls.filter((call) => call.follow_up && call.follow_up_date === today).length,
      closedDeals,
      conversionRate,
      revenueThisMonth,
      expensesThisMonth,
      profit,
      profitMargin: revenueThisMonth > 0 ? Math.round((profit / revenueThisMonth) * 100) : 0,
    }
  }, [calls, expenses, leads, revenues])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page-shell page-stack">
      <PageHeader
        eyebrow="Command center"
        title={`${greeting}, ${employee?.name?.split(' ')[0] || 'there'}.`}
        description="A live view of pipeline health, sales activity, follow-ups, and financial momentum across REDIX."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/reports')}>View reports</Button>
            <Button variant="primary" onClick={() => navigate('/call-center')}>
              Start calling <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[20px] border border-red-400/15 bg-[linear-gradient(125deg,rgba(229,57,53,.18),rgba(229,57,53,.035)_44%,rgba(255,255,255,.025))] p-6 shadow-[0_28px_90px_rgba(0,0,0,.42)] sm:p-8"
      >
        <div className="redix-grid absolute inset-0 opacity-30" />
        <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-red-500/14 blur-[90px]" />
        <div className="relative grid gap-8 xl:grid-cols-[1.1fr_1fr] xl:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-300/15 bg-red-500/8 px-3 py-1.5 text-[11px] font-bold text-red-200">
              <Sparkles className="h-3.5 w-3.5" /> Live business pulse
            </span>
            <h2 className="mt-5 max-w-xl text-[30px] font-bold leading-[1.12] tracking-[-0.045em] text-white sm:text-[38px]">
              Your pipeline is moving. Keep the momentum focused.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-[15px]">
              {metrics.pendingCalls} leads are ready for action and {metrics.followUpToday} follow-ups are due today. Your current conversion rate is {metrics.conversionRate}%.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] border border-white/[0.075] bg-black/20 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-bold uppercase tracking-[0.09em]">Revenue</span>
                <TrendingUp className="h-4 w-4 text-emerald-300" />
              </div>
              <p className="metric-value mt-5 text-xl sm:text-2xl">{formatCurrency(metrics.revenueThisMonth)}</p>
              <p className="mt-1 text-[11px] text-zinc-600">This month</p>
            </div>
            <div className="rounded-[18px] border border-white/[0.075] bg-black/20 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-bold uppercase tracking-[0.09em]">Net profit</span>
                <CircleDollarSign className="h-4 w-4 text-red-300" />
              </div>
              <p className="metric-value mt-5 text-xl sm:text-2xl">{formatCurrency(metrics.profit)}</p>
              <p className="mt-1 text-[11px] text-zinc-600">{metrics.profitMargin}% margin</p>
            </div>
            <div className="rounded-[18px] border border-white/[0.075] bg-black/20 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-bold uppercase tracking-[0.09em]">Expenses</span>
                <TrendingDown className="h-4 w-4 text-amber-300" />
              </div>
              <p className="metric-value mt-5 text-xl sm:text-2xl">{formatCurrency(metrics.expensesThisMonth)}</p>
              <p className="mt-1 text-[11px] text-zinc-600">Operating spend</p>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total leads" value={metrics.totalLeads.toLocaleString()} icon={<Users className="h-5 w-5" />} detail="All time" tone="info" index={0} />
        <StatCard label="Today's calls" value={metrics.todaysCalls} icon={<Phone className="h-5 w-5" />} detail="Live activity" tone="success" index={1} />
        <StatCard label="Pending calls" value={metrics.pendingCalls} icon={<PhoneOff className="h-5 w-5" />} detail="Needs action" tone="warning" index={2} />
        <StatCard label="Follow-ups due" value={metrics.followUpToday} icon={<CalendarClock className="h-5 w-5" />} detail="Today" tone="brand" index={3} />
        <StatCard label="Conversion rate" value={`${metrics.conversionRate}%`} icon={<Target className="h-5 w-5" />} detail="Lead to client" tone="success" trend="On track" index={4} />
        <StatCard label="Closed deals" value={metrics.closedDeals} icon={<Handshake className="h-5 w-5" />} detail="All time" tone="neutral" index={5} />
      </section>

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8"><RevenueChart revenues={revenues} /></div>
        <div className="col-span-12 xl:col-span-4"><DailyCallsChart calls={calls} /></div>
      </section>

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-7"><ConversionChart leads={leads} /></div>
        <div className="col-span-12 xl:col-span-5"><UpcomingFollowUps calls={calls} leads={leads} /></div>
      </section>

      <section>
        <RecentActivityFeed activities={activities} leads={leads} />
      </section>
    </div>
  )
}
