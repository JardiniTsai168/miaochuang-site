import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  // Relative production assets let the same build work both on the upstream
  // Worker root and behind the canonical lihi.io/tools/MeowSite/ proxy.
  base: process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/miaochuang-site/' : './'),
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 4173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
