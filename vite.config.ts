import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Where the FastAPI backend is listening (Server/.env uses PORT=9999).
  const apiTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:9999';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      port: 5173,
      // Proxying keeps the browser on one origin in development, so CORS never
      // gets in the way. The backend still allows the Vite origins for direct
      // calls (e.g. from a native build or Postman).
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
