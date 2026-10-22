import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Backend usado pelo proxy do servidor de desenvolvimento.
  const backend = env.VITE_DEV_BACKEND || 'http://127.0.0.1:8000'

  const proxyTarget = { target: backend, changeOrigin: true, ws: true }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': proxyTarget,
        '/ws': proxyTarget,
        '/static': { target: backend, changeOrigin: true },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
          },
        },
      },
    },
  }
})
