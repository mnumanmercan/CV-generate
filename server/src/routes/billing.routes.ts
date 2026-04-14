import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { captureRawBody } from '../middleware/stripeWebhook.js'
import { apiReadLimiter } from '../middleware/rateLimiter.js'
import { createCheckout, createPortal, getBillingStatus, stripeWebhook } from '../controllers/billing.controller.js'

const router = Router()

// Stripe webhook — raw body required, no auth
router.post('/webhooks/stripe', captureRawBody, stripeWebhook)

// Authenticated billing routes
router.get('/status',  authenticate, apiReadLimiter, getBillingStatus)
router.post('/checkout', authenticate, createCheckout)
router.post('/portal',   authenticate, createPortal)

export default router
