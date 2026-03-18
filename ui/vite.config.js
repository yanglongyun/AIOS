import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/aios/ws': { target: 'ws://localhost:9700', ws: true },
      '/aios/api': { target: 'http://localhost:9700' },
      '/aios/apps': { target: 'http://localhost:9700' }
    }
  },
  build: {
    base: '/aios/',
    outDir: 'dist',
    emptyOutDir: true
  }
});
