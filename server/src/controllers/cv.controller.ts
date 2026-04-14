import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { cvService } from '../services/cv.service.js'
import type { CVData } from '@resumark/shared'

export const listCVs = asyncHandler(async (req: Request, res: Response) => {
  const cvs = await cvService.list(req.user.sub)
  res.json({ success: true, data: cvs })
})

export const createCV = asyncHandler(async (req: Request, res: Response) => {
  const { content, title } = req.body as { content: CVData; title?: string }
  const cv = await cvService.create(req.user.sub, req.user.plan, content, title)
  res.status(201).json({ success: true, data: cv })
})

export const getCV = asyncHandler(async (req: Request, res: Response) => {
  const cv = await cvService.get(req.user.sub, String(req.params['id']))
  res.json({ success: true, data: cv })
})

export const updateCV = asyncHandler(async (req: Request, res: Response) => {
  const { content, title } = req.body as { content: CVData; title?: string }
  const cv = await cvService.update(req.user.sub, String(req.params['id']), req.user.plan, content, title)
  res.json({ success: true, data: cv })
})

export const patchCV = asyncHandler(async (req: Request, res: Response) => {
  const { title } = req.body as { title: string }
  const cv = await cvService.patch(req.user.sub, String(req.params['id']), title)
  res.json({ success: true, data: cv })
})

export const deleteCV = asyncHandler(async (req: Request, res: Response) => {
  await cvService.delete(req.user.sub, String(req.params['id']))
  res.status(204).send()
})
