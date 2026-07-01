import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { FileText, FileSignature, Quote, LayoutTemplate, RefreshCw, Receipt } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBillingStore } from './hooks/useBillingStore'
import { BillingDashboardCards } from './components/BillingDashboardCards'

const tabs = [
  { path: '/billing/invoices',   label: 'Invoices',          icon: FileText      },
  { path: '/billing/agreements', label: 'Agreements',        icon: FileSignature },
  { path: '/billing/quotations', label: 'Quotations',        icon: Quote         },
  { path: '/billing/templates',  label: 'Templates',         icon: LayoutTemplate},
  { path: '/billing/recurring',  label: 'Recurring',         icon: RefreshCw     },
]

export function BillingLayout() {
  const location = useLocation()
  const { billingStats } = useBillingStore()

  return (
    <div className="page-shell">
      <div className="page-stack">
        {/* Page Header */}
        <div className="page-intro">
          <div>
            <div className="eyebrow">
              <Receipt className="w-3 h-3" />
              Billing
            </div>
            <h1>Billing & Finance</h1>
            <p>Create professional invoices, agreements, and quotations for your clients.</p>
          </div>
        </div>

        {/* Dashboard Stats */}
        <BillingDashboardCards stats={billingStats} />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl w-fit overflow-x-auto">
          {tabs.map(tab => {
            const isActive = location.pathname.startsWith(tab.path)
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={`relative flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="billing-tab-active"
                    className="absolute inset-0 bg-white/[0.08] border border-white/[0.10] rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </NavLink>
            )
          })}
        </div>

        {/* Sub-page content */}
        <Outlet />
      </div>
    </div>
  )
}
