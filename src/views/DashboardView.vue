<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { RouterLink } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import { useUserStore } from '@/stores/userStore'
  import { useCVStore } from '@/stores/cvStore'
  import { usePDFExport } from '@/composables/usePDFExport'

  onMounted(() => {
    document.title = 'Dashboard — Resumark'
  })

  const userStore = useUserStore()
  const cvStore   = useCVStore()
  const { cvData } = storeToRefs(cvStore)
  const { status: pdfStatus, exportPDF } = usePDFExport()

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
      glyph: '✎',
      title: 'Cover Letter Generator',
      desc: 'Write targeted cover letters for each application',
      route: '/cover-letter',
    },
    {
      glyph: '◊',
      title: 'Cloud Sync',
      desc: 'Access your CV from any device, anytime',
      route: '/pricing',
    },
    {
      glyph: '▦',
      title: 'Multiple CVs',
      desc: 'Create tailored CVs for different roles',
      route: '/pricing',
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
            ? 'Full access to every Pro feature — cover letters, cloud sync, premium templates, and more.'
            : 'You\'re on the Free plan. Build, polish, and export — upgrade when you need more.' }}
        </p>
      </div>

      <!-- ══════════════ FREE PLAN ══════════════ -->
      <template v-if="!userStore.isPremium">

        <!-- CV card + Upgrade teaser -->
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
            <!-- Progress bar -->
            <div class="h-[3px] rounded-full mb-6" style="background: rgba(0,0,0,0.08)">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{ width: `${Math.round((completedSections / 8) * 100)}%`, background: 'var(--accent)' }"
              />
            </div>
            <div class="flex gap-2">
              <RouterLink
                to="/builder"
                class="btn-ghost flex-1 justify-center text-[13px]"
              >Edit CV</RouterLink>
              <button
                type="button"
                :disabled="pdfStatus === 'generating'"
                class="btn-primary flex-1 justify-center text-[13px]"
                @click="exportPDF('cv-preview')"
              >
                <svg v-if="pdfStatus === 'generating'" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span v-else aria-hidden="true">↓</span>
                {{ pdfStatus === 'generating' ? 'Generating…' : 'Download PDF' }}
              </button>
            </div>
          </div>

          <!-- Upgrade teaser card -->
          <div class="paper-card p-6 flex flex-col justify-between">
            <div>
              <span
                class="font-display text-[26px] leading-none block mb-4"
                :style="{ color: 'var(--accent)' }"
                aria-hidden="true"
              >✦</span>
              <p class="mono-eyebrow mb-2">Pro plan</p>
              <h2 class="font-display text-[22px] leading-[1.15] tracking-editorial text-ink mb-2">
                More room <span class="accent-italic">to grow</span>.
              </h2>
              <p class="text-[13.5px] text-muted mb-5 leading-[1.55]">
                Cover letters, cloud sync, multiple CVs, premium templates, and profile photo upload — for $9 a month.
              </p>
            </div>
            <RouterLink to="/pricing" class="btn-primary justify-center text-[13px]">
              View Pro plans
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </RouterLink>
          </div>
        </div>

        <!-- Locked Pro features -->
        <div class="stagger-item">
          <p class="mono-eyebrow mb-4">Unlock with Pro</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="feat in lockedFeatures"
              :key="feat.title"
              class="paper-card p-5 flex flex-col gap-3"
            >
              <span
                class="font-display text-[24px] leading-none"
                :style="{ color: 'var(--accent)' }"
                aria-hidden="true"
              >{{ feat.glyph }}</span>
              <div>
                <div class="flex items-center gap-1.5 mb-1">
                  <h3 class="font-display text-[17px] leading-tight text-ink">{{ feat.title }}</h3>
                  <span
                    class="mono-eyebrow text-[9px] px-1.5 py-px rounded-full text-white leading-none"
                    :style="{ background: 'var(--accent)' }"
                  >Pro</span>
                </div>
                <p class="text-[13px] text-muted leading-[1.55]">{{ feat.desc }}</p>
              </div>
              <RouterLink
                :to="feat.route"
                class="mt-auto mono-eyebrow text-[10.5px] transition-colors hover:opacity-80"
                :style="{ color: 'var(--accent)' }"
              >Upgrade to unlock →</RouterLink>
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
            <div class="flex gap-2">
              <RouterLink
                to="/builder"
                class="btn-ghost flex-1 justify-center text-[13px]"
              >Edit CV</RouterLink>
              <button
                type="button"
                :disabled="pdfStatus === 'generating'"
                class="btn-primary flex-1 justify-center text-[13px]"
                @click="exportPDF('cv-preview')"
              >
                <svg v-if="pdfStatus === 'generating'" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span v-else aria-hidden="true">↓</span>
                {{ pdfStatus === 'generating' ? 'Generating…' : 'Download PDF' }}
              </button>
            </div>
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
                { label: 'CVs Created',    value: '1' },
                { label: 'Cover Letters',  value: '—' },
                { label: 'PDF Downloads',  value: '—' },
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
  </div>
</template>
