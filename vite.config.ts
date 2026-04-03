import { readFileSync } from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
) as { version: string };
const buildStamp = new Date().toISOString().slice(0, 16).replace("T", " ");

export default defineConfig({
  define: {
    __APP_BUILD_VERSION__: JSON.stringify(`v${packageJson.version}`),
    __APP_BUILD_STAMP__: JSON.stringify(`${buildStamp} UTC`),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  build: {
    outDir: "docs",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
