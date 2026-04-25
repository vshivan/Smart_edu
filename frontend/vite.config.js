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
    port: 5173,
    proxy: {
      '/auth':          { target: 'http://localhost:3000', changeOrigin: true },
      '/courses':       { target: 'http://localhost:3000', changeOrigin: true },
      '/ai':            { target: 'http://localhost:3000', changeOrigin: true },
      '/quizzes':       { target: 'http://localhost:3000', changeOrigin: true },
      '/gamification':  { target: 'http://localhost:3000', changeOrigin: true },
      '/tutors':        { target: 'http://localhost:3000', changeOrigin: true },
      '/payments':      { target: 'http://localhost:3000', changeOrigin: true },
      '/notifications': { target: 'http://localhost:3000', changeOrigin: true },
      '/admin':         { target: 'http://localhost:3000', changeOrigin: true },
      '/health':        { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io':     { target: 'http://localhost:3000', changeOrigin: true, ws: true },
    },
  },
});
