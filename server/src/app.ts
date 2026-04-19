import express, { type Request } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { prisma } from './db/prisma.js'
import { redis } from './config/redis.js'
import { errorHandler } from './middleware/errorHandler.js'
import apiRoutes, { billingRoutes } from './routes/index.js'

export function createApp() {
  const app = express()

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(helmet())

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(cors({
    origin:      env.FRONTEND_URL,
    credentials: true, // allow HttpOnly cookies
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))

  // ── Cookie parser ─────────────────────────────────────────────────────────
  app.use(cookieParser())

  // ── JSON body parser ──────────────────────────────────────────────────────
  // `verify` callback captures the raw body for the Stripe webhook path ONLY,
  // so signature verification works while every other route still gets
  // parsed JSON via `req.body`. This is cleaner than the previous
  // `req.on('data')` approach which never fired once the JSON parser had
  // already consumed the stream.
  app.use(express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      // `verify` is typed with the raw Node IncomingMessage, but by the time
      // this runs Express has already attached its Request props. Cast to
      // the Express type so we can reach `originalUrl` (the unstripped path
      // that includes `/api/v1/billing/...`). We match either form so the
      // raw body is captured regardless of how the router mounts change.
      const er = req as Request
      if (er.url === '/webhooks/stripe' || er.originalUrl === '/api/v1/billing/webhooks/stripe') {
        er.rawBody = Buffer.from(buf)
      }
    },
  }))

  // ── Health checks ─────────────────────────────────────────────────────────
  // /health/live  — process is up (liveness probe, always 200)
  // /health/ready — dependencies reachable (readiness probe)
  // /health       — alias of /health/live, kept for backward compatibility
  app.get('/health/live', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.get('/health/ready', async (_req, res) => {
    const checks: Record<string, 'ok' | 'fail'> = {}
    let ok = true

    try {
      await prisma.$queryRaw`SELECT 1`
      checks.db = 'ok'
    } catch {
      checks.db = 'fail'
      ok = false
    }

    try {
      // Upstash `get` is a no-op in the stub — returns null but never throws.
      // A real Redis outage throws; that's what we want to surface here.
      await redis.get('health:ready')
      checks.redis = 'ok'
    } catch {
      checks.redis = 'fail'
      ok = false
    }

    res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', checks })
  })

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // ── API routes ────────────────────────────────────────────────────────────
  app.use('/api/v1',         apiRoutes)
  app.use('/api/v1/billing', billingRoutes)

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found.' } })
  })

  // ── Global error handler ──────────────────────────────────────────────────
  app.use(errorHandler)

  return app
}
