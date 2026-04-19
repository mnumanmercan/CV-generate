import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { apiReadLimiter } from '../middleware/rateLimiter.js'
import { createCheckout, createPortal, getBillingStatus, stripeWebhook } from '../controllers/billing.controller.js'

const router = Router()

// Stripe webhook — rawBody is captured by the `verify` callback on
// express.json() in app.ts for this specific path. No auth.
router.post('/webhooks/stripe', stripeWebhook)

// Authenticated billing routes
router.get('/status',    authenticate, apiReadLimiter, getBillingStatus)
router.post('/checkout', authenticate, createCheckout)
router.post('/portal',   authenticate, createPortal)

export default router
