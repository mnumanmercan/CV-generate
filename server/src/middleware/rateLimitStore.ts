import type { Store, IncrementResponse, Options as RateLimitOptions } from 'express-rate-limit'
import { redis } from '../config/redis.js'

/**
 * express-rate-limit Store implementation backed by Upstash Redis.
 *
 * Why we need this: the default in-memory store resets when the process
 * restarts and is not shared across processes. The moment we scale beyond
 * one dyno (or do blue-green deploys), an attacker can cycle through
 * instances and bypass limits.
 *
 * We use the same Upstash REST wrapper that powers the JWT blacklist — no
 * additional infrastructure, and the no-op stub in dev transparently
 * degrades to an in-memory counter via express-rate-limit's MemoryStore
 * (we select at construction time based on `isRedisConfigured`).
 *
 * Key layout: `rl:<prefix>:<clientId>` — prefix distinguishes limiters
 * (auth, write, read, …) so a spike on one does not leak into another.
 */
export class UpstashRateLimitStore implements Store {
  /** express-rate-limit calls `init` with the owning limiter's config. */
  windowMs!: number
  prefix: string

  constructor(prefix: string) {
    this.prefix = prefix
  }

  init(options: RateLimitOptions): void {
    this.windowMs = options.windowMs
  }

  private key(id: string): string {
    return `rl:${this.prefix}:${id}`
  }

  async increment(id: string): Promise<IncrementResponse> {
    const key = this.key(id)
    const totalHits = await redis.incr(key)

    // First hit in the window — apply TTL so the key expires and the
    // counter resets automatically.
    if (totalHits === 1) {
      await redis.expire(key, Math.ceil(this.windowMs / 1000))
    }

    // resetTime is advisory — used to set the Retry-After header. Without
    // a TTL roundtrip this is an approximation, which is fine for 429 UX.
    const resetTime = new Date(Date.now() + this.windowMs)
    return { totalHits, resetTime }
  }

  async decrement(id: string): Promise<void> {
    await redis.decr(this.key(id))
  }

  async resetKey(id: string): Promise<void> {
    await redis.del(this.key(id))
  }
}
