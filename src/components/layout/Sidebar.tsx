import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Phone,
  CalendarClock,
  Briefcase,
  TrendingUp,
  Receipt,
  BarChart3,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  ChevronDown,
  History,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/utils/cn'
import { Storage } from '@/lib/storage'

const iconMap = {
  LayoutDashboard,
  Users,
  Phone,
  CalendarClock,
  Briefcase,
  TrendingUp,
  Receipt,
  BarChart3,
  UserCheck,
  Settings,
  History,
} as const

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' as const, path: '/' },
  { id: 'leads', label: 'Leads', icon: 'Users' as const, path: '/leads' },
  { id: 'call-center', label: 'Call Center', icon: 'Phone' as const, path: '/call-center' },
  { id: 'call-history', label: 'Call History', icon: 'History' as const, path: '/call-history' },
  { id: 'followups', label: 'Follow Ups', icon: 'CalendarClock' as const, path: '/follow-ups' },
  { id: 'clients', label: 'Clients', icon: 'Briefcase' as const, path: '/clients' },
  { id: 'revenue', label: 'Revenue', icon: 'TrendingUp' as const, path: '/revenue' },
  { id: 'expenses', label: 'Expenses', icon: 'Receipt' as const, path: '/expenses' },
  { id: 'reports', label: 'Reports', icon: 'BarChart3' as const, path: '/reports' },
  { id: 'team', label: 'Team', icon: 'UserCheck' as const, path: '/team' },
  { id: 'settings', label: 'Settings', icon: 'Settings' as const, path: '/settings' },
]

const navSections = [
  {
    title: 'Operations',
    itemIds: ['dashboard', 'leads', 'call-center', 'call-history', 'followups', 'clients'],
  },
  {
    title: 'Finance',
    itemIds: ['revenue', 'expenses', 'reports'],
  },
  {
    title: 'Management',
    itemIds: ['team', 'settings'],
  },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { employee, signOut } = useAuth()
  const location = useLocation()

  // Dynamic counts for notification badges
  const [counts, setCounts] = useState({ leads: 0, calls: 0, followUps: 0 })

  useEffect(() => {
    try {
      const activeLeads = Storage.getLeads()
      const activeCalls = Storage.getCalls()
      const todayStr = new Date().toISOString().split('T')[0]

      const pendingLeads = activeLeads.filter((l) => l.status === 'new').length
      const queueCalls = activeLeads.filter((l) => l.status !== 'converted').length
      const activeFollowups = activeCalls.filter((c) => c.follow_up && c.follow_up_date === todayStr).length

      setCounts({
        leads: pendingLeads,
        calls: queueCalls,
        followUps: activeFollowups,
      })
    } catch (e) {
      // Storage might not be loaded yet
    }
  }, [location.pathname])

  const getBadgeValue = (id: string) => {
    if (id === 'leads' && counts.leads > 0) return counts.leads
    if (id === 'call-center' && counts.calls > 0) return counts.calls
    if (id === 'followups' && counts.followUps > 0) return counts.followUps
    return null
  }

  const renderNavList = () => (
    <div className="space-y-6">
      {navSections.map((sec) => (
        <div key={sec.title} className="space-y-1.5">
          {!collapsed && (
            <h4 className="px-4 text-[10px] font-bold uppercase tracking-wider text-[#71717A] mb-2">
              {sec.title}
            </h4>
          )}
          <div className="space-y-0.5">
            {sec.itemIds.map((itemId) => {
              const item = navItems.find((n) => n.id === itemId)
              if (!item) return null

              const Icon = iconMap[item.icon]
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)
              const badge = getBadgeValue(item.id)

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={onMobileClose}
                  className={cn(
                    'group flex items-center justify-between mx-2 px-3 py-2 rounded-xl text-caption font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-white/[0.06] text-white font-semibold'
                      : 'text-[#A1A1AA] hover:bg-white/[0.03] hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-lg transition-colors',
                      isActive ? 'bg-white/10 text-white' : 'text-[#71717A] group-hover:text-white group-hover:bg-white/[0.04]'
                    )}>
                      <Icon className="w-[18px] h-[18px]" />
                    </div>
                    {!collapsed && (
                      <span className="whitespace-nowrap overflow-hidden transition-all duration-200">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!collapsed && badge && (
                    <span className="inline-flex h-5 items-center justify-center rounded-full bg-red-500/10 px-2 text-[10px] font-bold text-red-400 border border-red-500/15">
                      {badge}
                    </span>
                  )}

                  {/* Active selector pill */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-nav-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-red-500 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between overflow-hidden">
      {/* Workspace Switcher */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl p-2 cursor-pointer hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-gradient-to-br from-[#e53935] to-[#c62828] text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
              R
            </div>
            {!collapsed && (
              <div className="flex-grow min-w-0">
                <p className="text-xs font-bold text-white truncate">Redix Media</p>
                <p className="text-[10px] text-zinc-500 font-semibold truncate leading-none mt-0.5">ERP Workspace</p>
              </div>
            )}
          </div>
          {!collapsed && <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 overflow-y-auto custom-scrollbar space-y-6">
        {renderNavList()}
      </div>

      {/* Footer Profile */}
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.01] border border-white/[0.03]',
          collapsed ? 'justify-center p-2' : ''
        )}>
          <div className="w-8 h-8 bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/[0.08] text-white rounded-xl flex items-center justify-center text-xs font-bold shrink-0">
            {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{employee?.name || 'User'}</p>
              <p className="text-[10px] text-[#A1A1AA] font-semibold truncate mt-0.5 capitalize leading-none">{employee?.role?.replace('_', ' ') || 'Admin'}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#A1A1AA] hover:text-red-400 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsible toggle desktop icon */}
        <div className="hidden lg:flex justify-end px-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.06] hover:border-white/12 bg-white/[0.02] text-zinc-400 hover:text-white transition-all shadow-sm"
          >
            {collapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar (Floating look) */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 240 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex h-[calc(100vh-32px)] my-4 ml-4 bg-[#111111]/85 border border-white/[0.08] rounded-2xl flex-col shrink-0 z-40 relative backdrop-blur-2xl shadow-xl overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Drawer Backdrop overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-[260px] h-full bg-[#111111] border-r border-white/[0.08] flex flex-col shrink-0 z-50"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
