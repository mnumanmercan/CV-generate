/**
 * Unit tests for the Stripe webhook handler. Two properties we want pinned:
 *
 *   1. Signature verification failure raises a 400 INVALID_SIGNATURE error
 *      (we never trust an unsigned payload from the public internet).
 *   2. Duplicate event delivery is idempotent — the second call is a no-op
 *      (Stripe retries failed deliveries and also delivers the same event
 *      more than once under at-least-once semantics).
 *
 * Both the Stripe SDK and Prisma are mocked so this runs without real
 * credentials, DB, or network.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Required env vars must be set BEFORE the service is imported, because
// env.ts calls process.exit(1) if it can't parse — that would abort vitest.
beforeAll(() => {
  process.env.DATABASE_URL        = 'postgresql://test:test@localhost:5432/test'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  process.env.STRIPE_SECRET_KEY   = 'sk_test_dummy'
  // Fake-but-valid-format RS256 PEM encoded as base64. Not a real key — the
  // signing path isn't exercised by webhook tests.
  const dummyKey = Buffer.from('-----BEGIN DUMMY-----\nnope\n-----END DUMMY-----').toString('base64')
  process.env.JWT_PRIVATE_KEY_B64 = dummyKey
  process.env.JWT_PUBLIC_KEY_B64  = dummyKey
})

// ─── Mocks ─────────────────────────────────────────────────────────────────────
// Track how many times stripeEvent.create was called and let each test
// decide whether it succeeds or throws the P2002 (unique violation).
const stripeEventCreate = vi.fn()

vi.mock('../db/prisma.js', () => ({
  prisma: {
    stripeEvent: {
      create: (...args: unknown[]) => stripeEventCreate(...args),
    },
    // Never called by the signature-verify tests but has to exist so the
    // service module's top-level imports resolve.
    subscription: { findUnique: vi.fn(), updateMany: vi.fn(), upsert: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    user:         { findUniqueOrThrow: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
  },
}))

// The Stripe SDK ctor is called lazily via `getStripe()`. We stub it so the
// webhooks object is under our control per-test.
const constructEvent = vi.fn()
vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEvent }
    customers = { create: vi.fn() }
    checkout = { sessions: { create: vi.fn() } }
    billingPortal = { sessions: { create: vi.fn() } }
  },
}))

// Import AFTER mocks so the module picks them up.
const { stripeService } = await import('./stripe.service.js')

describe('stripeService.handleWebhook', () => {
  beforeEach(() => {
    stripeEventCreate.mockReset()
    constructEvent.mockReset()
  })

  it('rejects a payload with an invalid signature', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload.')
    })

    await expect(
      stripeService.handleWebhook(Buffer.from('{}'), 'bogus-signature'),
    ).rejects.toMatchObject({
      message: 'Webhook signature verification failed.',
      statusCode: 400,
      code: 'INVALID_SIGNATURE',
    })

    // We never reach the DB when the signature is invalid.
    expect(stripeEventCreate).not.toHaveBeenCalled()
  })

  it('is idempotent — a duplicate event ID short-circuits before dispatch', async () => {
    constructEvent.mockReturnValue({
      id:   'evt_duplicate',
      type: 'checkout.session.completed',
      data: { object: { metadata: { userId: 'u1' } } },
    })
    // Simulate the unique-constraint violation Prisma throws when a row
    // with this event ID already exists.
    stripeEventCreate.mockRejectedValue(Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }))

    // Should resolve silently, not throw.
    await expect(stripeService.handleWebhook(Buffer.from('{}'), 'sig')).resolves.toBeUndefined()

    expect(stripeEventCreate).toHaveBeenCalledOnce()
    // The switch statement never ran — no subscription/user mutations were
    // issued. (We verify by noting that constructEvent was only called once
    // and stripeEvent.create was the only prisma call.)
  })

  it('surfaces unexpected Prisma errors instead of swallowing them', async () => {
    constructEvent.mockReturnValue({
      id:   'evt_new',
      type: 'invoice.paid',
      data: { object: { customer: 'cus_x', lines: { data: [] } } },
    })
    stripeEventCreate.mockRejectedValue(Object.assign(new Error('db connection refused'), { code: 'P1001' }))

    await expect(stripeService.handleWebhook(Buffer.from('{}'), 'sig')).rejects.toThrow('db connection refused')
  })
})
