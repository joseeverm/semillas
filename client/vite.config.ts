import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Semillas — Campamentos Juveniles",
        short_name: "Semillas",
        description:
          "App de repaso de mística, historia, simbología y técnicas de los Campamentos Juveniles de Colombia.",
        lang: "es",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#16a34a",
        background_color: "#f0fdf4",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Contenido estático + progreso en localStorage: cachear todo para uso offline.
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        navigateFallback: "index.html",
      },
    }),
  ],
});
