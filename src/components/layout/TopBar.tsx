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
      <header className="relative z-30 flex min-h-[80px] shrink-0 items-center justify-between gap-4 border-b border-white/[0.065] bg-[#090909]/72 px-4 backdrop-blur-2xl sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onMenuOpen} aria-label="Open navigation" className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/[0.075] bg-white/[0.035] text-zinc-500 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="hidden items-center gap-1.5 text-[10px] font-semibold text-zinc-600 sm:flex">
              <span>Workspace</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-zinc-400">{pageTitle}</span>
            </div>
            <h1 className="truncate text-[17px] font-bold tracking-[-0.03em] text-white sm:mt-0.5 sm:text-lg">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="mr-1 hidden items-center gap-2 rounded-[13px] border border-white/[0.065] bg-white/[0.025] px-3 py-2 text-[11px] text-zinc-500 2xl:flex">
            <Clock3 className="h-3.5 w-3.5" />
            <span className="font-semibold tabular-nums text-zinc-300">
              {clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Open global search"
            className="flex h-11 items-center gap-2 rounded-[14px] border border-white/[0.075] bg-white/[0.035] px-3 text-zinc-500 transition hover:border-white/[0.13] hover:bg-white/[0.055] hover:text-zinc-200 sm:min-w-[210px] sm:px-4"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden flex-1 text-left text-[13px] sm:block">Search workspace</span>
            <kbd className="hidden items-center gap-0.5 rounded-md border border-white/[0.07] bg-black/25 px-1.5 py-0.5 font-mono text-[9px] text-zinc-600 md:flex">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>

          <div className="hidden xl:block">
            <button
              onClick={() => navigate('/leads')}
              className="btn-primary px-3"
              aria-label="Open leads to add a new lead"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden 2xl:inline">New lead</span>
            </button>
          </div>

          <div className="hidden sm:block">
            <button
              onClick={() => setMidnightTheme((current) => !current)}
              aria-label="Toggle ambient theme"
              title="Toggle ambient theme"
              className="icon-btn"
            >
              {midnightTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <button aria-label="Notifications" title="Notifications" className="icon-btn relative">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-[#111] bg-red-400 shadow-[0_0_9px_rgba(229,57,53,.7)]" />
          </button>

          <div className="ml-1 hidden items-center gap-3 border-l border-white/[0.065] pl-3 md:flex">
            <div className="avatar">{employee?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div className="hidden min-w-0 xl:block">
              <p className="truncate text-[13px] font-bold leading-none text-white">{employee?.name || 'User'}</p>
              <p className="mt-1 truncate text-[10px] capitalize text-zinc-600">{employee?.role?.replace('_', ' ') || 'Admin'}</p>
            </div>
          </div>
        </div>
      </header>

      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
