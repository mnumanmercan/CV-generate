import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { coverLetterService } from '../services/coverLetter.service.js'
import type { CoverLetterData } from '@resumark/shared'

export const getCoverLetter = asyncHandler(async (req: Request, res: Response) => {
  const content = await coverLetterService.get(req.user.sub)
  res.json({ success: true, data: content })
})

export const upsertCoverLetter = asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body as { content: CoverLetterData }
  const cl = await coverLetterService.upsert(req.user.sub, content)
  res.json({ success: true, data: cl })
})

export const deleteCoverLetter = asyncHandler(async (req: Request, res: Response) => {
  await coverLetterService.delete(req.user.sub)
  res.status(204).send()
})
