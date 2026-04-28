/**
 * vitest setup file — runs BEFORE any test module imports.
 *
 * Why this exists: `server/src/config/env.ts` calls `process.exit(1)` when
 * required env vars are missing, and that parsing happens at module load
 * time. Any `beforeAll` hook in a test file runs after the import graph has
 * already resolved, so it's too late. Setting them here (referenced via
 * vitest.config.ts `setupFiles`) guarantees they're in place before env.ts
 * ever reads `process.env`.
 *
 * These are intentionally fake values — enough to satisfy zod's `min(1)`
 * checks. Tests that need specific values (e.g. STRIPE_WEBHOOK_SECRET) can
 * still override them, but the baseline must be here.
 */
process.env.NODE_ENV = 'test'

process.env.DATABASE_URL = process.env.DATABASE_URL
  ?? 'postgresql://test:test@localhost:5432/resumark_test'

// Dummy base64-encoded placeholder keys. The real JWT signer is mocked in
// tests that touch auth; this just has to parse past env.ts validation.
const dummyKey = Buffer.from(
  '-----BEGIN DUMMY-----\nnot-a-real-key\n-----END DUMMY-----',
).toString('base64')

process.env.JWT_PRIVATE_KEY_B64 = process.env.JWT_PRIVATE_KEY_B64 ?? dummyKey
process.env.JWT_PUBLIC_KEY_B64  = process.env.JWT_PUBLIC_KEY_B64  ?? dummyKey

// Stripe + email are optional — absence is legal in env.ts. Tests that
// need them mock directly via vi.mock('../config/env.js').
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test'
process.env.STRIPE_SECRET_KEY     = process.env.STRIPE_SECRET_KEY     ?? 'sk_test_dummy'
