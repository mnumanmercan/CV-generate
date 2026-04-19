import { env } from './env.js'

// Minimal interface — what authenticate, auth.service, and the rate-limit
// store use. Extended with `incr` + `expire` so we can back express-rate-limit
// with a shared Redis counter across processes.
export type RedisLike = {
  get(key: string):   Promise<string | null>
  set(key: string, value: string, opts?: { ex?: number }): Promise<unknown>
  incr(key: string):  Promise<number>
  expire(key: string, seconds: number): Promise<unknown>
  decr(key: string):  Promise<number>
  del(key: string):   Promise<unknown>
}

// Tracks whether the rate-limit warning has been logged. Separate from the
// blacklist warning so we don't double-log on process start.
const warnings = { limiter: false, blacklist: false }

// No-op stub used when Upstash vars are absent (local dev without Redis).
// Token blacklisting and distributed rate limiting fall back to per-process
// state — acceptable for local testing only.
const noOpRedis: RedisLike = {
  async get(_k)  {
    if (!warnings.blacklist) {
      console.warn('⚠️   Redis not configured — token blacklisting & distributed rate-limiting disabled (dev only)')
      warnings.blacklist = true
    }
    return null
  },
  async set()    { return undefined },
  async incr()   { return 0 },
  async expire() { return undefined },
  async decr()   { return 0 },
  async del()    { return undefined },
}

let _redis: RedisLike

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = await import('@upstash/redis')
  _redis = new Redis({
    url:   env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }) as unknown as RedisLike
} else {
  _redis = noOpRedis
}

export const redis = _redis

/** True when a real Redis backend is wired up. */
export const isRedisConfigured = _redis !== noOpRedis

if (!isRedisConfigured) {
  console.warn('⚠️   Rate limiter falling back to per-process memory store — do not run multiple dynos without Redis')
  warnings.limiter = true
}
