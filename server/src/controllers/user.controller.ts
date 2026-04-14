import type { Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { userService } from '../services/user.service.js'
import { AppError } from '../utils/apiError.js'

const UpdateMeSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: 'At least one field required' })

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getMe(req.user.sub)
  res.json({ success: true, data: user })
})

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const result = UpdateMeSchema.safeParse(req.body)
  if (!result.success) throw new AppError('Validation failed', 422, 'VALIDATION_ERROR')

  const user = await userService.updateMe(req.user.sub, result.data)
  res.json({ success: true, data: user })
})

export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
  await userService.deleteAccount(req.user.sub)
  res.clearCookie('refreshToken', { path: '/api/v1/auth' })
  res.status(204).send()
})

// POST /user/me/avatar — Phase 3: R2 file upload
// Placeholder: returns 501 until upload service is wired
export const uploadAvatar = asyncHandler(async (_req: Request, _res: Response) => {
  throw new AppError('Avatar upload coming in Phase 3.', 501, 'NOT_IMPLEMENTED')
})

export const deleteAvatar = asyncHandler(async (_req: Request, _res: Response) => {
  throw new AppError('Avatar delete coming in Phase 3.', 501, 'NOT_IMPLEMENTED')
})
