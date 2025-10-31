import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expose to network for mobile testing
    port: 5173
  },
  optimizeDeps: {
    include: ['rc-slider']
  }
})
