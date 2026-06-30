import { useState } from 'react'
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
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/utils/cn'

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
} as const

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' as const, path: '/' },
  { id: 'leads', label: 'Leads', icon: 'Users' as const, path: '/leads' },
  { id: 'call-center', label: 'Call Center', icon: 'Phone' as const, path: '/call-center' },
  { id: 'followups', label: 'Follow Ups', icon: 'CalendarClock' as const, path: '/follow-ups' },
  { id: 'clients', label: 'Clients', icon: 'Briefcase' as const, path: '/clients' },
  { id: 'revenue', label: 'Revenue', icon: 'TrendingUp' as const, path: '/revenue' },
  { id: 'expenses', label: 'Expenses', icon: 'Receipt' as const, path: '/expenses' },
  { id: 'reports', label: 'Reports', icon: 'BarChart3' as const, path: '/reports' },
  { id: 'team', label: 'Team', icon: 'UserCheck' as const, path: '/team' },
  { id: 'settings', label: 'Settings', icon: 'Settings' as const, path: '/settings' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { employee, signOut } = useAuth()
  const location = useLocation()

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-screen bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col shrink-0 z-40 relative"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-bold tracking-tight text-white whitespace-nowrap overflow-hidden"
              >
                REDIX
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#1a1a1a] text-[#6b7280] hover:text-white transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                'sidebar-item group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? 'bg-white/[0.06] text-white active'
                  : 'text-[#6b7280] hover:bg-white/[0.03] hover:text-[#d1d5db]'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg transition-colors flex-shrink-0',
                isActive ? 'bg-white/10' : 'group-hover:bg-white/[0.04]'
              )}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-white rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-[#1a1a1a] p-3">
        <div className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl',
          collapsed ? 'justify-center' : ''
        )}>
          <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 border border-[#2a2a2a]">
            {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-sm font-medium text-white truncate">{employee?.name || 'User'}</p>
                <p className="text-xs text-[#6b7280] truncate">{employee?.role || 'Admin'}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={signOut}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#1a1a1a] text-[#6b7280] hover:text-white transition-colors flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
