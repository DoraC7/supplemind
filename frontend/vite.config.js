import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";

// Use local HTTPS certs when present (see scripts/generate-dev-cert.sh),
// otherwise fall back to plain HTTP for local development.
const certDir = new URL("./.cert", import.meta.url).pathname;
const hasCerts =
  fs.existsSync(`${certDir}/dev-key.pem`) && fs.existsSync(`${certDir}/dev-cert.pem`);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "SuppleMind",
        short_name: "SuppleMind",
        description: "你的健康與保養品庫存管家",
        theme_color: "#3b82f6",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Never let the service worker cache/serve stale API responses.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: {
        // Enable the service worker + install prompt while running `npm run dev`,
        // so it can be tested on Android before doing a production build.
        enabled: true,
        type: "module",
      },
    }),
  ],
  server: {
    host: true,
    https: hasCerts
      ? {
          key: fs.readFileSync(`${certDir}/dev-key.pem`),
          cert: fs.readFileSync(`${certDir}/dev-cert.pem`),
        }
      : undefined,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});