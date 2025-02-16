import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true, // This enables all network interfaces
    port: 5173,
    strictPort: true, // This ensures Vite only uses the specified port
    watch: {
      usePolling: true // This is useful for Docker environments
    }
  },
  plugins: [react()],
})
