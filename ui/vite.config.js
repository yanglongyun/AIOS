import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/ws': { target: 'ws://localhost:9700', ws: true },
      '/api': { target: 'http://localhost:9700' }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
