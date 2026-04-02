import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
var stdin_default = defineConfig({
  base: "/aios/",
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      "/aios/ws": { target: "ws://localhost:9500", ws: true },
      "/aios/api": { target: "http://localhost:9500" },
      "/aios/apps": { target: "http://localhost:9500" }
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
export {
  stdin_default as default
};
