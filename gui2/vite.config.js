import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// gui2 dev server. 把 /api /apps /ws 反向代理到本机 9501 (主服务).
// 9501 已经会按需把 /apps/* 转发到 9502,所以这里只配 9501 一个目标即可.
export default defineConfig({
  base: '/',
  plugins: [vue()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
    proxy: {
      '/ws':   { target: 'ws://localhost:9501', ws: true },
      '/api':  { target: 'http://localhost:9501' },
      '/apps': { target: 'http://localhost:9501' }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
