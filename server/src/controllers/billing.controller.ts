import type { Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { stripeService } from '../services/stripe.service.js'
import { AppError } from '../utils/apiError.js'
import { env } from '../config/env.js'

/**
 * Accept a short symbolic plan identifier from the client instead of a raw
 * Stripe price ID. The server resolves it to the configured price ID.
 *
 * Why: accepting arbitrary `priceId` strings from the frontend is a privilege
 * escalation risk. A user could pass any price ID that exists in the Stripe
 * account (e.g. a legacy enterprise price, an internal test price) and Stripe
 * would happily create a checkout session at that price against their account.
 * By resolving on the server we guarantee only sanctioned prices are usable.
 */
const CheckoutSchema = z.object({
  plan:       z.enum(['pro_monthly', 'pro_annual']),
  successUrl: z.string().url().optional(),
  cancelUrl:  z.string().url().optional(),
})

function resolvePriceId(plan: 'pro_monthly' | 'pro_annual'): string {
  const priceId = plan === 'pro_monthly'
    ? env.STRIPE_PRICE_ID_PRO_MONTHLY
    : env.STRIPE_PRICE_ID_PRO_ANNUAL
  if (!priceId) {
    throw new AppError(
      `Plan "${plan}" is not configured on the server.`,
      503,
      'PLAN_NOT_CONFIGURED',
    )
  }
  return priceId
}

export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const result = CheckoutSchema.safeParse(req.body)
  if (!result.success) {
    throw new AppError('Validation failed', 422, 'VALIDATION_ERROR')
  }

  const { plan, successUrl, cancelUrl } = result.data
  const priceId = resolvePriceId(plan)

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
