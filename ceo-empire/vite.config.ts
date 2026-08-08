/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built app works from any subpath (e.g. GitHub Pages
  // project sites at /<repo>/) without hardcoding a path.
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'CEO Empire',
        short_name: 'CEO Empire',
        description: 'Build a business empire and become the richest CEO in the world.',
        theme_color: '#0a0e18',
        background_color: '#05070d',
        display: 'standalone',
        start_url: '.',
        scope: './',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // HashRouter means the app only ever has one real navigable document
        // (index.html) — every route lives in the URL fragment — so precaching
        // the shell + built assets is enough for full offline support.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: 'index.html',
        // This service worker's scope covers the whole Pages site root, which
        // also hosts unrelated apps in sibling directories (e.g.
        // /halftime-snack-preorder/, /velocity-rush/, /focusflow/, /time-rift/).
        // Without this, navigations into those directories get wrongly
        // redirected to this SPA's cached shell instead of reaching the real app.
        navigateFallbackDenylist: [/\/halftime-snack-preorder\//, /\/velocity-rush\//, /\/focusflow\//, /\/time-rift\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split large, independently-cacheable vendor libraries out of the main
        // chunk so the browser can fetch them in parallel and cache them across
        // deploys that don't touch these dependencies.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
            return 'firebase-firestore';
          }
          if (id.includes('firebase')) return 'firebase-auth';
          if (id.includes('framer-motion')) return 'framer-motion';
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
            return 'charts';
          }
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'react-vendor';
          }
          if (id.includes('react-router')) return 'router';
          if (id.includes('lucide-react')) return 'icons';
          return 'vendor';
        },
      },
    },
  },
  test: {
    // Pure logic tests (.test.ts) default to node; component tests (.test.tsx)
    // opt into jsdom individually via a `// @vitest-environment jsdom` pragma.
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
})
