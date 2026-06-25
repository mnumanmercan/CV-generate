/**
 * Regression test for the "stuck rate-limit counter" bug.
 *
 * INCR and EXPIRE are two separate, non-atomic Upstash REST calls. The previous
 * store only set the TTL when `totalHits === 1`, so if that single first-hit
 * EXPIRE was ever dropped (e.g. under a concurrent burst), the counter was left
 * pinned above the limit with no expiry (ttl = -1) and 429'd every request
 * forever. The fix issues EXPIRE … NX on EVERY increment — idempotent, never
 * extends an existing window, and re-arms a TTL that went missing so the key
 * self-heals within one window.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Options as RateLimitOptions } from 'express-rate-limit'

// In-memory fake modelling INCR + EXPIRE-NX semantics.
const store = new Map<string, { value: number; ttl: number }>()
const expireCalls: Array<{ key: string; seconds: number; mode?: string }> = []

vi.mock('../config/redis.js', () => ({
  redis: {
    async incr(key: string) {
      const entry = store.get(key) ?? { value: 0, ttl: -1 }
      entry.value += 1
      store.set(key, entry)
      return entry.value
    },
    async expire(key: string, seconds: number, mode?: string) {
      expireCalls.push({ key, seconds, mode })
      const entry = store.get(key)
      if (!entry) return 0
      // NX = set only when no TTL currently exists.
      if (mode === 'NX' && entry.ttl !== -1) return 0
      entry.ttl = seconds
      return 1
    },
  },
}))

import { UpstashRateLimitStore } from './rateLimitStore.js'

const opts = { windowMs: 60_000 } as unknown as RateLimitOptions

beforeEach(() => {
  store.clear()
  expireCalls.length = 0
})

describe('UpstashRateLimitStore.increment', () => {
  it('arms the TTL via EXPIRE … NX on every hit, not only the first', async () => {
    const s = new UpstashRateLimitStore('read')
    s.init(opts)

    await s.increment('1.2.3.4')
    await s.increment('1.2.3.4')

    expect(expireCalls).toHaveLength(2)
    expect(expireCalls.every((c) => c.mode === 'NX' && c.seconds === 60)).toBe(true)
    expect(store.get('rl:read:1.2.3.4')?.ttl).toBe(60)
  })

  it('self-heals a key that lost its TTL (the production bug: value high, ttl -1)', async () => {
    store.set('rl:read:::1', { value: 400, ttl: -1 }) // pinned, no expiry

    const s = new UpstashRateLimitStore('read')
    s.init(opts)
    await s.increment('::1')

    // The next request re-arms the window so the counter resets automatically.
    expect(store.get('rl:read:::1')?.ttl).toBe(60)
  })
})
