import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePlan } from '../middleware/authorize.js'
import { apiReadLimiter, apiWriteLimiter } from '../middleware/rateLimiter.js'
import { getMe, updateMe, deleteMe, uploadAvatar, deleteAvatar } from '../controllers/user.controller.js'

const router = Router()

router.use(authenticate)

router.get('/me',          apiReadLimiter,  getMe)
router.patch('/me',        apiWriteLimiter, updateMe)
router.delete('/me',       deleteMe)
router.post('/me/avatar',  requirePlan('PRO'), uploadAvatar)
router.delete('/me/avatar', requirePlan('PRO'), deleteAvatar)

export default router
