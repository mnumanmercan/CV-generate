<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { RouterLink } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import UpgradePrompt from '@/components/ui/UpgradePrompt.vue'
  import CVPreviewModal from '@/components/preview/CVPreviewModal.vue'
  import ConfirmModal from '@/components/ui/ConfirmModal.vue'
  import { CV_VARIANT_LIMIT } from '@resumark/shared'
  import { useUserStore } from '@/stores/userStore'
  import { useCVStore } from '@/stores/cvStore'
  import { useI18n } from '@/composables/useI18n'
  import { localStorageService } from '@/services/storageService'
  import {
    getShareStatus,
    createShareLink,
    regenerateShareLink,
    removeShareLink,
    resolveActiveCvId,
    buildShareUrl,
  } from '@/services/cvShareService'

  const { t, t_obj } = useI18n()

  const userStore = useUserStore()
  const cvStore = useCVStore()
  const { cvData, variants, activeVariantId } = storeToRefs(cvStore)

  // Read-only CV preview popup.
  const showPreview = ref(false)

  /* ── CV versions (Pro) ────────────────────────────────────── */

  /**
   * Open a version in the read-only preview. CVPreviewModal renders the
   * store's active document, so switching first is what makes the modal show
   * the row the user clicked — and it leaves them on that version, which is
   * the one "Edit" then opens.
   */
  async function viewVariant(id: string): Promise<void> {
    if (id !== activeVariantId.value) {
      await cvStore.switchVariant(id)
    }
    showPreview.value = true
  }

  /** Which row's share panel is expanded. Null = none. */
  const sharePanelFor = ref<string | null>(null)

  const pendingDeleteId = ref<string | null>(null)
  const pendingDeleteName = computed(
    () => variants.value.find((v) => v.id === pendingDeleteId.value)?.title ?? '',
  )

  async function confirmDeleteVariant(): Promise<void> {
    const id = pendingDeleteId.value
    pendingDeleteId.value = null
    if (!id) return
    if (sharePanelFor.value === id) sharePanelFor.value = null
    try {
      await cvStore.deleteVariant(id)
    } catch {
      /* non-fatal */
    }
  }

  function relativeTime(iso: string | undefined): string {
    if (!iso) return t('dashboard.lastSavedNever')
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 1) return t('dashboard.lastSavedJustNow')
    if (mins < 60) return t('dashboard.lastSavedMins', { n: String(mins) })
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return t('dashboard.lastSavedHours', { n: String(hrs) })
    return t('dashboard.lastSavedDays', { n: String(Math.floor(hrs / 24)) })
  }

  /* ── Public share link (Pro) ──────────────────────────────── */
  const shareCvId = ref<string | null>(null)
  const shareSlug = ref<string | null>(null)
  const shareBusy = ref(false)
  const shareError = ref(false)
  const justCopied = ref(false)

  const shareUrl = computed(() => (shareSlug.value ? buildShareUrl(shareSlug.value) : ''))

  /**
   * Expand (or collapse) one row's share panel and load that row's link state.
   *
   * Share state is per-row now that a user holds several CV versions — each row
   * has its own `shareSlug`, so the panel is bound to whichever row is open
   * rather than to "the" CV.
   */
  async function openSharePanel(id: string): Promise<void> {
    // Collapse when the same row is clicked again.
    if (sharePanelFor.value === id) {
      sharePanelFor.value = null
      return
    }
    sharePanelFor.value = id
    shareCvId.value = id
    shareSlug.value = null
    shareError.value = false
    try {
      shareSlug.value = (await getShareStatus(id)).slug
    } catch {
      // Non-fatal — the panel falls back to its "create link" state.
    }
  }

  onMounted(async () => {
    // Hydrate the store from the active backend so the cards and the preview
    // reflect the user's real, current CV (a direct refresh into /dashboard
    // would otherwise show empty in-memory defaults).
    try {
      await cvStore.loadFromStorage()
    } catch {
      // Cloud load failed (offline / rate-limited). The cards fall back to
      // whatever is already in the store — nothing else to do here, and we
      // must not let the rejection surface as an uncaught promise error.
    }

    // Populate the version list — a slim id/title/updatedAt read, no content.
    await cvStore.loadVariants()

    // Share state is NOT fetched here any more. No panel is open on mount, and
    // with one share link per version there is no single link to preload —
    // openSharePanel() fetches the state for the row the user actually opens.
  })

  // Resolve the active CV id on demand. Prefers the id the storage layer already
  // knows; otherwise asks the API. Caches the result so we resolve at most once.
  async function ensureCvId(): Promise<string | null> {
    if (shareCvId.value) return shareCvId.value
    const cached = localStorageService.getActiveId()
    if (cached) {
      shareCvId.value = cached
      return cached
    }
    const fetched = await resolveActiveCvId()
    shareCvId.value = fetched
    return fetched
  }

  async function runShareAction(fn: (id: string) => Promise<unknown>): Promise<void> {
    if (shareBusy.value) return
    shareBusy.value = true
    shareError.value = false
    try {
      const id = await ensureCvId()
      if (!id) {
        shareError.value = true
        return
      }
      await fn(id)
    } catch {
      shareError.value = true
    } finally {
      shareBusy.value = false
    }
  }

  function onCreateShare(): void {
    void runShareAction(async (id) => {
      shareSlug.value = (await createShareLink(id)).slug
    })
  }

  function onRegenerateShare(): void {
    void runShareAction(async (id) => {
      shareSlug.value = (await regenerateShareLink(id)).slug
    })
  }

  function onTurnOffShare(): void {
    void runShareAction(async (id) => {
      await removeShareLink(id)
      shareSlug.value = null
    })
  }

  async function copyShareUrl(): Promise<void> {
    if (!shareUrl.value) return
    try {
      await navigator.clipboard.writeText(shareUrl.value)
      justCopied.value = true
      setTimeout(() => (justCopied.value = false), 1500)
    } catch {
      shareError.value = true
    }
  }

  /* ── Last saved relative time ─────────────────────────────── */
  const lastSavedLabel = computed(() => {
    const ts = cvData.value.meta.updatedAt
    if (!ts) return t('dashboard.lastSavedNever')
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t('dashboard.lastSavedJustNow')
    if (mins < 60) return t('dashboard.lastSavedMins', { n: String(mins) })
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return t('dashboard.lastSavedHours', { n: String(hrs) })
    return t('dashboard.lastSavedDays', { n: String(Math.floor(hrs / 24)) })
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
    if (id === 'classic') return 'Classic'
    if (id === 'modern') return 'Modern'
    if (id === 'technical') return 'Technical'
    return 'Classic'
  })

  /* ── Locked Pro features (Free) ───────────────────────────── */
  const lockedFeatures = computed(() => [
    {
      glyph: '◊',
      title: t('dashboard.cloudSyncTitle'),
      desc: t('dashboard.cloudSyncDesc'),
      trigger: 'Cloud Sync',
    },
    {
      glyph: '▦',
      title: t('dashboard.multipleCvsTitle'),
      desc: t('dashboard.multipleCvsDesc'),
      trigger: 'Multiple CVs',
    },
    {
      glyph: '⇪',
      title: t('share.proOnlyTitle'),
      desc: t('share.proOnlyDesc'),
      trigger: 'Share Link',
    },
  ])

  const coverLetterHeading = computed(() =>
    t_obj<{ prefix: string; accent: string; suffix: string }>('dashboard.coverLetterHeading'),
  )
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <AppHeader />

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
      <!-- ── Welcome row ──────────────────────────────────────── -->
      <div class="mb-10 stagger-item">
        <p class="mono-eyebrow mb-3">
          {{ userStore.isPremium ? t('dashboard.planPro') : t('dashboard.planFree') }}
        </p>
        <h1
          class="font-display leading-[1.05] tracking-editorial text-ink mb-2 flex items-baseline flex-wrap gap-x-3"
          :style="{ fontSize: 'clamp(36px, 5vw, 52px)' }"
        >
          <span>{{ t('dashboard.welcomePrefix') }}</span>
          <span class="accent-italic">{{
            userStore.user?.name?.split(' ')[0] ?? t('dashboard.welcomeFallback')
          }}</span>
          <span class="text-ink">.</span>
        </h1>
        <p class="text-muted text-[14.5px] leading-[1.55] max-w-xl">
          {{ userStore.isPremium ? t('dashboard.welcomeDescPro') : t('dashboard.welcomeDescFree') }}
        </p>
      </div>

      <!-- ══════════════ FREE PLAN ══════════════ -->
      <template v-if="!userStore.isPremium">
        <!-- CV card — single full-width row -->
        <div class="paper-card p-5 sm:p-6 mb-10 stagger-item">
          <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <span
              class="font-display text-[28px] leading-none shrink-0"
              :style="{ color: 'var(--accent)' }"
              aria-hidden="true"
              >◉</span
            >

            <div class="flex-1 min-w-0">
              <div class="flex items-baseline justify-between gap-3 mb-0.5">
                <h2
                  class="font-display text-[20px] leading-[1.15] tracking-editorial text-ink truncate"
                >
                  {{ cvData.personal.fullName || t('dashboard.yourCv') }}
                </h2>
                <span class="mono-eyebrow text-[10.5px] shrink-0">{{ lastSavedLabel }}</span>
              </div>
              <p class="mono-eyebrow text-[10.5px] mb-3">
                {{ templateLabel }} ·
                {{ t('dashboard.sectionsLabel', { n: String(completedSections) }) }}
              </p>
              <div class="h-[3px] rounded-full" style="background: rgba(0, 0, 0, 0.08)">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{
                    width: `${Math.round((completedSections / 8) * 100)}%`,
                    background: 'var(--accent)',
                  }"
                />
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button type="button" class="btn-ghost text-[13px]" @click="showPreview = true">
                {{ t('dashboard.viewCv') }}
              </button>
              <RouterLink to="/builder" class="btn-primary text-[13px]">
                {{ t('dashboard.editCv') }}
                <svg
                  class="w-3.5 h-3.5"
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
            </div>
          </div>
        </div>

        <!-- Unlock with Pro — Pro Plan card wraps the feature subcards -->
        <div class="stagger-item">
          <p class="mono-eyebrow mb-4">{{ t('dashboard.unlock') }}</p>

          <!-- Pro Plan container card (full width) -->
          <div class="paper-card p-5 relative">
            <!-- Soon badge -->
            <div
              class="absolute -top-3 right-5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold tracking-[0.16em] uppercase shadow-md"
              style="background: var(--accent); color: #ffffff; white-space: nowrap"
              aria-label="Coming soon"
            >
              {{ t('dashboard.proCardBadge') }}
            </div>

            <!-- Header row — single line -->
            <div class="flex items-center gap-4 mb-5">
              <span
                class="font-display text-[24px] leading-none shrink-0"
                :style="{ color: 'var(--accent)' }"
                aria-hidden="true"
                >✦</span
              >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <h3 class="font-display text-[17px] leading-tight text-ink">
                    {{ t('dashboard.proCardName') }}
                  </h3>
                  <span
                    class="mono-eyebrow text-[9px] px-1.5 py-px rounded-full text-white leading-none"
                    :style="{ background: 'var(--accent)' }"
                    >Pro</span
                  >
                </div>
                <p class="text-[13px] text-muted leading-none">
                  {{ t('dashboard.proCardDesc') }}
                </p>
              </div>
              <button
                type="button"
                class="btn-ghost shrink-0 text-[13px]"
                @click="userStore.openUpgradeModal('pro plan')"
              >
                {{ t('dashboard.getNotified') }}
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
                    >{{ feat.glyph }}</span
                  >
                  <h4 class="font-display text-[15px] leading-tight text-ink">{{ feat.title }}</h4>
                  <span
                    class="mono-eyebrow text-[9px] px-1.5 py-px rounded-full text-white leading-none"
                    :style="{ background: 'var(--accent)' }"
                    >Pro</span
                  >
                </div>
                <p class="text-[12.5px] text-muted leading-[1.55]">{{ feat.desc }}</p>
                <button
                  type="button"
                  class="mono-eyebrow text-[10.5px] text-left transition-colors hover:opacity-80"
                  :style="{ color: 'var(--accent)' }"
                  @click="userStore.openUpgradeModal(feat.trigger)"
                >
                  {{ t('dashboard.getNotified') }} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ══════════════ PRO PLAN ══════════════ -->
      <template v-else>
        <!--
          CV versions — one row per tailored CV. Each row is a complete,
          independently shareable document, so share state is per-row rather
          than one panel for "the" CV.
        -->
        <div class="mb-10 stagger-item">
          <div class="flex items-baseline justify-between gap-3 mb-4">
            <p class="mono-eyebrow">{{ t('builder.variants.eyebrow') }}</p>
            <span class="mono-eyebrow text-[10px] text-muted">
              {{ variants.length }} / {{ CV_VARIANT_LIMIT }}
            </span>
          </div>

          <div class="flex flex-col gap-3">
            <!--
              Fallback when the version list is unavailable (offline, or the
              slim GET /cv was rate-limited). Without it a Pro user would land
              on a dashboard with no CV card at all — worse than the single
              card this replaced.
            -->
            <div v-if="variants.length === 0" class="paper-card p-5">
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <span
                  class="font-display text-[24px] leading-none shrink-0"
                  :style="{ color: 'var(--accent)' }"
                  aria-hidden="true"
                  >◉</span
                >
                <div class="flex-1 min-w-0">
                  <h2
                    class="font-display text-[19px] leading-[1.15] tracking-editorial text-ink truncate"
                  >
                    {{ cvData.personal.fullName || t('dashboard.yourCv') }}
                  </h2>
                  <p class="mono-eyebrow text-[10.5px]">{{ lastSavedLabel }}</p>
                </div>
                <RouterLink to="/builder" class="btn-primary text-[12.5px] shrink-0">
                  {{ t('dashboard.editCv') }}
                </RouterLink>
              </div>
            </div>

            <div v-for="variant in variants" :key="variant.id" class="paper-card p-5">
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <span
                  class="font-display text-[24px] leading-none shrink-0"
                  :style="{
                    color: variant.id === activeVariantId ? 'var(--accent)' : 'var(--muted)',
                  }"
                  aria-hidden="true"
                  >◉</span
                >

                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline gap-2 mb-0.5">
                    <h2
                      class="font-display text-[19px] leading-[1.15] tracking-editorial text-ink truncate"
                    >
                      {{ variant.title || t('dashboard.yourCv') }}
                    </h2>
                    <span
                      v-if="variant.id === activeVariantId"
                      class="mono-eyebrow text-[9px] px-1.5 py-px rounded-full text-white leading-none shrink-0"
                      :style="{ background: 'var(--accent)' }"
                      >●</span
                    >
                  </div>
                  <p class="mono-eyebrow text-[10.5px]">{{ relativeTime(variant.updatedAt) }}</p>
                </div>

                <div class="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    class="btn-ghost text-[12.5px]"
                    @click="viewVariant(variant.id)"
                  >
                    {{ t('dashboard.viewCv') }}
                  </button>
                  <button
                    type="button"
                    class="btn-ghost text-[12.5px]"
                    :aria-expanded="sharePanelFor === variant.id"
                    @click="openSharePanel(variant.id)"
                  >
                    {{ t('share.panelTitle') }}
                  </button>
                  <button
                    v-if="variants.length > 1"
                    type="button"
                    class="btn-ghost text-[12.5px]"
                    :aria-label="t('builder.variants.deleteLabel')"
                    @click="pendingDeleteId = variant.id"
                  >
                    ✕
                  </button>
                  <RouterLink :to="`/builder/${variant.id}`" class="btn-primary text-[12.5px]">
                    {{ t('dashboard.editCv') }}
                    <svg
                      class="w-3.5 h-3.5"
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
                </div>
              </div>

              <!-- Per-row share link panel -->
              <div v-if="sharePanelFor === variant.id" class="mt-4 pt-4 border-t border-overlay/10">
                <p class="text-[12.5px] text-muted leading-[1.55] mb-3">
                  {{ t('share.panelDesc') }}
                </p>

                <button
                  v-if="!shareSlug"
                  type="button"
                  class="btn-primary text-[12.5px]"
                  :disabled="shareBusy"
                  @click="onCreateShare"
                >
                  {{ shareBusy ? t('share.creating') : t('share.create') }}
                </button>

                <div v-else class="flex flex-col gap-2.5">
                  <label class="mono-eyebrow text-[10.5px]">{{ t('share.linkLabel') }}</label>
                  <div class="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      readonly
                      :value="shareUrl"
                      class="flex-1 min-w-0 rounded-lg px-3 py-2 text-[13px] text-ink border border-overlay/15 bg-[var(--paper)] focus:outline-none focus:border-[var(--accent)]"
                      @focus="($event.target as HTMLInputElement).select()"
                    />
                    <button
                      type="button"
                      class="btn-primary text-[13px] justify-center shrink-0"
                      @click="copyShareUrl"
                    >
                      {{ justCopied ? t('share.copied') : t('share.copy') }}
                    </button>
                  </div>
                  <p class="text-[12px] text-muted leading-[1.5]">{{ t('share.activeHint') }}</p>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="btn-ghost text-[12.5px]"
                      :disabled="shareBusy"
                      @click="onRegenerateShare"
                    >
                      {{ t('share.regenerate') }}
                    </button>
                    <button
                      type="button"
                      class="btn-ghost text-[12.5px]"
                      :disabled="shareBusy"
                      @click="onTurnOffShare"
                    >
                      {{ t('share.turnOff') }}
                    </button>
                  </div>
                </div>

                <p v-if="shareError" class="text-[12.5px] mt-3" style="color: var(--accent)">
                  {{ t('share.error') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-10 stagger-item">
          <!-- Cover Letter card -->
          <div class="paper-card p-6 flex flex-col justify-between">
            <div>
              <span
                class="font-display text-[26px] leading-none block mb-4"
                :style="{ color: 'var(--accent)' }"
                aria-hidden="true"
                >✎</span
              >
              <p class="mono-eyebrow mb-2">{{ t('dashboard.coverLetterEyebrow') }}</p>
              <h2 class="font-display text-[22px] leading-[1.15] tracking-editorial text-ink mb-2">
                {{ coverLetterHeading.prefix
                }}<span class="accent-italic">{{ coverLetterHeading.accent }}</span
                >{{ coverLetterHeading.suffix }}
              </h2>
              <p class="text-[13.5px] text-muted mb-5 leading-[1.55]">
                {{ t('dashboard.coverLetterDesc') }}
              </p>
            </div>
            <RouterLink to="/cover-letter" class="btn-primary justify-center text-[13px]">
              {{ t('dashboard.coverLetterButton') }}
              <svg
                class="w-3.5 h-3.5"
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
          </div>
        </div>

        <!-- Stats row -->
        <div class="stagger-item">
          <p class="mono-eyebrow mb-4">{{ t('dashboard.statsEyebrow') }}</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div
              v-for="stat in [
                { label: t('dashboard.statsCvsCreated'), value: String(variants.length || 1) },
                { label: t('dashboard.statsCoverLetters'), value: '—' },
                { label: t('dashboard.statsPdfDownloads'), value: '—' },
              ]"
              :key="stat.label"
              class="paper-card px-5 py-5 text-center"
            >
              <p class="font-display text-[36px] leading-none tracking-editorial text-ink mb-1.5">
                {{ stat.value }}
              </p>
              <p class="mono-eyebrow text-[10.5px]">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </template>
    </main>

    <CVPreviewModal :visible="showPreview" @close="showPreview = false" />

    <ConfirmModal
      :visible="pendingDeleteId !== null"
      :title="t('builder.variants.deleteTitle', { name: pendingDeleteName })"
      :message="t('builder.variants.deleteMessage')"
      :confirm-label="t('builder.variants.deleteConfirm')"
      @confirm="confirmDeleteVariant"
      @cancel="pendingDeleteId = null"
    />

    <UpgradePrompt />
  </div>
</template>
