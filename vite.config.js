import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No se necesita una configuración manual de chunks cuando se utilizan 
// importaciones dinámicas correctamente en el código de la aplicación.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5030,
    proxy: {
      '/api': {
        target: 'http://localhost:5040',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Error en proxy, intentando puerto alternativo...')
          })
        }
      }
    }
  },
  // Eliminamos la sección `build` personalizada para permitir que Vite
  // maneje la división de código automáticamente basándose en los `import()` dinámicos.
  build: {
    // Podemos mantener un límite de advertencia más alto si es útil, pero las opciones de rollup se van.
    chunkSizeWarningLimit: 1600, 
  }
})
