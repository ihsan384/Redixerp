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
  Globe,
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

      // Write timeline entry activities for assigned items
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
    { id: 'meeting', label: 'Meeting', color: 'bg-violet-400', statuses: ['meeting_scheduled'] },
    { id: 'won', label: 'Won', color: 'bg-red-400', statuses: ['converted'] },
    { id: 'closed', label: 'Closed', color: 'bg-zinc-500', statuses: ['not_interested', 'lost', 'wrong_number', 'already_has_website'] },
  ]

  return (
    <div className="page-shell page-stack">
      <PageHeader
        eyebrow="Pipeline"
        title="Leads"
        description="Qualify prospects, coordinate ownership, and move every opportunity toward its next best action."
      />

      {/* Top Action Bar */}
      <div className="panel-card flex flex-col justify-between gap-4 p-4 2xl:flex-row 2xl:items-center">
        {/* Left Side: Search + Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#4b5563] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="bg-[#141414] border border-[#1f1f1f] text-xs text-white placeholder-[#4b5563] pl-9 pr-4 py-2 rounded-xl focus:border-white/20 outline-none w-56 transition-colors"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
            className="bg-[#141414] border border-[#1f1f1f] text-xs text-white px-3 py-2 rounded-xl outline-none focus:border-white/20"
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
            className="bg-[#141414] border border-[#1f1f1f] text-xs text-white px-3 py-2 rounded-xl outline-none focus:border-white/20"
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
            className="bg-[#141414] border border-[#1f1f1f] text-xs text-white px-3 py-2 rounded-xl outline-none focus:border-white/20"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right Side: Grid/Table toggle + Import/Export/Add */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bulk Assign */}
          {selectedLeadIds.length > 0 && (
            <select
              onChange={(e) => {
                handleBulkAssign(e.target.value)
                e.target.value = ''
              }}
              className="bg-white text-black font-semibold text-xs px-3 py-2 rounded-xl cursor-pointer"
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
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white/10 text-white' : 'text-[#636363] hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-[#636363] hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              aria-label="Kanban view"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-[#636363] hover:text-white'
              }`}
            >
              <LayoutPanelTop className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Import / Export */}
          <button
            onClick={() => setIsImportOpen(true)}
            className="btn-secondary px-3 text-xs"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>

          <button
            onClick={handleExportCSV}
            className="btn-secondary px-3 text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-primary px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Lead
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-[#111111]/10 border border-[#1f1f1f] border-dashed rounded-3xl gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs text-[#636363]">Loading lead list...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-24 border border-[#1f1f1f] border-dashed rounded-3xl bg-[#111111]/10">
          <Users className="w-10 h-10 text-[#4b5563] mx-auto mb-3" />
          <p className="text-sm font-medium text-white mb-1">No Leads Found</p>
          <p className="text-xs text-[#4b5563]">Import an Excel file or click Add Lead to start.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* PREMIUM TABLE VIEW */
        <div className="table-shell">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse sticky-header">
              <thead>
                <tr className="border-b border-[#1f1f1f] bg-[#111111]/30">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        paginatedLeads.length > 0 &&
                        paginatedLeads.every((l) => selectedLeadIds.includes(l.id))
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-[#2a2a2a] bg-[#141414] text-white focus:ring-0 w-3.5 h-3.5"
                    />
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider">
                    Shop Name
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider w-36">
                    Category
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider w-36">
                    Phone
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider w-20">
                    Rating
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider w-36">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider w-40">
                    Assigned To
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-[#8c8c8c] tracking-wider w-24 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]">
                {paginatedLeads.map((lead) => {
                  const isChecked = selectedLeadIds.includes(lead.id)
                  const emp = employees.find((e) => e.id === lead.assigned_to)

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-white/[0.02] transition-colors group ${
                        isChecked ? 'bg-white/[0.01]' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                          className="rounded border-[#2a2a2a] bg-[#141414] text-white focus:ring-0 w-3.5 h-3.5"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white truncate max-w-xs">{lead.shop_name}</div>
                        <div className="text-[10px] text-[#525252] mt-0.5 truncate max-w-xs">
                          {lead.address || 'No address logged'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#8c8c8c]">{lead.category}</td>
                      <td className="py-3.5 px-4 text-xs text-white">{lead.phone}</td>
                      <td className="py-3.5 px-4 text-xs">
                        {lead.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span>{lead.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <LeadStatusBadge status={lead.status} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#8c8c8c]">
                        {emp ? (
                          <span className="text-white font-medium">{emp.name}</span>
                        ) : (
                          <span className="text-[#525252] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity xl:opacity-0 xl:group-hover:opacity-100">
                          <button
                            onClick={() => handleCallRedirect(lead.id)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-[#8c8c8c] hover:text-white"
                            title="Call Center"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedLeadForDrawer(lead)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-[#8c8c8c] hover:text-white"
                            title="View Profile / History"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white leading-snug">{lead.shop_name}</h3>
                      <p className="text-xs text-[#525252] mt-0.5">{lead.category}</p>
                    </div>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <div className="text-xs text-[#8c8c8c] leading-relaxed line-clamp-2 h-8 pt-1">
                    {lead.notes || 'No description notes added.'}
                  </div>
                </div>

                {/* Card Fields */}
                <div className="text-xs space-y-2 border-t border-[#1f1f1f] pt-3.5">
                  <div className="flex justify-between">
                    <span className="text-[#525252]">Phone:</span>
                    <span className="text-white font-medium">{lead.phone}</span>
                  </div>
                  {lead.website && (
                    <div className="flex justify-between">
                      <span className="text-[#525252]">Website:</span>
                      <a
                        href={`https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white hover:underline truncate max-w-[180px]"
                      >
                        {lead.website}
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#525252]">Assigned Rep:</span>
                    <span className="text-white font-medium">
                      {emp ? emp.name : <span className="text-[#4b5563] italic">Unassigned</span>}
                    </span>
                  </div>
                </div>

                {/* Card Buttons */}
                <div className="grid grid-cols-4 gap-1.5 border-t border-[#1f1f1f] pt-3 flex-shrink-0">
                  <button
                    onClick={() => handleCallRedirect(lead.id)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#141414] border border-[#1f1f1f] hover:border-white/10 text-white transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => handleWhatsApp(lead.phone)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#141414] border border-[#1f1f1f] hover:border-white/10 text-white transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                  </button>
                  <button
                    onClick={() => {
                      const query = encodeURIComponent(`${lead.shop_name} ${lead.address || ''}`)
                      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#141414] border border-[#1f1f1f] hover:border-white/10 text-white transition-all"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => setSelectedLeadForDrawer(lead)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#141414] border border-[#1f1f1f] hover:border-white/10 text-white transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1160px] grid-cols-5 gap-4">
            {kanbanColumns.map((column) => {
              const columnLeads = paginatedLeads.filter((lead) => column.statuses.includes(lead.status))
              return (
                <section key={column.id} className="panel-card min-h-[430px] p-3">
                  <div className="flex items-center justify-between border-b border-white/[0.065] px-1 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${column.color}`} />
                      <h3 className="text-[13px] font-bold text-zinc-200">{column.label}</h3>
                    </div>
                    <span className="status-pill min-h-6 px-2 text-zinc-500">{columnLeads.length}</span>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {columnLeads.map((lead) => {
                      const employee = employees.find((item) => item.id === lead.assigned_to)
                      return (
                        <button
                          key={lead.id}
                          onClick={() => setSelectedLeadForDrawer(lead)}
                          className="w-full rounded-[16px] border border-white/[0.065] bg-white/[0.025] p-3.5 text-left transition hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.04]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold text-white">{lead.shop_name}</p>
                              <p className="mt-0.5 truncate text-[10px] text-zinc-600">{lead.category}</p>
                            </div>
                            {lead.rating && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300"><Star className="h-3 w-3 fill-amber-300" />{lead.rating}</span>}
                          </div>
                          <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-zinc-500">{lead.notes || 'No notes recorded.'}</p>
                          <div className="mt-3 flex items-center justify-between border-t border-white/[0.055] pt-3">
                            <span className="text-[10px] text-zinc-600">{employee?.name || 'Unassigned'}</span>
                            <LeadStatusBadge status={lead.status} />
                          </div>
                        </button>
                      )
                    })}
                    {columnLeads.length === 0 && (
                      <div className="rounded-[14px] border border-dashed border-white/[0.07] p-5 text-center text-[11px] text-zinc-700">No leads</div>
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
        <div className="flex items-center justify-between pt-4 border-t border-[#1f1f1f] text-xs text-[#636363]">
          <p>
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalItems)} of {totalItems}{' '}
            leads
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 border border-[#1f1f1f] bg-[#111111] hover:border-white/10 rounded-lg disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-white" />
            </button>
            <span className="px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2 border border-[#1f1f1f] bg-[#111111] hover:border-white/10 rounded-lg disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-white" />
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
