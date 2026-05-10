import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(__dirname, "package.json"), "utf-8")) as { version: string };

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, __dirname, "");
  const apiProxyTarget =
    fileEnv.PRICE_MONITOR_API_PROXY ||
    process.env.PRICE_MONITOR_API_PROXY ||
    "http://127.0.0.1:8017";
  const apiProxy = {
    "/api": { target: apiProxyTarget, changeOrigin: true },
  };

  return {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      react(),
      {
        name: "price-monitor-log-api-proxy",
        configureServer(server) {
          server.httpServer?.once("listening", () => {
            console.log(`[price-monitor] Vite proxy: /api -> ${apiProxyTarget}`);
          });
        },
      },
    ],
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: apiProxy,
    },
    preview: {
      proxy: apiProxy,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
