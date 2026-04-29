<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { RouterLink } from 'vue-router'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import AppFooter from '@/components/ui/AppFooter.vue'
  import { useUserStore } from '@/stores/userStore'
  import { useScrollReveal } from '@/composables/useScrollReveal'
  import { PLANS, useSubscription, type SubscriptionTier } from '@/composables/useSubscription'

  onMounted(() => {
    document.title = 'Pricing — Resumark'
  })

  const { vReveal } = useScrollReveal()
  const userStore = useUserStore()
  const { subscribe, isCheckingOut, checkoutError } = useSubscription()

  const currentTier = computed<SubscriptionTier>(() => (userStore.isPremium ? 'pro' : 'free'))
  const billingPeriod = ref<'monthly' | 'annual'>('monthly')

  /**
   * Click handler for the plan CTA. Delegates to useSubscription which will
   * either redirect to Stripe Checkout (logged-in Pro upgrade) or open the
   * upgrade modal (anonymous user needs to sign up first).
   */
  async function handleUpgrade(tier: SubscriptionTier): Promise<void> {
    await subscribe(tier, billingPeriod.value)
  }

  function displayedPrice(price: number): string {
    if (price === 0) return '$0'
    const monthly = billingPeriod.value === 'annual' ? Math.floor(price * 0.8) : price
    return `$${monthly}`
  }

  function annualTotal(price: number): number {
    return Math.floor(price * 0.8) * 12
  }

  /* ── Comparison table (Free vs Pro — Enterprise removed from public UI) ── */
  type ComparisonRow = [string, boolean, boolean]

  const comparisonRows: ComparisonRow[] = [
    ['ATS résumé builder',          true,  true],
    ['Real-time preview',            true,  true],
    ['PDF download',                 true,  true],
    ['Browser auto-save',            true,  true],
    ['ATS writing hints',            true,  true],
    ['Cover letter builder',         true,  true],
    ['Profile photo upload',         false, true],
    ['Premium templates',            false, true],
    ['Cloud storage & sync',         false, true],
    ['Multiple CV versions',         false, true],
    ['Priority support',             false, true],
  ]

  /* ── FAQ — 4 persuasive items ────────────────────────────────────────── */
  const faq = [
    {
      q: 'What does an ATS-friendly CV actually look like?',
      a: 'Two columns, custom fonts, and a photo header look great to a person. An ATS sees garbage. An ATS-friendly CV is single-column, uses standard section headings (Experience, Education, Skills), relies on machine-readable text, and has no tables or graphics. Every Resumark export passes those requirements by default — you never have to think about it.',
    },
    {
      q: 'How is Resumark different from Canva or Zety?',
      a: 'Canva and Zety optimise for aesthetics. Resumark optimises for getting your résumé read. Single-column layout. Standard ATS headings. No mandatory sign-up. No personal data leaving your browser on the Free plan. The goal is a callback, not a compliment on the design.',
    },
    {
      q: 'What happens to my data if I cancel Pro?',
      a: 'Your exported PDFs are yours to keep, always. If you cancel Pro, your cloud-stored CV data remains downloadable for 30 days, then it\'s deleted from our servers. You can export a copy at any time from the builder — Free or Pro.',
    },
    {
      q: 'Can I try Pro before paying?',
      a: 'The Free tier is the trial. It includes the full builder, ATS hints, real-time preview, and PDF download — no account needed, no time limit. Pro adds cloud sync and extra features on top of a foundation you\'ve already tested.',
    },
  ]

  // Single-open accordion. Click the same row again to close it.
  const openFaq = ref<number | null>(0)
  function toggleFaq(i: number): void {
    openFaq.value = openFaq.value === i ? null : i
  }
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <AppHeader />

    <main class="flex-1">

      <!-- ── Hero ──────────────────────────────────────────────────────── -->
      <section class="px-6 pt-14 md:pt-20 pb-16 md:pb-20 text-center max-w-5xl mx-auto w-full">
        <div class="flex items-center justify-center gap-2 mb-7 stagger-item">
          <span class="w-1.5 h-1.5 rounded-full" :style="{ background: 'var(--accent)' }" aria-hidden="true" />
          <span class="mono-eyebrow">Simple Pricing</span>
        </div>

        <h1
          class="font-display leading-[1.02] tracking-editorial text-ink stagger-item"
          :style="{ fontSize: 'clamp(48px, 7.4vw, 96px)', animationDelay: '60ms' }"
        >
          Free for the <span class="accent-italic">work.</span><br />
          <span class="accent-italic">Pro</span><span> for the rest.</span>
        </h1>

        <p
          class="mt-7 max-w-xl mx-auto text-[18px] leading-[1.55] text-muted stagger-item"
          style="animation-delay: 120ms"
        >
          The full résumé builder is free, forever. Pro unlocks cloud sync,
          multiple CV versions, and cover letters tailored to every application.
        </p>

        <!-- Billing toggle -->
        <div
          class="inline-flex items-center mt-10 p-1 rounded-full border border-overlay/10 stagger-item"
          style="background: var(--card); animation-delay: 180ms"
          role="group"
          aria-label="Billing period"
        >
          <button
            type="button"
            class="px-5 py-2 rounded-full text-sm font-medium transition-all"
            :class="billingPeriod === 'monthly' ? '' : 'text-muted hover:text-ink'"
            :style="billingPeriod === 'monthly' ? { background: 'var(--ink)', color: 'var(--paper)' } : {}"
            @click="billingPeriod = 'monthly'"
          >Monthly</button>
          <button
            type="button"
            class="px-5 py-2 rounded-full text-sm font-medium transition-all inline-flex items-center gap-2"
            :class="billingPeriod === 'annual' ? '' : 'text-muted hover:text-ink'"
            :style="billingPeriod === 'annual' ? { background: 'var(--ink)', color: 'var(--paper)' } : {}"
            @click="billingPeriod = 'annual'"
          >
            Annual
            <span
              class="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
              :style="{ background: 'var(--accent-soft)', color: 'var(--accent)' }"
            >−20%</span>
          </button>
        </div>
      </section>

      <!-- ── Checkout error banner ─────────────────────────────────────── -->
      <div v-if="checkoutError" class="max-w-3xl mx-auto px-6 mb-4">
        <div
          class="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm"
          style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.22); color: #ef4444"
          role="alert"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {{ checkoutError }}
        </div>
      </div>

      <!-- ── Plan cards ───────────────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 pb-20 max-w-3xl mx-auto w-full"
        aria-label="Pricing plans"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div
            v-for="(plan, i) in PLANS.filter(p => p.id !== 'enterprise')"
            :key="plan.id"
            class="relative reveal-item flex"
            :style="{ animationDelay: `${i * 70}ms` }"
          >
            <!-- The actual paper card. Pro is scaled 1.02 and gets a sienna
                 border + tinted shadow so it pops out of the row visually. -->
            <div
              class="paper-card relative w-full p-8 flex flex-col"
              :style="plan.id === 'pro'
                ? { borderColor: 'var(--accent)', transform: 'scale(1.02)', boxShadow: '0 14px 36px rgba(184,83,42,0.18)' }
                : {}"
            >
              <!-- Most-popular badge -->
              <div
                v-if="plan.id === 'pro'"
                class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10.5px] font-mono font-semibold tracking-[0.16em] uppercase shadow-md"
                style="background: var(--accent); color: #FFFFFF; white-space: nowrap"
                aria-label="Most popular plan"
              >
                Most Popular
              </div>

              <!-- Plan identity -->
              <p class="mono-eyebrow mb-3">{{ plan.id }}</p>
              <h2
                class="font-display leading-none tracking-editorial text-ink"
                :style="{ fontSize: 'clamp(34px, 4.2vw, 48px)' }"
              >
                {{ plan.name }}
              </h2>

              <!-- Price -->
              <div class="mt-5 flex items-end gap-2">
                <template v-if="plan.id === 'enterprise'">
                  <span
                    class="font-display leading-none text-ink"
                    :style="{ fontSize: 'clamp(38px, 4.4vw, 56px)', letterSpacing: '-0.02em' }"
                  >Custom</span>
                </template>
                <template v-else>
                  <span
                    class="font-display leading-none text-ink"
                    :style="{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.02em' }"
                  >{{ displayedPrice(plan.price) }}</span>
                  <span v-if="plan.price > 0" class="text-muted text-sm mb-2">/ month</span>
                </template>
              </div>

              <!-- Annual savings note -->
              <p
                v-if="plan.price > 0 && plan.id !== 'enterprise' && billingPeriod === 'annual'"
                class="text-[12.5px] mt-2"
                :style="{ color: 'var(--accent)' }"
              >
                ${{ annualTotal(plan.price) }} billed annually
              </p>

              <!-- Plan tagline -->
              <p
                v-if="plan.id === 'free'"
                class="text-[12.5px] mt-2 text-muted"
              >No credit card required.</p>
              <p
                v-else-if="plan.id === 'pro'"
                class="text-[12.5px] mt-2"
                :style="{ color: 'var(--accent)' }"
              >Everything in Free, plus more.</p>
              <p
                v-else
                class="text-[12.5px] mt-2 text-muted"
              >Custom pricing for teams.</p>

              <!-- CTA -->
              <div class="mt-7">
                <span
                  v-if="currentTier === plan.id"
                  class="block w-full text-center py-3 rounded-xl text-sm font-medium"
                  :style="{ border: '1px solid var(--accent)', color: 'var(--accent)' }"
                >
                  Current plan
                </span>
                <RouterLink
                  v-else-if="plan.id === 'free'"
                  to="/builder"
                  class="block w-full text-center py-3 rounded-xl border border-overlay/15 text-ink text-sm font-medium hover:bg-overlay/5 transition-colors"
                >
                  Get started free
                </RouterLink>
                <a
                  v-else-if="plan.id === 'enterprise'"
                  href="mailto:hello@resumark.app"
                  class="block w-full text-center py-3 rounded-xl border border-overlay/15 text-ink text-sm font-medium hover:bg-overlay/5 transition-colors"
                >
                  Contact sales
                </a>
                <button
                  v-else
                  type="button"
                  :disabled="isCheckingOut"
                  class="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  :style="{ background: 'var(--accent)', color: '#FFFFFF' }"
                  @click="handleUpgrade(plan.id)"
                >
                  <svg
                    v-if="isCheckingOut"
                    class="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ isCheckingOut ? 'Starting checkout…' : `Upgrade to ${plan.name}` }}
                </button>
              </div>

              <!-- Hairline -->
              <div class="my-7 h-px bg-overlay/10" aria-hidden="true" />

              <!-- Features (sienna circle + checkmark — matches image-6) -->
              <ul class="flex flex-col gap-3.5 flex-1" :aria-label="`${plan.name} features`">
                <li
                  v-for="feature in plan.features"
                  :key="feature"
                  class="flex items-start gap-3 text-[14px] text-muted leading-snug"
                >
                  <span
                    class="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-[2px]"
                    :style="{ background: 'var(--accent-soft)', color: 'var(--accent)' }"
                    aria-hidden="true"
                  >
                    <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span class="text-ink">{{ feature }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Comparison table ─────────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 pb-20 max-w-5xl mx-auto w-full"
        aria-labelledby="compare-heading"
      >
        <div class="flex flex-col md:flex-row gap-8 md:gap-16 mb-10">
          <div class="md:w-1/3 reveal-item">
            <p class="mono-eyebrow">Free vs Pro</p>
          </div>
          <div class="md:w-2/3 reveal-item" style="animation-delay: 80ms">
            <h2
              id="compare-heading"
              class="font-display leading-[1.02] tracking-editorial text-ink"
              :style="{ fontSize: 'clamp(34px, 4.5vw, 56px)' }"
            >
              <span class="accent-italic">Everything</span><span> in one table.</span>
            </h2>
          </div>
        </div>

        <div
          class="rounded-2xl border border-overlay/10 overflow-hidden reveal-item"
          style="background: var(--card)"
        >
          <table class="w-full text-[14px]" role="table">
            <thead>
              <tr class="border-b border-overlay/10">
                <th class="text-left px-5 py-4 mono-eyebrow font-medium w-1/2" scope="col">
                  Feature
                </th>
                <th class="text-center px-4 py-4 mono-eyebrow font-medium" scope="col">
                  Free
                </th>
                <th
                  class="text-center px-4 py-4 mono-eyebrow font-medium"
                  scope="col"
                  style="background: rgba(184,83,42,0.05);
                         background: color-mix(in oklab, var(--accent) 5%, transparent);
                         color: var(--accent)"
                >Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in comparisonRows"
                :key="row[0]"
                class="border-b border-overlay/8 last:border-0 transition-colors hover:bg-overlay/[0.02]"
              >
                <td class="px-5 py-3.5 text-ink">{{ row[0] }}</td>

                <td class="px-4 py-3.5 text-center">
                  <svg v-if="row[1]" class="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.6" :style="{ color: 'var(--accent)' }" aria-label="Included">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span v-else class="text-muted/50" aria-label="Not included">—</span>
                </td>

                <td
                  class="px-4 py-3.5 text-center"
                  style="background: rgba(184,83,42,0.05);
                         background: color-mix(in oklab, var(--accent) 5%, transparent)"
                >
                  <svg v-if="row[2]" class="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.6" :style="{ color: 'var(--accent)' }" aria-label="Included">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span v-else class="text-muted/50" aria-label="Not included">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Teams footer link -->
        <p class="mt-8 text-center mono-eyebrow reveal-item">
          Building for a team?
          <RouterLink to="/teams" class="ml-1 underline underline-offset-4 hover:opacity-70 transition-opacity" style="color: var(--accent)">
            See /teams →
          </RouterLink>
        </p>
      </section>

      <!-- ── FAQ ──────────────────────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 pb-24 max-w-6xl mx-auto w-full"
        aria-labelledby="faq-heading"
      >
        <div class="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-10 md:gap-16">
          <div class="reveal-item">
            <p class="mono-eyebrow mb-4">Questions</p>
            <h2
              id="faq-heading"
              class="font-display leading-[1.02] tracking-editorial text-ink"
              :style="{ fontSize: 'clamp(34px, 4.8vw, 56px)' }"
            >
              <span class="accent-italic">Frequently</span><br /><span>asked.</span>
            </h2>
          </div>

          <div class="flex flex-col">
            <div
              v-for="(item, i) in faq"
              :key="item.q"
              class="reveal-item border-t border-overlay/10 last:border-b"
              :style="{ animationDelay: `${i * 60}ms` }"
            >
              <button
                type="button"
                class="w-full text-left py-5 px-1 flex items-start gap-4"
                :aria-expanded="openFaq === i"
                @click="toggleFaq(i)"
              >
                <span
                  class="font-display text-2xl leading-none transition-transform duration-300 shrink-0 mt-0.5"
                  :style="{ color: 'var(--accent)', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }"
                  aria-hidden="true"
                >+</span>
                <span class="flex-1 text-[16px] font-medium text-ink leading-snug">{{ item.q }}</span>
              </button>
              <!-- Animated reveal via the grid-rows trick — height transitions
                   smoothly from 0 to content without measuring. -->
              <div
                class="grid transition-[grid-template-rows] duration-300 ease-out"
                :style="{ gridTemplateRows: openFaq === i ? '1fr' : '0fr' }"
              >
                <div class="overflow-hidden">
                  <p class="pl-9 pr-1 pb-5 text-[14.5px] leading-[1.6] text-muted">
                    {{ item.a }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Closing CTA ──────────────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 py-24 md:py-32 max-w-6xl mx-auto w-full text-center border-t border-overlay/8"
      >
        <p class="mono-eyebrow mb-8 reveal-item">
          Free forever · No sign-up · Under five minutes
        </p>
        <h2
          class="font-display leading-[1.02] tracking-editorial text-ink mb-12 reveal-item"
          :style="{ fontSize: 'clamp(48px, 8vw, 96px)', animationDelay: '80ms' }"
        >
          Start writing.<br />
          <span class="accent-italic">Upgrade</span><span> later.</span>
        </h2>
        <RouterLink
          to="/builder"
          class="btn-primary text-base reveal-item"
          style="animation-delay: 160ms"
        >
          Start free
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </RouterLink>
      </section>

    </main>

    <AppFooter />
  </div>
</template>
