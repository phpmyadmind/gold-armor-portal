import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5030,
    proxy: {
      '/api': {
        target: 'http://localhost:5040',
        changeOrigin: true,
        // Si el puerto 5000 no está disponible, usa 5001
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Error en proxy, intentando puerto alternativo...')
          })
        }
      }
    }
  }
})

