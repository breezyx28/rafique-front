import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync, existsSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-files-to-dist',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist')
        const copies: [string, string][] = [
          ['.env.production', '.env'],
          ['.htaccess', '.htaccess'],
        ]
        for (const [srcName, destName] of copies) {
          const src = path.resolve(__dirname, srcName)
          const dest = path.join(distDir, destName)
          if (existsSync(src)) {
            copyFileSync(src, dest)
          }
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
