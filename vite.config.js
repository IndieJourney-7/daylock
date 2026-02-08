import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Assets/daylock_logo.png'],
      manifest: {
        name: 'Daylock',
        short_name: 'Daylock',
        description: 'Your Day. Locked. One Room at a Time.',
        theme_color: '#0f0f0f',
        background_color: '#0f0f0f',
        display: 'standalone',
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
        ]
      }
    })
  ],
})
