import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ["appliance-staleness-implode.ngrok-free.dev", "localhost"],
    proxy: {
      '/api': 'http://localhost:3000',
      '/models': 'http://localhost:3000',
      '/peerjs': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  }
})
