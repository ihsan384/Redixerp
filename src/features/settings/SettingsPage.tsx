import { useState, useEffect } from 'react'
import {
  Settings,
  Database,
  RefreshCw,
  Trash2,
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react'
import { Storage } from '@/lib/storage'
import { useAuth } from '../auth/AuthContext'
import { toast } from 'sonner'

const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://dnzhkytalvlkpyiyexwt.supabase.co' ||
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
    toast.success('Database templates seeded. Reloading system...')
    setTimeout(() => window.location.reload(), 1000)
  }

  return (
    <div className="page-shell page-stack !max-w-6xl space-y-6">
      {/* Header Info */}
      <div className="panel-card flex items-center gap-3 p-5">
        <Settings className="w-5 h-5 text-red-400" />
        <div>
          <p className="text-sm font-bold text-white">System Settings</p>
          <p className="text-xs text-zinc-500 mt-0.5">Configure Supabase integration, user roles, and cache diagnostics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase Status Card */}
        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/[0.04]">
            <Database className="w-4 h-4 text-zinc-500" /> Database Integration
          </h3>

          <div className="space-y-4.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-bold uppercase tracking-wider">Status:</span>
              {supabaseStatus ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Sandbox Mode (Local DB)
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Supabase API Endpoint</p>
              <p className="text-xs font-mono text-white bg-white/[0.01] p-3 rounded-lg border border-white/[0.06] truncate">
                {supabaseUrl}
              </p>
            </div>

            {!supabaseStatus && (
              <p className="text-[11px] text-zinc-400 leading-relaxed pt-3.5 border-t border-white/[0.04] font-medium">
                No active Supabase config found in <code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded">.env.local</code>. Running fully in Local Storage Sandbox mode.
              </p>
            )}
          </div>
        </div>

        {/* User Account Info Card */}
        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/[0.04]">
            <User className="w-4 h-4 text-zinc-500" /> User Profile Information
          </h3>

          <div className="space-y-4.5 pt-1 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-white text-sm font-bold shadow-inner">
                {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{employee?.name || 'Local User'}</p>
                <p className="text-[10px] text-zinc-500 font-bold flex items-center gap-1.5 mt-1.5 uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-zinc-600" /> {employee?.role?.replace('_', ' ') || 'Admin'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-white/[0.04] pt-3.5 mt-4">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Email Address</p>
              <p className="text-white font-bold text-sm bg-white/[0.01] p-3 rounded-lg border border-white/[0.06]">{employee?.email || 'user@redix.media'}</p>
            </div>
          </div>
        </div>

        {/* Local sandbox data resets */}
        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-6 space-y-4 md:col-span-2 shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/[0.04]">
            <Trash2 className="w-4 h-4 text-zinc-500" /> Sandbox Cache Diagnostics
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            Reset or flush local mock databases in the browser. You can seed preset contact lists to run outbound phone/leads tests.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSeedData}
              className="flex-grow btn-secondary h-11 px-4 text-xs font-bold rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" /> <span>Reset & Seed Preset Templates</span>
            </button>
            <button
              onClick={handleResetData}
              className="flex-grow btn-secondary h-11 px-4 text-xs font-bold rounded-xl border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 hover:!text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" /> <span>Wipe Browser Storage Cache</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
