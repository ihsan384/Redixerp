import { useState, useEffect } from 'react'
import {
  BarChart3,
  FileText,
  Download,
  Phone,
  DollarSign,
  TrendingDown,
  Users,
  Award,
} from 'lucide-react'
import { Storage } from '@/lib/storage'
import { formatCurrency } from '@/utils/format'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

export function ReportsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [calls, setCalls] = useState<any[]>([])
  const [revenue, setRevenue] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])

  useEffect(() => {
    setLeads(Storage.getLeads())
    setCalls(Storage.getCalls())
    setRevenue(Storage.getRevenue())
    setExpenses(Storage.getExpenses())
    setEmployees(Storage.getEmployees())
  }, [])

  const totalCalls = calls.length
  const totalRevenue = revenue.reduce((acc, r) => acc + r.amount, 0)
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0)
  const netProfit = totalRevenue - totalExpenses

  const totalLeads = leads.length
  const convertedCount = leads.filter((l) => l.status === 'converted').length
  const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : '0'

  const employeePerformance = employees.map((emp) => {
    const empCalls = calls.filter((c) => c.employee_id === emp.id).length
    const empConversions = leads.filter(
      (l) => l.assigned_to === emp.id && l.status === 'converted'
    ).length
    const rate = empCalls > 0 ? ((empConversions / empCalls) * 100).toFixed(0) : '0'

    return {
      name: emp.name,
      role: emp.role.replace('_', ' '),
      calls: empCalls,
      conversions: empConversions,
      rate: `${rate}%`,
    }
  })

  const exportExcel = (type: 'leads' | 'financials' | 'employees') => {
    try {
      let data: any[] = []
      let filename = 'redix_report.xlsx'

      if (type === 'leads') {
        data = leads.map((l) => ({
          'Shop Name': l.shop_name,
          Category: l.category,
          Phone: l.phone,
          Website: l.website || 'None',
          Address: l.address || 'None',
          Rating: l.rating || 'None',
          Status: l.status,
          'Assigned Rep': employees.find((e) => e.id === l.assigned_to)?.name || 'Unassigned',
        }))
        filename = `redix_leads_audit_${Date.now()}.xlsx`
      } else if (type === 'financials') {
        data = [
          ...revenue.map((r) => ({
            Type: 'Revenue Inflow',
            Title: r.package,
            Amount: r.amount,
            Date: r.received_date,
            Method: r.payment_method,
            Notes: r.notes || '',
          })),
          ...expenses.map((e) => ({
            Type: 'Expense Outflow',
            Title: e.title,
            Amount: -e.amount,
            Date: e.date,
            Method: e.payment_method,
            Notes: e.notes || '',
          })),
        ]
        filename = `redix_financial_ledger_${Date.now()}.xlsx`
      } else if (type === 'employees') {
        data = employeePerformance.map((emp) => ({
          'Employee Name': emp.name,
          Role: emp.role,
          'Calls Placed': emp.calls,
          'Deals Closed': emp.conversions,
          'Conversion Ratio': emp.rate,
        }))
        filename = `redix_employee_leaderboard_${Date.now()}.xlsx`
      }

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'REDIX Audit')
      XLSX.writeFile(wb, filename)
      toast.success('Excel report downloaded successfully')
    } catch (err: unknown) {
      toast.error('Failed to export Excel')
    }
  }

  const exportPDF = () => {
    try {
      const doc = new jsPDF()

      doc.setFillColor(10, 10, 10)
      doc.rect(0, 0, 210, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.text('REDIX.MEDIA CRM & ERP', 15, 22)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('AUTOMATED AUDIT SUMMARY REPORT', 15, 29)

      doc.setTextColor(80, 80, 80)
      doc.setFontSize(9)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 145, 45)
      doc.text(`Auditor Account: ${employees[0]?.name || 'Admin'}`, 145, 50)

      doc.setTextColor(10, 10, 10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('Financial Statement', 15, 50)

      autoTable(doc, {
        head: [['Metric', 'PKR Inflows / Outflows']],
        body: [
          ['Gross Billing Inflow', formatCurrency(totalRevenue)],
          ['Gross Operational Expenses', formatCurrency(totalExpenses)],
          ['Net Profit (PKR)', formatCurrency(netProfit)],
        ],
        startY: 55,
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40] },
      })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('Operational Sales Metrics', 15, (doc as any).lastAutoTable.finalY + 15)

      autoTable(doc, {
        head: [['Parameter', 'Operational KPI Metric']],
        body: [
          ['Total Unique Lead Contacts', `${totalLeads} businesses`],
          ['Successfully Converted Accounts', `${convertedCount} deals`],
          ['Sales Team Conversion Rate', `${conversionRate}%`],
          ['Total Dialed Phone Calls', `${totalCalls} calls`],
        ],
        startY: (doc as any).lastAutoTable.finalY + 20,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40] },
      })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('Employee League Table', 15, (doc as any).lastAutoTable.finalY + 15)

      autoTable(doc, {
        head: [['Employee Name', 'Role', 'Calls Placed', 'Deals Closed', 'Conversion Ratio']],
        body: employeePerformance.map((emp) => [
          emp.name,
          emp.role,
          emp.calls,
          emp.conversions,
          emp.rate,
        ]),
        startY: (doc as any).lastAutoTable.finalY + 20,
        theme: 'striped',
        headStyles: { fillColor: [10, 10, 10] },
      })

      doc.save(`redix_audit_report_${Date.now()}.pdf`)
      toast.success('PDF report downloaded successfully!')
    } catch (err: unknown) {
      toast.error('Failed to generate PDF')
      console.error(err)
    }
  }

  return (
    <div className="page-shell page-stack space-y-6">
      {/* Header Info */}
      <div className="panel-card flex items-center gap-3 p-5">
        <BarChart3 className="w-5 h-5 text-red-400" />
        <div>
          <p className="text-sm font-bold text-white">Reports & Business Intelligence</p>
          <p className="text-xs text-zinc-500 mt-0.5">Audit leads lists, compile team stats, and download spreadsheets or PDF reports.</p>
        </div>
      </div>

      {/* Overview statistical cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Calls Logged */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Calls Logged</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{totalCalls} calls</h3>
          </div>
          <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/15 text-blue-400 rounded-lg flex items-center justify-center">
            <Phone className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Conversion Ratio</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mt-2">{conversionRate}%</h3>
          </div>
          <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 rounded-lg flex items-center justify-center">
            <Award className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Net Billings</p>
            <h3 className="text-xl font-bold text-white tracking-tight mt-2">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="w-9 h-9 bg-neutral-800 border border-white/[0.08] text-white rounded-lg flex items-center justify-center">
            <DollarSign className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-[#111111]/70 border border-white/[0.08] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Net Expenditures</p>
            <h3 className="text-xl font-bold text-white tracking-tight mt-2">{formatCurrency(totalExpenses)}</h3>
          </div>
          <div className="w-9 h-9 bg-red-500/10 border border-red-500/15 text-red-400 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Export modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF audit compilation */}
        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-zinc-500" /> Compile PDF Audit Report
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Generates a formal, printable PDF document summarizing financial inflows, outflows, conversion rates, and sales agent performance indices.
            </p>
          </div>
          <button
            onClick={exportPDF}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition-all shadow-md h-11"
          >
            <Download className="w-4.5 h-4.5 text-black" /> Download PDF Report
          </button>
        </div>

        {/* Excel Spreadsheet sheets */}
        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/[0.04]">
            <Download className="w-4.5 h-4.5 text-zinc-500" /> Export Excel Spreadsheets
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            Download modular spreadsheets to perform custom computations on raw operational registers.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => exportExcel('leads')}
              className="flex flex-col items-center justify-center p-3 border border-white/[0.08] bg-white/[0.02] hover:border-white/12 rounded-xl text-center text-[10px] font-bold text-white hover:bg-white/[0.04] transition-all gap-1.5"
            >
              <Users className="w-4.5 h-4.5 text-blue-400" />
              <span>Leads Audit</span>
            </button>
            <button
              onClick={() => exportExcel('financials')}
              className="flex flex-col items-center justify-center p-3 border border-white/[0.08] bg-white/[0.02] hover:border-white/12 rounded-xl text-center text-[10px] font-bold text-white hover:bg-white/[0.04] transition-all gap-1.5"
            >
              <DollarSign className="w-4.5 h-4.5 text-emerald-400" />
              <span>Cash Ledger</span>
            </button>
            <button
              onClick={() => exportExcel('employees')}
              className="flex flex-col items-center justify-center p-3 border border-white/[0.08] bg-white/[0.02] hover:border-white/12 rounded-xl text-center text-[10px] font-bold text-white hover:bg-white/[0.04] transition-all gap-1.5"
            >
              <Award className="w-4.5 h-4.5 text-purple-400" />
              <span>Reps Standings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
