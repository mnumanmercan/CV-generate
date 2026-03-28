<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { RouterLink } from 'vue-router'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import AppFooter from '@/components/ui/AppFooter.vue'
  import { useUserStore } from '@/stores/userStore'
  import { useScrollReveal } from '@/composables/useScrollReveal'
  import { PLANS, type SubscriptionTier } from '@/composables/useSubscription'

  /* ── Per-page title ───────────────────────────────────────────────────── */
  onMounted(() => {
    document.title = 'Pricing — Resumark'
  })

  /* ── Scroll reveal ────────────────────────────────────────────────────── */
  const { vReveal } = useScrollReveal()

  /* ── Store ────────────────────────────────────────────────────────────── */
  const userStore = useUserStore()

  /* ── Reactive current tier ────────────────────────────────────────────── */
  const currentTier = computed(() => (userStore.isPremium ? 'pro' : 'free'))

  /* ── Billing period toggle ────────────────────────────────────────────── */
  const billingPeriod = ref<'monthly' | 'annual'>('monthly')

  function displayedPrice(price: number): string {
    if (price === 0) return 'Free'
    const monthly = billingPeriod.value === 'annual' ? Math.floor(price * 0.8) : price
    return `$${monthly}`
  }

  function annualTotal(price: number): number {
    return Math.floor(price * 0.8) * 12
  }

  /* ── Plan styling ─────────────────────────────────────────────────────── */
  const tierHighlight: Record<SubscriptionTier, boolean> = {
    free: false,
    pro: true,
    enterprise: false,
  }

  const tierBorder: Record<SubscriptionTier, string> = {
    free: 'border-overlay/10',
    pro: 'border-accent shadow-lg shadow-accent/10',
    enterprise: 'border-overlay/10',
  }

  /* ── Comparison table data ────────────────────────────────────────────── */
  type ComparisonRow = [string, boolean, boolean, boolean]

  const comparisonRows: ComparisonRow[] = [
    ['ATS CV Builder',            true,  true,  true],
    ['Real-time Preview',          true,  true,  true],
    ['PDF Download',               true,  true,  true],
    ['Browser Auto-save',          true,  true,  true],
    ['ATS Writing Hints',          true,  true,  true],
    ['Profile Photo Upload',       false, true,  true],
    ['Premium Templates',          false, true,  true],
    ['Cloud Storage',              false, true,  true],
    ['Multiple CVs',               false, true,  true],
    ['Priority Support',           false, true,  true],
    ['Team Management',            false, false, true],
    ['Custom Branding',            false, false, true],
    ['API Access',                 false, false, true],
    ['Dedicated Account Manager',  false, false, true],
  ]

  /* ── FAQ ──────────────────────────────────────────────────────────────── */
  const faq = [
    {
      q: 'Is the Free plan really free forever?',
      a: 'Yes. The Free plan includes the full ATS CV builder, live preview, PDF download, and browser auto-save — permanently free with no time limits or credit card required.',
    },
    {
      q: 'Is my data safe?',
      a: 'On the Free plan, all data is stored in your browser via localStorage — it never leaves your device. Pro and Enterprise plans will use encrypted cloud storage.',
    },
    {
      q: 'What is an ATS-compliant CV?',
      a: 'ATS (Applicant Tracking System) software scans CVs before a human ever reads them. An ATS-compliant CV uses a single-column layout, standard section headings, no tables or graphics, and machine-readable fonts — exactly what Resumark produces.',
    },
    {
      q: 'When will Pro and Enterprise be available?',
      a: 'Pro and Enterprise are launching soon. Click "Upgrade" on any plan card and leave your email — you\'ll be among the first to know when billing goes live.',
    },
  ]
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-shell)">
    <AppHeader />

    <main class="flex-1">

      <!-- ── Header ─────────────────────────────────────────────── -->
      <section class="section-visible px-6 pt-16 pb-12 text-center max-w-3xl mx-auto">
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold mb-5 stagger-item"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
          Simple pricing
        </div>
        <h1
          class="text-3xl md:text-4xl font-bold text-primary mb-3 stagger-item"
          style="animation-delay: 60ms"
        >
          Start free. Upgrade when you're ready.
        </h1>
        <p
          class="text-secondary text-base max-w-lg mx-auto stagger-item"
          style="animation-delay: 120ms"
        >
          The core CV builder is free forever. Pro and Enterprise unlock cloud storage,
          multiple CVs, premium templates, and team features.
        </p>

        <!-- Billing toggle -->
        <div
          class="flex items-center justify-center gap-3 mt-8 stagger-item"
          style="animation-delay: 180ms"
        >
          <span :class="['text-sm font-medium transition-colors', billingPeriod === 'monthly' ? 'text-primary' : 'text-secondary']">
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            :aria-checked="billingPeriod === 'annual'"
            class="relative w-11 h-6 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-shell"
            :style="{ background: billingPeriod === 'annual' ? 'var(--accent)' : 'rgb(var(--overlay-rgb) / 0.12)' }"
            @click="billingPeriod = billingPeriod === 'monthly' ? 'annual' : 'monthly'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              :style="{ transform: billingPeriod === 'annual' ? 'translateX(20px)' : 'translateX(0)' }"
              aria-hidden="true"
            />
          </button>
          <span :class="['text-sm font-medium transition-colors', billingPeriod === 'annual' ? 'text-primary' : 'text-secondary']">
            Annual
          </span>
          <span
            v-if="billingPeriod === 'annual'"
            class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold"
          >
            Save 20%
          </span>
        </div>
      </section>

      <!-- ── Pricing cards ──────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 pb-16 max-w-5xl mx-auto w-full"
        aria-label="Pricing plans"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          <div
            v-for="(plan, index) in PLANS"
            :key="plan.id"
            :class="[
              'relative rounded-2xl border p-7 flex flex-col gap-5 reveal-item transition-all',
              tierHighlight[plan.id]
                ? 'bg-gradient-to-b from-accent/10 to-transparent ' + tierBorder[plan.id]
                : tierBorder[plan.id],
            ]"
            :style="{
              animationDelay: `${index * 70}ms`,
              background: tierHighlight[plan.id] ? undefined : 'var(--bg-surface)',
            }"
          >
            <!-- Most Popular badge -->
            <div
              v-if="tierHighlight[plan.id]"
              class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-white text-xs font-bold shadow-lg whitespace-nowrap"
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

              <!-- Price display -->
              <div class="flex items-end gap-1.5 mt-3">
                <template v-if="plan.id === 'enterprise'">
                  <span class="text-3xl font-black text-primary leading-none">Custom</span>
                </template>
                <template v-else>
                  <span class="text-4xl font-black text-primary leading-none">
                    {{ displayedPrice(plan.price) }}
                  </span>
                  <span v-if="plan.price > 0" class="text-secondary text-sm mb-1">/ month</span>
                </template>
              </div>

              <!-- Annual savings note -->
              <p
                v-if="plan.price > 0 && plan.id !== 'enterprise' && billingPeriod === 'annual'"
                class="text-xs text-emerald-400 mt-1"
              >
                ${{ annualTotal(plan.price) }} billed annually
              </p>

              <!-- Plan taglines -->
              <p v-if="plan.id === 'free'" class="text-xs text-emerald-400 mt-1">No credit card required</p>
              <p v-else-if="plan.id === 'pro'" class="text-xs text-accent mt-1">Everything in Free, plus more</p>
              <p v-else class="text-xs text-secondary mt-1">Custom pricing for teams</p>
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
                class="block w-full text-center py-3 rounded-xl border border-overlay/10 text-primary text-sm font-semibold hover:border-overlay/20 hover:bg-overlay/5 transition-all"
              >
                Get Started Free
              </RouterLink>
              <a
                v-else-if="plan.id === 'enterprise'"
                href="mailto:hello@resumark.app"
                class="block w-full text-center py-3 rounded-xl border border-overlay/10 text-primary text-sm font-semibold hover:border-accent/40 hover:bg-accent/5 transition-all"
              >
                Contact Sales
              </a>
              <button
                v-else
                type="button"
                :class="[
                  'w-full py-3 rounded-xl text-sm font-semibold transition-all',
                  tierHighlight[plan.id]
                    ? 'shimmer-btn text-white shadow-lg shadow-accent/20'
                    : 'border border-overlay/10 text-primary hover:border-accent/40 hover:bg-accent/5',
                ]"
                @click="userStore.openUpgradeModal(`${plan.name} Plan`)"
              >
                Upgrade to {{ plan.name }}
              </button>
            </div>

            <div class="h-px bg-overlay/5" aria-hidden="true" />

            <!-- Feature list -->
            <ul class="flex flex-col gap-2.5 flex-1" :aria-label="`${plan.name} features`">
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {{ feature }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ── Feature comparison table ───────────────────────────── -->
      <section
        v-reveal
        class="px-6 pb-16 max-w-4xl mx-auto w-full"
        aria-labelledby="compare-heading"
      >
        <h2
          id="compare-heading"
          class="text-center text-lg font-semibold text-primary mb-6 reveal-item"
        >
          Full comparison
        </h2>

        <div class="rounded-2xl border border-overlay/5 overflow-hidden reveal-item" style="background: var(--bg-surface)">
          <table class="w-full text-sm" role="table">
            <thead>
              <tr class="border-b border-overlay/5">
                <th class="text-left px-5 py-3.5 text-secondary font-medium text-xs uppercase tracking-wider w-1/2" scope="col">Feature</th>
                <th class="text-center px-4 py-3.5 text-secondary font-medium text-xs uppercase tracking-wider" scope="col">Free</th>
                <th class="text-center px-4 py-3.5 text-accent font-medium text-xs uppercase tracking-wider" scope="col">Pro</th>
                <th class="text-center px-4 py-3.5 text-secondary font-medium text-xs uppercase tracking-wider" scope="col">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in comparisonRows"
                :key="row[0]"
                :class="['border-b border-overlay/5 last:border-0 transition-colors hover:bg-overlay/[0.02]', i % 2 === 0 ? '' : 'bg-overlay/[0.01]']"
              >
                <td class="px-5 py-3 text-secondary">{{ row[0] }}</td>
                <td class="px-4 py-3 text-center">
                  <svg v-if="row[1]" class="w-4 h-4 text-emerald-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Included">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span v-else class="text-overlay/20 text-base leading-none" aria-label="Not included">—</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <svg v-if="row[2]" class="w-4 h-4 text-emerald-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Included">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span v-else class="text-overlay/20 text-base leading-none" aria-label="Not included">—</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <svg v-if="row[3]" class="w-4 h-4 text-emerald-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Included">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span v-else class="text-overlay/20 text-base leading-none" aria-label="Not included">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── FAQ ───────────────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 pb-20 max-w-2xl mx-auto w-full"
        aria-labelledby="faq-heading"
      >
        <h2
          id="faq-heading"
          class="text-center text-xl font-bold text-primary mb-8 reveal-item"
        >
          Frequently asked questions
        </h2>
        <div class="flex flex-col gap-4">
          <details
            v-for="(item, index) in faq"
            :key="item.q"
            class="group rounded-xl border border-overlay/5 overflow-hidden reveal-item"
            style="background: var(--bg-surface)"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <summary
              class="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer text-sm font-semibold text-primary list-none hover:bg-overlay/5 transition-colors"
            >
              {{ item.q }}
              <svg
                class="w-4 h-4 text-secondary shrink-0 transition-transform duration-200 group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-5 pb-4 text-sm text-secondary leading-relaxed border-t border-overlay/5 pt-3">
              {{ item.a }}
            </div>
          </details>
        </div>
      </section>

    </main>

    <AppFooter />
  </div>
</template>
