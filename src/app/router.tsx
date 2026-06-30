import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'

// Lazy-loaded or placeholder components for features to keep it clean and buildable
import { LeadsPage } from '@/features/leads/LeadsPage'
import { CallCenterPage } from '@/features/call-center/CallCenterPage'
import { FollowUpsPage } from '@/features/followups/FollowUpsPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { RevenuePage } from '@/features/revenue/RevenuePage'
import { ExpensesPage } from '@/features/expenses/ExpensesPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { TeamPage } from '@/features/team/TeamPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

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
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="call-center" element={<CallCenterPage />} />
        <Route path="follow-ups" element={<FollowUpsPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="revenue" element={<RevenuePage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
