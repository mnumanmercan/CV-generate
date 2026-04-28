import { ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { apiClient, ApiError } from '@/services/apiClient'

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'
export type BillingInterval  = 'monthly' | 'annual'

/**
 * Narrow plan identifiers sent to the backend. The server resolves each to
 * a sanctioned Stripe price ID (see billing.controller.ts `resolvePriceId`)
 * — we never send raw Stripe price IDs from the client.
 */
export type StripePlan = 'pro_monthly' | 'pro_annual'

export interface SubscriptionPlan {
  id: SubscriptionTier
  name: string
  price: number
  features: string[]
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      '1 CV with ATS template',
      'PDF download',
      'Real-time preview',
      'LocalStorage auto-save',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9,
    features: [
      'Everything in Free',
      'Profile photo upload',
      'Premium templates',
      'Cloud storage & sync',
      'Multiple CVs',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29,
    features: [
      'Everything in Pro',
      'Team management',
      'Custom branding',
      'API access',
      'Dedicated account manager',
    ],
  },
]

// Module-scoped refs so every component that imports the composable shares
// the same "checkout in flight" state — matches how the store-less stub
// behaved, and prevents the user from clicking Upgrade twice.
const isCheckingOut = ref(false)
const checkoutError = ref<string | null>(null)

export function useSubscription() {
  const userStore = useUserStore()

  /**
   * Map tier + billing interval to the plan identifier the backend expects.
   * Centralised so PricingView doesn't hard-code the strings in two places.
   */
  function toStripePlan(tier: SubscriptionTier, interval: BillingInterval): StripePlan | null {
    if (tier !== 'pro') return null // only Pro is purchasable via Stripe; Enterprise = contact sales
    return interval === 'annual' ? 'pro_annual' : 'pro_monthly'
  }

  /**
   * Start a Stripe Checkout session. Requires the user to be authenticated
   * because `/billing/checkout` is behind `authenticate`. The backend returns
   * a redirect URL; we hard-navigate to Stripe's hosted page.
   *
   * Returns `false` if we bailed early (not logged in, unsupported tier) so
   * the caller can decide whether to open the upgrade modal instead.
   */
  async function subscribe(tier: SubscriptionTier, interval: BillingInterval = 'monthly'): Promise<boolean> {
    checkoutError.value = null

    if (!userStore.isLoggedIn) {
      // Checkout requires an authenticated user — defer to the modal which
      // tells them to create an account. Same behaviour as the old stub.
      userStore.openUpgradeModal(`${tier} plan`)
      return false
    }

    const plan = toStripePlan(tier, interval)
    if (!plan) {
      console.warn('[useSubscription] tier not purchasable via Stripe:', tier)
      return false
    }

    isCheckingOut.value = true
    try {
      const res = await apiClient.post<{ success: boolean; data: { url: string } }>(
        '/billing/checkout',
        { plan },
      )
      const url = res.data?.url
      if (!url) throw new Error('Checkout session did not return a redirect URL.')
      // Hard-navigate — Stripe Checkout is a Stripe-hosted page, not an SPA route.
      window.location.href = url
      return true
    } catch (err) {
      // ApiError.code === 'PLAN_NOT_CONFIGURED' is the most common miss
      // in a fresh deploy (STRIPE_PRICE_ID_* env vars not set). Surface
      // it plainly so the user doesn't think their card was declined.
      if (err instanceof ApiError && err.code === 'PLAN_NOT_CONFIGURED') {
        checkoutError.value = 'This plan is not yet available. Please try again later.'
      } else {
        checkoutError.value = err instanceof Error ? err.message : 'Could not start checkout.'
      }
      console.error('[useSubscription] checkout failed:', err)
      return false
    } finally {
      isCheckingOut.value = false
    }
  }

  /**
   * Open Stripe's Customer Portal so the user can manage/cancel their
   * subscription. Same auth requirements as `subscribe()`.
   */
  async function manageBilling(): Promise<void> {
    if (!userStore.isLoggedIn) return
    isCheckingOut.value = true
    checkoutError.value = null
    try {
      const res = await apiClient.post<{ success: boolean; data: { url: string } }>(
        '/billing/portal',
        {},
      )
      const url = res.data?.url
      if (!url) throw new Error('Portal session did not return a redirect URL.')
      window.location.href = url
    } catch (err) {
      checkoutError.value = err instanceof Error ? err.message : 'Could not open billing portal.'
      console.error('[useSubscription] portal failed:', err)
    } finally {
      isCheckingOut.value = false
    }
  }

  function getCurrentTier(): SubscriptionTier {
    return userStore.isPremium ? 'pro' : 'free'
  }

  return {
    plans: PLANS,
    isCheckingOut,
    checkoutError,
    getCurrentTier,
    subscribe,
    manageBilling,
  }
}
