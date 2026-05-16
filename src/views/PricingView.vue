<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { RouterLink } from 'vue-router'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import AppFooter from '@/components/ui/AppFooter.vue'
  import UpgradePrompt from '@/components/ui/UpgradePrompt.vue'
  import { useUserStore } from '@/stores/userStore'
  import { useScrollReveal } from '@/composables/useScrollReveal'
  import { PLANS, type SubscriptionTier } from '@/composables/useSubscription'
  import { useI18n } from '@/composables/useI18n'

  onMounted(() => {
    document.title = 'Pricing — Resumark'
  })

  const { t, t_obj } = useI18n()
  const { vReveal } = useScrollReveal()
  const userStore = useUserStore()
  const currentTier = computed<SubscriptionTier>(() => (userStore.isPremium ? 'pro' : 'free'))
  const billingPeriod = ref<'monthly' | 'annual'>('monthly')

  const pricingHeading = computed(() =>
    t_obj<{ prefix: string; accent: string; suffix: string }>('pricing.heading'),
  )
  const compareHeading = computed(() =>
    t_obj<{ prefix: string; accent: string; suffix: string }>('pricing.compareHeading'),
  )
  const faqHeading = computed(() =>
    t_obj<{ prefix: string; accent: string; suffix: string }>('pricing.faqHeading'),
  )
  const closingHeading = computed(() =>
    t_obj<{ prefix: string; accent: string; suffix: string }>('pricing.closingHeading'),
  )
  const planFeatures = computed<Record<string, string[]>>(() => ({
    free: t_obj<string[]>('pricing.freePlanFeatures'),
    pro: t_obj<string[]>('pricing.proPlanFeatures'),
  }))

  function displayedPrice(price: number): string {
    if (price === 0) return '$0'
    const monthly = billingPeriod.value === 'annual' ? Math.floor(price * 0.8) : price
    return `$${monthly}`
  }

  function annualTotal(price: number): number {
    return Math.floor(price * 0.8) * 12
  }

  /* ── Comparison table rows — sourced from i18n ──────────────────────── */
  type ComparisonRow = [string, boolean, boolean]

  const comparisonAvailability: [boolean, boolean][] = [
    [true, true],
    [true, true],
    [true, true],
    [true, true],
    [true, true],
    [true, true],
    [false, true],
    [false, true],
    [false, true],
    [false, true],
  ]

  const comparisonRows = computed<ComparisonRow[]>(() => {
    const labels = t_obj<string[]>('pricing.comparisonRows')
    return labels.map((label, i) => [label, ...comparisonAvailability[i]!] as ComparisonRow)
  })

  /* ── FAQ — sourced from i18n ──────────────────────────────────────────── */
  const faq = computed(() => t_obj<Array<{ q: string; a: string }>>('pricing.faqItems'))

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
          <span
            class="w-1.5 h-1.5 rounded-full"
            :style="{ background: 'var(--accent)' }"
            aria-hidden="true"
          />
          <span class="mono-eyebrow">{{ t('pricing.eyebrow') }}</span>
        </div>

        <h1
          class="font-display leading-[1.02] tracking-editorial text-ink stagger-item"
          :style="{ fontSize: 'clamp(48px, 7.4vw, 96px)', animationDelay: '60ms' }"
        >
          {{ pricingHeading.prefix }}<span class="accent-italic">{{ pricingHeading.accent }}</span
          >{{ pricingHeading.suffix }}
        </h1>

        <p
          class="mt-7 max-w-xl mx-auto text-[18px] leading-[1.55] text-muted stagger-item"
          style="animation-delay: 120ms"
        >
          {{ t('pricing.lede') }}
        </p>

        <!-- Billing toggle -->
        <div
          class="inline-flex items-center mt-10 p-1 rounded-full border border-overlay/10 stagger-item"
          style="background: var(--card); animation-delay: 180ms"
          role="group"
          :aria-label="t('aria.billingPeriod')"
        >
          <button
            type="button"
            class="px-5 py-2 rounded-full text-sm font-medium transition-all"
            :class="billingPeriod === 'monthly' ? '' : 'text-muted hover:text-ink'"
            :style="
              billingPeriod === 'monthly' ? { background: 'var(--ink)', color: 'var(--paper)' } : {}
            "
            @click="billingPeriod = 'monthly'"
          >
            {{ t('pricing.billingMonthly') }}
          </button>
          <button
            type="button"
            class="px-5 py-2 rounded-full text-sm font-medium transition-all inline-flex items-center gap-2"
            :class="billingPeriod === 'annual' ? '' : 'text-muted hover:text-ink'"
            :style="
              billingPeriod === 'annual' ? { background: 'var(--ink)', color: 'var(--paper)' } : {}
            "
            @click="billingPeriod = 'annual'"
          >
            {{ t('pricing.billingAnnual') }}
            <span
              class="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
              :style="{ background: 'var(--accent-soft)', color: 'var(--accent)' }"
              >−20%</span
            >
          </button>
        </div>
      </section>

      <!-- ── Plan cards ───────────────────────────────────────────────── -->
      <section v-reveal class="px-6 pb-20 max-w-3xl mx-auto w-full" aria-label="Pricing plans">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div
            v-for="(plan, i) in PLANS.filter((p) => p.id !== 'enterprise')"
            :key="plan.id"
            class="relative reveal-item flex"
            :style="{ animationDelay: `${i * 70}ms` }"
          >
            <!-- The actual paper card. Pro is scaled 1.02 and gets a sienna
                 border + tinted shadow so it pops out of the row visually. -->
            <div
              class="paper-card relative w-full p-6 sm:p-8 flex flex-col"
              :style="
                currentTier === plan.id
                  ? {
                      border: '1.5px solid var(--accent)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                    }
                  : plan.id === 'pro'
                    ? { boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }
                    : {}
              "
            >
              <!-- Soon badge -->
              <div
                v-if="plan.id === 'pro'"
                class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[13px] font-mono font-semibold tracking-[0.16em] uppercase shadow-md"
                style="background: var(--accent); color: #ffffff; white-space: nowrap"
                aria-label="Coming soon"
              >
                {{ t('dashboard.proCardBadge') }}
              </div>

              <!-- Plan identity -->
              <p class="mono-eyebrow mb-3">{{ plan.id }}</p>
              <h2
                class="font-display leading-none tracking-editorial text-ink"
                :style="{ fontSize: 'clamp(34px, 4.2vw, 48px)' }"
              >
                {{ t('pricing.' + plan.id) }}
              </h2>

              <!-- Price -->
              <div class="mt-5 flex items-end gap-2">
                <template v-if="plan.id === 'enterprise'">
                  <span
                    class="font-display leading-none text-ink"
                    :style="{ fontSize: 'clamp(38px, 4.4vw, 56px)', letterSpacing: '-0.02em' }"
                    >Custom</span
                  >
                </template>
                <template v-else>
                  <span
                    class="font-display leading-none text-ink"
                    :style="{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.02em' }"
                    >{{ displayedPrice(plan.price) }}</span
                  >
                  <span v-if="plan.price > 0" class="text-muted text-sm mb-2">{{
                    t('pricing.perMonth')
                  }}</span>
                </template>
              </div>

              <!-- Annual savings note -->
              <p
                v-if="plan.price > 0 && plan.id !== 'enterprise' && billingPeriod === 'annual'"
                class="text-[12.5px] mt-2"
                :style="{ color: 'var(--accent)' }"
              >
                {{ t('pricing.billedAnnually', { total: String(annualTotal(plan.price)) }) }}
              </p>

              <!-- Plan tagline -->
              <p v-if="plan.id === 'free'" class="text-[12.5px] mt-2 text-muted">
                {{ t('pricing.noCreditCard') }}
              </p>
              <p
                v-else-if="plan.id === 'pro'"
                class="text-[12.5px] mt-2"
                :style="{ color: 'var(--accent)' }"
              >
                {{ t('pricing.everythingInFree') }}
              </p>

              <!-- CTA -->
              <div class="mt-7">
                <span
                  v-if="currentTier === plan.id"
                  class="block w-full text-center py-3 rounded-xl text-sm font-medium"
                  :style="{ border: '1px solid var(--accent)', color: 'var(--accent)' }"
                >
                  {{ t('pricing.currentPlan') }}
                </span>
                <RouterLink
                  v-else-if="plan.id === 'free'"
                  to="/builder"
                  class="block w-full text-center py-3 rounded-xl border border-overlay/15 text-ink text-sm font-medium hover:bg-overlay/5 transition-colors"
                >
                  {{ t('pricing.getStartedFree') }}
                </RouterLink>
                <button
                  v-else-if="plan.id === 'pro'"
                  type="button"
                  class="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  :style="{ background: 'var(--accent)', color: '#FFFFFF' }"
                  @click="userStore.openUpgradeModal('pro plan')"
                >
                  {{ t('pricing.getNotified') }}
                </button>
              </div>

              <!-- Hairline -->
              <div class="my-7 h-px bg-overlay/10" aria-hidden="true" />

              <!-- Features -->
              <ul
                class="flex flex-col gap-3.5 flex-1"
                :aria-label="`${t('pricing.' + plan.id)} features`"
              >
                <li
                  v-for="feature in planFeatures[plan.id] ?? plan.features"
                  :key="feature"
                  class="flex items-start gap-3 text-[14px] text-muted leading-snug"
                >
                  <span
                    class="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-[2px]"
                    :style="{ background: 'var(--accent-soft)', color: 'var(--accent)' }"
                    aria-hidden="true"
                  >
                    <svg
                      class="w-2.5 h-2.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="3.5"
                    >
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
        <div class="text-center mb-10">
          <p class="flex mono-eyebrow mb-5 reveal-item">{{ t('pricing.compareEyebrow') }}</p>
          <h2
            id="compare-heading"
            class="font-display leading-[1.02] tracking-editorial text-ink reveal-item"
            :style="{ fontSize: 'clamp(34px, 4.5vw, 56px)', animationDelay: '80ms' }"
          >
            {{ compareHeading.prefix }}<span class="accent-italic">{{ compareHeading.accent }}</span
            >{{ compareHeading.suffix }}
          </h2>
        </div>

        <div
          class="rounded-2xl border border-overlay/10 overflow-x-auto reveal-item"
          style="background: var(--card)"
        >
          <table class="w-full min-w-[560px] text-[14px]" role="table">
            <thead>
              <tr class="border-b border-overlay/10">
                <th class="text-left px-5 py-4 mono-eyebrow font-medium w-1/2" scope="col">
                  {{ t('pricing.compareFeatureCol') }}
                </th>
                <th class="text-center px-4 py-4 mono-eyebrow font-medium" scope="col">
                  {{ t('pricing.free') }}
                </th>
                <th
                  class="text-center px-4 py-4 mono-eyebrow font-medium"
                  scope="col"
                  style="
                    background: rgba(184, 83, 42, 0.05);
                    background: color-mix(in oklab, var(--accent) 5%, transparent);
                    color: var(--accent);
                  "
                >
                  Pro
                </th>
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
                  <svg
                    v-if="row[1]"
                    class="w-4 h-4 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.6"
                    :style="{ color: 'var(--accent)' }"
                    aria-label="Included"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span v-else class="text-muted/50" aria-label="Not included">—</span>
                </td>

                <td
                  class="px-4 py-3.5 text-center"
                  style="
                    background: rgba(184, 83, 42, 0.05);
                    background: color-mix(in oklab, var(--accent) 5%, transparent);
                  "
                >
                  <svg
                    v-if="row[2]"
                    class="w-4 h-4 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.6"
                    :style="{ color: 'var(--accent)' }"
                    aria-label="Included"
                  >
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
          <RouterLink
            to="/teams"
            class="underline underline-offset-4 hover:opacity-70 transition-opacity"
            style="color: var(--accent)"
          >
            {{ t('pricing.teamsLink') }}
          </RouterLink>
        </p>
      </section>

      <!-- ── FAQ ──────────────────────────────────────────────────────── -->
      <section v-reveal class="px-6 pb-24 max-w-6xl mx-auto w-full" aria-labelledby="faq-heading">
        <div class="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-10 md:gap-16">
          <div class="reveal-item">
            <p class="mono-eyebrow mb-4">{{ t('pricing.faqEyebrow') }}</p>
            <h2
              id="faq-heading"
              class="font-display leading-[1.02] tracking-editorial text-ink"
              :style="{ fontSize: 'clamp(34px, 4.8vw, 56px)' }"
            >
              {{ faqHeading.prefix }}<span class="accent-italic">{{ faqHeading.accent }}</span
              >{{ faqHeading.suffix }}
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
                  class="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center"
                  :style="{ color: 'var(--accent)' }"
                  aria-hidden="true"
                >
                  <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="9.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
                    <rect
                      x="9.25"
                      y="4"
                      width="1.5"
                      height="12"
                      rx="0.75"
                      fill="currentColor"
                      :style="{
                        transform: openFaq === i ? 'scaleY(0)' : 'scaleY(1)',
                        transformOrigin: '10px 10px',
                        transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                      }"
                    />
                  </svg>
                </span>
                <span class="flex-1 text-[16px] font-medium text-ink leading-snug">{{
                  item.q
                }}</span>
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
          {{ t('pricing.closingTagline') }}
        </p>
        <h2
          class="font-display leading-[1.02] tracking-editorial text-ink mb-12 reveal-item"
          :style="{ fontSize: 'clamp(48px, 8vw, 96px)', animationDelay: '80ms' }"
        >
          {{ closingHeading.prefix }}<span class="accent-italic">{{ closingHeading.accent }}</span
          >{{ closingHeading.suffix }}
        </h2>
        <RouterLink
          to="/builder"
          class="btn-primary text-base reveal-item"
          style="animation-delay: 160ms"
        >
          {{ t('pricing.closingButton') }}
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </RouterLink>
      </section>
    </main>

    <AppFooter />
    <UpgradePrompt />
  </div>
</template>
