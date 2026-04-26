import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "RxReader",
        short_name: "RxReader",
        description: "AI Prescription Reader",
        theme_color: "#0ea5e9",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        // Do not precache ONNX Runtime WASM files.
        // They are too large and should load only when needed.
        globIgnores: ["**/ort/**"],

        // Optional: allows normal assets up to 5MB.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],

  assetsInclude: ["**/*.wasm"],

  optimizeDeps: {
    exclude: ["onnxruntime-web"],
  },
});