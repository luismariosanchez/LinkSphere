import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  plugins: [react({ include: /\.(jsx|js)$/ })],
  esbuild: {
    loader: 'jsx',
    include: /src\/renderer\/.*\.[jt]sx?$/,
    exclude: [],
  },
  base: './',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@core': path.resolve(__dirname, 'src/core'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/renderer/index.html'),
        quickAdd: path.resolve(__dirname, 'src/renderer/quick-add.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
