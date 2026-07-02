import { useState, useEffect, useRef } from 'react'
import { Upload, File, FileText, Image, Video, Trash2, Eye, Download, Shield } from 'lucide-react'
import type { Client, ClientFile } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface FileManagerProps {
  client: Client
}

const CATEGORIES = [
  { value: 'contracts', label: 'Contracts / SLAs' },
  { value: 'logo', label: 'Client Logos' },
  { value: 'brand_kit', label: 'Brand Kits' },
  { value: 'images', label: 'Sourced Images' },
  { value: 'videos', label: 'Project Video Assets' },
  { value: 'documents', label: 'Strategic Docs' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'receipts', label: 'Payment Receipts' }
] as const

export function FileManager({ client }: FileManagerProps) {
  const [files, setFiles] = useState<ClientFile[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<typeof CATEGORIES[number]['value']>('documents')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('client_files')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setFiles((data || []) as ClientFile[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [client.id])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Limit to 5MB to avoid localStorage payload overflow in Mock Mode
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit')
      return
    }

    try {
      setUploading(true)
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        const fileContentBase64 = event.target?.result as string
        const mockUrl = fileContentBase64 || '#'

        const filePayload = {
          client_id: client.id,
          name: selectedFile.name,
          category: category,
          size: selectedFile.size,
          url: mockUrl,
          created_at: new Date().toISOString()
        }

        // Try inserting into DB
        const { error } = await supabase.from('client_files').insert(filePayload as never)
        if (error) throw error

        // Add activity
        const activityPayload = {
          lead_id: client.id,
          type: 'note',
          description: `Uploaded file "${selectedFile.name}" to category "${category}".`
        }
        await supabase.from('activities').insert(activityPayload as never)

        toast.success(`File uploaded successfully!`)
        loadFiles()
      }

      reader.onerror = () => {
        throw new Error('Failed to read file')
      }

      reader.readAsDataURL(selectedFile)
    } catch (err) {
      console.error(err)
      toast.error('Failed to complete upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteFile = async (fileId: string, name: string) => {
    try {
      const { error } = await supabase.from('client_files').delete().eq('id', fileId)
      if (error) throw error
      
      toast.success(`Deleted file: ${name}`)
      loadFiles()
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete file')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (cat: typeof CATEGORIES[number]['value']) => {
    switch (cat) {
      case 'logo':
      case 'images':
        return <Image className="w-5 h-5 text-emerald-400" />
      case 'videos':
        return <Video className="w-5 h-5 text-blue-400" />
      case 'contracts':
      case 'invoices':
      case 'receipts':
        return <FileText className="w-5 h-5 text-red-400" />
      default:
        return <File className="w-5 h-5 text-zinc-400" />
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Upload Zone */}
      <div className="panel-card p-5 space-y-4 bg-[#111]/40 border border-white/[0.06] backdrop-blur-md">
        <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
          <Upload className="w-4 h-4 text-red-500" /> Secure File Upload
        </div>
        <p className="text-zinc-500 text-xs mt-0.5">Upload brand assets, contracts, logos, or client briefs here. Maximum file size: 5MB.</p>

        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Target Folder Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full h-11 bg-[#151515] border border-white/[0.08] text-white rounded-xl text-xs font-semibold px-3"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/[0.06] hover:border-red-500/40 bg-white/[0.01] hover:bg-white/[0.02] rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.zip,.docx,.txt,.mp4"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2.5">
                <div className="w-6 h-6 border-2 border-red-500/20 border-t-red-500 animate-spin rounded-full" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Processing upload...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-500 group-hover:text-red-400 group-hover:bg-red-500/5 group-hover:border-red-500/20 transition-all">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Choose file or drag here</p>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-1">PDF, JPG, PNG, DOCX, TXT, MP4</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Files grid */}
      <div className="lg:col-span-2 space-y-4">
        <div className="panel-card p-5 bg-[#111]/40 border border-white/[0.06] backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4 text-zinc-400" /> Vault Storage Assets ({files.length})
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-6 h-6 border-2 border-red-500/20 border-t-red-500 animate-spin rounded-full" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 border border-white/[0.04] bg-white/[0.01] rounded-2xl">
              <File className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-xs font-semibold italic">No assets uploaded in vault yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {files.map(file => (
                <div key={file.id} className="flex items-center justify-between py-3.5 hover:bg-white/[0.01] px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
                      {getFileIcon(file.category)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate max-w-[220px] sm:max-w-[320px]">{file.name}</p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500 mt-1">
                        <span className="text-red-400 font-semibold">{file.category.replace('_', ' ')}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span className="font-mono">{formatSize(file.size)}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span className="font-mono text-[8.5px] font-medium">{new Date(file.created_at).toLocaleDateString('en-PK')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-4">
                    {file.url && file.url !== '#' && (
                      <a
                        href={file.url}
                        download={file.name}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.06] hover:border-red-500/20 bg-white/[0.02] hover:bg-red-500/5 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Download Asset"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteFile(file.id, file.name)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.06] hover:border-red-500/30 bg-white/[0.02] hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
