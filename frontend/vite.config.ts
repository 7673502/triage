import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      // Any browser call to /api/* will be proxied to the FastAPI service
      '/api': {
        target: 'http://fastapi:8000',
        changeOrigin: true,
      },
    },
  },
})
