import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: { alias: { '@': path.resolve(__dirname, './src') } },

  // ── Build output ────────────────────────────────────────────────────────────
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui:     ['framer-motion', 'lucide-react'],
          query:  ['@tanstack/react-query'],
          charts: ['recharts'],
        },
      },
    },
  },

  // ── Dev server proxy ─────────────────────────────────────────────────────────
  // All API calls use /api prefix → proxy strips /api and forwards to backend
  // This matches both Docker (nginx) and Render (VITE_API_URL) behaviour
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:      'http://localhost:3001',
        changeOrigin: true,
        rewrite:     (path) => path.replace(/^\/api/, ''),
      },
      '/socket.io': {
        target:       'http://localhost:3001',
        changeOrigin: true,
        ws:           true,
      },
    },
  },
});
