import { useState } from 'react'
import {
  List,
  Grid,
  LayoutPanelTop,
  Search,
  Plus,
  Upload,
  Download,
  Users,
  Phone,
  MessageSquare,
  MapPin,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/Primitives'
import { useLeads } from './hooks/useLeads'
import { Storage } from '@/lib/storage'
import { LEAD_CATEGORIES, LEAD_STATUS_LABELS } from '@/utils/constants'
import { LeadStatusBadge } from './components/LeadStatusBadge'
import { AddLeadModal } from './components/AddLeadModal'
import { ImportExcelModal } from './components/ImportExcelModal'
import { LeadDetailDrawer } from './components/LeadDetailDrawer'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export function LeadsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  // Filter States
  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [assignedTo, setAssignedTo] = useState('all')

  // View & UI States
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'kanban'>('table')
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 12

  // Modals / Drawers States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedLeadForDrawer, setSelectedLeadForDrawer] = useState<any>(null)

  // Fetch leads with active filters
  const { leads, isLoading, updateLead } = useLeads({
    search: search || undefined,
    category: category !== 'all' ? category : undefined,
    status: status !== 'all' ? (status as any) : undefined,
    assignedTo: assignedTo !== 'all' ? assignedTo : undefined,
  })

  const employees = Storage.getEmployees()

  // Pagination Logic
  const totalItems = leads.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedLeads = leads.slice((page - 1) * pageSize, page * pageSize)

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(paginatedLeads.map((l) => l.id))
    } else {
      setSelectedLeadIds([])
    }
  }

  const handleSelectLead = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds((prev) => [...prev, id])
    } else {
      setSelectedLeadIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleBulkAssign = async (employeeId: string) => {
    if (selectedLeadIds.length === 0) return
    try {
      await Promise.all(
        selectedLeadIds.map((id) =>
          updateLead({ id, data: { assigned_to: employeeId || undefined } })
        )
      )
      toast.success(`Assigned ${selectedLeadIds.length} leads successfully`)
      setSelectedLeadIds([])

      const currentActivities = Storage.getActivities()
      const newActivities = selectedLeadIds.map((id) => ({
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        lead_id: id,
        type: 'status_change' as const,
        description: `Lead bulk-assigned to employee.`,
        created_at: new Date().toISOString(),
      }))
      Storage.saveActivities([...newActivities, ...currentActivities])
    } catch (err: unknown) {
      toast.error('Bulk assignment failed')
    }
  }

  // CSV Export Routine
  const handleExportCSV = () => {
    const leadsToExport =
      selectedLeadIds.length > 0
        ? leads.filter((l) => selectedLeadIds.includes(l.id))
        : leads

    if (leadsToExport.length === 0) {
      toast.error('No leads available to export')
      return
    }

    const headers = 'Shop Name,Category,Phone,Website,Address,Rating,Status,Assigned To\n'
    const csvContent =
      headers +
      leadsToExport
        .map((l) => {
          const emp = employees.find((e) => e.id === l.assigned_to)?.name || 'Unassigned'
          return `"${l.shop_name.replace(/"/g, '""')}","${l.category}","${l.phone}","${l.website || ''}","${(l.address || '').replace(/"/g, '""')}",${l.rating || ''},"${l.status}","${emp}"`
        })
        .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `redix_leads_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${leadsToExport.length} leads to CSV`)
  }

  const handleWhatsApp = (phone: string) => {
    const formatted = phone.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${formatted}`, '_blank')
  }

  const handleCallRedirect = (leadId: string) => {
    navigate(`/call-center?leadId=${leadId}`)
  }

  const kanbanColumns = [
    { id: 'queue', label: 'Queued', color: 'bg-blue-400', statuses: ['new', 'called', 'no_answer', 'busy', 'call_later', 'owner_not_available'] },
    { id: 'qualified', label: 'Qualified', color: 'bg-emerald-400', statuses: ['interested'] },
    { id: 'meeting', label: 'Meetings', color: 'bg-violet-400', statuses: ['meeting_scheduled'] },
    { id: 'won', label: 'Closed Won', color: 'bg-red-400', statuses: ['converted'] },
    { id: 'closed', label: 'Closed Lost', color: 'bg-zinc-500', statuses: ['not_interested', 'lost', 'wrong_number', 'already_has_website'] },
  ]

  return (
    <div className="page-shell page-stack space-y-6">
      <PageHeader
        eyebrow="Business Pipeline"
        title="Leads Ledger"
        description="Manage inbound prospects, qualify opportunities, coordinate ownership, and drive sales closures."
      />

      {/* Top Action & Filtering Bar - Redesigned to fit the 8px layout */}
      <div className="panel-card flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center">
        {/* Left Side: Search + Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search prospects..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10 w-60"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Categories</option>
            {LEAD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Statuses</option>
            {Object.entries(LEAD_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          {/* Employee Filter */}
          <select
            value={assignedTo}
            onChange={(e) => {
              setAssignedTo(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Reps</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right Side: Grid/Table toggle + Import/Export/Add */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Bulk Assign */}
          {selectedLeadIds.length > 0 && (
            <select
              onChange={(e) => {
                handleBulkAssign(e.target.value)
                e.target.value = ''
              }}
              className="!bg-white !text-black !border-transparent font-semibold h-11 px-3 py-0.5 rounded-xl cursor-pointer"
            >
              <option value="">Bulk Assign ({selectedLeadIds.length})</option>
              <option value="">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  Assign to {emp.name}
                </option>
              ))}
            </select>
          )}

          {/* View Toggles */}
          <div className="segmented-control">
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'table' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              aria-label="Kanban view"
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'kanban' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'
              )}
            >
              <LayoutPanelTop className="w-4 h-4" />
            </button>
          </div>

          {/* Import / Export */}
          <button
            onClick={() => setIsImportOpen(true)}
            className="btn-secondary h-11 px-4 text-xs shrink-0"
          >
            <Upload className="w-4 h-4 text-zinc-500" /> <span>Import</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn-secondary h-11 px-4 text-xs shrink-0"
          >
            <Download className="w-4 h-4 text-zinc-500" /> <span>Export</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-primary h-11 px-4 text-xs shrink-0"
          >
            <Plus className="w-4 h-4" /> <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 border border-dashed border-white/[0.08] rounded-3xl gap-4 bg-white/[0.01]">
          <div className="w-9 h-9 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs font-semibold text-zinc-500">Loading prospects list...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-white/[0.08] rounded-[24px] bg-white/[0.01]">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-white mb-1">No leads found matching query</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">Import a spreadsheet or click Add Lead to start cataloging prospects.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* PREMIUM TABLE VIEW */
        <div className="table-shell">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse sticky-header">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#111111]/40">
                  <th className="py-3.5 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedLeads.length > 0 &&
                        paginatedLeads.every((l) => selectedLeadIds.includes(l.id))
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-white/[0.08] bg-black text-white focus:ring-0"
                    />
                  </th>
                  <th className="py-3.5 px-4">Shop / Business Name</th>
                  <th className="py-3.5 px-4 w-40">Category</th>
                  <th className="py-3.5 px-4 w-40">Contact Phone</th>
                  <th className="py-3.5 px-4 w-24">Rating</th>
                  <th className="py-3.5 px-4 w-40">Status</th>
                  <th className="py-3.5 px-4 w-44">Assigned Representative</th>
                  <th className="py-3.5 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {paginatedLeads.map((lead) => {
                  const isChecked = selectedLeadIds.includes(lead.id)
                  const emp = employees.find((e) => e.id === lead.assigned_to)

                  return (
                    <tr
                      key={lead.id}
                      className={cn(
                        'hover:bg-white/[0.02] transition-colors group',
                        isChecked ? 'bg-white/[0.01]' : ''
                      )}
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                          className="rounded border-white/[0.08] bg-black text-white focus:ring-0"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white truncate max-w-xs">{lead.shop_name}</div>
                        <div className="text-[11px] text-zinc-500 mt-1 truncate max-w-xs font-medium">
                          {lead.address || 'No address logged'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-zinc-400">{lead.category}</td>
                      <td className="py-4 px-4 text-xs font-medium text-white">{lead.phone}</td>
                      <td className="py-4 px-4 text-xs">
                        {lead.rating ? (
                          <div className="flex items-center gap-1 font-bold text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{lead.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-bold">--</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <LeadStatusBadge status={lead.status} />
                      </td>
                      <td className="py-4 px-4 text-xs">
                        {emp ? (
                          <span className="text-white font-bold inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            {emp.name}
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-semibold italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity xl:opacity-0 xl:group-hover:opacity-100">
                          <button
                            onClick={() => handleCallRedirect(lead.id)}
                            className="p-2 rounded-lg hover:bg-white/[0.06] text-[#A1A1AA] hover:text-white transition-colors"
                            title="Dial Prospect"
                          >
                            <Phone className="w-4 h-4 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => setSelectedLeadForDrawer(lead)}
                            className="p-2 rounded-lg hover:bg-white/[0.06] text-[#A1A1AA] hover:text-white transition-colors"
                            title="View File History"
                          >
                            <Eye className="w-4 h-4 text-zinc-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* PREMIUM DETAILED CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedLeads.map((lead) => {
            const emp = employees.find((e) => e.id === lead.assigned_to)

            return (
              <div
                key={lead.id}
                className="surface-card flex flex-col justify-between space-y-4"
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight leading-snug">{lead.shop_name}</h3>
                      <p className="text-xs text-zinc-500 font-semibold mt-0.5">{lead.category}</p>
                    </div>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 h-10 border-t border-white/[0.04] pt-2">
                    {lead.notes || 'No description notes logged for this prospect.'}
                  </p>
                </div>

                {/* Card Fields */}
                <div className="text-xs space-y-2.5 border-t border-white/[0.06] pt-3.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Contact:</span>
                    <span className="text-white font-bold">{lead.phone}</span>
                  </div>
                  {lead.website && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Website:</span>
                      <a
                        href={`https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400 hover:text-red-300 font-semibold hover:underline truncate max-w-[190px]"
                      >
                        {lead.website}
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Representative:</span>
                    <span className="text-white font-bold">
                      {emp ? emp.name : <span className="text-zinc-600 font-medium italic">Unassigned</span>}
                    </span>
                  </div>
                </div>

                {/* Card Buttons */}
                <div className="grid grid-cols-4 gap-2 border-t border-white/[0.06] pt-3 shrink-0">
                  <button
                    onClick={() => handleCallRedirect(lead.id)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/12 text-white hover:bg-white/[0.04] transition-all"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => handleWhatsApp(lead.phone)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/12 text-white hover:bg-white/[0.04] transition-all"
                  >
                    <MessageSquare className="w-4 h-4 text-green-400" />
                  </button>
                  <button
                    onClick={() => {
                      const query = encodeURIComponent(`${lead.shop_name} ${lead.address || ''}`)
                      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/12 text-white hover:bg-white/[0.04] transition-all"
                  >
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => setSelectedLeadForDrawer(lead)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/12 text-white hover:bg-white/[0.04] transition-all"
                  >
                    <Eye className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* PREMIUM KANBAN PIPELINE VIEW */
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="grid min-w-[1200px] grid-cols-5 gap-4">
            {kanbanColumns.map((column) => {
              const columnLeads = leads.filter((lead) => column.statuses.includes(lead.status))
              return (
                <section key={column.id} className="panel-card flex flex-col min-h-[500px] p-4.5 bg-[#111111]/45 border border-white/[0.06]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">{column.label}</h3>
                    </div>
                    <span className="inline-flex h-5 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.06] px-2 text-[10px] font-bold text-zinc-400">
                      {columnLeads.length}
                    </span>
                  </div>

                  {/* Columns Container */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1.5 custom-scrollbar">
                    {columnLeads.map((lead) => {
                      const employee = employees.find((item) => item.id === lead.assigned_to)
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLeadForDrawer(lead)}
                          className="w-full rounded-2xl border border-white/[0.06] bg-[#171717]/80 hover:bg-[#1a1a1c]/90 p-4 text-left transition hover:translate-y-[-2px] hover:border-white/12 cursor-pointer shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-white">{lead.shop_name}</p>
                              <p className="mt-1 truncate text-[10px] text-zinc-500 font-semibold">{lead.category}</p>
                            </div>
                            {lead.rating && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                                <Star className="h-3 w-3 fill-amber-400 shrink-0" />
                                {lead.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <p className="mt-3.5 line-clamp-2 text-[11px] leading-relaxed text-[#A1A1AA] h-8 overflow-hidden font-medium">
                            {lead.notes || 'No prospect notes registered.'}
                          </p>
                          <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3.5 shrink-0">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                              <div className="w-5 h-5 rounded-md bg-zinc-800 border border-white/[0.08] text-white font-bold flex items-center justify-center text-[9px] shrink-0">
                                {employee?.name?.charAt(0) || '?'}
                              </div>
                              <span>{employee?.name || 'Unassigned'}</span>
                            </div>
                            <LeadStatusBadge status={lead.status} />
                          </div>
                        </div>
                      )
                    })}
                    {columnLeads.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-white/[0.06] p-6 text-center text-xs text-zinc-600 font-semibold italic bg-white/[0.005]">
                        No prospects
                      </div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] text-xs text-zinc-500 font-semibold">
          <p>
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalItems)} of {totalItems}{' '}
            prospect leads
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 border border-white/[0.08] bg-[#111111] hover:border-white/12 rounded-xl disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <span className="px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2 border border-white/[0.08] bg-[#111111] hover:border-white/12 rounded-xl disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Dialogs and Drawers */}
      <AddLeadModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <ImportExcelModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <LeadDetailDrawer
        isOpen={selectedLeadForDrawer !== null}
        onClose={() => setSelectedLeadForDrawer(null)}
        lead={selectedLeadForDrawer}
      />
    </div>
  )
}
