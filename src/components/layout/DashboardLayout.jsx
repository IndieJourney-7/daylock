/**
 * Dashboard Layout Component
 * Wraps all dashboard pages with navigation
 * Desktop: Sidebar left
 * Mobile: Header top + Bottom nav
 */

import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import { useReminderScheduler } from '../../hooks'
import { pushManager } from '../../lib/pushManager'

function DashboardLayout() {
  const navigate = useNavigate()

  // Start background reminder scheduler (client-side, for when app is open)
  useReminderScheduler()

  // Auto-subscribe to Web Push if permission already granted
  // This ensures push subscription is registered/refreshed on every app load
  useEffect(() => {
    async function autoSubscribe() {
      if (!pushManager.isSupported()) return
      if (Notification.permission !== 'granted') return

      const isAlready = await pushManager.isSubscribed()
      if (!isAlready) {
        await pushManager.subscribe()
      }
    }
    autoSubscribe()
  }, [])

  // Listen for notification clicks from the service worker
  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.url) {
        navigate(event.data.url)
      }
    }
    navigator.serviceWorker?.addEventListener('message', handleMessage)
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [navigate])

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
