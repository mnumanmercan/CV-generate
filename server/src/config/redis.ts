import { env } from './env.js'

// Minimal interface — only what authenticate + auth.service use
export type RedisLike = {
  get(key: string): Promise<string | null>
  set(key: string, value: string, opts?: { ex?: number }): Promise<unknown>
}

// No-op stub used when Upstash vars are absent (local dev without Redis).
// Token blacklisting is skipped — acceptable for local testing only.
const noOpRedis: RedisLike = (() => {
  let warned = false
  const warn = () => {
    if (!warned) {
      console.warn('⚠️   Redis not configured — token blacklisting disabled (dev only)')
      warned = true
    }
  }
  return {
    async get()  { warn(); return null },
    async set()  { warn() },
  }
})()

let _redis: RedisLike

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = await import('@upstash/redis')
  _redis = new Redis({
    url:   env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  })
} else {
  _redis = noOpRedis
}

export const redis = _redis
