import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
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
} from '../controllers/cv.controller.js'

const router = Router()

// All CV routes require authentication
router.use(authenticate)

router.get('/',       apiReadLimiter,  listCVs)
router.post('/',      apiWriteLimiter, validate(CreateCVSchema), createCV)
router.get('/:id',    apiReadLimiter,  getCV)
router.put('/:id',    apiWriteLimiter, validate(UpdateCVSchema), updateCV)
router.patch('/:id',  apiWriteLimiter, validate(PatchCVSchema),  patchCV)
router.delete('/:id', apiWriteLimiter, deleteCV)

export default router
