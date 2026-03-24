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
    pro: true,
    enterprise: false,
  }

  const tierAccent: Record<SubscriptionTier, string> = {
    free: 'border-white/10',
    pro: 'border-accent shadow-lg shadow-accent/10',
    enterprise: 'border-white/10',
  }

  const faq = [
    {
      q: 'Is the Free plan really free forever?',
      a: 'Yes. The Free plan includes the ATS CV builder, live preview, PDF download, and localStorage auto-save — permanently free with no time limits.',
    },
    {
      q: 'Is my data safe?',
      a: 'On the Free plan, all data is stored in your browser via localStorage — it never leaves your device. Pro/Enterprise plans will use encrypted cloud storage (Phase 2).',
    },
    {
      q: 'What is an ATS-compliant CV?',
      a: 'ATS (Applicant Tracking System) software scans CVs before a human reads them. An ATS-compliant CV uses single-column layout, standard section headings, no tables or graphics, and machine-readable fonts.',
    },
    {
      q: 'When will Pro and Enterprise be available?',
      a: 'Payment integration is planned for Phase 2. All premium features are currently unlocked for testing. You will be notified when billing goes live.',
    },
  ]
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-shell)">
    <AppHeader />

    <main class="flex-1">

      <!-- ── Header ─────────────────────────────────────────────── -->
      <section class="px-6 pt-16 pb-12 text-center max-w-3xl mx-auto stagger-item">
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold mb-5"
        >
          Simple pricing
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-primary mb-3">
          Start free. Upgrade when you're ready.
        </h1>
        <p class="text-secondary text-base max-w-lg mx-auto">
          The core CV builder is free forever. Pro and Enterprise unlock cloud storage,
          multiple CVs, premium templates, and team features.
        </p>
      </section>

      <!-- ── Pricing cards ──────────────────────────────────────── -->
      <section class="px-6 pb-16 max-w-5xl mx-auto w-full" aria-label="Pricing plans">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div
            v-for="(plan, index) in plans"
            :key="plan.id"
            :class="[
              'relative rounded-2xl border p-7 flex flex-col gap-5 stagger-item transition-all',
              tierHighlight[plan.id]
                ? 'bg-gradient-to-b from-accent/10 to-transparent ' + tierAccent[plan.id]
                : tierAccent[plan.id],
            ]"
            :style="{ animationDelay: `${index * 60}ms`, background: tierHighlight[plan.id] ? undefined : 'var(--bg-surface)' }"
          >
            <!-- Most Popular badge -->
            <div
              v-if="tierHighlight[plan.id]"
              class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-white text-xs font-bold shadow-lg"
              aria-label="Most popular plan"
            >
              Most Popular
            </div>

            <!-- Plan identity -->
            <div>
              <p class="text-xs font-mono text-secondary uppercase tracking-widest mb-2">
                {{ plan.id }}
              </p>
              <h2 class="text-2xl font-bold text-primary">{{ plan.name }}</h2>
              <div class="flex items-end gap-1.5 mt-2">
                <span class="text-4xl font-black text-primary leading-none">${{ plan.price }}</span>
                <span class="text-secondary text-sm mb-1">/ month</span>
              </div>
              <p v-if="plan.id === 'free'" class="text-xs text-emerald-400 mt-1">Free forever — no credit card</p>
              <p v-else-if="plan.id === 'pro'" class="text-xs text-accent mt-1">Everything in Free, plus more</p>
              <p v-else class="text-xs text-secondary mt-1">Everything in Pro, plus team tools</p>
            </div>

            <!-- CTA -->
            <div>
              <span
                v-if="currentTier === plan.id"
                class="block w-full text-center py-3 rounded-xl border border-emerald-500/30 text-emerald-400 text-sm font-semibold"
              >
                ✓ Current Plan
              </span>
              <RouterLink
                v-else-if="plan.id === 'free'"
                to="/builder"
                class="block w-full text-center py-3 rounded-xl border border-white/10 text-primary text-sm font-semibold hover:border-white/20 hover:bg-white/5 transition-all"
              >
                Get Started Free
              </RouterLink>
              <button
                v-else
                type="button"
                :class="[
                  'w-full py-3 rounded-xl text-sm font-semibold transition-all',
                  tierHighlight[plan.id]
                    ? 'shimmer-btn text-white shadow-lg shadow-accent/20'
                    : 'border border-white/10 text-primary hover:border-accent/40 hover:bg-accent/5',
                ]"
                @click="userStore.openUpgradeModal(`${plan.name} Plan`)"
              >
                Upgrade to {{ plan.name }}
              </button>
            </div>

            <div class="h-px bg-white/5" aria-hidden="true" />

            <!-- Feature list -->
            <ul class="flex flex-col gap-2.5" :aria-label="`${plan.name} features`">
              <li
                v-for="feature in plan.features"
                :key="feature"
                class="flex items-start gap-2.5 text-sm text-secondary"
              >
                <svg
                  class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {{ feature }}
              </li>
            </ul>
          </div>
        </div>

        <p
          class="text-center text-xs text-secondary mt-8 stagger-item flex items-center justify-center gap-2"
          style="animation-delay: 240ms"
        >
          <svg class="w-3.5 h-3.5 text-yellow-500/60" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 2a8 8 0 100 16A8 8 0 0012 4zm0 3a1 1 0 011 1v4a1 1 0 01-2 0V8a1 1 0 011-1zm0 8a1.25 1.25 0 110 2.5A1.25 1.25 0 0112 15z"/>
          </svg>
          Payment integration is coming in Phase 2. All premium features are currently unlocked for testing.
        </p>
      </section>

      <!-- ── FAQ ───────────────────────────────────────────────── -->
      <section class="px-6 pb-20 max-w-2xl mx-auto w-full" aria-labelledby="faq-heading">
        <h2
          id="faq-heading"
          class="text-center text-xl font-bold text-primary mb-8 stagger-item"
        >
          Frequently asked questions
        </h2>
        <div class="flex flex-col gap-4">
          <details
            v-for="(item, index) in faq"
            :key="item.q"
            class="group rounded-xl border border-white/5 overflow-hidden stagger-item"
            style="background: var(--bg-surface)"
            :style="{ animationDelay: `${index * 40}ms` }"
          >
            <summary
              class="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer text-sm font-semibold text-primary list-none hover:bg-white/5 transition-colors"
            >
              {{ item.q }}
              <svg
                class="w-4 h-4 text-secondary shrink-0 transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-5 pb-4 text-sm text-secondary leading-relaxed border-t border-white/5 pt-3">
              {{ item.a }}
            </div>
          </details>
        </div>
      </section>

    </main>

    <footer
      class="border-t border-white/5 py-8 px-6"
      style="background: var(--bg-surface)"
    >
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded bg-accent flex items-center justify-center text-white text-xs font-bold">
            CV
          </div>
          <span class="text-sm font-semibold text-secondary">CV Generate</span>
        </div>
        <div class="flex items-center gap-5 text-xs text-secondary">
          <RouterLink to="/builder" class="hover:text-primary transition-colors">Builder</RouterLink>
          <RouterLink to="/pricing" class="hover:text-primary transition-colors">Pricing</RouterLink>
        </div>
        <p class="text-xs text-secondary">
          © {{ new Date().getFullYear() }} CV Generate
        </p>
      </div>
    </footer>
  </div>
</template>
