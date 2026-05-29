import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
  },

  server: {
     port: 5173,
     proxy: {
       '/trpc': 'http://localhost:3000'
     }
   }
});