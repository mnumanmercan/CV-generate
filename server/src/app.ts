import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
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

  // ── Stripe webhook — raw body MUST come before express.json() ─────────────
  // The captureRawBody middleware in billing.routes.ts handles its own body parsing.
  // We skip express.json() for the webhook path.
  app.use('/api/v1/webhooks/stripe', (req, res, next) => {
    // Pass through without json parsing — captureRawBody handles it
    next()
  })

  // ── JSON body parser ──────────────────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }))

  // ── Health check ─────────────────────────────────────────────────────────
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
