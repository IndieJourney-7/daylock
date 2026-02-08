/**
 * Admin Layout Component
 * Separate layout for admin panel
 * Similar structure to user dashboard but with admin branding
 */

import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Icon } from '../ui'

// Admin navigation items
const ADMIN_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin', icon: 'home' },
  { id: 'rooms', label: 'My Rooms', path: '/admin/rooms', icon: 'rooms' },
  { id: 'settings', label: 'Settings', path: '/admin/settings', icon: 'settings' },
]

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-charcoal-900">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-charcoal-800 border-b border-charcoal-400/10">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-charcoal-500/50 rounded-lg transition-colors"
          >
            <Icon name="menu" className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <span className="text-accent text-sm font-bold">A</span>
            </div>
            <span className="text-white font-semibold text-sm">Admin Panel</span>
          </div>
          
          <button 
            onClick={() => navigate('/admin/settings')}
            className="p-2 hover:bg-charcoal-500/50 rounded-lg transition-colors"
          >
            <Icon name="settings" className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-charcoal-800 border-r border-charcoal-400/10 flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-charcoal-400/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <span className="text-accent text-lg font-bold">A</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg">Daylock</span>
              <p className="text-gray-500 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-accent/20 text-accent' 
                      : 'text-gray-400 hover:bg-charcoal-500/50 hover:text-white'
                    }
                  `}
                >
                  <Icon name={item.icon} className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-charcoal-400/10">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-charcoal-500/50 hover:text-white transition-all w-full"
          >
            <Icon name="chevronLeft" className="w-5 h-5" />
            <span className="font-medium">Back to App</span>
          </button>
        </div>
      </aside>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      <aside className={`
        md:hidden fixed left-0 top-0 bottom-0 w-64 bg-charcoal-800 border-r border-charcoal-400/10 z-50
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-charcoal-400/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <span className="text-accent text-lg font-bold">A</span>
            </div>
            <span className="text-white font-bold text-lg">Admin</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-charcoal-500/50 rounded-lg"
          >
            <Icon name="close" className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-accent/20 text-accent' 
                      : 'text-gray-400 hover:bg-charcoal-500/50 hover:text-white'
                    }
                  `}
                >
                  <Icon name={item.icon} className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Back to app */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-charcoal-400/10">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-charcoal-500/50 hover:text-white transition-all w-full"
          >
            <Icon name="chevronLeft" className="w-5 h-5" />
            <span className="font-medium">Back to App</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="md:ml-64 pt-14 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
