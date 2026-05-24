import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/devops-expedition/',
  server: {
    allowedHosts: ['.ngrok-free.app']
  },
  preview: {
    allowedHosts: ['.ngrok-free.app']
  }
})
