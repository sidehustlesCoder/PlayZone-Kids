import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/PlayZone-Kids/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
