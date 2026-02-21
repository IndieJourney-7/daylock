/**
 * NotificationBell Component
 * Bell icon with unread count badge, opens notification dropdown
 */

import { useState, useRef, useEffect } from 'react'
import { useNotifications, useUnreadCount } from '../../hooks'
import { notificationsService } from '../../lib/notifications'

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { count, refetch: refetchCount } = useUnreadCount()
  const { notifications, markRead, markAllRead, loading } = useNotifications({ limit: 20 })
  const ref = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = () => {
    setOpen(prev => !prev)
  }

  const handleMarkRead = async (id) => {
    await markRead(id)
    refetchCount()
  }

  const handleMarkAll = async () => {
    await markAllRead()
    refetchCount()
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-charcoal-500/30 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-charcoal-600 border border-charcoal-400/30 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal-400/20">
            <h3 className="text-white font-semibold text-sm">Notifications</h3>
            {count > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-72">
            {loading && notifications.length === 0 && (
              <div className="text-center py-6">
                <div className="animate-spin w-5 h-5 border-2 border-gray-500 border-t-white rounded-full mx-auto" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No notifications yet
              </div>
            )}

            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
                className={`flex gap-3 px-4 py-3 border-b border-charcoal-400/10 cursor-pointer transition-colors ${
                  notif.read ? 'opacity-60' : 'hover:bg-charcoal-500/20'
                }`}
              >
                <span className="text-lg flex-shrink-0">
                  {notificationsService.getTypeIcon(notif.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium ${notif.read ? 'text-gray-400' : 'text-white'}`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="text-gray-500 text-[10px] mt-0.5 truncate">{notif.body}</p>
                  )}
                  <p className="text-gray-600 text-[10px] mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
