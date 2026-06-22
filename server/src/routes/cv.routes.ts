import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePlan } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { apiReadLimiter, apiWriteLimiter } from '../middleware/rateLimiter.js'
import { CreateCVSchema, UpdateCVSchema, PatchCVSchema } from '@resumark/shared'
import {
  listCVs,
  createCV,
  getCV,
  updateCV,
  patchCV,
  deleteCV,
  getShareStatusCV,
  shareCV,
  regenerateShareCV,
  unshareCV,
} from '../controllers/cv.controller.js'

const router = Router()

// All CV routes require authentication
router.use(authenticate)

router.get('/', apiReadLimiter, listCVs)
router.post('/', apiWriteLimiter, validate(CreateCVSchema), createCV)
router.get('/:id', apiReadLimiter, getCV)
router.put('/:id', apiWriteLimiter, validate(UpdateCVSchema), updateCV)
router.patch('/:id', apiWriteLimiter, validate(PatchCVSchema), patchCV)
router.delete('/:id', apiWriteLimiter, deleteCV)

// Public share-link management. Reading current state is free; creating or
// regenerating a link is Pro-only (turning a link off is always allowed so a
// downgraded user can still revoke).
router.get('/:id/share', apiReadLimiter, getShareStatusCV)
router.post('/:id/share', apiWriteLimiter, requirePlan('PRO'), shareCV)
router.post('/:id/share/regenerate', apiWriteLimiter, requirePlan('PRO'), regenerateShareCV)
router.delete('/:id/share', apiWriteLimiter, unshareCV)

export default router
