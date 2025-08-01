import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, '../src/renderer'),
  base: './',
  build: {
    outDir: resolve(__dirname, '../dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, '../src/renderer/index.html'),
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@/renderer': resolve(__dirname, '../src/renderer'),
      '@/shared': resolve(__dirname, '../src/shared'),
    },
  },
  server: {
    port: 3001,
    host: 'localhost'
  },
  optimizeDeps: {
    exclude: ['electron'],
  },
});