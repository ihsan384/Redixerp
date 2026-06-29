import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell, Command } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { SearchDialog } from './SearchDialog'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
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

export function TopBar() {
  const location = useLocation()
  const { employee } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  // Listen for global Command+K / Ctrl+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const pageTitle = PAGE_TITLES[location.pathname] || 'REDIX CRM'

  return (
    <>
      <header className="h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#1a1a1a] flex items-center justify-between px-8 sticky top-0 z-30">
        {/* Left: Page Title */}
        <div>
          <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
          <p className="text-xs text-[#4b5563]">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-[#222222] rounded-xl text-[#6b7280] text-sm hover:border-[#333333] hover:text-[#9ca3af] transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden lg:inline">Search...</span>
            <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1a1a1a] rounded text-[10px] text-[#4b5563] font-mono border border-[#2a2a2a]">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>

          {/* Notifications */}
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-[#111111] border border-[#222222] text-[#6b7280] hover:border-[#333333] hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
          </button>

          {/* Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-[#1a1a1a]">
            <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-white text-xs font-semibold border border-[#2a2a2a]">
              {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-white leading-none">{employee?.name || 'User'}</p>
              <p className="text-xs text-[#4b5563] mt-0.5 capitalize">{employee?.role?.replace('_', ' ') || 'Admin'}</p>
            </div>
          </div>
        </div>
      </header>

      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
