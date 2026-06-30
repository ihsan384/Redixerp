import { useEffect, useState } from 'react'
import {
  Users,
  Phone,
  PhoneOff,
  CalendarClock,
  ThumbsUp,
  ThumbsDown,
  Handshake,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react'
import { KpiCard } from './components/KpiCard'
import { DailyCallsChart, ConversionChart, RevenueChart } from './components/Charts'
import { RecentActivityFeed, UpcomingFollowUps } from './components/ActivityFeed'
import { formatCurrency } from '@/utils/format'
import { Storage } from '@/lib/storage'
import type { Lead, Call, Activity, Revenue, Expense } from '@/types'

export function DashboardPage() {
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

  // 1. Calculate KPI values
  const totalLeads = leads.length
  const todayStr = new Date().toISOString().split('T')[0]
  
  const todaysCalls = calls.filter((c) => c.start_time.startsWith(todayStr)).length
  const pendingCalls = leads.filter((l) => ['new', 'called', 'no_answer', 'busy', 'call_later'].includes(l.status)).length
  const followUpToday = calls.filter((c) => c.follow_up && c.follow_up_date === todayStr).length
  const interestedClients = leads.filter((l) => l.status === 'interested').length
  const notInterested = leads.filter((l) => l.status === 'not_interested').length
  const closedDeals = leads.filter((l) => l.status === 'converted').length

  // Current Month calculations
  const currentMonthStr = new Date().toISOString().slice(5, 7)
  const currentYearStr = new Date().getFullYear().toString()

  const revenueThisMonth = revenues
    .filter((r) => r.received_date.includes(`-${currentMonthStr}-`) || r.received_date.startsWith(`${currentYearStr}-${currentMonthStr}`))
    .reduce((acc, r) => acc + r.amount, 0)

  const expensesThisMonth = expenses
    .filter((e) => e.date.includes(`-${currentMonthStr}-`) || e.date.startsWith(`${currentYearStr}-${currentMonthStr}`))
    .reduce((acc, e) => acc + e.amount, 0)

  const profit = revenueThisMonth - expensesThisMonth

  return (
    <div className="max-w-none w-full px-8 py-6 space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Leads" value={totalLeads.toLocaleString()} icon={<Users className="w-5 h-5" />} index={0} />
        <KpiCard title="Today's Calls" value={todaysCalls} icon={<Phone className="w-5 h-5" />} index={1} />
        <KpiCard title="Pending Calls" value={pendingCalls} icon={<PhoneOff className="w-5 h-5" />} index={2} />
        <KpiCard title="Follow-up Today" value={followUpToday} icon={<CalendarClock className="w-5 h-5" />} index={3} />
        <KpiCard title="Interested" value={interestedClients} icon={<ThumbsUp className="w-5 h-5" />} index={4} />
        <KpiCard title="Not Interested" value={notInterested} icon={<ThumbsDown className="w-5 h-5" />} index={5} />
        <KpiCard title="Closed Deals" value={closedDeals} icon={<Handshake className="w-5 h-5" />} index={6} />
        <KpiCard title="Revenue" value={formatCurrency(revenueThisMonth)} icon={<TrendingUp className="w-5 h-5" />} index={7} />
        <div className="sm:col-span-1 lg:col-span-2">
          <KpiCard title="Expenses" value={formatCurrency(expensesThisMonth)} icon={<TrendingDown className="w-5 h-5" />} index={8} />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <KpiCard title="Profit" value={formatCurrency(profit)} icon={<DollarSign className="w-5 h-5" />} index={9} />
        </div>
      </div>

      {/* Main Charts 12-Column Grid */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <RevenueChart revenues={revenues} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <DailyCallsChart calls={calls} />
        </div>
      </div>

      {/* Secondary Chart Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <ConversionChart leads={leads} />
        </div>
      </div>

      {/* Bottom Section 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityFeed activities={activities} leads={leads} />
        <UpcomingFollowUps calls={calls} leads={leads} />
      </div>
    </div>
  )
}
