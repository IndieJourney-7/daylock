/**
 * InstallPrompt Component
 * PWA install prompt - shows when app is installable
 */

import { useState, useEffect } from 'react'

let deferredPrompt = null

// Capture the beforeinstallprompt event globally
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
  })
}

function InstallPrompt({ className = '' }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Check if dismissed recently
    const dismissed = localStorage.getItem('install_prompt_dismissed')
    if (dismissed) {
      const dismissedAt = new Date(dismissed)
      const daysSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) return // Don't show for 7 days after dismiss
    }

    // Show if we have a deferred prompt or after a delay
    const timer = setTimeout(() => {
      if (deferredPrompt || !window.matchMedia('(display-mode: standalone)').matches) {
        setShow(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShow(false)
      }
      deferredPrompt = null
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('install_prompt_dismissed', new Date().toISOString())
    setShow(false)
  }

  if (!show) return null

  return (
    <div className={`rounded-xl border border-green-500/20 bg-green-500/5 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">📱</span>
        <div className="flex-1">
          <h4 className="text-white font-semibold text-sm mb-1">Install Daylock</h4>
          <p className="text-gray-400 text-xs mb-3">
            Install for quick access, offline support, and a native app experience.
          </p>
          <div className="flex gap-2">
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                Install App
              </button>
            ) : (
              <p className="text-gray-500 text-xs">
                Open in your browser menu → "Add to Home Screen"
              </p>
            )}
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-300 text-xs px-3 py-1.5 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt
