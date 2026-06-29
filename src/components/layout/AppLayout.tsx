import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      {/* Main content area — offset by sidebar width */}
      <div className="flex-1 ml-[256px] transition-all duration-250">
        <TopBar />
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
