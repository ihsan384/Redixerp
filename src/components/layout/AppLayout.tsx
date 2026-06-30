import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background flex flex-col">
        <TopBar />
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
