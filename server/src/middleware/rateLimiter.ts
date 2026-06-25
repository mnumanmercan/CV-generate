import rateLimit, { type Options } from 'express-rate-limit'
import type { Request } from 'express'
import { UpstashRateLimitStore } from './rateLimitStore.js'
import { isRedisConfigured } from '../config/redis.js'

// When Upstash is configured, counters live in Redis and are shared across
// all dynos. Otherwise we fall through to express-rate-limit's built-in
// MemoryStore (per-process) — fine for local dev / single-dyno deploys.
function makeStore(prefix: string): Options['store'] | undefined {
  return isRedisConfigured ? new UpstashRateLimitStore(prefix) : undefined
}

// Key authenticated traffic by user id, falling back to IP for guests.
//
// The default key generator buckets by IP. On the authenticated CV / cover-
// letter / user routes that's wrong on two counts: in dev the Vite proxy makes
// every request arrive from 127.0.0.1, so all tabs/users share ONE bucket; and
// in prod two users behind the same NAT/proxy share a bucket. Keying by
// `req.user.sub` gives each account its own budget. Unauthenticated routes
// (e.g. the public share view) have no user, so they keep per-IP keying —
// identical to the previous behaviour.
function userOrIpKey(req: Request): string {
  return req.user?.sub ?? req.ip ?? 'unknown'
}

// Strict: auth brute-force protection
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again in 15 minutes.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('auth'),
})

// Strict: password reset — prevent email enumeration
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many password reset requests. Please try again in 1 hour.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('pwreset'),
})

// Moderate: refresh tokens
export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many refresh requests.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('refresh'),
})

// Write: auto-save fires frequently but is debounced on the client (500ms)
export const apiWriteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: userOrIpKey,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many save requests. Please slow down.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('write'),
})

// Read: general API reads
export const apiReadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  keyGenerator: userOrIpKey,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('read'),
})

// Waitlist: anti-abuse
export const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Already registered. Please check your email.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('waitlist'),
})

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyGenerator: (req) => req.user?.sub || 'unknown',
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many AI requests. Please try again in a moment.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('ai'),
})
