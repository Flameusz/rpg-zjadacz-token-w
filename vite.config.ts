import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: true,
    // Honour PORT when the launcher assigns one (5173 may already be taken).
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  build: {
    target: "es2020",
    // Bundle output goes to dist/bundle so it can't collide with the art +
    // maps copied verbatim from public/assets/ into dist/assets/.
    assetsDir: "bundle",
    // Phaser is large; keep it in its own chunk for clarity.
    chunkSizeWarningLimit: 1500,
  },
});
