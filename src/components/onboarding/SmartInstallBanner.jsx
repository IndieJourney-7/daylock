/**
 * PWA Smart Install Banner
 * Shows a contextual, non-intrusive install prompt after the user
 * has visited 2+ times (not on first visit). Appears at the top of
 * the dashboard, dismissible for 7 days.
 */

import { useState, useEffect } from 'react'

const VISIT_KEY = 'daylock_visit_count'
const DISMISS_KEY = 'daylock_install_dismissed'

let deferredPrompt = null

// Capture the beforeinstallprompt event as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
  })
}

export default function SmartInstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Already installed?
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Track visit count
    const visits = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10) + 1
    localStorage.setItem(VISIT_KEY, String(visits))
    if (visits < 2) return // Don't show on first visit

    // Dismissed recently?
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const days = (Date.now() - new Date(dismissed).getTime()) / 86400000
      if (days < 7) return
    }

    // Show after a short delay (let user see the page first)
    const timer = setTimeout(() => setVisible(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setVisible(false)
      deferredPrompt = null
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString())
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 sm:p-4 flex items-center gap-3 animate-fade-in">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
        <img src="/Assets/daylock_logo.png" alt="" className="w-6 h-6 rounded" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">Install Daylock</p>
        <p className="text-gray-500 text-xs truncate">Get reminders & faster access</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="bg-accent hover:bg-accent-dark text-charcoal-900 text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Install
          </button>
        ) : (
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleDismiss() }}
            className="text-accent text-xs font-medium"
          >
            Add to Home
          </a>
        )}
        <button
          onClick={handleDismiss}
          className="text-gray-600 hover:text-gray-400 transition-colors p-1"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
