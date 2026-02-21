/**
 * Daylock Custom Service Worker
 * 
 * This file is used as the source for vite-plugin-pwa's injectManifest strategy.
 * Workbox will inject its precache manifest and runtime caching into this file.
 * 
 * CUSTOM: Handles Web Push events so notifications arrive even when the PWA is closed.
 */

import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

// ============================================================
// WORKBOX: Precaching (injected by vite-plugin-pwa)
// ============================================================
precacheAndRoute(self.__WB_MANIFEST)

// ============================================================
// WORKBOX: Runtime caching strategies
// ============================================================

// API responses: network-first with 5s timeout
registerRoute(
  ({ url }) => url.pathname.match(/\/api\/(profile|rooms|achievements|leaderboard)/),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 300,
        maxEntries: 50
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ],
    networkTimeoutSeconds: 5
  })
)

// Images: cache-first
registerRoute(
  ({ url }) => url.pathname.match(/\.(?:png|jpg|jpeg|svg|gif|webp)$/),
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30,
        maxEntries: 100
      })
    ]
  })
)

// Fonts: cache-first
registerRoute(
  ({ url }) => url.pathname.match(/\.(?:woff|woff2|ttf|otf)$/),
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 20
      })
    ]
  })
)

// ============================================================
// WEB PUSH: Handle push events (works even when PWA is closed!)
// ============================================================

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    // Fallback: treat as plain text
    payload = {
      title: 'Daylock',
      body: event.data.text(),
      icon: '/Assets/daylock_logo.png'
    }
  }

  const { title, body, data, tag, icon, badge } = payload

  const options = {
    body: body || '',
    icon: icon || '/Assets/daylock_logo.png',
    badge: badge || '/favicon.svg',
    tag: tag || 'daylock-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: data || {},
    actions: [
      {
        action: 'open',
        title: 'Open Room'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(title || 'Daylock', options)
  )
})

// ============================================================
// NOTIFICATION CLICK: Open the app / navigate to the room
// ============================================================

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  // Determine URL to open
  const data = event.notification.data || {}
  const targetUrl = data.url || '/dashboard'

  event.waitUntil(
    // Try to focus an existing window, or open a new one
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's already a Daylock tab open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: targetUrl
          })
          return
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl)
    })
  )
})

// ============================================================
// NAVIGATION FALLBACK: SPA support
// ============================================================

// Handle navigation requests — serve index.html for SPA routing
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        return cached || fetch(event.request)
      })
    )
  }
})
