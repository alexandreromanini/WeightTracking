/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const YEAR = 60 * 60 * 24 * 365

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // « prompt » plutôt que « autoUpdate » : un rechargement automatique
      // effacerait une séance en cours de saisie.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Barre · tes charges, séance après séance',
        short_name: 'Barre',
        description:
          'Suivi de progression en musculation, exercice par exercice.',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b1238',
        theme_color: '#0b1238',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Tout le build est préchargé, y compris l'écran Progression chargé à la demande.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: YEAR },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Photos d'exercices (le catalogue JSON, lui, est déjà dans IndexedDB).
            urlPattern: ({ url }) =>
              url.origin === 'https://raw.githubusercontent.com' &&
              /\/exercises\/.+\.(jpg|png)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-images',
              expiration: { maxEntries: 300, maxAgeSeconds: YEAR / 4 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
