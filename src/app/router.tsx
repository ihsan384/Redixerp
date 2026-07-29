import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'

import { LeadsPage } from '@/features/leads/LeadsPage'
import { CallCenterPage } from '@/features/call-center/CallCenterPage'
import { CallHistoryPage } from '@/features/call-history/CallHistoryPage'
import { FollowUpsPage } from '@/features/followups/FollowUpsPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { RevenuePage } from '@/features/revenue/RevenuePage'
import { ExpensesPage } from '@/features/expenses/ExpensesPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { TeamPage } from '@/features/team/TeamPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { AboutPage } from '@/features/about/AboutPage'
import { BalancePage } from '@/features/balance/BalancePage'

import { MessagesPage } from '@/features/messages/MessagesPage'
import { ReviewsPage } from '@/features/reviews/ReviewsPage'
import { ContactsPage } from '@/features/contacts/ContactsPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { QuotesPage } from '@/features/quotes/QuotesPage'

// Billing Module
import { BillingLayout } from '@/features/billing/BillingLayout'
import { InvoicesPage } from '@/features/billing/invoices/InvoicesPage'
import { AgreementsPage } from '@/features/billing/agreements/AgreementsPage'
import { QuotationsPage } from '@/features/billing/quotations/QuotationsPage'
import { TemplatesPage } from '@/features/billing/templates/TemplatesPage'
import { RecurringPage } from '@/features/billing/recurring/RecurringPage'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { employee, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="redix-grid flex min-h-screen items-center justify-center bg-[#090909]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-400/20 border-t-red-400" />
          <p className="text-sm font-semibold text-zinc-500">Loading REDIX workspace...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="call-center" element={<CallCenterPage />} />
        <Route path="call-history" element={<CallHistoryPage />} />
        <Route path="follow-ups" element={<FollowUpsPage />} />
        <Route path="revenue" element={<RevenuePage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="balance" element={<BalancePage />} />

        {/* Billing Module */}
        <Route path="billing" element={<BillingLayout />}>
          <Route index element={<Navigate to="invoices" replace />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="agreements" element={<AgreementsPage />} />
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="recurring" element={<RecurringPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}


