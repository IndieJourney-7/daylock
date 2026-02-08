/**
 * Dashboard Layout Component
 * Wraps all dashboard pages with navigation
 * Desktop: Sidebar left
 * Mobile: Header top + Bottom nav
 */

import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-charcoal-900">
      <div className="flex">
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <Header />
          
          {/* Page content */}
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  )
}

export default DashboardLayout
