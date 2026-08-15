import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'GameZoneKids.com',
        short_name: 'GameZoneKids',
        description: 'Fun, colorful browser games for kids!',
        theme_color: '#0f0f1a',
        background_color: '#0f0f1a',
        display: 'standalone',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      }
    })
  ],
  base: '/PlayZone-Kids/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-core'
            }
            if (id.includes('framer-motion')) {
              return 'motion'
            }
            if (id.includes('phaser')) {
              return 'phaser'
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-libs'
            }
            return 'vendor'
          }
        }
      }
    }
  }
})
