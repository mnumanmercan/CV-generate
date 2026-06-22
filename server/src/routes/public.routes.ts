import { Router } from 'express'
import { apiReadLimiter } from '../middleware/rateLimiter.js'
import { getPublicCV } from '../controllers/cv.controller.js'

// Unauthenticated routes. Mounted at /api/v1/public — NOT under the /cv router,
// which applies `authenticate` to every request.
const router = Router()

router.get('/cv/:slug', apiReadLimiter, getPublicCV)

export default router
