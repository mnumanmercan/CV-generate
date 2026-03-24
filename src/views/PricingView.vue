<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import { useSubscription, type SubscriptionTier } from '@/composables/useSubscription'
  import { useUserStore } from '@/stores/userStore'

  const userStore = useUserStore()
  const { plans, getCurrentTier } = useSubscription()

  const currentTier = getCurrentTier()

  const tierHighlight: Record<SubscriptionTier, boolean> = {
    free: false,
    pro: true, // most popular
    enterprise: false,
  }
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-shell)">
    <AppHeader />

    <main class="flex-1 px-6 py-16 max-w-5xl mx-auto w-full">
      <!-- Header -->
      <div class="text-center mb-12 stagger-item">
        <h1 class="text-3xl md:text-4xl font-bold text-primary mb-3">Simple, Transparent Pricing</h1>
        <p class="text-secondary text-base max-w-lg mx-auto">
          Start free. Upgrade when you need more.
        </p>
      </div>

      <!-- Pricing cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          v-for="(plan, index) in plans"
          :key="plan.id"
          :class="[
            'relative rounded-2xl border p-6 flex flex-col gap-4 stagger-item transition-all',
            tierHighlight[plan.id]
              ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
              : 'border-white/10',
          ]"
          :style="{ animationDelay: `${index * 60}ms` }"
        >
          <!-- Popular badge -->
          <div
            v-if="tierHighlight[plan.id]"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold"
            aria-label="Most popular plan"
          >
            Most Popular
          </div>

          <!-- Plan header -->
          <div>
            <h2 class="text-lg font-bold text-primary">{{ plan.name }}</h2>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-3xl font-bold text-primary">${{ plan.price }}</span>
              <span class="text-secondary text-sm">/ month</span>
            </div>
          </div>

          <!-- Feature list -->
          <ul class="flex flex-col gap-2.5 flex-1" :aria-label="`${plan.name} features`">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex items-start gap-2 text-sm text-secondary"
            >
              <span class="text-emerald-400 shrink-0 mt-0.5" aria-hidden="true">✓</span>
              {{ feature }}
            </li>
          </ul>

          <!-- CTA -->
          <div class="mt-2">
            <span
              v-if="currentTier === plan.id"
              class="block w-full text-center py-2.5 rounded-xl border border-emerald-500/30 text-emerald-400 text-sm font-medium"
            >
              Current Plan
            </span>
            <RouterLink
              v-else-if="plan.id === 'free'"
              to="/builder"
              class="block w-full text-center py-2.5 rounded-xl border border-white/10 text-secondary text-sm font-medium hover:text-primary hover:border-white/20 transition-colors"
            >
              Get Started Free
            </RouterLink>
            <button
              v-else
              type="button"
              :class="[
                'w-full py-2.5 rounded-xl text-sm font-semibold transition-all',
                tierHighlight[plan.id]
                  ? 'shimmer-btn text-white'
                  : 'border border-accent/30 text-accent hover:bg-accent/10',
              ]"
              @click="userStore.openUpgradeModal(`${plan.name} Plan`)"
            >
              Upgrade to {{ plan.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Note -->
      <p class="text-center text-xs text-secondary mt-8 stagger-item" style="animation-delay: 240ms">
        Payment integration coming in Phase 2. All premium features are currently unlocked for testing.
      </p>
    </main>

    <footer class="border-t border-white/5 py-6 px-6 text-center text-xs text-secondary">
      © {{ new Date().getFullYear() }} CV Generate
    </footer>
  </div>
</template>
