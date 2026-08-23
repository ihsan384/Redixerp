import type { SiteVisitor } from '@/types/database.types'

export type TimeRangePreset = 'today' | '24h' | '7d' | '30d' | 'all'

export interface VisitorFilter {
  search?: string
  deviceType?: string
  country?: string
  browser?: string
  os?: string
  pagePath?: string
  timeRange: TimeRangePreset
}

export interface TrafficDataPoint {
  timestamp: string
  label: string
  pageViews: number
  uniqueVisitors: number
}

export interface PageMetric {
  path: string
  title: string
  views: number
  uniqueVisitors: number
  percentage: number
}

export interface GeoMetric {
  country: string
  countryCode: string
  cities: { city: string; count: number }[]
  count: number
  percentage: number
}

export interface TechMetric {
  name: string
  count: number
  percentage: number
  icon?: string
}

export interface ReferrerMetric {
  source: string
  domain: string
  count: number
  percentage: number
}

export interface VisitorAnalyticsOverview {
  totalPageViews: number
  uniqueVisitors: number
  totalSessions: number
  activeNow: number
  pagesPerSession: number
  topCountry: { name: string; percentage: number }
  topDevice: { name: string; percentage: number }
  trafficTrends: TrafficDataPoint[]
  topPages: PageMetric[]
  geoBreakdown: GeoMetric[]
  deviceBreakdown: TechMetric[]
  osBreakdown: TechMetric[]
  browserBreakdown: TechMetric[]
  referrerBreakdown: ReferrerMetric[]
}

export interface VisitorSessionJourney {
  visitorId: string
  sessionId: string
  firstSeen: string
  lastSeen: string
  ipAddress?: string | null
  country?: string | null
  city?: string | null
  deviceType?: string | null
  os?: string | null
  browser?: string | null
  screenResolution?: string | null
  language?: string | null
  userAgent?: string | null
  referrer?: string | null
  hits: SiteVisitor[]
}
