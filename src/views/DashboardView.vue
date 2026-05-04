<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { RouterLink } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import UpgradePrompt from '@/components/ui/UpgradePrompt.vue'
  import { useUserStore } from '@/stores/userStore'
  import { useCVStore } from '@/stores/cvStore'

  onMounted(() => {
    document.title = 'Dashboard — Resumark'
  })

  const userStore = useUserStore()
  const cvStore   = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  /* ── Last saved relative time ─────────────────────────────── */
  const lastSavedLabel = computed(() => {
    const ts = cvData.value.meta.updatedAt
    if (!ts) return 'Never'
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  })

  /* ── Section completion count ─────────────────────────────── */
  const completedSections = computed(() => {
    const p = cvData.value.personal
    let n = 0
    if (p.fullName && p.email && p.phone && p.location && p.jobTitle) n++
    if (cvData.value.summary.trim().length >= 50) n++
    if (cvData.value.experience.length > 0) n++
    if (cvData.value.education.length > 0) n++
    if (cvData.value.skills.length > 0) n++
    if (cvData.value.projects.length > 0) n++
    if (cvData.value.certifications.length > 0) n++
    if (cvData.value.languages.length > 0) n++
    return n
  })

  const templateLabel = computed(() => {
    const id = cvData.value.meta.templateId
    if (id === 'classic')   return 'Classic'
    if (id === 'modern')    return 'Modern'
    if (id === 'technical') return 'Technical'
    return 'Classic'
  })

  /* ── Locked Pro features (Free) ───────────────────────────── */
  const lockedFeatures = [
    {
      glyph:   '◊',
      title:   'Cloud Sync',
      desc:    'Access your CV from any device, anytime',
      trigger: 'Cloud Sync',
    },
    {
      glyph:   '▦',
      title:   'Multiple CVs',
      desc:    'Create tailored CVs for different roles',
      trigger: 'Multiple CVs',
    },
  ]
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <AppHeader />

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-12">

      <!-- ── Welcome row ──────────────────────────────────────── -->
      <div class="mb-10 stagger-item">
        <p class="mono-eyebrow mb-3">
          {{ userStore.isPremium ? 'Pro Member' : 'Free Plan' }}
        </p>
        <h1
          class="font-display leading-[1.05] tracking-editorial text-ink mb-2 flex items-baseline flex-wrap gap-x-3"
          :style="{ fontSize: 'clamp(36px, 5vw, 52px)' }"
        >
          <span>Welcome back,</span>
          <span class="accent-italic">{{ userStore.user?.name?.split(' ')[0] ?? 'there' }}</span>
          <span class="text-ink">.</span>
        </h1>
        <p class="text-muted text-[14.5px] leading-[1.55] max-w-xl">
          {{ userStore.isPremium
            ? 'Full access to every Pro feature — cloud sync, multiple CVs, premium templates, and more.'
            : 'You\'re on the Free plan. Build, polish, and export — upgrade when you need more.' }}
        </p>
      </div>

      <!-- ══════════════ FREE PLAN ══════════════ -->
      <template v-if="!userStore.isPremium">

        <!-- CV card — single full-width row -->
        <div class="paper-card p-6 mb-10 stagger-item">
          <div class="flex items-center gap-5">
            <span
              class="font-display text-[28px] leading-none shrink-0"
              :style="{ color: 'var(--accent)' }"
              aria-hidden="true"
            >◉</span>

            <div class="flex-1 min-w-0">
              <div class="flex items-baseline justify-between gap-3 mb-0.5">
                <h2 class="font-display text-[20px] leading-[1.15] tracking-editorial text-ink truncate">
                  {{ cvData.personal.fullName || 'Your CV' }}
                </h2>
                <span class="mono-eyebrow text-[10.5px] shrink-0">{{ lastSavedLabel }}</span>
              </div>
              <p class="mono-eyebrow text-[10.5px] mb-3">
                {{ templateLabel }} · {{ completedSections }}/8 sections filled
              </p>
              <div class="h-[3px] rounded-full" style="background: rgba(0,0,0,0.08)">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{ width: `${Math.round((completedSections / 8) * 100)}%`, background: 'var(--accent)' }"
                />
              </div>
            </div>

            <RouterLink
              to="/builder"
              class="btn-primary shrink-0 text-[13px]"
            >
              Edit CV
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </RouterLink>
          </div>
        </div>

        <!-- Unlock with Pro — Pro Plan card wraps the feature subcards -->
        <div class="stagger-item">
          <p class="mono-eyebrow mb-4">Unlock with Pro</p>

          <!-- Pro Plan container card (full width) -->
          <div class="paper-card p-5 relative">

            <!-- Soon badge -->
            <div
              class="absolute -top-3 right-5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold tracking-[0.16em] uppercase shadow-md"
              style="background: var(--accent); color: #FFFFFF; white-space: nowrap"
              aria-label="Coming soon"
            >
              Soon
            </div>

            <!-- Header row — single line -->
            <div class="flex items-center gap-4 mb-5">
              <span
                class="font-display text-[24px] leading-none shrink-0"
                :style="{ color: 'var(--accent)' }"
                aria-hidden="true"
              >✦</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <h3 class="font-display text-[17px] leading-tight text-ink">Pro Plan</h3>
                  <span
                    class="mono-eyebrow text-[9px] px-1.5 py-px rounded-full text-white leading-none"
                    :style="{ background: 'var(--accent)' }"
                  >Pro</span>
                </div>
                <p class="text-[13px] text-muted leading-none">
                  Cloud sync, multiple CVs, premium templates, and more — coming soon.
                </p>
              </div>
              <button
                type="button"
                class="btn-ghost shrink-0 text-[13px]"
                @click="userStore.openUpgradeModal('pro plan')"
              >
                Get notified
              </button>
            </div>

            <!-- Feature subcards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="feat in lockedFeatures"
                :key="feat.title"
                class="rounded-xl p-4 flex flex-col gap-2.5 border border-overlay/8"
                style="background: var(--paper)"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="font-display text-[20px] leading-none"
                    :style="{ color: 'var(--accent)' }"
                    aria-hidden="true"
                  >{{ feat.glyph }}</span>
                  <h4 class="font-display text-[15px] leading-tight text-ink">{{ feat.title }}</h4>
                  <span
                    class="mono-eyebrow text-[9px] px-1.5 py-px rounded-full text-white leading-none"
                    :style="{ background: 'var(--accent)' }"
                  >Pro</span>
                </div>
                <p class="text-[12.5px] text-muted leading-[1.55]">{{ feat.desc }}</p>
                <button
                  type="button"
                  class="mono-eyebrow text-[10.5px] text-left transition-colors hover:opacity-80"
                  :style="{ color: 'var(--accent)' }"
                  @click="userStore.openUpgradeModal(feat.trigger)"
                >Get notified →</button>
              </div>
            </div>

          </div>
        </div>

      </template>

      <!-- ══════════════ PRO PLAN ══════════════ -->
      <template v-else>

        <!-- Two main cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 stagger-item">

          <!-- CV card -->
          <div class="paper-card p-6">
            <div class="flex items-start justify-between mb-4">
              <span
                class="font-display text-[26px] leading-none"
                :style="{ color: 'var(--accent)' }"
                aria-hidden="true"
              >◉</span>
              <span class="mono-eyebrow text-[10.5px]">{{ lastSavedLabel }}</span>
            </div>
            <h2 class="font-display text-[22px] leading-[1.15] tracking-editorial text-ink mb-1">
              {{ cvData.personal.fullName || 'Your CV' }}
            </h2>
            <p class="mono-eyebrow text-[10.5px] mb-5">
              {{ templateLabel }} · {{ completedSections }}/8 sections filled
            </p>
            <div class="h-[3px] rounded-full mb-6" style="background: rgba(0,0,0,0.08)">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{ width: `${Math.round((completedSections / 8) * 100)}%`, background: 'var(--accent)' }"
              />
            </div>
            <RouterLink
              to="/builder"
              class="btn-primary w-full justify-center text-[13px]"
            >
              Edit CV
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </RouterLink>
          </div>

          <!-- Cover Letter card -->
          <div class="paper-card p-6 flex flex-col justify-between">
            <div>
              <span
                class="font-display text-[26px] leading-none block mb-4"
                :style="{ color: 'var(--accent)' }"
                aria-hidden="true"
              >✎</span>
              <p class="mono-eyebrow mb-2">Cover letter</p>
              <h2 class="font-display text-[22px] leading-[1.15] tracking-editorial text-ink mb-2">
                A second page<br />
                for the <span class="accent-italic">why</span>.
              </h2>
              <p class="text-[13.5px] text-muted mb-5 leading-[1.55]">
                Tailor a letter that matches your CV — same fonts, same tone, same paper.
              </p>
            </div>
            <RouterLink to="/cover-letter" class="btn-primary justify-center text-[13px]">
              Open Cover Letter
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </RouterLink>
          </div>
        </div>

        <!-- Stats row -->
        <div class="stagger-item">
          <p class="mono-eyebrow mb-4">Your stats</p>
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="stat in [
                { label: 'CVs Created',   value: '1' },
                { label: 'Cover Letters', value: '—' },
                { label: 'PDF Downloads', value: '—' },
              ]"
              :key="stat.label"
              class="paper-card px-5 py-5 text-center"
            >
              <p class="font-display text-[36px] leading-none tracking-editorial text-ink mb-1.5">{{ stat.value }}</p>
              <p class="mono-eyebrow text-[10.5px]">{{ stat.label }}</p>
            </div>
          </div>
        </div>

      </template>
    </main>

    <UpgradePrompt />
  </div>
</template>
