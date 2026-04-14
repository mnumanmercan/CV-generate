import rateLimit from 'express-rate-limit'

// Uses the default in-memory store — correct for a single Railway dyno.
// If you scale to multiple dynos, swap to @upstash/ratelimit (native Upstash SDK).
// Token blacklisting (the security-critical part) still uses Upstash Redis via REST.

// Strict: auth brute-force protection
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict: password reset — prevent email enumeration
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many password reset requests. Please try again in 1 hour.' } },
  standardHeaders: true,
  legacyHeaders: false,
})

// Moderate: refresh tokens
export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many refresh requests.' } },
  standardHeaders: true,
  legacyHeaders: false,
})

// Write: auto-save fires frequently but is debounced on the client (500ms)
export const apiWriteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many save requests. Please slow down.' } },
  standardHeaders: true,
  legacyHeaders: false,
})

// Read: general API reads
export const apiReadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
  standardHeaders: true,
  legacyHeaders: false,
})

// Waitlist: anti-abuse
export const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Already registered. Please check your email.' } },
  standardHeaders: true,
  legacyHeaders: false,
})
