import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';

// Read version from package.json
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
const appVersion = pkg.version;

function stripCrossorigin(): Plugin {
  return {
    name: 'strip-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/crossorigin\s*/g, '');
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    stripCrossorigin(),
  ],
  base: './',
  build: {
    outDir: 'dist/web',
    sourcemap: false, // Disable source maps to reduce memory
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevent code splitting overhead
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Memory optimization for Windows
    watch: {
      usePolling: true,      // Use polling instead of native events
      interval: 2000,        // Check every 2 seconds instead of default
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/*.log'
      ]
    },
    // Optimize middleware
    middlewareMode: false,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-redux',
      'framer-motion',
      'lucide-react',
      '@reduxjs/toolkit',
      '@tanstack/react-query',
      'axios',
      'date-fns',
      'react-router-dom'
    ],
    exclude: ['electron'],
    // Force re-optimization
    force: false,
  },
  // Memory optimization for esbuild
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  define: {
    // Make the version available in the app as __APP_VERSION__
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  // Cache directory (avoid permission issues on Windows)
  cacheDir: 'node_modules/.vite',
});