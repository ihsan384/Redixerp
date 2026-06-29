import { useState, useEffect } from 'react'
import {
  Settings,
  Database,
  RefreshCw,
  Trash2,
  Lock,
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Storage } from '@/lib/storage'
import { useAuth } from '../auth/AuthContext'
import { toast } from 'sonner'

const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                  !import.meta.env.VITE_SUPABASE_URL

export function SettingsPage() {
  const { employee } = useAuth()
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseStatus, setSupabaseStatus] = useState(false)

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL || 'Not Configured'
    setSupabaseUrl(url)
    setSupabaseStatus(!DEMO_MODE)
  }, [])

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to clear all local databases? This will wipe your history.')) {
      localStorage.clear()
      toast.success('Local Storage cleared. Please refresh the page.')
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  const handleSeedData = () => {
    localStorage.clear()
    // By clearing localStorage, the storage utility will automatically load INITIAL mock arrays next reload!
    toast.success('Database templates seeded. Reloading system...')
    setTimeout(() => window.location.reload(), 1000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Info */}
      <div className="flex items-center gap-3 p-4 bg-[#111111]/30 border border-[#1f1f1f] rounded-2xl">
        <Settings className="w-5 h-5 text-white" />
        <div>
          <p className="text-sm font-semibold text-white">System Settings</p>
          <p className="text-xs text-[#525252] mt-0.5">Configure platform connections, user credentials, and database resets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase Status Card */}
        <div className="border border-[#1f1f1f] bg-[#0d0d0d] rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-[#8c8c8c]" /> Database Integration
          </h3>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8c8c8c]">Connection Status:</span>
              {supabaseStatus ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-yellow-500 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Sandbox Mode (Local DB)
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-[#525252] uppercase font-semibold">Supabase Endpoint URL</p>
              <p className="text-xs font-mono text-white bg-[#111111] p-2.5 rounded-lg border border-[#1f1f1f] truncate">
                {supabaseUrl}
              </p>
            </div>

            {!supabaseStatus && (
              <p className="text-[11px] text-[#8c8c8c] leading-relaxed pt-1 border-t border-[#1f1f1f]">
                No Supabase URL detected in <code className="text-white font-mono">.env.local</code>. Running fully local in browser Local Storage. All actions are saved dynamically.
              </p>
            )}
          </div>
        </div>

        {/* User Account Info Card */}
        <div className="border border-[#1f1f1f] bg-[#0d0d0d] rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-[#8c8c8c]" /> User Account Info
          </h3>

          <div className="space-y-4.5 pt-1 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-[#1f1f1f] flex items-center justify-center text-white text-sm font-bold">
                {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{employee?.name || 'Local User'}</p>
                <p className="text-[10px] text-[#525252] font-semibold flex items-center gap-1 mt-0.5 uppercase">
                  <Shield className="w-3 h-3 text-[#525252]" /> {employee?.role?.replace('_', ' ') || 'Admin'}
                </p>
              </div>
            </div>

            <div className="space-y-1 border-t border-[#1f1f1f] pt-3.5">
              <p className="text-[10px] text-[#525252] uppercase font-semibold">Email Address</p>
              <p className="text-white font-medium">{employee?.email || 'user@redix.media'}</p>
            </div>
          </div>
        </div>

        {/* Local sandbox data resets */}
        <div className="border border-[#1f1f1f] bg-[#0d0d0d] rounded-2xl p-6 space-y-4 md:col-span-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#8c8c8c]" /> Sandbox Data Administration
          </h3>
          <p className="text-xs text-[#8c8c8c] leading-relaxed">
            Manage browser-cached CRM data. You can completely wipe local registers or force-seed the default dummy contacts to test CRM flows.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2.5">
            <button
              onClick={handleSeedData}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#141414] hover:bg-[#1a1a1a] border border-[#1f1f1f] hover:border-white/10 text-white text-xs font-bold rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Seed Dummy Templates
            </button>
            <button
              onClick={handleResetData}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-500/20 hover:border-red-500/40 bg-red-500/[0.02] hover:bg-red-500/[0.04] text-red-400 text-xs font-bold rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" /> Wipe Browser Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
