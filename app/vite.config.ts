import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {},
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-tds': ['@toss/tds-mobile', '@emotion/react', '@emotion/styled'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
})
