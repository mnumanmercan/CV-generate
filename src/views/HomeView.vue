<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { RouterLink } from 'vue-router'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import AppFooter from '@/components/ui/AppFooter.vue'
  import HeroMiniDemo from '@/components/home/HeroMiniDemo.vue'
  import LiveCV from '@/components/home/LiveCV.vue'
  import StepCard from '@/components/home/StepCard.vue'
  import { useScrollReveal } from '@/composables/useScrollReveal'
  import { useAutoSave } from '@/composables/useAutoSave'
  import { useCVStore } from '@/stores/cvStore'
  import { useI18n } from '@/composables/useI18n'
  import { createWorkExperience } from '@/types/cv.types'
  import type { Step } from '@/i18n/index'

  const cvStore = useCVStore()
  const { vReveal } = useScrollReveal()
  const { t, t_obj } = useI18n()

  const steps       = computed(() => t_obj<Step[]>('home.steps'))
  const heroHeading = computed(() => t_obj<{ prefix: string; accent: string; suffix: string }>('home.hero.heading'))
  const ctaHeading  = computed(() => t_obj<{ prefix: string; accent: string; suffix: string }>('home.cta.heading'))

  // Mirror the auto-save loop /builder uses, so edits in HeroMiniDemo
  // persist with the same debounced, fire-and-forget guarantee.
  useAutoSave()

  /**
   * The mini-demo's five fields write straight into cvStore.cvData — the
   * same Pinia slots the Builder reads from. So a visitor who types here
   * will:
   *   • see their input reflected in LiveCV (and persisted to localStorage),
   *   • find the same data already filled in when they navigate to /builder,
   *   • see the form pre-filled again the next time they return to the homepage.
   *
   * `fullName` writes to personal.fullName; the other four to experience[0].*.
   *
   * `ensureExp0()` lazily creates an Experience entry on first edit, and
   * `pruneEmptyExp0()` removes it again the moment ALL its fields go empty —
   * so when a visitor types something then clears it, cvData returns to a
   * genuinely empty state. That's what lets LiveCV's "fully empty → return
   * sample untouched" short-circuit fire and bring back the default mockup.
   */
  function ensureExp0() {
    if (cvStore.cvData.experience.length === 0) {
      cvStore.cvData.experience.push(createWorkExperience())
    }
    // Non-null asserted: ensureExp0 just guaranteed an entry exists.
    return cvStore.cvData.experience[0]!
  }

  function pruneEmptyExp0(): void {
    const exp = cvStore.cvData.experience[0]
    if (!exp) return
    const isEmpty =
      !exp.position.trim() &&
      !exp.company.trim() &&
      !exp.startDate.trim() &&
      !exp.endDate.trim() &&
      !(exp.location ?? '').trim() &&
      exp.bullets.every((b) => !b.trim())
    if (isEmpty) cvStore.cvData.experience.splice(0, 1)
  }

  const demoFullName = computed<string>({
    get: () => cvStore.cvData.personal.fullName,
    set: (v) => { cvStore.cvData.personal.fullName = v },
  })
  const demoRole = computed<string>({
    get: () => cvStore.cvData.experience[0]?.position ?? '',
    set: (v) => {
      ensureExp0().position = v
      pruneEmptyExp0()
    },
  })
  const demoCompany = computed<string>({
    get: () => cvStore.cvData.experience[0]?.company ?? '',
    set: (v) => {
      ensureExp0().company = v
      pruneEmptyExp0()
    },
  })
  const demoStarted = computed<string>({
    get: () => cvStore.cvData.experience[0]?.startDate ?? '',
    set: (v) => {
      ensureExp0().startDate = v
      pruneEmptyExp0()
    },
  })
  const demoHighlight = computed<string>({
    get: () => cvStore.cvData.experience[0]?.bullets?.[0] ?? '',
    set: (v) => {
      const exp = ensureExp0()
      if (exp.bullets.length === 0) exp.bullets.push(v)
      else exp.bullets[0] = v
      pruneEmptyExp0()
    },
  })

  /**
   * Per-page document title + lazy CV-data load. Loading the store on Home
   * mount means the LiveCV preview renders the user's saved data even
   * before they click into /builder — giving the hero a personal feel for
   * returning visitors.
   */
  onMounted(async () => {
    document.title = 'Resumark — Build a Professional Résumé Free'
    if (!cvStore.isLoaded) {
      await cvStore.loadFromStorage()
    }
  })


</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <AppHeader />

    <main class="flex-1 flex flex-col">

      <!-- ── Hero ─────────────────────────────────────────────────────── -->
      <section
        class="px-4 sm:px-6 pt-8 md:pt-14 pb-16 md:pb-28 max-w-7xl mx-auto w-full"
        aria-labelledby="hero-heading"
      >
        <div class="flex flex-col lg:flex-row items-center gap-10 sm:gap-12 lg:gap-10">

          <!-- Left column: copy + mini demo -->
          <div class="w-full shrink-0 lg:w-[44%] lg:max-w-[580px]">
            <!-- Eyebrow -->
            <div class="flex items-center gap-2.5 mb-8 stagger-item">
              <span class="w-1.5 h-1.5 rounded-full" :style="{ background:'var(--accent)' }" aria-hidden="true" />
              <span class="mono-eyebrow">{{ t('home.eyebrow') }}</span>
            </div>

            <!-- Display headline -->
            <h1
              id="hero-heading"
              class="font-display leading-[1.02] tracking-editorial stagger-item"
              :style="{ fontSize:'clamp(38px, 7.4vw, 96px)', animationDelay:'60ms' }"
            >
              <div class="whitespace-normal sm:whitespace-nowrap">
                <span v-if="heroHeading.prefix" class="text-ink">{{ heroHeading.prefix }}</span><span class="accent-italic">{{ heroHeading.accent }}</span><span class="text-ink">{{ heroHeading.suffix }}</span>
              </div>
            </h1>

            <!-- Lede -->
            <p
              class="mt-7 max-w-[540px] text-[18px] leading-[1.55] text-muted stagger-item"
              style="animation-delay: 120ms"
            >
              {{ t('home.hero.lede') }}
            </p>

            <!-- Mini demo -->
            <div class="mt-10 stagger-item" style="animation-delay: 180ms">
              <HeroMiniDemo
                v-model:full-name="demoFullName"
                v-model:role="demoRole"
                v-model:company="demoCompany"
                v-model:started="demoStarted"
                v-model:highlight="demoHighlight"
              />
            </div>

            <!-- Foot line -->
            <p class="mt-6 mono-eyebrow stagger-item" style="animation-delay: 240ms">
              {{ t('home.hero.tagline') }}
            </p>
          </div>

          <!-- Right column: live CV preview -->
          <div class="w-full lg:flex-1 flex justify-center">
            <div
              class="stagger-item w-full flex justify-center"
              style="animation-delay: 100ms"
              aria-hidden="true"
            >
              <LiveCV />
            </div>
          </div>

        </div>
      </section>

      <!-- ── Three steps ──────────────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 py-20 md:py-28 max-w-7xl mx-auto w-full border-t border-overlay/8"
        aria-labelledby="steps-heading"
      >
        <div class="flex flex-col md:flex-row gap-8 md:gap-16 mb-14 md:mb-20">
          <div class="md:w-1/3 reveal-item">
            <p class="mono-eyebrow">{{ t('home.method.eyebrow') }}</p>
          </div>
          <div class="md:w-2/3 reveal-item" style="animation-delay: 80ms">
            <h2
              id="steps-heading"
              class="font-display leading-[1.02] tracking-editorial text-ink"
              :style="{ fontSize:'clamp(40px, 6vw, 80px)' }"
            >
              {{ t_obj<{prefix:string;accent:string;suffix:string}>('home.method.heading').prefix }}<span class="accent-italic">{{ t_obj<{prefix:string;accent:string;suffix:string}>('home.method.heading').accent }}</span>{{ t_obj<{prefix:string;accent:string;suffix:string}>('home.method.heading').suffix }}
            </h2>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
          <StepCard
            v-for="(step, i) in steps"
            :key="step.numeral"
            class="reveal-item"
            :style="{ animationDelay: `${i * 90}ms` }"
            v-bind="step"
          />
        </div>
      </section>

      <!-- ── Closing CTA ──────────────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 py-24 md:py-32 max-w-6xl mx-auto w-full text-center border-t border-overlay/8"
      >
        <p class="mono-eyebrow mb-8 reveal-item">
          {{ t('home.cta.tagline') }}
        </p>

        <h2
          class="font-display leading-[1.02] tracking-editorial text-ink mb-12 reveal-item"
          :style="{ fontSize:'clamp(56px, 9vw, 120px)', animationDelay:'80ms' }"
        >
          {{ ctaHeading.prefix }}<span class="accent-italic">{{ ctaHeading.accent }}</span>{{ ctaHeading.suffix }}
        </h2>

        <RouterLink
          to="/builder"
          class="btn-primary text-base reveal-item"
          style="animation-delay: 160ms"
        >
          {{ t('home.cta.button') }}
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </RouterLink>
      </section>

    </main>

    <AppFooter />
  </div>
</template>
