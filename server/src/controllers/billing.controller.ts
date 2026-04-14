import type { Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { stripeService } from '../services/stripe.service.js'
import { AppError } from '../utils/apiError.js'
import { env } from '../config/env.js'

const CheckoutSchema = z.object({
  priceId:    z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl:  z.string().url().optional(),
})

export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const result = CheckoutSchema.safeParse(req.body)
  if (!result.success) throw new AppError('Validation failed', 422, 'VALIDATION_ERROR')

  const { priceId, successUrl, cancelUrl } = result.data
  const data = await stripeService.createCheckoutSession(
    req.user.sub,
    priceId,
    successUrl ?? `${env.FRONTEND_URL}/dashboard?checkout=success`,
    cancelUrl  ?? `${env.FRONTEND_URL}/pricing`,
  )
  res.json({ success: true, data })
})

export const createPortal = asyncHandler(async (req: Request, res: Response) => {
  const returnUrl = (req.body as { returnUrl?: string }).returnUrl ?? `${env.FRONTEND_URL}/dashboard`

  let data: { url: string }
  try {
    data = await stripeService.createPortalSession(req.user.sub, returnUrl)
  } catch (err: unknown) {
    const e = err as { statusCode?: number; code?: string; message: string }
    throw new AppError(e.message, e.statusCode ?? 500, e.code)
  }
  res.json({ success: true, data })
})

export const getBillingStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = await stripeService.getStatus(req.user.sub)
  res.json({ success: true, data })
})

export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature']
  if (!signature || typeof signature !== 'string') {
    throw new AppError('Missing stripe-signature header', 400, 'MISSING_SIGNATURE')
  }
  if (!req.rawBody) {
    throw new AppError('Raw body not available', 500)
  }

  try {
    await stripeService.handleWebhook(req.rawBody, signature)
  } catch (err: unknown) {
    const e = err as { statusCode?: number; code?: string; message: string }
    throw new AppError(e.message, e.statusCode ?? 400, e.code)
  }

  res.json({ received: true })
})
