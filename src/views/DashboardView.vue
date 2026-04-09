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
  const cvStore = useCVStore()
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
    return n
  })

  const templateLabel = computed(() => {
    const id = cvData.value.meta.templateId
    if (id === 'classic') return 'Classic'
    if (id === 'modern') return 'Modern'
    if (id === 'technical') return 'Technical'
    return 'Classic'
  })

  /* ── Locked Pro features (Free) ───────────────────────────── */
  const lockedFeatures = [
    {
      icon: '✍️',
      title: 'Cover Letter Generator',
      desc: 'Write targeted cover letters for each application',
      route: '/cover-letter',
    },
    {
      icon: '☁️',
      title: 'Cloud Sync',
      desc: 'Access your CV from any device, anytime',
      route: '/pricing',
    },
    {
      icon: '📄',
      title: 'Multiple CVs',
      desc: 'Create tailored CVs for different roles',
      route: '/pricing',
    },
  ]
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-shell)">
    <AppHeader />

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-10">

      <!-- ── Welcome row ──────────────────────────────────────── -->
      <div class="flex items-center gap-3 mb-8 stagger-item">
        <div>
          <h1 class="text-2xl font-bold text-primary flex items-center gap-2.5">
            Welcome back, {{ userStore.user?.name ?? 'there' }}
            <span
              v-if="userStore.isPremium"
              class="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style="background: linear-gradient(135deg, #0891B2, #0D9488)"
            >Pro</span>
          </h1>
          <p class="text-secondary text-sm mt-0.5">
            {{ userStore.isPremium ? 'You have full access to all Pro features.' : 'You\'re on the Free plan. Upgrade to unlock more.' }}
          </p>
        </div>
      </div>

      <!-- ══════════════ FREE PLAN ══════════════ -->
      <template v-if="!userStore.isPremium">

        <!-- CV card + quick actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 stagger-item">

          <!-- CV card -->
          <div
            class="rounded-2xl border border-overlay/10 p-6"
            style="background: var(--bg-surface)"
          >
            <div class="flex items-start justify-between mb-4">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style="background: rgba(8,145,178,0.12)"
                aria-hidden="true"
              >📄</div>
              <span class="text-xs text-secondary">{{ lastSavedLabel }}</span>
            </div>
            <h2 class="text-base font-semibold text-primary mb-1">
              {{ cvData.personal.fullName || 'Your CV' }}
            </h2>
            <p class="text-xs text-secondary mb-4">
              Template: {{ templateLabel }} · {{ completedSections }}/7 sections filled
            </p>
            <!-- Progress bar -->
            <div class="h-1.5 rounded-full bg-overlay/10 mb-5 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                style="background: linear-gradient(90deg, #0891B2, #0D9488)"
                :style="{ width: `${Math.round((completedSections / 7) * 100)}%` }"
              />
            </div>
            <div class="flex gap-2">
              <RouterLink
                to="/builder"
                class="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium border border-overlay/10 text-secondary hover:text-primary hover:border-overlay/20 transition-all"
              >Edit CV</RouterLink>
              <button
                type="button"
                :disabled="pdfStatus === 'generating'"
                class="flex-1 shimmer-btn flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-60"
                @click="exportPDF('cv-preview')"
              >
                <svg v-if="pdfStatus === 'generating'" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ pdfStatus === 'generating' ? 'Generating…' : 'Download PDF' }}
              </button>
            </div>
          </div>

          <!-- Upgrade teaser card -->
          <div
            class="rounded-2xl border border-overlay/10 p-6 flex flex-col justify-between"
            style="background: linear-gradient(135deg, rgba(8,145,178,0.07) 0%, var(--bg-surface) 60%, rgba(13,148,136,0.05) 100%)"
          >
            <div>
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4 shrink-0"
                style="background: rgba(8,145,178,0.12)"
                aria-hidden="true"
              >✨</div>
              <h2 class="text-base font-semibold text-primary mb-1">Upgrade to Pro</h2>
              <p class="text-xs text-secondary mb-4 leading-relaxed">
                Cover letters, cloud sync, multiple CVs, premium templates, and profile photo upload — all for $9/month.
              </p>
            </div>
            <RouterLink
              to="/pricing"
              class="shimmer-btn flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-all"
            >
              View Pro Plans
              <svg class="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </RouterLink>
          </div>
        </div>

        <!-- Locked Pro features -->
        <div class="stagger-item">
          <h2 class="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Unlock with Pro</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              v-for="feat in lockedFeatures"
              :key="feat.title"
              class="feature-card rounded-xl p-4 flex flex-col gap-3"
            >
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                style="background: rgba(8,145,178,0.10)"
                aria-hidden="true"
              >{{ feat.icon }}</div>
              <div>
                <div class="flex items-center gap-1.5 mb-0.5">
                  <h3 class="text-sm font-semibold text-primary">{{ feat.title }}</h3>
                  <span class="text-[9px] font-bold px-1.5 py-px rounded-full text-white leading-none" style="background: linear-gradient(135deg, #0891B2, #0D9488)">Pro</span>
                </div>
                <p class="text-xs text-secondary">{{ feat.desc }}</p>
              </div>
              <RouterLink
                :to="feat.route"
                class="mt-auto text-xs font-semibold transition-colors hover:opacity-80"
                style="color: var(--accent)"
              >Upgrade to unlock →</RouterLink>
            </div>
          </div>
        </div>

      </template>

      <!-- ══════════════ PRO PLAN ══════════════ -->
      <template v-else>

        <!-- Two main cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 stagger-item">

          <!-- CV card -->
          <div
            class="rounded-2xl border border-overlay/10 p-6"
            style="background: var(--bg-surface)"
          >
            <div class="flex items-start justify-between mb-4">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style="background: rgba(8,145,178,0.12)"
                aria-hidden="true"
              >📄</div>
              <span class="text-xs text-secondary">{{ lastSavedLabel }}</span>
            </div>
            <h2 class="text-base font-semibold text-primary mb-1">
              {{ cvData.personal.fullName || 'Your CV' }}
            </h2>
            <p class="text-xs text-secondary mb-4">
              Template: {{ templateLabel }} · {{ completedSections }}/7 sections filled
            </p>
            <div class="h-1.5 rounded-full bg-overlay/10 mb-5 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                style="background: linear-gradient(90deg, #0891B2, #0D9488)"
                :style="{ width: `${Math.round((completedSections / 7) * 100)}%` }"
              />
            </div>
            <div class="flex gap-2">
              <RouterLink
                to="/builder"
                class="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium border border-overlay/10 text-secondary hover:text-primary hover:border-overlay/20 transition-all"
              >Edit CV</RouterLink>
              <button
                type="button"
                :disabled="pdfStatus === 'generating'"
                class="flex-1 shimmer-btn flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-60"
                @click="exportPDF('cv-preview')"
              >
                <svg v-if="pdfStatus === 'generating'" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ pdfStatus === 'generating' ? 'Generating…' : 'Download PDF' }}
              </button>
            </div>
          </div>

          <!-- Cover Letter card -->
          <div
            class="rounded-2xl border border-overlay/10 p-6 flex flex-col justify-between"
            style="background: linear-gradient(135deg, rgba(8,145,178,0.07) 0%, var(--bg-surface) 60%, rgba(13,148,136,0.05) 100%)"
          >
            <div>
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4 shrink-0"
                style="background: rgba(8,145,178,0.12)"
                aria-hidden="true"
              >✍️</div>
              <h2 class="text-base font-semibold text-primary mb-1">Cover Letter</h2>
              <p class="text-xs text-secondary mb-4 leading-relaxed">
                Craft a tailored cover letter that matches your CV and stands out to hiring managers.
              </p>
            </div>
            <RouterLink
              to="/cover-letter"
              class="shimmer-btn flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-all"
            >
              Open Cover Letter
              <svg class="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </RouterLink>
          </div>
        </div>

        <!-- Stats row -->
        <div class="stagger-item">
          <h2 class="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Your Stats</h2>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="stat in [
                { label: 'CVs Created', value: '1' },
                { label: 'Cover Letters', value: '—' },
                { label: 'PDF Downloads', value: '—' },
              ]"
              :key="stat.label"
              class="rounded-xl border border-overlay/10 px-5 py-4 text-center"
              style="background: var(--bg-surface)"
            >
              <p class="text-2xl font-bold text-primary mb-0.5">{{ stat.value }}</p>
              <p class="text-xs text-secondary">{{ stat.label }}</p>
            </div>
          </div>
        </div>

      </template>
    </main>
  </div>
</template>
