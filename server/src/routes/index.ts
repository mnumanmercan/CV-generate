import { Router } from 'express'
import authRoutes from './auth.routes.js'
import cvRoutes from './cv.routes.js'
import coverLetterRoutes from './coverLetter.routes.js'
import userRoutes from './user.routes.js'
import billingRoutes from './billing.routes.js'
import waitlistRoutes from './waitlist.routes.js'

const router = Router()

router.use('/auth',          authRoutes)
router.use('/cv',            cvRoutes)
router.use('/cover-letter',  coverLetterRoutes)
router.use('/user',          userRoutes)
router.use('/waitlist',      waitlistRoutes)

// Billing routes are mounted at /api/v1 — the webhook is at /api/v1/webhooks/stripe
// and billing routes at /api/v1/billing/*
export { billingRoutes }
export default router
