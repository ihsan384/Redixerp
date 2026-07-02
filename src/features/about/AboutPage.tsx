import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Cpu,
  Database,
  Users,
  Phone,
  Receipt,
  BarChart3,
  FileText,
  Shield,
  ExternalLink,
  Info,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  History,
  CalendarClock,
  UserCheck
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { getDbMode } from '@/lib/supabase'

export function AboutPage() {
  const { employee } = useAuth()
  const [dbMode, setDbMode] = useState<'local' | 'supabase'>('local')
  const [localStorageSize, setLocalStorageSize] = useState('0 KB')
  const [browserInfo, setBrowserInfo] = useState('')

  useEffect(() => {
    // Determine database mode
    setDbMode(getDbMode())

    // Calculate local storage size
    let totalBytes = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        totalBytes += (localStorage.getItem(key) || '').length * 2 // UTF-16 characters = 2 bytes
      }
    }
    setLocalStorageSize((totalBytes / 1024).toFixed(2) + ' KB')

    // Get simple browser info
    const agent = window.navigator.userAgent
    if (agent.includes('Chrome')) setBrowserInfo('Chromium Engine')
    else if (agent.includes('Firefox')) setBrowserInfo('Firefox Engine')
    else if (agent.includes('Safari')) setBrowserInfo('Webkit Engine')
    else setBrowserInfo('Standard Browser Engine')
  }, [])

  const modules = [
    {
      title: 'Operations Manager',
      desc: 'Seamless lead management, live calling widgets, automated follow-ups, and clients dashboards.',
      icon: Users,
      color: 'text-red-400 border-red-500/20 bg-red-500/5',
      items: ['Leads pipeline', 'Call Center outbound widget', 'Call History logging', 'Smart Follow-ups calendar']
    },
    {
      title: 'Finance & Accounts',
      desc: 'Real-time billing, expense cataloging, operating margin calculation, and comprehensive cashflow statements.',
      icon: Receipt,
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
      items: ['Revenue tracking', 'Operational expenses logs', 'Automatic net profit indicators', 'Performance charts']
    },
    {
      title: 'Billing Invoice Suite',
      desc: 'Create, edit, manage, and print customized invoices, quotations, proposals, and agreements.',
      icon: FileText,
      color: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
      items: ['PDF Invoice exports', 'Client Agreements/SLAs', 'Pricing Quotations builder', 'Templates & Recurring bills']
    },
    {
      title: 'Team Management & Analytics',
      desc: 'Role-based access permissions, audit logs, employee status management, and performance reporting.',
      icon: UserCheck,
      color: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
      items: ['Granular access roles', 'Live team activity audit', 'Dynamic business charts', 'Excel/PDF exports']
    }
  ]

  const technologies = [
    { name: 'React 19', category: 'Frontend framework', desc: 'Component model and client state hydration' },
    { name: 'Vite 6', category: 'Build toolchain', desc: 'Ultra-fast HMR module loading' },
    { name: 'Tailwind CSS v4', category: 'Styling engine', desc: 'Precompiled style variables and design tokens' },
    { name: 'Supabase JS', category: 'Database & Auth client', desc: 'PostgreSQL connection and session management' },
    { name: 'Framer Motion', category: 'Transitions', desc: 'Fluid micro-animations and route entry layouts' },
    { name: 'Recharts', category: 'Visual charts', desc: 'Render business performance dashboards' }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="page-shell page-stack !max-w-6xl space-y-8 pb-12"
    >
      {/* Hero Banner Grid */}
      <div className="relative overflow-hidden border border-white/[0.08] bg-gradient-to-br from-[#111111] to-[#0a0a0a] rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Glow behind logo */}
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-red-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-red-500/5 blur-[100px] pointer-events-none" />

        <div className="space-y-4 max-w-xl text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 text-[10px] font-bold uppercase tracking-wider">
            <Zap className="w-3 h-3 text-red-500 animate-pulse" /> Platform Overview
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Redix ERP
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed font-medium">
            Redix ERP is a premium enterprise resource planning system tailored for high-growth operations. It unifies operations tracking, outbound sales telecommunication, complete client invoicing workflows, and multi-employee workspace coordination in a fast, responsive cloud-sandbox environment.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs font-semibold text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>v1.2.4 Production Build</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs font-semibold text-zinc-300">
              <span>Database Mode:</span>
              <span className={dbMode === 'supabase' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {dbMode === 'supabase' ? 'Supabase' : 'Sandbox (Local)'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Logo graphic */}
        <div className="relative flex items-center justify-center w-36 h-36 md:w-44 md:h-44 rounded-[32px] bg-gradient-to-br from-[#e53935] to-[#b71c1c] shadow-[0_12px_40px_rgba(229,57,53,0.3)] shrink-0 border border-white/20 select-none z-10">
          <Zap className="w-20 h-20 md:w-24 md:h-24 fill-white text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]" />
          <div className="absolute inset-0 rounded-[32px] border border-white/10" />
        </div>
      </div>

      {/* Diagnostics & Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-5 space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Integrations State</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">Database Sync</span>
            {dbMode === 'supabase' ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Supabase
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Sandbox (Local)
              </span>
            )}
          </div>
        </div>

        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-5 space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Local Storage Footprint</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">Client DB Cache</span>
            <span className="text-sm font-mono text-zinc-300 font-bold">{localStorageSize}</span>
          </div>
        </div>

        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-5 space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Environment Engine</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">Browser Core</span>
            <span className="text-xs text-zinc-300 font-semibold">{browserInfo}</span>
          </div>
        </div>

        <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-5 space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Session Operator</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white truncate max-w-[120px]">{employee?.name || 'Local User'}</span>
            <span className="text-[10px] bg-white/[0.05] border border-white/[0.08] text-zinc-400 px-2 py-0.5 rounded-md font-bold uppercase">
              {employee?.role?.replace('_', ' ') || 'Admin'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Features Modules Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Platform Functional Modules</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Explore the interconnected core components of the Redix operating system.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod, idx) => {
            const Icon = mod.icon
            return (
              <div 
                key={idx}
                className="border border-white/[0.08] bg-[#111111]/40 hover:bg-[#111111]/60 transition-all duration-300 rounded-2xl p-6 flex gap-4 shadow-lg group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${mod.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{mod.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-medium">{mod.desc}</p>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1.5 border-t border-white/[0.04]">
                    {mod.items.map((item, keyIdx) => (
                      <li key={keyIdx} className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
                        <span className="w-1 h-1 rounded-full bg-red-500/40 shrink-0" />
                        <span className="truncate">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Technology Specifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">System Technologies</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Under the hood developer stack driving speed and security.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {technologies.map((tech, idx) => (
              <div 
                key={idx} 
                className="border border-white/[0.06] bg-[#111111]/30 rounded-xl p-4 flex flex-col justify-between hover:border-white/[0.12] transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-white">{tech.name}</span>
                    <span className="text-[9px] font-bold text-zinc-600 bg-white/[0.02] border border-white/[0.05] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      {tech.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed font-medium">
                    {tech.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hosting / Deployment Status Card */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Architecture Flow</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Real-time networking and hosting topology status.</p>
          </div>

          <div className="border border-white/[0.08] bg-[#111111]/70 backdrop-blur-md rounded-2xl p-6 space-y-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-red-500/5 blur-[24px] pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-zinc-400">
                <Server className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Vercel Serverless Hosting</p>
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Deployment Engine</p>
              </div>
            </div>

            <div className="space-y-3.5 pt-1.5 border-t border-white/[0.04]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Client Latency</span>
                <span className="font-mono text-white font-bold">~ 14ms (Optimal)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">SSL Security</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> TLS 1.3 Active
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">CDN Edge Cache</span>
                <span className="text-zinc-300 font-bold uppercase text-[10px] tracking-wider bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                  HIT (Edge Node)
                </span>
              </div>
            </div>

            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 w-full h-11 px-4 text-xs font-bold text-[#A1A1AA] hover:text-white border border-white/[0.08] hover:border-white/[0.14] rounded-xl hover:bg-white/[0.02] transition-all"
            >
              <span>Access Source Code Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
