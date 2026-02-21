import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libs into separate cached chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-export': ['jspdf', 'html2canvas'],
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
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
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        // Increase limit so all JS chunks get precached (default 2MB too low)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ],
})
