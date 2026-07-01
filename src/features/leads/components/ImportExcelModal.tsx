import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, CheckCircle2, AlertCircle, RefreshCw, Loader2, Settings, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LeadStatus } from '@/types'

interface ImportExcelModalProps {
  isOpen: boolean
  onClose: () => void
}

interface RowError {
  row: number
  message: string
  type: 'validation' | 'db' | 'warning'
}

export function ImportExcelModal({ isOpen, onClose }: ImportExcelModalProps) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [parsedData, setParsedData] = useState<Record<string, unknown>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({
    shop_name: '',
    category: '',
    phone: '',
    website: '',
    address: '',
    rating: '',
  })

  // Settings & Result states
  const [duplicatePolicy, setDuplicatePolicy] = useState<'skip' | 'upsert'>(() => {
    return (localStorage.getItem('redix_import_duplicate_policy') as 'skip' | 'upsert') || 'skip'
  })
  const [importState, setImportState] = useState<'idle' | 'importing' | 'completed'>('idle')
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState({
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  })
  const [rowErrors, setRowErrors] = useState<RowError[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePolicyChange = (policy: 'skip' | 'upsert') => {
    setDuplicatePolicy(policy)
    localStorage.setItem('redix_import_duplicate_policy', policy)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setLoading(true)
    setImportState('idle')
    setImportProgress(0)
    setRowErrors([])
    setImportStats({ imported: 0, updated: 0, skipped: 0, failed: 0 })

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[]

        if (data.length === 0) {
          toast.error('The selected file is empty')
          setLoading(false)
          return
        }

        // Get headers from first row
        const sheetHeaders = Object.keys(data[0])
        setHeaders(sheetHeaders)
        setParsedData(data)

        // Attempt smart mapping
        const initialMapping: Record<string, string> = {
          shop_name: '',
          category: '',
          phone: '',
          website: '',
          address: '',
          rating: '',
        }

        sheetHeaders.forEach((h) => {
          const lh = h.toLowerCase().replace(/[\s_-]/g, '')
          if (lh.includes('shop') || lh.includes('company') || lh.includes('business') || lh.includes('name')) {
            initialMapping.shop_name = h
          } else if (lh.includes('category') || lh.includes('industry') || lh.includes('type')) {
            initialMapping.category = h
          } else if (lh.includes('phone') || lh.includes('number') || lh.includes('contact') || lh.includes('tel')) {
            initialMapping.phone = h
          } else if (lh.includes('website') || lh.includes('web') || lh.includes('url')) {
            initialMapping.website = h
          } else if (lh.includes('address') || lh.includes('location') || lh.includes('street') || lh.includes('city')) {
            initialMapping.address = h
          } else if (lh.includes('rating') || lh.includes('stars') || lh.includes('googlerating')) {
            initialMapping.rating = h
          }
        })

        setMapping(initialMapping)
        toast.success(`Loaded ${data.length} rows from file`)
      } catch (err: unknown) {
        toast.error('Failed to parse Excel file')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsBinaryString(selectedFile)
  }

  const handleImport = async () => {
    if (!mapping.shop_name || !mapping.phone) {
      toast.error('Shop Name and Phone Number are required fields for mapping')
      return
    }

    try {
      console.log('%c[Lead Import] Starting Lead Import Lifecycle', 'color: #3b82f6; font-weight: bold; font-size: 14px;')
      console.log('Parsed Rows count:', parsedData.length)
      console.log('Mapping Configuration:', mapping)
      console.log('Duplicate Policy:', duplicatePolicy)

      // 1. Verify authenticated user & permissions
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session) {
        console.error('RLS/Auth Verification Failed:', authError)
        toast.error('Authentication error: You must be logged in to import leads.')
        return
      }
      console.log('Authenticated User:', session.user.email)

      // 2. Pre-validate every row
      const validLeads: any[] = []
      const errorsList: RowError[] = []
      const phoneInFileSet = new Set<string>()

      parsedData.forEach((row, index) => {
        const rowNum = index + 2 // header is row 1, first data row is 2

        const getVal = (key: string) => {
          const raw = row[mapping[key]]
          return raw !== undefined && raw !== null ? String(raw).trim() : ''
        }

        const rawPhone = getVal('phone')
        const rawShopName = getVal('shop_name')
        const rawWebsite = getVal('website')
        const rawAddress = getVal('address')
        const rawCategory = getVal('category')

        // Parse rating safely
        const ratingVal = row[mapping.rating]
        const rating = ratingVal !== undefined && ratingVal !== null ? parseFloat(String(ratingVal)) : undefined
        const parsedRating = isNaN(rating as number) ? undefined : rating

        let isRowValid = true

        // Validate Shop Name
        let shopName = rawShopName
        if (!shopName) {
          errorsList.push({
            row: rowNum,
            message: `Warning: Empty shop name. Defaulted to 'Unnamed Business'.`,
            type: 'warning',
          })
          shopName = 'Unnamed Business'
        }

        // Validate Phone Number presence
        if (!rawPhone) {
          errorsList.push({
            row: rowNum,
            message: `Error: Missing phone number. Row skipped.`,
            type: 'validation',
          })
          isRowValid = false
        } else {
          // Validate Phone Number format (7-15 digits, spaces/dashes/brackets/plus allowed)
          const digitsOnly = rawPhone.replace(/\D/g, '')
          const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/
          if (!phoneRegex.test(rawPhone) || digitsOnly.length < 7 || digitsOnly.length > 15) {
            errorsList.push({
              row: rowNum,
              message: `Error: Invalid phone number format '${rawPhone}'. Must contain 7-15 digits. Row skipped.`,
              type: 'validation',
            })
            isRowValid = false
          }
        }

        // Validate Website URL if present
        let website: string | undefined = rawWebsite || undefined
        if (website) {
          try {
            const formattedUrl = website.match(/^https?:\/\//i) ? website : `http://${website}`
            new URL(formattedUrl)
          } catch {
            errorsList.push({
              row: rowNum,
              message: `Warning: Invalid website URL format '${website}'. Field cleared.`,
              type: 'warning',
            })
            website = undefined
          }
        }

        // Validate duplicates inside the file itself
        if (isRowValid && rawPhone) {
          if (phoneInFileSet.has(rawPhone)) {
            errorsList.push({
              row: rowNum,
              message: `Error: Duplicate phone number '${rawPhone}' found in Excel file. Row skipped.`,
              type: 'validation',
            })
            isRowValid = false
          } else {
            phoneInFileSet.add(rawPhone)
          }
        }

        if (isRowValid) {
          validLeads.push({
            shop_name: shopName,
            category: rawCategory || 'Other',
            phone: rawPhone,
            website,
            address: rawAddress || undefined,
            rating: parsedRating,
            status: 'new' as LeadStatus,
            excelRow: rowNum,
          })
        }
      })

      console.log('Parsed Rows (Raw excel rows):', parsedData)
      console.log('Mapped Rows (Valid + Warnings):', validLeads)

      setImportState('importing')
      setImportProgress(0)
      setRowErrors(errorsList)

      let importedCount = 0
      let updatedCount = 0
      let skippedCount = parsedData.length - validLeads.length
      let failedCount = 0

      // 3. Fetch existing records in DB to build a cache for duplicate policy checking
      console.log('Fetching existing phone numbers from database to perform duplicate check...')
      const { data: existingLeads, error: fetchError } = await supabase
        .from('leads')
        .select('phone')

      if (fetchError) {
        console.error('Failed to query existing database phone numbers:', fetchError)
        toast.error(`Database Query Error: ${fetchError.message} (Code: ${fetchError.code})`)
        setImportState('idle')
        return
      }

      const dbPhoneSet = new Set(((existingLeads || []) as any[]).map((l) => l.phone))
      console.log('Database unique phone cache size:', dbPhoneSet.size)

      // Filter based on policy if 'skip'
      const leadsToProcess: typeof validLeads = []
      validLeads.forEach((lead) => {
        if (duplicatePolicy === 'skip' && dbPhoneSet.has(lead.phone)) {
          skippedCount++
          errorsList.push({
            row: lead.excelRow,
            message: `Skipped: Duplicate phone number '${lead.phone}' already exists in CRM database.`,
            type: 'warning',
          })
        } else {
          leadsToProcess.push(lead)
        }
      })

      console.log('Leads to process for Database Insertion:', leadsToProcess)
      setImportStats({
        imported: 0,
        updated: 0,
        skipped: skippedCount,
        failed: 0,
      })

      if (leadsToProcess.length === 0) {
        setImportState('completed')
        setRowErrors([...errorsList])
        queryClient.invalidateQueries({ queryKey: ['leads'] })
        return
      }

      // 4. Batch processes in sizes of 50
      const batchSize = 50
      const batches: (typeof leadsToProcess)[] = []
      for (let i = 0; i < leadsToProcess.length; i += batchSize) {
        batches.push(leadsToProcess.slice(i, i + batchSize))
      }

      console.log(`Divided into ${batches.length} batches of max 50 rows each.`)

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        console.log(`Processing Batch ${i + 1}/${batches.length}...`, batch)

        const dbPayload = batch.map((lead) => ({
          shop_name: lead.shop_name,
          category: lead.category,
          phone: lead.phone,
          website: lead.website,
          address: lead.address,
          rating: lead.rating,
          status: lead.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        console.log(`Final Payload for Batch ${i + 1}:`, dbPayload)

        if (duplicatePolicy === 'upsert') {
          // Perform batch upsert
          const { data, error } = await supabase
            .from('leads')
            .upsert(dbPayload as any, { onConflict: 'phone' })
            .select()

          if (error) {
            console.warn(`Batch ${i + 1} upsert failed (Code: ${error.code}). Retrying row-by-row fallback...`, error)
            // Fallback row-by-row
            for (const lead of batch) {
              const singlePayload = {
                shop_name: lead.shop_name,
                category: lead.category,
                phone: lead.phone,
                website: lead.website,
                address: lead.address,
                rating: lead.rating,
                status: lead.status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
              const { error: singleError } = await supabase
                .from('leads')
                .upsert(singlePayload as any, { onConflict: 'phone' })

              if (singleError) {
                console.error(`Row ${lead.excelRow} upsert failed:`, singleError)
                failedCount++
                errorsList.push({
                  row: lead.excelRow,
                  message: `Database Upsert Error: ${singleError.message} (Code: ${singleError.code}). Details: ${singleError.details || 'None'}. Hint: ${singleError.hint || 'None'}`,
                  type: 'db',
                })
              } else {
                if (dbPhoneSet.has(lead.phone)) {
                  updatedCount++
                } else {
                  importedCount++
                  dbPhoneSet.add(lead.phone)
                }
              }
            }
          } else {
            console.log(`Batch ${i + 1} upsert database response:`, data)
            batch.forEach((lead) => {
              if (dbPhoneSet.has(lead.phone)) {
                updatedCount++
              } else {
                importedCount++
                dbPhoneSet.add(lead.phone)
              }
            })
          }
        } else {
          // Perform batch insert
          const { data, error } = await supabase
            .from('leads')
            .insert(dbPayload as any)
            .select()

          if (error) {
            console.warn(`Batch ${i + 1} insert failed (Code: ${error.code}). Retrying row-by-row fallback...`, error)
            // Fallback row-by-row
            for (const lead of batch) {
              const singlePayload = {
                shop_name: lead.shop_name,
                category: lead.category,
                phone: lead.phone,
                website: lead.website,
                address: lead.address,
                rating: lead.rating,
                status: lead.status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
              const { error: singleError } = await supabase
                .from('leads')
                .insert(singlePayload as any)

              if (singleError) {
                console.error(`Row ${lead.excelRow} insert failed:`, singleError)
                failedCount++
                let errMsg = `Database Insert Error: ${singleError.message} (Code: ${singleError.code}). Details: ${singleError.details || 'None'}. Hint: ${singleError.hint || 'None'}`
                if (singleError.code === '23505') {
                  errMsg = `Duplicate phone number: Lead with phone '${lead.phone}' already exists. Row skipped.`
                }
                errorsList.push({
                  row: lead.excelRow,
                  message: errMsg,
                  type: 'db',
                })
              } else {
                importedCount++
                dbPhoneSet.add(lead.phone)
              }
            }
          } else {
            console.log(`Batch ${i + 1} insert database response:`, data)
            importedCount += batch.length
          }
        }

        // Update progress percentage
        const currentProcessedCount = Math.min((i + 1) * batchSize, leadsToProcess.length)
        const progress = Math.round((currentProcessedCount / leadsToProcess.length) * 100)
        setImportProgress(progress)
        setImportStats({
          imported: importedCount,
          updated: updatedCount,
          skipped: skippedCount,
          failed: failedCount,
        })
        setRowErrors([...errorsList])
      }

      console.log('%c[Lead Import] Import completed successfully', 'color: #10b981; font-weight: bold; font-size: 14px;')
      console.log('Final Stats Summary:', {
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        failed: failedCount,
      })
      console.log('Failed / Warning Row Level Details:', errorsList)

      setImportStats({
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        failed: failedCount,
      })
      setImportState('completed')
      toast.success(`Leads import completed. ${importedCount} imported, ${updatedCount} updated, ${skippedCount} skipped, ${failedCount} failed.`)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    } catch (err: unknown) {
      console.error('Fatal Import Lifecycle Error:', err)
      const msg = err instanceof Error ? err.message : 'Unknown fatal error importing leads'
      toast.error(`Fatal Error: ${msg}`)
      setImportState('idle')
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const resetModalState = () => {
    setFile(null)
    setParsedData([])
    setImportState('idle')
    setImportProgress(0)
    setImportStats({ imported: 0, updated: 0, skipped: 0, failed: 0 })
    setRowErrors([])
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={importState === 'importing' ? undefined : onClose}
            className="modal-backdrop"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            role="dialog"
            aria-modal="true"
            aria-label="Import leads"
            className="modal-panel z-10 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f] flex-shrink-0">
              <h3 className="text-base font-semibold text-white">Import Leads from Excel / CSV</h3>
              {importState !== 'importing' && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#636363] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-grow">
              {/* STATE 1: IMPORTING PROGRESS SCREEN */}
              {importState === 'importing' && (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="w-16 h-16 text-white animate-spin stroke-[1.5]" />
                    <span className="absolute text-xs font-bold text-white">{importProgress}%</span>
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-sm font-semibold text-white">Importing Leads...</h4>
                    <p className="text-xs text-[#8c8c8c] max-w-xs">
                      Processing batches in sizes of 50 rows. Please do not close the window.
                    </p>
                  </div>
                  {/* Realtime mini-stats */}
                  <div className="grid grid-cols-4 gap-4 w-full max-w-md pt-4">
                    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-3 text-center">
                      <div className="text-xs font-semibold text-[#8c8c8c]">Imported</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1">{importStats.imported}</div>
                    </div>
                    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-3 text-center">
                      <div className="text-xs font-semibold text-[#8c8c8c]">Updated</div>
                      <div className="text-lg font-bold text-blue-400 mt-1">{importStats.updated}</div>
                    </div>
                    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-3 text-center">
                      <div className="text-xs font-semibold text-[#8c8c8c]">Skipped</div>
                      <div className="text-lg font-bold text-yellow-400 mt-1">{importStats.skipped}</div>
                    </div>
                    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-3 text-center">
                      <div className="text-xs font-semibold text-[#8c8c8c]">Failed</div>
                      <div className="text-lg font-bold text-red-400 mt-1">{importStats.failed}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 2: COMPLETED SUMMARY SCREEN */}
              {importState === 'completed' && (
                <div className="space-y-6 py-2">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-semibold text-white">Import Process Finished</h4>
                    <p className="text-xs text-[#8c8c8c]">
                      The CRM data load has completed. Review the results below.
                    </p>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 text-center">
                      <div className="text-xs font-semibold text-[#8c8c8c] uppercase tracking-wider">Imported</div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">{importStats.imported}</div>
                      <p className="text-[10px] text-[#636363] mt-1">New rows added</p>
                    </div>
                    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 text-center">
                      <div className="text-xs font-semibold text-[#8c8c8c] uppercase tracking-wider">Updated</div>
                      <div className="text-2xl font-black text-blue-400 mt-1">{importStats.updated}</div>
                      <p className="text-[10px] text-[#636363] mt-1">Existing rows updated</p>
                    </div>
                    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 text-center">
                      <div className="text-xs font-semibold text-[#8c8c8c] uppercase tracking-wider">Skipped</div>
                      <div className="text-2xl font-black text-yellow-500 mt-1">{importStats.skipped}</div>
                      <p className="text-[10px] text-[#636363] mt-1">Format/DB Duplicates</p>
                    </div>
                    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 text-center">
                      <div className="text-xs font-semibold text-[#8c8c8c] uppercase tracking-wider">Failed</div>
                      <div className="text-2xl font-black text-red-500 mt-1">{importStats.failed}</div>
                      <p className="text-[10px] text-[#636363] mt-1">Database errors</p>
                    </div>
                  </div>

                  {/* Row Level Logs */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-zinc-500" /> Row-Level Log ({rowErrors.length} entries)
                    </h5>
                    {rowErrors.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-[#1f1f1f] rounded-xl text-xs text-[#636363]">
                        No row-level validation errors or warnings. Happy path completed cleanly!
                      </div>
                    ) : (
                      <div className="border border-[#1f1f1f] rounded-xl bg-[#0f0f0f] max-h-56 overflow-y-auto divide-y divide-[#181818] text-xs">
                        {rowErrors.map((err, idx) => (
                          <div
                            key={idx}
                            className={`p-3 flex items-start gap-2.5 ${
                              err.type === 'db'
                                ? 'bg-red-500/5 hover:bg-red-500/10 text-red-400'
                                : err.type === 'validation'
                                ? 'bg-amber-500/5 hover:bg-amber-500/10 text-amber-400'
                                : 'bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-500'
                            }`}
                          >
                            <span className="font-mono font-bold bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 mt-0.5">
                              Row {err.row}
                            </span>
                            <span className="leading-relaxed">{err.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STATE 3: IDLE SELECT & CONFIGURATION SCREEN */}
              {importState === 'idle' && (
                <>
                  {/* File Upload Zone */}
                  {!file ? (
                    <div
                      onClick={triggerFileInput}
                      className="border border-dashed border-[#2a2a2a] hover:border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-[#111111]/30 hover:bg-[#111111]/50 group"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-xl bg-[#141414] border border-[#1f1f1f] flex items-center justify-center mb-4 group-hover:border-white/10 transition-colors">
                        <Upload className="w-5 h-5 text-[#8c8c8c] group-hover:text-white transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-white mb-1">Click to select files</p>
                      <p className="text-xs text-[#4b5563]">Supports Excel (.xlsx, .xls) and CSV files</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* File Info */}
                      <div className="flex items-center justify-between p-3.5 bg-[#141414] border border-[#1f1f1f] rounded-xl flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{file.name}</p>
                            <p className="text-xs text-[#636363]">
                              {(file.size / 1024).toFixed(1)} KB • {parsedData.length} rows loaded
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={resetModalState}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-[#8c8c8c] hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3 h-3" /> Change File
                        </button>
                      </div>

                      {/* Mapping Panel */}
                      <div className="space-y-3 bg-[#111111]/50 border border-[#1f1f1f] p-4 rounded-xl">
                        <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Map Columns</h4>
                        <p className="text-xs text-[#636363]">
                          Assign columns from your Excel sheet to REDIX CRM Lead fields.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
                          {/* Shop Name */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#8c8c8c] flex items-center gap-1.5">
                              Shop Name <span className="text-red-500 text-[10px]">*</span>
                            </label>
                            <select
                              value={mapping.shop_name}
                              onChange={(e) => setMapping((prev) => ({ ...prev, shop_name: e.target.value }))}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                            >
                              <option value="">-- Choose Column --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Phone */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#8c8c8c] flex items-center gap-1.5">
                              Phone Number <span className="text-red-500 text-[10px]">*</span>
                            </label>
                            <select
                              value={mapping.phone}
                              onChange={(e) => setMapping((prev) => ({ ...prev, phone: e.target.value }))}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                            >
                              <option value="">-- Choose Column --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Category */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#8c8c8c]">Category</label>
                            <select
                              value={mapping.category}
                              onChange={(e) => setMapping((prev) => ({ ...prev, category: e.target.value }))}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                            >
                              <option value="">-- Choose Column (Optional) --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Website */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#8c8c8c]">Website</label>
                            <select
                              value={mapping.website}
                              onChange={(e) => setMapping((prev) => ({ ...prev, website: e.target.value }))}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                            >
                              <option value="">-- Choose Column (Optional) --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Address */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#8c8c8c]">Address / Location</label>
                            <select
                              value={mapping.address}
                              onChange={(e) => setMapping((prev) => ({ ...prev, address: e.target.value }))}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                            >
                              <option value="">-- Choose Column (Optional) --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Rating */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#8c8c8c]">Google Rating</label>
                            <select
                              value={mapping.rating}
                              onChange={(e) => setMapping((prev) => ({ ...prev, rating: e.target.value }))}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
                            >
                              <option value="">-- Choose Column (Optional) --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Duplicate Settings Panel */}
                      <div className="space-y-3 bg-[#111111]/50 border border-[#1f1f1f] p-4 rounded-xl">
                        <h4 className="text-xs font-semibold text-white tracking-wider uppercase flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-zinc-500" /> Duplicate Phone Number Policy
                        </h4>
                        <p className="text-[11px] text-[#636363]">
                          Choose how to handle leads with phone numbers that already exist in the CRM database.
                        </p>
                        <div className="flex gap-6 mt-1">
                          <label className="flex items-center gap-2 text-xs font-medium text-white cursor-pointer select-none">
                            <input
                              type="radio"
                              name="duplicatePolicy"
                              value="skip"
                              checked={duplicatePolicy === 'skip'}
                              onChange={() => handlePolicyChange('skip')}
                              className="text-white accent-white w-3.5 h-3.5"
                            />
                            Skip duplicates (Keep existing DB leads unchanged)
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium text-white cursor-pointer select-none">
                            <input
                              type="radio"
                              name="duplicatePolicy"
                              value="upsert"
                              checked={duplicatePolicy === 'upsert'}
                              onChange={() => handlePolicyChange('upsert')}
                              className="text-white accent-white w-3.5 h-3.5"
                            />
                            Update duplicates (Overwrite fields in DB)
                          </label>
                        </div>
                      </div>

                      {/* Informative Warning Info */}
                      <div className="flex gap-2.5 p-3.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-yellow-500 text-[11px]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Import Information</p>
                          <p className="mt-0.5 text-yellow-500/80">
                            {duplicatePolicy === 'skip'
                              ? 'Leads with phone numbers already in the CRM will be skipped. Row-by-row logs will list skipped items.'
                              : 'Leads with matching phone numbers will have their name, rating, website, address, and category updated in the DB.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1f1f1f] flex-shrink-0">
              {importState === 'completed' ? (
                <>
                  <button
                    type="button"
                    onClick={resetModalState}
                    className="px-4 py-2 border border-[#1f1f1f] bg-[#111111] text-xs font-medium text-[#8c8c8c] hover:text-white rounded-xl transition-all"
                  >
                    Import Another File
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-white text-black text-xs font-medium rounded-xl hover:bg-neutral-200 transition-all"
                  >
                    Done & Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={importState === 'importing'}
                    className="px-4 py-2 border border-[#1f1f1f] bg-[#111111] text-xs font-medium text-[#8c8c8c] hover:text-white rounded-xl transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  {file && importState !== 'importing' && (
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={loading}
                      className="px-4 py-2 bg-white text-black text-xs font-medium rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center min-w-[100px]"
                    >
                      Start Import
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
