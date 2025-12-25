import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read version from package.json
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
const appVersion = pkg.version;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: './',
  build: {
    outDir: 'dist/web',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  define: {
    // Make the version available in the app as __APP_VERSION__
    __APP_VERSION__: JSON.stringify(appVersion),
  },
});
