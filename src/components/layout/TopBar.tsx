import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  Clock3,
  Command,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { SearchDialog } from './SearchDialog'
import { cn } from '@/utils/cn'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/leads': 'Leads',
  '/call-center': 'Call Center',
  '/follow-ups': 'Follow Ups',
  '/clients': 'Clients',
  '/revenue': 'Revenue',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/team': 'Team',
  '/settings': 'Settings',
}

interface TopBarProps {
  onMenuOpen: () => void
}

export function TopBar({ onMenuOpen }: TopBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { employee } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [clock, setClock] = useState(new Date())
  const [midnightTheme, setMidnightTheme] = useState(() => localStorage.getItem('redix_theme') === 'midnight')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const value = midnightTheme ? 'midnight' : 'dark'
    document.documentElement.dataset.theme = value
    localStorage.setItem('redix_theme', value)
  }, [midnightTheme])

  const pageTitle = PAGE_TITLES[location.pathname] || 'REDIX'

  return (
    <>
      <header className="relative z-30 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#090909]/60 px-6 backdrop-blur-2xl transition-all duration-300">
        {/* Left Section: Mobile Menu Trigger & Breadcrumbs */}
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={onMenuOpen}
            aria-label="Open navigation"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-[#A1A1AA] hover:text-white hover:bg-white/[0.06] lg:hidden transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="min-w-0">
            <div className="hidden items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider sm:flex">
              <span>Workspace</span>
              <ChevronRight className="h-3 w-3 text-zinc-600" />
              <span className="text-zinc-400 font-semibold">{pageTitle}</span>
            </div>
            <h2 className="truncate text-h4 font-bold tracking-tight text-white leading-none mt-1">{pageTitle}</h2>
          </div>
        </div>

        {/* Right Section: Workspace clock, Search trigger, notifications, quick actions */}
        <div className="flex items-center gap-3">
          {/* Clock Widget */}
          <div className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-[#A1A1AA] xl:flex">
            <Clock3 className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-bold tabular-nums text-zinc-300">
              {clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Quick Command search trigger - 48px height to align with inputs */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Open global search"
            className="flex h-11 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[#A1A1AA] transition-all hover:border-white/12 hover:bg-white/[0.06] hover:text-white sm:min-w-[220px]"
          >
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <span className="hidden flex-1 text-left text-xs font-semibold sm:block">Search Workspace</span>
            <kbd className="hidden items-center gap-0.5 rounded border border-white/[0.08] bg-black/40 px-2 py-0.5 font-mono text-[9px] font-bold text-zinc-600 md:flex">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>

          {/* Quick Lead Button */}
          <div className="hidden sm:block">
            <button
              onClick={() => navigate('/leads')}
              className="btn-primary h-11 px-4 text-xs font-bold rounded-xl"
              aria-label="Open leads page to add lead"
            >
              <Plus className="h-4 w-4" />
              <span>Add Lead</span>
            </button>
          </div>

          {/* Ambient Lighting Theme Toggle */}
          <button
            onClick={() => setMidnightTheme((current) => !current)}
            aria-label="Toggle ambient glow theme"
            title="Toggle theme ambient illumination"
            className="icon-btn h-11 w-11 rounded-xl"
          >
            {midnightTheme ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* Notifications Notification system */}
          <button
            aria-label="Notifications system alerts"
            title="Workspace Alerts"
            className="icon-btn h-11 w-11 rounded-xl relative"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full border border-[#111111] bg-red-500 shadow-[0_0_8px_rgba(229,57,53,0.8)]" />
          </button>

          {/* User Widget */}
          <div className="ml-2 hidden items-center gap-3 border-l border-white/[0.08] pl-4 md:flex">
            <div className="avatar w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 font-bold border border-white/[0.08] text-xs">
              {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden min-w-0 xl:block text-left">
              <p className="truncate text-caption font-bold leading-none text-white">{employee?.name || 'User'}</p>
              <p className="mt-1 truncate text-[10px] uppercase font-bold tracking-wider text-zinc-500">{employee?.role?.replace('_', ' ') || 'Admin'}</p>
            </div>
          </div>
        </div>
      </header>

      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
