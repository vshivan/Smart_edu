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
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:    ['react', 'react-dom', 'react-router-dom'],
          ui:        ['framer-motion', 'lucide-react'],
          query:     ['@tanstack/react-query'],
          charts:    ['recharts'],
        },
      },
    },
  },

  // ── Dev server (local only — Vercel/Render don't use this) ──────────────────
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target:       'http://localhost:3001',
        changeOrigin: true,
        rewrite:      (p) => p.replace(/^\/api/, ''),
      },
      '/socket.io': {
        target:       'http://localhost:3001',
        ws:           true,
        changeOrigin: true,
      },
    },
  },
});
