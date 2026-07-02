import { useState, useEffect, useMemo } from 'react'
import {
  Briefcase,
  Search,
  Plus,
  TrendingUp,
  Award,
  DollarSign,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  UserPlus,
  Edit,
  Trash2,
  ChevronRight,
  Sparkles,
  Phone,
  Building,
  UserCheck
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Client, ClientStatus } from '@/types'
import { formatCurrency } from '@/utils/format'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Child components
import { ClientForm } from './components/ClientForm'
import { ClientDetail } from './components/ClientDetail'

const STATUS_DETAILS: Record<ClientStatus, { label: string; class: string; dot: string }> = {
  lead:           { label: 'Lead',           class: 'text-blue-400 bg-blue-500/10 border-blue-500/20',     dot: 'bg-blue-400' },
  discussion:     { label: 'Discussion',     class: 'text-purple-400 bg-purple-500/10 border-purple-500/20', dot: 'bg-purple-400' },
  proposal_sent:  { label: 'Proposal Sent',  class: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-400' },
  active_project: { label: 'Active Project', class: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_6px_rgba(239,68,68,0.1)]', dot: 'bg-red-400' },
  completed:      { label: 'Completed',      class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  cancelled:      { label: 'Cancelled',      class: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',     dot: 'bg-zinc-500' }
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')

  // Navigation / Modal controls
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined)

  const loadClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setClients((data || []) as Client[])
    } catch (e) {
      console.error(e)
      toast.error('Failed to retrieve client portfolios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  // Calculations
  const metrics = useMemo(() => {
    const total = clients.length
    const active = clients.filter(c => c.status === 'active_project').length
    const totalVal = clients.reduce((acc, c) => acc + c.total_project_value, 0)
    const paid = clients.reduce((acc, c) => acc + c.advance_paid, 0)
    const balance = Math.max(0, totalVal - paid)
    return { total, active, totalVal, paid, balance }
  }, [clients])

  // Filters & Search
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company_name.toLowerCase().includes(search.toLowerCase()) ||
        c.industry.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (c.gst_number || '').toLowerCase().includes(search.toLowerCase())

      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [clients, search, statusFilter])

  // Save / Update client
  const handleSaveClient = async (data: Omit<Client, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    try {
      const now = new Date().toISOString()
      if (data.id) {
        // Edit existing
        const { error } = await supabase
          .from('clients')
          .update({ ...data, updated_at: now })
          .eq('id', data.id)
        
        if (error) throw error
        
        // Log Activity
        const newAct = {
          lead_id: data.id,
          type: 'note',
          description: `Updated client profile parameters for "${data.company_name}".`
        }
        await supabase.from('activities').insert(newAct as never)
      } else {
        // Create new
        const newId = `cli-${Date.now()}`
        const payload = {
          id: newId,
          ...data,
          project_progress: 0,
          created_at: now,
          updated_at: now
        }
        const { error } = await supabase.from('clients').insert(payload as never)
        if (error) throw error

        // Log Activity
        const newAct = {
          lead_id: newId,
          type: 'converted',
          description: `Created new client profile "${data.company_name}".`
        }
        await supabase.from('activities').insert(newAct as never)
      }
      loadClients()
    } catch (e) {
      console.error(e)
      toast.error('Failed to persist client record')
    }
  }

  // Delete client
  const handleDeleteClient = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the client portfolio for ${name}?`)) return
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      
      toast.success('Client deleted successfully')
      loadClients()
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete client')
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredClients.length === 0) return
    const headers = 'Client Name,Company Name,Industry,Phone,Email,Status,Project Progress %,Total Value,Paid Amount,Balance Due\n'
    const rows = filteredClients.map(c => {
      const balance = c.total_project_value - c.advance_paid
      return `"${c.name}","${c.company_name}","${c.industry}","${c.phone}","${c.email}","${c.status}",${c.project_progress},${c.total_project_value},${c.advance_paid},${balance}`
    }).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `REDIX_Clients_${new Date().toISOString().slice(0,10)}.csv`
    link.click()
  }

  // Export to Excel (xlsx)
  const handleExportExcel = () => {
    if (filteredClients.length === 0) return
    const data = filteredClients.map(c => ({
      'Client Name': c.name,
      'Company Name': c.company_name,
      'Industry': c.industry,
      'Phone': c.phone,
      'Email': c.email,
      'Status': c.status.toUpperCase(),
      'Progress %': c.project_progress,
      'Total Project Value': c.total_project_value,
      'Paid Amount': c.advance_paid,
      'Balance Due': c.total_project_value - c.advance_paid
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clients Ledger')
    XLSX.writeFile(wb, `REDIX_Clients_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  // Export List as PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' })
    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, 297, 24, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text('REDIX.MEDIA CLIENT PORTFOLIO LEDGER', 15, 15)

    const rows = filteredClients.map((c, i) => [
      String(i + 1),
      c.company_name,
      c.name,
      c.industry,
      c.phone,
      c.status.toUpperCase(),
      `${c.project_progress}%`,
      formatCurrency(c.total_project_value),
      formatCurrency(c.advance_paid),
      formatCurrency(c.total_project_value - c.advance_paid)
    ])

    autoTable(doc, {
      startY: 28,
      head: [['S.#', 'Company', 'Contact Name', 'Industry', 'Phone', 'Status', 'Progress', 'Total Value', 'Paid', 'Balance']],
      body: rows,
      headStyles: { fillColor: [229, 57, 53], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [40, 40, 40] },
      theme: 'grid'
    })

    doc.save(`REDIX_Clients_${new Date().toISOString().slice(0,10)}.pdf`)
  }

  if (selectedClientId) {
    return (
      <div className="page-shell">
        <ClientDetail
          clientId={selectedClientId}
          onBack={() => {
            setSelectedClientId(null)
            loadClients()
          }}
        />
      </div>
    )
  }

  return (
    <div className="page-shell page-stack space-y-6">
      {/* Header Panel */}
      <div className="panel-card flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-br from-[#1c1c1e]/40 to-[#111112]/50 border border-white/[0.06] rounded-[20px] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <h1 className="text-h4 font-bold text-white leading-none">Client Portfolio Hub</h1>
            <p className="text-caption text-zinc-500 mt-1 font-medium">Manage converted accounts, track design requirements forms, issue NDA agreements, and check development timeline SLAs.</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingClient(undefined)
            setIsFormOpen(true)
          }}
          className="btn-primary h-11 px-5 text-xs font-bold rounded-xl gap-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" /> <span>Add Client Portfolio</span>
        </button>
      </div>

      {/* Corporate KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Accounts</p>
          <p className="text-2xl font-bold text-white flex items-center gap-2 font-mono">
            <Award className="w-6 h-6 text-red-500 shrink-0" /> {metrics.total}
          </p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-[20px]" />
        </div>

        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Dev Projects</p>
          <p className="text-2xl font-bold text-red-400 flex items-center gap-2 font-mono">
            <TrendingUp className="w-6 h-6 text-red-500 shrink-0" /> {metrics.active}
          </p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-[20px]" />
        </div>

        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Gross Contract Value</p>
          <p className="text-2xl font-bold text-emerald-400 flex items-center gap-2 font-mono">
            <DollarSign className="w-6 h-6 text-emerald-500 shrink-0" /> {formatCurrency(metrics.totalVal)}
          </p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-[20px]" />
        </div>

        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Dues Outstanding Balance</p>
          <p className="text-2xl font-bold text-amber-500 flex items-center gap-2 font-mono">
            <DollarSign className="w-6 h-6 text-amber-500 shrink-0" /> {formatCurrency(metrics.balance)}
          </p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 blur-[20px]" />
        </div>
      </div>

      {/* Toolbar - Search, Filter, Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by company, contact, NTN..."
            className="pl-9 w-full"
          />
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filters */}
          <div className="flex items-center gap-1 bg-[#111]/60 border border-white/[0.08] p-1 rounded-xl overflow-x-auto max-w-[360px] sm:max-w-md">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 h-8 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white/[0.08] text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All
            </button>
            {(Object.keys(STATUS_DETAILS) as ClientStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 h-8 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {STATUS_DETAILS[status].label}
              </button>
            ))}
          </div>

          {/* Export button group */}
          <div className="flex items-center gap-1.5 border border-white/[0.08] bg-[#111]/40 p-1 rounded-xl">
            <button
              onClick={handleExportExcel}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              title="Export as Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
              title="Export as CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportPDF}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Export as PDF Document list"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Grid Layout */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 animate-spin rounded-full" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="panel-card p-12 text-center border border-white/[0.06] bg-[#111]/20">
          <Briefcase className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-white font-bold uppercase tracking-wider">No client profiles found</h3>
          <p className="text-zinc-500 text-xs mt-1">Refine your search keywords or create a new client record to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredClients.map(client => {
            const statusDetail = STATUS_DETAILS[client.status] || STATUS_DETAILS.lead
            const balance = client.total_project_value - client.advance_paid
            return (
              <div
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className="panel-card border border-white/[0.08] hover:border-red-500/40 bg-gradient-to-br from-[#111112]/90 to-[#0c0c0d]/95 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-2xl p-5 space-y-4 cursor-pointer transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-[24px] pointer-events-none group-hover:bg-red-500/10 transition-all" />

                {/* Header details */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/[0.08] text-white rounded-xl flex items-center justify-center font-bold text-sm">
                      {client.company_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors uppercase tracking-wider">
                        {client.company_name}
                      </h4>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{client.industry}</p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${statusDetail.class}`}>
                    <span className={`w-1 h-1 rounded-full ${statusDetail.dot}`} />
                    {statusDetail.label}
                  </span>
                </div>

                {/* Contact person */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-white/[0.04]">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Contact Representative</span>
                    <span className="text-zinc-300 font-semibold truncate block mt-0.5">{client.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Phone Contact</span>
                    <span className="text-zinc-400 font-mono text-[10.5px] mt-0.5 block">{client.phone}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider">Milestone Progress</span>
                    <span className="text-white font-bold font-mono">{client.project_progress}%</span>
                  </div>
                  <div className="w-full bg-white/[0.03] border border-white/[0.06] h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${client.project_progress}%` }} />
                  </div>
                </div>

                {/* Financial breakdown */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/[0.04] text-[10px]">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Deal Value</span>
                    <span className="text-zinc-300 font-semibold font-mono mt-0.5 block">{formatCurrency(client.total_project_value)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Paid In</span>
                    <span className="text-emerald-400 font-bold font-mono mt-0.5 block">{formatCurrency(client.advance_paid)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Dues Remaining</span>
                    <span className={`font-bold font-mono mt-0.5 block ${balance > 0 ? 'text-red-400' : 'text-zinc-500'}`}>{formatCurrency(balance)}</span>
                  </div>
                </div>

                {/* Card hover details footer */}
                <div className="flex justify-between items-center pt-2 border-t border-white/[0.04] text-[10px] text-zinc-500 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="flex items-center gap-1 text-red-400">View detailed profile <ChevronRight className="w-3 h-3" /></span>
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingClient(client)
                        setIsFormOpen(true)
                      }}
                      className="p-1 hover:text-white"
                      title="Edit Client Parameters"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id, client.company_name)}
                      className="p-1 hover:text-red-400"
                      title="Delete Client Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <ClientForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingClient(undefined)
        }}
        onSave={handleSaveClient}
        client={editingClient}
      />
    </div>
  )
}
