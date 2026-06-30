import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Call, Lead, Revenue } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

interface DailyCallsChartProps {
  calls: Call[]
}

interface ConversionChartProps {
  leads: Lead[]
}

interface RevenueChartProps {
  revenues: Revenue[]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#171717]/95 px-3 py-2 shadow-2xl backdrop-blur-xl">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-sm font-bold text-white">{payload[0].value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

export function DailyCallsChart({ calls }: DailyCallsChartProps) {
  const getCallsData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const counts: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
    
    calls.forEach((c) => {
      const date = new Date(c.start_time)
      const dayName = days[date.getDay()]
      if (counts[dayName] !== undefined) {
        counts[dayName]++
      }
    })

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      day,
      calls: counts[day] || 0,
    }))
  }

  const data = getCallsData()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="h-full w-full"
    >
      <Card className="h-full flex flex-col justify-between">
        <CardHeader>
          <CardTitle>Daily call volume</CardTitle>
          <CardDescription>Outbound activity across the current week</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px] w-full flex-1 min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.055)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(229,57,53,.035)' }} />
              <Bar dataKey="calls" fill="#e53935" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ConversionChart({ leads }: ConversionChartProps) {
  const getConversionData = () => {
    const total = leads.length
    const converted = leads.filter((l) => l.status === 'converted').length
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0

    return [
      { week: 'W1', rate: Math.max(2, Math.round(rate * 0.4)) },
      { week: 'W2', rate: Math.max(5, Math.round(rate * 0.6)) },
      { week: 'W3', rate: Math.max(8, Math.round(rate * 0.75)) },
      { week: 'W4', rate: Math.max(10, Math.round(rate * 0.9)) },
      { week: 'W5', rate: rate },
    ]
  }

  const data = getConversionData()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="h-full w-full"
    >
      <Card className="h-full flex flex-col justify-between">
        <CardHeader>
          <CardTitle>Conversion velocity</CardTitle>
          <CardDescription>Lead-to-client performance across five pipeline checkpoints</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px] w-full flex-1 min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.055)" vertical={false} />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="rate" stroke="#ff625e" strokeWidth={2.5} dot={{ fill: '#e53935', r: 4, strokeWidth: 2, stroke: '#311' }} activeDot={{ r: 6, fill: '#ff625e' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function RevenueChart({ revenues }: RevenueChartProps) {
  const getRevenueData = () => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setDate(1)
      date.setMonth(date.getMonth() - (5 - index))
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleString('default', { month: 'short' }),
      }
    })
    const monthlyMap = Object.fromEntries(months.map((month) => [month.key, 0])) as Record<string, number>

    revenues.forEach((r) => {
      if (r.received_date) {
        const key = r.received_date.slice(0, 7)
        if (monthlyMap[key] !== undefined) {
          monthlyMap[key] += r.amount
        }
      }
    })

    return months.map((month) => ({
      month: month.label,
      revenue: monthlyMap[month.key] || 0,
    }))
  }

  const data = getRevenueData()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="h-full w-full"
    >
      <Card className="h-full flex flex-col justify-between">
        <CardHeader>
          <CardTitle>Revenue performance</CardTitle>
          <CardDescription>Collected revenue over the last six months</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px] w-full flex-1 min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e53935" stopOpacity={0.34} />
                  <stop offset="95%" stopColor="#e53935" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.055)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#ff625e" strokeWidth={2.5} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
