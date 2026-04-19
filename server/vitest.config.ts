import { defineConfig } from 'vitest/config'

/**
 * Server-side vitest config. Node environment (not jsdom) because the server
 * code never touches `window` / `document`. Tests should be pure-logic or
 * supertest-driven HTTP assertions — integration tests that need a DB should
 * point DATABASE_URL at a throwaway schema.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals:     true,
    include:     ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // The setup file populates required process.env values so env.ts parses
    // cleanly when test modules import it transitively. See tests/setup.ts
    // for the rationale.
    setupFiles:  ['./tests/setup.ts'],
    testTimeout: 10_000,
  },
})
