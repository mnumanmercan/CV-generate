import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // Dev proxy — forward /api/* to the local backend so the frontend can use
  // same-origin URLs during development. Saves having to set VITE_API_URL
  // and avoids CORS friction when testing cookie-based flows.
  server: {
    proxy: {
      '/api': {
        target:       'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Chunk strategy: split the long-lived vendor dependencies from app code
    // so they can cache independently across deploys. html2pdf.js is
    // dynamically imported from usePDFExport and must NOT appear here — that
    // would re-eagerize it and undo the lazy-load.
    //
    // We use the function form of manualChunks because Vite 8 / Rollup 4's
    // object form has narrower types that vue-tsc trips over.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](vue|vue-router|pinia)[\\/]/.test(id)) return 'vue-core'
            if (id.includes('@vueuse'))                                        return 'vueuse'
            if (id.includes('vue-draggable-plus'))                             return 'drag'
          }
          return undefined
        },
      },
    },
    // Keep the warning threshold honest — the main bundle should stay lean
    // once html2pdf and the vendor bundle are separated.
    chunkSizeWarningLimit: 600,
  },
})
