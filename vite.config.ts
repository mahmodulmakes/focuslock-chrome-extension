import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json" with { type: "json" };

export default defineConfig({
  plugins: [preact(), crx({ manifest: manifest as any })],
  resolve: {
    alias: {
      "@core": "/src/core",
      "@features": "/src/features",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        options: "src/options/index.html",
        popup: "src/popup/index.html",
        blocked: "src/blocked/index.html",
      },
    },
  },
});
