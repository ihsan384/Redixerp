import { useState, useEffect } from 'react'
import {
  Settings,
  Database,
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Radio,
  HardDrive,
  Key,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { EMPLOYEE_ROLE_LABELS } from '@/utils/constants'

export function SettingsPage() {
  const { employee, session, signOut } = useAuth()
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [authStatus, setAuthStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [realtimeStatus, setRealtimeStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [storageStatus, setStorageStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [pingTime, setPingTime] = useState<number | null>(null)

  useEffect(() => {
    const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
    // Mask URL e.g., https://dnzhkytalvlkpyiyexwt.supabase.co -> https://dnzhk*********.supabase.co
    if (rawUrl) {
      try {
        const urlObj = new URL(rawUrl)
        const hostParts = urlObj.hostname.split('.')
        const sub = hostParts[0]
        const maskedSub = sub.substring(0, 5) + '*********'
        hostParts[0] = maskedSub
        urlObj.hostname = hostParts.join('.')
        setSupabaseUrl(urlObj.toString())
      } catch {
        setSupabaseUrl(rawUrl.substring(0, 12) + '*********')
      }
    } else {
      setSupabaseUrl('Not Configured')
    }

    checkConnections()
  }, [])

  const checkConnections = async () => {
    setDbStatus('checking')
    setAuthStatus('checking')
    setRealtimeStatus('checking')
    setStorageStatus('checking')

    const start = performance.now()

    try {
      // 1. Check Database (query employees)
      const { error: dbErr } = await supabase.from('employees').select('count', { count: 'exact', head: true }).limit(1)
      if (dbErr) throw dbErr
      setDbStatus('connected')
      setPingTime(Math.round(performance.now() - start))
    } catch (e) {
      console.error('DB Status Check Failed:', e)
      setDbStatus('error')
    }

    // 2. Check Auth Status (already checked if session exists, but verify via client)
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setAuthStatus(currentSession ? 'connected' : 'error')
    } catch {
      setAuthStatus('error')
    }

    // 3. Check Realtime (simulate simple channel subscription)
    try {
      const channel = supabase.channel('ping-channel')
      channel
        .on('system', { event: '*' }, () => {})
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected')
            supabase.removeChannel(channel)
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setRealtimeStatus('error')
          }
        })
      // Timeout after 4s
      setTimeout(() => {
        setRealtimeStatus((curr) => (curr === 'checking' ? 'error' : curr))
      }, 4000)
    } catch {
      setRealtimeStatus('error')
    }

    // 4. Check Storage
    try {
      const { data, error } = await supabase.storage.listBuckets()
      if (error) throw error
      setStorageStatus('connected')
    } catch (e) {
      console.error('Storage Check Failed:', e)
      setStorageStatus('error')
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (err) {
      toast.error('Failed to sign out')
    }
  }

  const getStatusLabel = (status: 'checking' | 'connected' | 'error') => {
    switch (status) {
      case 'checking':
        return <span className="text-zinc-500 font-medium animate-pulse">Checking...</span>
      case 'connected':
        return <span className="text-emerald-400 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Operational</span>
      case 'error':
        return <span className="text-red-400 font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Disconnected / Error</span>
    }
  }

  // Extract project name from URL if possible
  const projectName = import.meta.env.VITE_SUPABASE_URL
    ? new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]
    : 'Redix ERP Production'

  return (
    <div className="page-shell page-stack !max-w-6xl space-y-6">
      {/* Header Info */}
      <div className="panel-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-sm font-bold text-white">System Settings</p>
            <p className="text-xs text-zinc-500 mt-0.5">Production environment health, authentication status, and active user session info.</p>
          </div>
        </div>
        <button
          onClick={checkConnections}
          className="btn-secondary h-9 px-4 text-xs font-bold rounded-xl whitespace-nowrap"
        >
          Re-check Connection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase Status Card */}
        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-6 space-y-5 shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/[0.04]">
            <Database className="w-4 h-4 text-zinc-500" /> Live Integrations
          </h3>

          <div className="space-y-4 pt-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-zinc-500" /> Database Status:
              </span>
              {getStatusLabel(dbStatus)}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-zinc-500" /> Authentication:
              </span>
              {getStatusLabel(authStatus)}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-zinc-500" /> Realtime Engine:
              </span>
              {getStatusLabel(realtimeStatus)}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-zinc-500" /> File Storage:
              </span>
              {getStatusLabel(storageStatus)}
            </div>

            {dbStatus === 'connected' && pingTime !== null && (
              <div className="text-[10px] text-zinc-500 font-mono text-right pt-2 border-t border-white/[0.04]">
                DB response latency: <span className="text-white font-bold">{pingTime}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* User Account Info Card */}
        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-6 space-y-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/[0.04]">
              <User className="w-4 h-4 text-zinc-500" /> User Profile Information
            </h3>

            <div className="space-y-4 pt-1 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-sm font-bold shadow-inner">
                  {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{employee?.name || 'Active Representative'}</p>
                  <p className="text-[10px] text-zinc-500 font-bold flex items-center gap-1.5 mt-1.5 uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5 text-zinc-600" /> {employee?.role ? EMPLOYEE_ROLE_LABELS[employee.role] : 'Loading...'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/[0.04] pt-4">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Email Address</p>
                  <p className="text-white font-bold truncate">{employee?.email || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Session Status</p>
                  <p className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active Session
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.04] flex justify-end">
            <button
              onClick={handleLogout}
              className="btn-secondary h-10 px-4 text-xs font-bold rounded-xl border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 hover:!text-red-400 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> <span>Sign Out of REDIX</span>
            </button>
          </div>
        </div>

        {/* Project Credentials Info */}
        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-6 space-y-4 md:col-span-2 shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/[0.04]">
            <Settings className="w-4 h-4 text-zinc-500" /> Supabase Connection Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Project Identifier</p>
              <p className="text-white font-mono bg-white/[0.01] p-3 rounded-lg border border-white/[0.06] truncate">
                {projectName}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">API Endpoint URL</p>
              <p className="text-white font-mono bg-white/[0.01] p-3 rounded-lg border border-white/[0.06] truncate">
                {supabaseUrl}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
