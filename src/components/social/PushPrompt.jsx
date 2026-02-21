/**
 * PushPrompt Component
 * One-time prompt to enable push notifications
 */

import { useState, useEffect } from 'react'
import { notificationsService } from '../../lib/notifications'

function PushPrompt({ className = '' }) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Only show if push is supported and not yet subscribed
    async function check() {
      if (!notificationsService.isPushSupported()) return
      const permission = notificationsService.getPermissionStatus()
      if (permission === 'denied') return // Already denied, don't bother
      if (permission === 'granted') {
        const subscribed = await notificationsService.isPushSubscribed()
        if (subscribed) return // Already subscribed
      }
      // Check if user dismissed before
      const dismissed = localStorage.getItem('push_prompt_dismissed')
      if (dismissed) return
      setShow(true)
    }
    check()
  }, [])

  const handleEnable = async () => {
    setLoading(true)
    try {
      await notificationsService.subscribeToPush()
      setShow(false)
    } catch (err) {
      console.error('Push subscription failed:', err)
      // If permission denied, hide prompt
      if (notificationsService.getPermissionStatus() === 'denied') {
        setShow(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('push_prompt_dismissed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className={`rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🔔</span>
        <div className="flex-1">
          <h4 className="text-white font-semibold text-sm mb-1">Enable Push Notifications</h4>
          <p className="text-gray-400 text-xs mb-3">
            Get notified when rooms open, streaks are at risk, and achievements are earned.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              {loading ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-300 text-xs px-3 py-1.5 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PushPrompt
