import { supabase } from '@/lib/supabase'
import type { SiteVisitor } from '@/types/database.types'
import type {
  TimeRangePreset,
  VisitorAnalyticsOverview,
  TrafficDataPoint,
  PageMetric,
  GeoMetric,
  TechMetric,
  ReferrerMetric,
  VisitorSessionJourney,
} from '../types'

/**
 * Returns ISO timestamp string corresponding to the start of a preset timeframe
 */
export function getPresetStartDate(preset: TimeRangePreset): string | null {
  const now = new Date()
  switch (preset) {
    case 'today': {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      return today.toISOString()
    }
    case '24h': {
      const d = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      return d.toISOString()
    }
    case '7d': {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return d.toISOString()
    }
    case '30d': {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return d.toISOString()
    }
    case 'all':
    default:
      return null
  }
}

/**
 * Fetch raw visitor records within timeframe
 */
export async function fetchRawVisitors(preset: TimeRangePreset = 'today', limit = 2000): Promise<SiteVisitor[]> {
  const startDate = getPresetStartDate(preset)
  let query = supabase
    .from('site_visitors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching site_visitors:', error)
    return []
  }
  return (data || []) as SiteVisitor[]
}

/**
 * Compute full analytics overview from raw visitor entries
 */
export function computeVisitorAnalytics(
  visitors: SiteVisitor[],
  preset: TimeRangePreset = 'today'
): VisitorAnalyticsOverview {
  const totalPageViews = visitors.length
  if (totalPageViews === 0) {
    return {
      totalPageViews: 0,
      uniqueVisitors: 0,
      totalSessions: 0,
      activeNow: 0,
      pagesPerSession: 0,
      topCountry: { name: 'N/A', percentage: 0 },
      topDevice: { name: 'N/A', percentage: 0 },
      trafficTrends: [],
      topPages: [],
      geoBreakdown: [],
      deviceBreakdown: [],
      osBreakdown: [],
      browserBreakdown: [],
      referrerBreakdown: [],
    }
  }

  const uniqueVisitorIds = new Set<string>()
  const sessionIds = new Set<string>()
  const now = Date.now()
  const fifteenMinutesAgo = now - 15 * 60 * 1000
  const activeVisitorIds = new Set<string>()

  const pageCounts: Record<string, { title: string; views: number; visitors: Set<string> }> = {}
  const countryCounts: Record<string, { countryCode: string; count: number; cities: Record<string, number> }> = {}
  const deviceCounts: Record<string, number> = {}
  const osCounts: Record<string, number> = {}
  const browserCounts: Record<string, number> = {}
  const referrerCounts: Record<string, number> = {}

  visitors.forEach((v) => {
    if (v.visitor_id) uniqueVisitorIds.add(v.visitor_id)
    if (v.session_id) sessionIds.add(v.session_id)

    // Active in last 15 mins
    const hitTime = new Date(v.created_at).getTime()
    if (hitTime >= fifteenMinutesAgo && v.visitor_id) {
      activeVisitorIds.add(v.visitor_id)
    }

    // Page metrics
    const path = v.page_path || '/'
    const title = v.page_title || path
    if (!pageCounts[path]) {
      pageCounts[path] = { title, views: 0, visitors: new Set() }
    }
    pageCounts[path].views += 1
    if (v.visitor_id) pageCounts[path].visitors.add(v.visitor_id)

    // Geo metrics
    const country = v.country || 'Unknown'
    const countryCode = v.country_code || 'UN'
    const city = v.city || 'Unknown'
    if (!countryCounts[country]) {
      countryCounts[country] = { countryCode, count: 0, cities: {} }
    }
    countryCounts[country].count += 1
    countryCounts[country].cities[city] = (countryCounts[country].cities[city] || 0) + 1

    // Device metrics
    const device = (v.device_type || 'Desktop').toLowerCase()
    const formattedDevice = device.charAt(0).toUpperCase() + device.slice(1)
    deviceCounts[formattedDevice] = (deviceCounts[formattedDevice] || 0) + 1

    // OS metrics
    const os = v.os || 'Other'
    osCounts[os] = (osCounts[os] || 0) + 1

    // Browser metrics
    const browser = v.browser || 'Other'
    browserCounts[browser] = (browserCounts[browser] || 0) + 1

    // Referrer metrics
    let ref = v.referrer || 'Direct'
    if (ref.includes('://')) {
      try {
        const urlObj = new URL(ref)
        ref = urlObj.hostname.replace(/^www\./, '')
      } catch {
        // Keep raw ref
      }
    }
    if (ref.toLowerCase().includes('google')) ref = 'Google Search'
    else if (ref.toLowerCase().includes('instagram')) ref = 'Instagram'
    else if (ref.toLowerCase().includes('facebook')) ref = 'Facebook'
    else if (ref.toLowerCase().includes('linkedin')) ref = 'LinkedIn'
    else if (ref.toLowerCase().includes('youtube')) ref = 'YouTube'
    else if (ref.toLowerCase().includes('twitter') || ref.toLowerCase().includes('x.com')) ref = 'Twitter / X'
    else if (!ref || ref === 'Direct' || ref === '/') ref = 'Direct Traffic'

    referrerCounts[ref] = (referrerCounts[ref] || 0) + 1
  })

  // Format Top Pages
  const topPages: PageMetric[] = Object.entries(pageCounts)
    .map(([path, data]) => ({
      path,
      title: data.title,
      views: data.views,
      uniqueVisitors: data.visitors.size,
      percentage: Math.round((data.views / totalPageViews) * 100),
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)

  // Format Geo
  const geoBreakdown: GeoMetric[] = Object.entries(countryCounts)
    .map(([country, data]) => ({
      country,
      countryCode: data.countryCode,
      count: data.count,
      percentage: Math.round((data.count / totalPageViews) * 100),
      cities: Object.entries(data.cities)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    }))
    .sort((a, b) => b.count - a.count)

  // Format Tech
  const deviceBreakdown: TechMetric[] = Object.entries(deviceCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalPageViews) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  const osBreakdown: TechMetric[] = Object.entries(osCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalPageViews) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  const browserBreakdown: TechMetric[] = Object.entries(browserCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalPageViews) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  // Format Referrers
  const referrerBreakdown: ReferrerMetric[] = Object.entries(referrerCounts)
    .map(([source, count]) => ({
      source,
      domain: source,
      count,
      percentage: Math.round((count / totalPageViews) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Compute Traffic Trend Timeline
  const trafficTrends = computeTrafficTimeline(visitors, preset)

  const totalSessions = sessionIds.size || 1
  const pagesPerSession = Number((totalPageViews / totalSessions).toFixed(1))

  const topCountry = geoBreakdown[0]
    ? { name: geoBreakdown[0].country, percentage: geoBreakdown[0].percentage }
    : { name: 'None', percentage: 0 }

  const topDevice = deviceBreakdown[0]
    ? { name: deviceBreakdown[0].name, percentage: deviceBreakdown[0].percentage }
    : { name: 'None', percentage: 0 }

  return {
    totalPageViews,
    uniqueVisitors: uniqueVisitorIds.size,
    totalSessions,
    activeNow: activeVisitorIds.size,
    pagesPerSession,
    topCountry,
    topDevice,
    trafficTrends,
    topPages,
    geoBreakdown,
    deviceBreakdown,
    osBreakdown,
    browserBreakdown,
    referrerBreakdown,
  }
}

/**
 * Generates timeline points (hourly for today/24h, daily for 7d/30d/all)
 */
function computeTrafficTimeline(visitors: SiteVisitor[], preset: TimeRangePreset): TrafficDataPoint[] {
  const isHourly = preset === 'today' || preset === '24h'

  if (isHourly) {
    // Generate 24 hourly buckets
    const buckets: Record<string, { views: number; visitors: Set<string> }> = {}
    const now = new Date()

    if (preset === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      for (let h = 0; h < 24; h++) {
        const hourDate = new Date(todayStart.getTime() + h * 3600 * 1000)
        const hourKey = hourDate.toISOString().slice(0, 13) // "YYYY-MM-DDTHH"
        buckets[hourKey] = { views: 0, visitors: new Set() }
      }
    } else {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 3600 * 1000)
        const hourKey = d.toISOString().slice(0, 13)
        buckets[hourKey] = { views: 0, visitors: new Set() }
      }
    }

    visitors.forEach((v) => {
      const key = v.created_at.slice(0, 13)
      if (buckets[key]) {
        buckets[key].views += 1
        if (v.visitor_id) buckets[key].visitors.add(v.visitor_id)
      }
    })

    return Object.entries(buckets).map(([key, data]) => {
      const dateObj = new Date(`${key}:00:00Z`)
      const hour = dateObj.getHours()
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return {
        timestamp: key,
        label: `${displayHour} ${ampm}`,
        pageViews: data.views,
        uniqueVisitors: data.visitors.size,
      }
    })
  } else {
    // Daily buckets (e.g. 7 or 30 days)
    const daysCount = preset === '7d' ? 7 : preset === '30d' ? 30 : 14
    const buckets: Record<string, { views: number; visitors: Set<string> }> = {}
    const now = new Date()

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000)
      const dayKey = d.toISOString().slice(0, 10) // "YYYY-MM-DD"
      buckets[dayKey] = { views: 0, visitors: new Set() }
    }

    visitors.forEach((v) => {
      const key = v.created_at.slice(0, 10)
      if (buckets[key]) {
        buckets[key].views += 1
        if (v.visitor_id) buckets[key].visitors.add(v.visitor_id)
      }
    })

    return Object.entries(buckets).map(([key, data]) => {
      const dateObj = new Date(key)
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return {
        timestamp: key,
        label,
        pageViews: data.views,
        uniqueVisitors: data.visitors.size,
      }
    })
  }
}

/**
 * Fetch full journey for a specific visitor or session
 */
export async function fetchVisitorJourney(visitorId: string): Promise<VisitorSessionJourney | null> {
  const { data, error } = await supabase
    .from('site_visitors')
    .select('*')
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: true })

  if (error || !data || data.length === 0) return null

  const first = data[0]
  const last = data[data.length - 1]

  return {
    visitorId,
    sessionId: first.session_id,
    firstSeen: first.created_at,
    lastSeen: last.created_at,
    ipAddress: first.ip_address,
    country: first.country,
    city: first.city,
    deviceType: first.device_type,
    os: first.os,
    browser: first.browser,
    screenResolution: first.screen_resolution,
    language: first.language,
    userAgent: first.user_agent,
    referrer: first.referrer,
    hits: data as SiteVisitor[],
  }
}

/**
 * Export visitor records to CSV
 */
export function exportVisitorsToCSV(visitors: SiteVisitor[]) {
  const headers = [
    'Timestamp',
    'Visitor ID',
    'Session ID',
    'Page Path',
    'Page Title',
    'Country',
    'City',
    'Region',
    'Device',
    'OS',
    'Browser',
    'Referrer',
    'IP Address',
    'Resolution',
  ]

  const rows = visitors.map((v) => [
    `"${v.created_at}"`,
    `"${v.visitor_id}"`,
    `"${v.session_id}"`,
    `"${v.page_path}"`,
    `"${(v.page_title || '').replace(/"/g, '""')}"`,
    `"${v.country || ''}"`,
    `"${v.city || ''}"`,
    `"${v.region || ''}"`,
    `"${v.device_type || ''}"`,
    `"${v.os || ''}"`,
    `"${v.browser || ''}"`,
    `"${(v.referrer || '').replace(/"/g, '""')}"`,
    `"${v.ip_address || ''}"`,
    `"${v.screen_resolution || ''}"`,
  ])

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `redix_visitors_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
