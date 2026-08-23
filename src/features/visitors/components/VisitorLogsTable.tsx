import { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react'
import type { SiteVisitor } from '@/types/database.types'
import { exportVisitorsToCSV } from '../services/visitorService'

interface VisitorLogsTableProps {
  visitors: SiteVisitor[]
  onSelectVisitor: (visitor: SiteVisitor) => void
}

function getCountryFlag(code?: string | null): string {
  if (!code || code.length !== 2 || code === 'UN') return '🌐'
  const base = 127397
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => base + c.charCodeAt(0)))
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${Math.max(diffSec, 1)}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export function VisitorLogsTable({ visitors, onSelectVisitor }: VisitorLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [browserFilter, setBrowserFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Distinct filter options
  const deviceOptions = useMemo(() => {
    const set = new Set<string>()
    visitors.forEach((v) => {
      if (v.device_type) set.add(v.device_type)
    })
    return Array.from(set)
  }, [visitors])

  const browserOptions = useMemo(() => {
    const set = new Set<string>()
    visitors.forEach((v) => {
      if (v.browser) set.add(v.browser)
    })
    return Array.from(set)
  }, [visitors])

  const countryOptions = useMemo(() => {
    const set = new Set<string>()
    visitors.forEach((v) => {
      if (v.country) set.add(v.country)
    })
    return Array.from(set)
  }, [visitors])

  // Filtered dataset
  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matches =
          (v.page_path && v.page_path.toLowerCase().includes(query)) ||
          (v.page_title && v.page_title.toLowerCase().includes(query)) ||
          (v.country && v.country.toLowerCase().includes(query)) ||
          (v.city && v.city.toLowerCase().includes(query)) ||
          (v.visitor_id && v.visitor_id.toLowerCase().includes(query)) ||
          (v.ip_address && v.ip_address.toLowerCase().includes(query)) ||
          (v.browser && v.browser.toLowerCase().includes(query)) ||
          (v.os && v.os.toLowerCase().includes(query)) ||
          (v.referrer && v.referrer.toLowerCase().includes(query))

        if (!matches) return false
      }

      // Device
      if (deviceFilter !== 'all' && v.device_type?.toLowerCase() !== deviceFilter.toLowerCase()) {
        return false
      }

      // Browser
      if (browserFilter !== 'all' && v.browser?.toLowerCase() !== browserFilter.toLowerCase()) {
        return false
      }

      // Country
      if (countryFilter !== 'all' && v.country?.toLowerCase() !== countryFilter.toLowerCase()) {
        return false
      }

      return true
    })
  }, [visitors, searchTerm, deviceFilter, browserFilter, countryFilter])

  // Pagination
  const totalPages = Math.ceil(filteredVisitors.length / pageSize) || 1
  const paginatedVisitors = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredVisitors.slice(start, start + pageSize)
  }, [filteredVisitors, currentPage])

  const handleExport = () => {
    exportVisitorsToCSV(filteredVisitors)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] shadow-xl">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-4 border-b border-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by city, country, page path, IP, OS, visitor ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50"
          />
        </div>

        {/* Filter Dropdowns & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Device filter */}
          <select
            value={deviceFilter}
            onChange={(e) => {
              setDeviceFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500/50"
          >
            <option value="all" className="bg-zinc-900 text-white">All Devices</option>
            {deviceOptions.map((dev) => (
              <option key={dev} value={dev} className="bg-zinc-900 text-white capitalize">
                {dev}
              </option>
            ))}
          </select>

          {/* Country filter */}
          <select
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500/50"
          >
            <option value="all" className="bg-zinc-900 text-white">All Countries</option>
            {countryOptions.map((c) => (
              <option key={c} value={c} className="bg-zinc-900 text-white">
                {c}
              </option>
            ))}
          </select>

          {/* Browser filter */}
          <select
            value={browserFilter}
            onChange={(e) => {
              setBrowserFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500/50"
          >
            <option value="all" className="bg-zinc-900 text-white">All Browsers</option>
            {browserOptions.map((b) => (
              <option key={b} value={b} className="bg-zinc-900 text-white">
                {b}
              </option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExport}
            disabled={filteredVisitors.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            title="Export filtered records to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/5 bg-white/[0.02] text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 pl-6 pr-3">Time</th>
              <th className="px-3 py-3.5">Location</th>
              <th className="px-3 py-3.5">Page Visited</th>
              <th className="px-3 py-3.5">Device & OS</th>
              <th className="px-3 py-3.5">Browser</th>
              <th className="px-3 py-3.5">Referrer</th>
              <th className="py-3.5 pl-3 pr-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-300">
            {paginatedVisitors.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500">
                  No visitor logs match the current filter criteria
                </td>
              </tr>
            ) : (
              paginatedVisitors.map((v) => {
                const device = (v.device_type || 'desktop').toLowerCase()
                const DeviceIcon = device === 'mobile' ? Smartphone : device === 'tablet' ? Tablet : Monitor

                return (
                  <tr
                    key={v.id}
                    onClick={() => onSelectVisitor(v)}
                    className="group cursor-pointer transition hover:bg-white/[0.03]"
                  >
                    {/* Time */}
                    <td className="py-3.5 pl-6 pr-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="font-semibold text-white">
                          {formatRelativeTime(v.created_at)}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getCountryFlag(v.country_code)}</span>
                        <div>
                          <p className="font-semibold text-zinc-200">
                            {v.city ? `${v.city}, ` : ''}{v.country || 'Unknown'}
                          </p>
                          <p className="text-[10px] text-zinc-500">{v.region || v.country_code || 'N/A'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Page Path */}
                    <td className="px-3 py-3.5 max-w-xs truncate">
                      <div className="font-mono font-bold text-red-400 truncate">
                        {v.page_path || '/'}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                        {v.page_title || 'REDIX.MEDIA'}
                      </div>
                    </td>

                    {/* Device & OS */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <DeviceIcon className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="capitalize text-zinc-200">{v.device_type || 'Desktop'}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">{v.os || 'Other OS'}</span>
                    </td>

                    {/* Browser */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-zinc-300 font-medium">
                        {v.browser || 'Other'}
                      </span>
                    </td>

                    {/* Referrer */}
                    <td className="px-3 py-3.5 max-w-[140px] truncate text-zinc-400">
                      <span className="truncate block" title={v.referrer || 'Direct'}>
                        {v.referrer || 'Direct'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectVisitor(v)
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Journey</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 border-t border-white/5 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-400">
        <div>
          Showing{' '}
          <span className="font-semibold text-white">
            {filteredVisitors.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-white">
            {Math.min(currentPage * pageSize, filteredVisitors.length)}
          </span>{' '}
          of <span className="font-semibold text-white">{filteredVisitors.length}</span> records
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-semibold text-zinc-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
