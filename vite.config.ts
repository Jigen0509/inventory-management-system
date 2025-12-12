import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/yahoo-proxy': {
        target: 'https://shopping.yahooapis.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yahoo-proxy/, ''),
      },
    },
  },
});