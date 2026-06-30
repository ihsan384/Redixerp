import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)

  return (
    <div className="app-shell h-screen overflow-hidden">
      <Sidebar
        mobileOpen={mobileNavigationOpen}
        onMobileClose={() => setMobileNavigationOpen(false)}
      />
      <main className="app-main flex h-screen flex-col overflow-hidden">
        <TopBar onMenuOpen={() => setMobileNavigationOpen(true)} />
        <div id="app-scroll-region" className="flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
