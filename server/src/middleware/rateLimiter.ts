import rateLimit, { type Options } from 'express-rate-limit'
import { UpstashRateLimitStore } from './rateLimitStore.js'
import { isRedisConfigured } from '../config/redis.js'

// When Upstash is configured, counters live in Redis and are shared across
// all dynos. Otherwise we fall through to express-rate-limit's built-in
// MemoryStore (per-process) — fine for local dev / single-dyno deploys.
function makeStore(prefix: string): Options['store'] | undefined {
  return isRedisConfigured ? new UpstashRateLimitStore(prefix) : undefined
}

// Strict: auth brute-force protection
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('auth'),
})

// Strict: password reset — prevent email enumeration
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many password reset requests. Please try again in 1 hour.' } },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('pwreset'),
})

// Moderate: refresh tokens
export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many refresh requests.' } },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('refresh'),
})

// Write: auto-save fires frequently but is debounced on the client (500ms)
export const apiWriteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many save requests. Please slow down.' } },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('write'),
})

// Read: general API reads
export const apiReadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('read'),
})

// Waitlist: anti-abuse
export const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Already registered. Please check your email.' } },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('waitlist'),
})
