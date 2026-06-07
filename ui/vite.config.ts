import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    headers: {
      "Cache-Control": "no-store",
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:9502",
        ws: true,
      },
      "/ws": {
        target: "http://127.0.0.1:9502",
        ws: true,
      },
      "/apps": "http://127.0.0.1:9503",
      "/health": "http://127.0.0.1:9502",
    },
  },
});
