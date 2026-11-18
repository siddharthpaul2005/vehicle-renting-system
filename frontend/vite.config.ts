import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In dev, the React app talks to Spring Boot through this proxy (no CORS needed).
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
