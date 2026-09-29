import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  server: { port: 3000 },
  // MapLibre v6 starts its tile worker from a sibling module via new URL(..., import.meta.url);
  // pre-bundling breaks that path, so serve it as-is.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  build: {
    rollupOptions: {
      input: {
        chooser: resolve(import.meta.dirname, 'index.html'),
        familiar: resolve(import.meta.dirname, 'familiar/index.html'),
        fresh: resolve(import.meta.dirname, 'fresh/index.html'),
        admin: resolve(import.meta.dirname, 'admin/index.html'),
        atelier: resolve(import.meta.dirname, 'atelier/index.html'),
        noir: resolve(import.meta.dirname, 'noir/index.html'),
        terra: resolve(import.meta.dirname, 'terra/index.html'),
      },
    },
  },
});
