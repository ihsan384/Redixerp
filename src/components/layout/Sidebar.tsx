import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Briefcase,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Phone,
  Receipt,
  Settings,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/utils/cn'

const primaryNavigation = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, path: '/' },
  { id: 'leads', label: 'Leads', icon: Users, path: '/leads' },
  { id: 'call-center', label: 'Call Center', icon: Phone, path: '/call-center', badge: 'Live' },
  { id: 'followups', label: 'Follow Ups', icon: CalendarClock, path: '/follow-ups', badge: '2' },
  { id: 'clients', label: 'Clients', icon: Briefcase, path: '/clients' },
]

const insightNavigation = [
  { id: 'revenue', label: 'Revenue', icon: TrendingUp, path: '/revenue' },
  { id: 'expenses', label: 'Expenses', icon: Receipt, path: '/expenses' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { employee, signOut } = useAuth()
  const location = useLocation()

  const renderNavigation = (
    label: string,
    items: typeof primaryNavigation,
  ) => (
    <div className="space-y-2">
      {!collapsed && (
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">{label}</p>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group relative flex h-11 items-center gap-3 overflow-hidden rounded-[14px] px-3 text-sm font-semibold transition-all duration-200',
                collapsed && 'lg:justify-center lg:px-0',
                isActive
                  ? 'bg-gradient-to-r from-red-500/16 to-red-500/[0.035] text-white shadow-[inset_0_0_0_1px_rgba(229,57,53,.16)]'
                  : 'text-zinc-500 hover:bg-white/[0.045] hover:text-zinc-100'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="redix-sidebar-active"
                  className="absolute left-0 h-6 w-[3px] rounded-r-full bg-red-400 shadow-[0_0_14px_rgba(229,57,53,.8)]"
                  transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                />
              )}
              <Icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive && 'text-red-300')} />
              <span className={cn('min-w-0 flex-1 truncate', collapsed && 'lg:hidden')}>{item.label}</span>
              {item.badge && !collapsed && (
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[9px] font-bold',
                  item.badge === 'Live' ? 'bg-red-500/12 text-red-300' : 'bg-white/[0.06] text-zinc-400'
                )}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            aria-label="Close navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] shrink-0 flex-col p-3 transition-[transform,width] duration-300 ease-out lg:relative lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[88px]' : 'lg:w-[272px]'
        )}
      >
        <div className="panel-card flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0d0d0d]/94">
          <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.065] px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-red-300/30 bg-gradient-to-br from-red-400 to-red-700 shadow-[0_10px_30px_rgba(229,57,53,.28)]">
                <Zap className="h-5 w-5 fill-white text-white" />
              </div>
              <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
                <p className="truncate text-[17px] font-bold tracking-[-0.04em] text-white">REDIX</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">Business OS</p>
              </div>
            </div>
            <button
              onClick={onMobileClose}
              aria-label="Close navigation"
              className="flex h-9 min-h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.035] text-zinc-500 transition hover:bg-white/[0.07] hover:text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-3 pb-2 pt-3">
            <button
              className={cn(
                'flex h-12 w-full items-center gap-3 rounded-[14px] border border-white/[0.065] bg-white/[0.025] px-3 text-left transition hover:border-white/[0.11] hover:bg-white/[0.045]',
                collapsed && 'lg:justify-center lg:px-0'
              )}
              title="REDIX Media workspace"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-xs font-bold text-white">R</span>
              <span className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
                <span className="block truncate text-xs font-bold text-zinc-200">REDIX Media</span>
                <span className="block truncate text-[10px] text-zinc-600">Main workspace</span>
              </span>
              {!collapsed && <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />}
            </button>
          </div>

          <nav className="sidebar-scroll flex-1 space-y-6 overflow-y-auto px-3 py-3" aria-label="Primary navigation">
            {renderNavigation('Workspace', primaryNavigation)}
            {renderNavigation('Finance & insights', insightNavigation)}
          </nav>

          <div className="space-y-1 border-t border-white/[0.065] px-3 py-3">
            <NavLink
              to="/team"
              onClick={onMobileClose}
              className={({ isActive }) => cn(
                'flex h-11 items-center gap-3 rounded-[14px] px-3 text-sm font-semibold text-zinc-500 transition hover:bg-white/[0.045] hover:text-white',
                collapsed && 'lg:justify-center lg:px-0',
                isActive && 'bg-white/[0.055] text-white'
              )}
            >
              <UserCheck className="h-5 w-5 shrink-0" />
              <span className={cn('flex-1', collapsed && 'lg:hidden')}>Team</span>
            </NavLink>
            <NavLink
              to="/settings"
              onClick={onMobileClose}
              className={({ isActive }) => cn(
                'flex h-11 items-center gap-3 rounded-[14px] px-3 text-sm font-semibold text-zinc-500 transition hover:bg-white/[0.045] hover:text-white',
                collapsed && 'lg:justify-center lg:px-0',
                isActive && 'bg-white/[0.055] text-white'
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span className={cn('flex-1', collapsed && 'lg:hidden')}>Settings</span>
            </NavLink>
          </div>

          <div className="border-t border-white/[0.065] p-3">
            <div className={cn('flex items-center gap-3 rounded-[16px] bg-white/[0.025] p-2', collapsed && 'lg:justify-center')}>
              <div className="avatar h-10 w-10">{employee?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
                <p className="truncate text-[13px] font-bold text-white">{employee?.name || 'User'}</p>
                <p className="truncate text-[10px] capitalize text-zinc-600">{employee?.role?.replace('_', ' ') || 'Admin'}</p>
              </div>
              {!collapsed && (
                <button
                  onClick={signOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-1 top-[100px] z-10 hidden h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#171717] text-zinc-500 shadow-xl transition hover:text-white lg:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>
    </>
  )
}
