// Versión abierta para GitHub Pages: solo cliente, sin Worker ni D1.
// `pnpm run build:pages` → dist-pages/ (ver docs/GITHUB_PAGES.md).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "web"),
  base: "./",
  publicDir: path.resolve(__dirname, "public"),
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname) } },
  build: {
    outDir: path.resolve(__dirname, "dist-pages"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 2500,
  },
});
