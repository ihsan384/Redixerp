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
  Zap,
} from 'lucide-react'
import { KpiCard } from './components/KpiCard'
import { DailyCallsChart, ConversionChart, RevenueChart } from './components/Charts'
import { RecentActivityFeed, UpcomingFollowUps } from './components/ActivityFeed'
import { formatCurrency } from '@/utils/format'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import type { Lead, Call, Activity, Revenue, Expense } from '@/types'
import { toast } from 'sonner'

export function DashboardPage() {
  const { employee } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [calls, setCalls] = useState<Call[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [messagesCount, setMessagesCount] = useState(0)
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0)
  const [activeProjectsCount, setActiveProjectsCount] = useState(0)
  const [quotesCount, setQuotesCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      const [
        { data: leadsData },
        { data: callsData },
        { data: activitiesData },
        { data: revenuesData },
        { data: expensesData },
        { data: msgData },
        { data: revData },
        { data: projData },
        { data: quoteData },
      ] = await Promise.all([
        supabase.from('leads').select('*'),
        supabase.from('calls').select('*'),
        supabase.from('activities').select('*'),
        supabase.from('revenue').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('messages').select('*').eq('status', 'unread'),
        supabase.from('client_reviews').select('*').eq('status', 'pending'),
        supabase.from('projects').select('*'),
        supabase.from('quotes').select('*'),
      ])

      setLeads((leadsData || []) as Lead[])
      setCalls((callsData || []) as Call[])
      setActivities((activitiesData || []) as Activity[])
      setRevenues((revenuesData || []) as Revenue[])
      setExpenses((expensesData || []) as Expense[])
      setMessagesCount(msgData?.length || 0)
      setPendingReviewsCount(revData?.length || 0)
      setActiveProjectsCount(projData?.length || 0)
      setQuotesCount(quoteData?.length || 0)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    loadDashboardData()
  }, [])

  // Calculate KPI values
  const totalLeads = leads.length
  const todayStr = new Date().toISOString().split('T')[0]

  const todaysCalls = calls.filter((c) => c.start_time?.startsWith(todayStr)).length
  const pendingCalls = leads.filter((l) => ['new', 'called', 'no_answer', 'busy', 'call_later'].includes(l.status)).length
  const followUpToday = calls.filter((c) => c.follow_up && c.follow_up_date === todayStr).length
  const interestedClients = leads.filter((l) => l.status === 'interested').length
  const notInterested = leads.filter((l) => l.status === 'not_interested').length
  const closedDeals = leads.filter((l) => l.status === 'converted').length

  // Current Month calculations
  const currentMonthStr = new Date().toISOString().slice(5, 7)
  const currentYearStr = new Date().getFullYear().toString()

  const revenueThisMonth = revenues
    .filter((r) => r.received_date && (r.received_date.includes(`-${currentMonthStr}-`) || r.received_date.startsWith(`${currentYearStr}-${currentMonthStr}`)))
    .reduce((acc, r) => acc + (r.amount || 0), 0)

  const expensesThisMonth = expenses
    .filter((e) => e.date && (e.date.includes(`-${currentMonthStr}-`) || e.date.startsWith(`${currentYearStr}-${currentMonthStr}`)))
    .reduce((acc, e) => acc + (e.amount || 0), 0)


  const profit = revenueThisMonth - expensesThisMonth

  if (isLoading) {
    return (
      <div className="redix-grid flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-400/20 border-t-red-400" />
          <p className="text-xs font-semibold text-zinc-500">Retrieving operational intelligence logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell page-stack space-y-6">
      {/* Premium Hero Overview Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-[#1c1c1e]/40 to-[#111112]/50 border border-white/[0.06] rounded-[20px] p-6 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-red-400/20" /> Active Operations Platform
          </div>
          <h1 className="text-h2 font-bold text-white tracking-tight leading-tight">
            Welcome back, {employee?.name || 'Representative'}
          </h1>
          <p className="text-caption text-zinc-500 font-medium">
            Here is your agency's pipeline status, collections ledger, and customer outreach metrics today.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Prospects" value={totalLeads.toLocaleString()} icon={<Users className="w-5 h-5" />} index={0} change="+12.4%" changeType="positive" />
        <KpiCard title="Today's Outbound Calls" value={todaysCalls} icon={<Phone className="w-5 h-5" />} index={1} />
        <KpiCard title="Call-Center Queue Pending" value={pendingCalls} icon={<PhoneOff className="w-5 h-5" />} index={2} />
        <KpiCard title="Callbacks Pending Today" value={followUpToday} icon={<CalendarClock className="w-5 h-5" />} index={3} change="Active" changeType="neutral" />
        <KpiCard title="Qualified Leads (Interested)" value={interestedClients} icon={<ThumbsUp className="w-5 h-5" />} index={4} tone="success" />
        <KpiCard title="Lost Leads (Disinterested)" value={notInterested} icon={<ThumbsDown className="w-5 h-5" />} index={5} tone="neutral" />
        <KpiCard title="Deals Closed Won" value={closedDeals} icon={<Handshake className="w-5 h-5" />} index={6} tone="brand" />
        <KpiCard title="Monthly Gross Revenue" value={formatCurrency(revenueThisMonth)} icon={<TrendingUp className="w-5 h-5" />} index={7} tone="success" />
        
        <div className="sm:col-span-1 lg:col-span-2">
          <KpiCard title="Monthly Operations Expenses" value={formatCurrency(expensesThisMonth)} icon={<TrendingDown className="w-5 h-5" />} index={8} tone="neutral" />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <KpiCard title="Net Profit Margin" value={formatCurrency(profit)} icon={<DollarSign className="w-5 h-5" />} index={9} tone="brand" />
        </div>
      </div>

      {/* Main Analytical Chart Layer */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <RevenueChart revenues={revenues} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <DailyCallsChart calls={calls} />
        </div>
      </div>

      {/* Sub charts row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <ConversionChart leads={leads} />
        </div>
      </div>

      {/* Dynamic Timelines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityFeed activities={activities} leads={leads} />
        <UpcomingFollowUps calls={calls} leads={leads} />
      </div>
    </div>
  )
}
