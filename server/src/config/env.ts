import { z } from 'zod'

// Coerce empty string → undefined so optional vars can be left blank in .env
const opt   = (schema: z.ZodString) => z.preprocess(v => v === '' ? undefined : v, schema.optional())
const optUrl = z.preprocess(v => v === '' ? undefined : v, z.string().url().optional())

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT:     z.coerce.number().default(3000),

  // ── Required in all environments ──────────────────────────────────────────
  DATABASE_URL:        z.string().min(1),
  JWT_PRIVATE_KEY_B64: z.string().min(1),
  JWT_PUBLIC_KEY_B64:  z.string().min(1),

  // ── Optional in development; required in production ────────────────────────
  // Redis / Upstash — token blacklisting (skipped when absent in dev)
  UPSTASH_REDIS_REST_URL:   optUrl,
  UPSTASH_REDIS_REST_TOKEN: opt(z.string().min(1)),

  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Stripe — billing endpoints will return 503 when absent
  STRIPE_SECRET_KEY:           opt(z.string().min(1)),
  STRIPE_WEBHOOK_SECRET:       opt(z.string().min(1)),
  STRIPE_PRICE_ID_PRO_MONTHLY: opt(z.string().min(1)),
  STRIPE_PRICE_ID_PRO_ANNUAL:  opt(z.string().min(1)),

  // Email (Resend) — password reset / verify-email will return 503 when absent
  RESEND_API_KEY: opt(z.string().min(1)),
  EMAIL_FROM:     z.string().min(1).default('Resumark <noreply@resumark.app>'),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌  Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
