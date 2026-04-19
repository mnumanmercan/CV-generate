import Stripe from 'stripe'
import { prisma } from '../db/prisma.js'
import { env } from '../config/env.js'
import { STRIPE_GRACE_PERIOD_DAYS } from '@resumark/shared'

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe not configured: set STRIPE_SECRET_KEY in .env to use billing')
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
}

export const stripeService = {
  // ── Create Checkout Session ─────────────────────────────────────────────────
  async createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

    // Get or create Stripe customer
    let subscription = await prisma.subscription.findUnique({ where: { userId } })
    let customerId: string

    if (subscription?.stripeCustomerId) {
      customerId = subscription.stripeCustomerId
    } else {
      const customer = await getStripe().customers.create({
        email: user.email,
        name:  user.name,
        metadata: { userId },
      })
      customerId = customer.id
      subscription = await prisma.subscription.create({
        data: { userId, stripeCustomerId: customerId, status: 'INCOMPLETE' },
      })
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode:     'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      metadata:    { userId },
      subscription_data: {
        metadata: { userId },
      },
    })

    return { url: session.url! }
  },

  // ── Create Customer Portal Session ─────────────────────────────────────────
  async createPortalSession(userId: string, returnUrl: string) {
    const subscription = await prisma.subscription.findUnique({ where: { userId } })
    if (!subscription?.stripeCustomerId) {
      throw Object.assign(new Error('No billing account found.'), { statusCode: 404, code: 'NO_SUBSCRIPTION' })
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer:   subscription.stripeCustomerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  },

  // ── Get subscription status ─────────────────────────────────────────────────
  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where:   { id: userId },
      include: { subscription: true },
    })

    return {
      plan:   user?.plan ?? 'FREE',
      status: user?.subscription?.status ?? null,
      currentPeriodEnd:  user?.subscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: user?.subscription?.cancelAtPeriodEnd ?? false,
    }
  },

  // ── Process Stripe webhook ──────────────────────────────────────────────────
  async handleWebhook(rawBody: Buffer, signature: string) {
    const secret = env.STRIPE_WEBHOOK_SECRET
    if (!secret) {
      throw Object.assign(
        new Error('Stripe webhook not configured: set STRIPE_WEBHOOK_SECRET in .env'),
        { statusCode: 503, code: 'WEBHOOK_NOT_CONFIGURED' },
      )
    }

    let event: Stripe.Event
    try {
      event = getStripe().webhooks.constructEvent(rawBody, signature, secret)
    } catch {
      throw Object.assign(new Error('Webhook signature verification failed.'), { statusCode: 400, code: 'INVALID_SIGNATURE' })
    }

    // ── Idempotency: skip events we've already processed ─────────────────────
    // Stripe retries failed deliveries for up to 3 days and also delivers the
    // same event ID more than once under normal conditions (at-least-once).
    // A unique-constrained StripeEvent row makes re-delivery a no-op.
    try {
      await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } })
    } catch (err: unknown) {
      // P2002 = unique constraint violation → already processed, exit silently
      const e = err as { code?: string }
      if (e.code === 'P2002') return
      throw err
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        await prisma.$transaction(async (tx) => {
          await tx.subscription.upsert({
            where:  { stripeCustomerId: session.customer as string },
            create: {
              userId,
              stripeCustomerId:     session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status:               'ACTIVE',
              gracePeriodEndsAt:    null,
            },
            update: {
              stripeSubscriptionId: session.subscription as string,
              status:               'ACTIVE',
              gracePeriodEndsAt:    null,
            },
          })
          await tx.user.update({
            where: { id: userId },
            data:  { plan: 'PRO' },
          })
        })
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const sub = await prisma.subscription.findUnique({
          where: { stripeCustomerId: invoice.customer as string },
        })
        if (!sub) break

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status:           'ACTIVE',
            gracePeriodEndsAt: null,
            currentPeriodEnd:  invoice.lines.data[0]?.period?.end
              ? new Date(invoice.lines.data[0].period.end * 1000)
              : undefined,
          },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const gracePeriodEndsAt = new Date(Date.now() + STRIPE_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)

        await prisma.subscription.updateMany({
          where: { stripeCustomerId: invoice.customer as string },
          data:  { status: 'PAST_DUE', gracePeriodEndsAt },
        })
        break
      }

      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription
        const userId = stripeSub.metadata?.userId
        if (!userId) break

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSub.id },
          data: {
            stripePriceId:     stripeSub.items.data[0]?.price?.id,
            currentPeriodEnd:  new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription
        await prisma.$transaction(async (tx) => {
          await tx.subscription.updateMany({
            where: { stripeSubscriptionId: stripeSub.id },
            data:  { status: 'CANCELED', gracePeriodEndsAt: null },
          })
          // Find the subscription to get userId, then downgrade
          const sub = await tx.subscription.findFirst({
            where: { stripeSubscriptionId: stripeSub.id },
          })
          if (sub) {
            await tx.user.update({
              where: { id: sub.userId },
              data:  { plan: 'FREE' },
            })
          }
        })
        break
      }

      default:
        // Unhandled event types are silently ignored
        break
    }
  },
}
