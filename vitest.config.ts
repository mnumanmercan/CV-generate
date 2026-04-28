import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * Frontend vitest config. Uses jsdom so Pinia stores and composables that
 * touch `window`/`document` run as they would in the browser. The server
 * workspace has its own vitest.config.ts (Node environment, no Vue plugin).
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals:     true,
    include:     ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
    // Excluding node_modules explicitly prevents accidentally picking up
    // dependency tests if any slip through the default ignore list.
    exclude:     ['node_modules', 'dist', 'server/**', 'packages/**'],
  },
})
