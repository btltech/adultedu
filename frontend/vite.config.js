import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const curriculumCacheVersion = process.env.VITE_CURRICULUM_CACHE_VERSION
  || process.env.CF_PAGES_COMMIT_SHA?.slice(0, 12)
  || 'schema-v1'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: null,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: false, // Use public/manifest.json
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        runtimeCaching: [
          {
            // Public curriculum may be reused during a temporary outage. The
            // pattern deliberately excludes auth, progress and every personal
            // endpoint so account data can never enter a shared runtime cache.
            urlPattern: /\/api\/v1\/(?:tracks(?:\/[^/?]+)?|topics\/[^/?]+|lessons\/[^/?]+)(?:\?.*)?$/,
            handler: 'NetworkFirst',
            options: {
              // A Pages commit automatically creates a fresh cache. Outside
              // Pages, bump VITE_CURRICULUM_CACHE_VERSION whenever the public
              // curriculum response shape or content contract changes.
              cacheName: `public-learning-content-${curriculumCacheVersion}`,
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            // Personal and mutating API requests are never cached.
            urlPattern: /\/api\//,
            handler: 'NetworkOnly'
          },
          {
            // Cache images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      // Set DEV_API_PROXY to run the dev server against a deployed backend
      // (the API only allows CORS from the production origin, so requests must
      // go through this proxy rather than straight from the browser).
      '/api': {
        target: process.env.DEV_API_PROXY || 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          admin: ['recharts'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          motion: ['framer-motion'],
          ui: ['lucide-react', 'react-hot-toast', 'canvas-confetti'],
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  }
})
