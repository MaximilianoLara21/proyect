import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Durante el desarrollo, pedimos los datos e imágenes al servidor del proyecto.
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/assets': 'http://localhost:3000',
    },
  },
  // En la vista previa, Vite sirve la página y el servidor aporta datos e imágenes.
  preview: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/assets/img': 'http://localhost:3000',
    },
  },
})
