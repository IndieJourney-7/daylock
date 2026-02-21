import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Assets/daylock_logo.png', 'robots.txt'],
      manifest: {
        name: 'Daylock',
        short_name: 'Daylock',
        description: 'Your Day. Locked. One Room at a Time.',
        theme_color: '#0f0f0f',
        background_color: '#0f0f0f',
        display: 'standalone',
        start_url: '/dashboard',
        scope: '/',
        categories: ['productivity', 'lifestyle'],
        icons: [
          {
            src: 'Assets/daylock_logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'Assets/daylock_logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'Assets/daylock_logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            url: '/dashboard',
            icons: [{ src: 'Assets/daylock_logo.png', sizes: '192x192' }]
          },
          {
            name: 'Leaderboard',
            url: '/leaderboard',
            icons: [{ src: 'Assets/daylock_logo.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        // Precache all generated assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache API responses with network-first strategy
            urlPattern: /\/api\/(profile|rooms|achievements|leaderboard)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxAgeSeconds: 300, // 5 minutes
                maxEntries: 50
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                maxEntries: 100
              }
            }
          },
          {
            // Cache fonts
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                maxEntries: 20
              }
            }
          }
        ],
        // Fallback when offline
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ],
})
