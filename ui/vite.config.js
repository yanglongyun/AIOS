import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainPort = process.env.AIOS_MAIN_PORT || process.env.AGENT_PORT || "9502";
const mainHttp = `http://localhost:${mainPort}`;
const mainWs = `ws://localhost:${mainPort}`;

export default defineConfig({
  base: "/",
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  },
  server: {
    // dev 模式允许任意 Host (ngrok / 局域网 IP / 自定义域名等都能直连).
    // 本地运行态没有 cookie/token 鉴权层.
    allowedHosts: true,
    proxy: {
      "/ws": { target: mainWs, ws: true },
      "/api": { target: mainHttp },
      "/apps": { target: mainHttp }
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
