// Phase 1 stub — Phase 2 will implement payment provider integration
import { useUserStore } from '@/stores/userStore'

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

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
      'Cloud storage (MongoDB)',
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
      'Dedicated support',
    ],
  },
]

export function useSubscription() {
  const userStore = useUserStore()

  // Phase 2: Replace with actual payment provider checkout
  async function subscribe(_tier: SubscriptionTier): Promise<void> {
    console.warn('Payment integration not yet implemented (Phase 2).')
  }

  function getCurrentTier(): SubscriptionTier {
    return userStore.isPremium ? 'pro' : 'free'
  }

  return {
    plans: PLANS,
    getCurrentTier,
    subscribe,
  }
}
