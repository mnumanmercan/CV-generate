import type { Request, Response, NextFunction, RequestHandler } from 'express'
import type { Plan } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { AppError } from '../utils/apiError.js'

// Plan hierarchy: FREE < PRO < ENTERPRISE
const PLAN_LEVEL: Record<Plan, number> = {
  FREE:       0,
  PRO:        1,
  ENTERPRISE: 2,
}

export function requirePlan(required: Plan): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sub: userId, plan } = req.user

    if (PLAN_LEVEL[plan] >= PLAN_LEVEL[required]) {
      // For PRO+ routes, check grace period expiry (only hits DB for PRO plan check)
      if (required === 'PRO' && plan === 'PRO') {
        const sub = await prisma.subscription.findUnique({ where: { userId } })
        if (
          sub?.status === 'PAST_DUE' &&
          sub.gracePeriodEndsAt &&
          sub.gracePeriodEndsAt < new Date()
        ) {
          next(new AppError(
            'Subscription payment failed. Please update your payment method.',
            402,
            'PAYMENT_REQUIRED',
          ))
          return
        }
      }
      next()
      return
    }

    next(new AppError('This feature requires a Pro subscription.', 403, 'PLAN_REQUIRED'))
  }
}
