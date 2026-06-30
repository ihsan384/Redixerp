import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useLeads } from '../hooks/useLeads'
import { toast } from 'sonner'
import type { LeadStatus } from '@/types'

interface ImportExcelModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ImportExcelModal({ isOpen, onClose }: ImportExcelModalProps) {
  const { importLeads, isImporting } = useLeads()
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setLoading(true)

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
    // Validate mapping
    if (!mapping.shop_name || !mapping.phone) {
      toast.error('Shop Name and Phone Number are required fields for mapping')
      return
    }

    try {
      const formattedLeads = parsedData.map((row) => {
        const getVal = (key: string) => {
          const raw = row[mapping[key]]
          return raw !== undefined && raw !== null ? String(raw).trim() : ''
        }

        // Parse rating safely
        const ratingVal = row[mapping.rating]
        const rating = ratingVal !== undefined && ratingVal !== null ? parseFloat(String(ratingVal)) : undefined

        return {
          shop_name: getVal('shop_name') || 'Unnamed Business',
          category: getVal('category') || 'Other',
          phone: getVal('phone'),
          website: getVal('website') || undefined,
          address: getVal('address') || undefined,
          rating: isNaN(rating as number) ? undefined : rating,
          status: 'new' as LeadStatus,
        }
      }).filter((lead) => lead.phone) // must have a phone number

      if (formattedLeads.length === 0) {
        toast.error('No valid leads to import (missing phone numbers)')
        return
      }

      const importedCount = await importLeads(formattedLeads)
      toast.success(`Successfully imported ${importedCount} new unique leads!`)
      onClose()
      // reset states
      setFile(null)
      setParsedData([])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error importing leads'
      toast.error(msg)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-backdrop"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            role="dialog"
            aria-modal="true"
            aria-label="Import leads"
            className="modal-panel z-10 w-full max-w-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
              <h3 className="text-base font-semibold text-white">Import Leads from Excel / CSV</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#636363] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
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
                  <div className="flex items-center justify-between p-3.5 bg-[#141414] border border-[#1f1f1f] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <p className="text-xs text-[#636363]">{(file.size / 1024).toFixed(1)} KB • {parsedData.length} rows loaded</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-[#8c8c8c] hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" /> Change File
                    </button>
                  </div>

                  {/* Mapping Panel */}
                  <div className="space-y-3 bg-[#111111]/50 border border-[#1f1f1f] p-4 rounded-xl">
                    <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Map Columns</h4>
                    <p className="text-xs text-[#636363]">Assign columns from your Excel sheet to REDIX CRM Lead fields.</p>

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
                            <option key={h} value={h}>{h}</option>
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
                            <option key={h} value={h}>{h}</option>
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
                            <option key={h} value={h}>{h}</option>
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
                            <option key={h} value={h}>{h}</option>
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
                            <option key={h} value={h}>{h}</option>
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
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Warning Info */}
                  <div className="flex gap-2.5 p-3.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-yellow-500 text-[11px]">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Deduplication Rule Enabled</p>
                      <p className="mt-0.5 text-yellow-500/80">Duplicate phone numbers will be skipped. Only new, unique businesses will be added.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1f1f1f]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#1f1f1f] bg-[#111111] text-xs font-medium text-[#8c8c8c] hover:text-white rounded-xl transition-all"
              >
                Cancel
              </button>
              {file && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting || loading}
                  className="px-4 py-2 bg-white text-black text-xs font-medium rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center min-w-[100px]"
                >
                  {isImporting ? 'Importing...' : 'Start Import'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
