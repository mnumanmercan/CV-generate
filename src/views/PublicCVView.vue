<script setup lang="ts">
  import { nextTick, onMounted, onUnmounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import CVPreview from '@/components/preview/CVPreview.vue'
  import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
  import ConfirmModal from '@/components/ui/ConfirmModal.vue'
  import { usePDFExport, willOverflow } from '@/composables/usePDFExport'
  import { useI18n } from '@/composables/useI18n'
  import { A4_WIDTH_PX, A4_HEIGHT_PX } from '@/constants/layout'
  import { setPageTitle } from '@/composables/useDocumentTitle'
  import { fetchPublicCV } from '@/services/cvShareService'
  import { ApiError } from '@/services/apiClient'
  import type { CVData } from '@/types/cv.types'

  const route = useRoute()
  const { t } = useI18n()
  const { status: pdfStatus, exportPDF } = usePDFExport()

  // `notFound` is the permanent dead-end (slug never existed / link revoked).
  // `error` is transient (rate-limit, 5xx, network) — recoverable, so we offer
  // a retry instead of wrongly telling the visitor a live link is gone.
  type ViewState = 'loading' | 'ready' | 'notFound' | 'error'
  const state = ref<ViewState>('loading')
  const cv = ref<CVData | null>(null)

  // ── Fit the rigid A4 document (794×1122) into the viewport, never above 1 ────
  // Same approach as CVPreviewModal; usePDFExport neutralizes this transform
  // before capture, so the exported PDF is unaffected.
  const VIEWPORT_MARGIN_PX = 48
  const rootEl = ref<HTMLElement | null>(null)
  const scale = ref(1)
  let observer: ResizeObserver | null = null

  function fit(): void {
    const el = rootEl.value
    if (!el) return
    const availW = el.clientWidth - VIEWPORT_MARGIN_PX
    const availH = el.clientHeight - VIEWPORT_MARGIN_PX
    scale.value = Math.min(1, availW / A4_WIDTH_PX, availH / A4_HEIGHT_PX)
  }

  // Keep the link out of search results — shared CVs are private by intent.
  let robotsMeta: HTMLMetaElement | null = null
  function addNoIndex(): void {
    robotsMeta = document.createElement('meta')
    robotsMeta.name = 'robots'
    robotsMeta.content = 'noindex, nofollow'
    document.head.appendChild(robotsMeta)
  }

  // The export clamps to page 1 — confirm before cutting an overflowing CV.
  const showOverflowConfirm = ref(false)

  async function handleDownload(): Promise<void> {
    if (willOverflow('cv-preview')) {
      showOverflowConfirm.value = true
      return
    }
    await exportPDF('cv-preview')
  }

  async function confirmOverflowDownload(): Promise<void> {
    showOverflowConfirm.value = false
    await exportPDF('cv-preview')
  }

  async function load(): Promise<void> {
    state.value = 'loading'
    const slug = String(route.params.slug ?? '')
    try {
      const data = await fetchPublicCV(slug)
      cv.value = data.content
      state.value = 'ready'
      // Name the tab after whose CV this is — a visitor opening several shared
      // links otherwise gets a row of identical "Shared CV" tabs. Cleared for
      // us on navigation, so it can't outlive this page.
      const owner = data.content.personal.fullName.trim()
      if (owner) setPageTitle(owner)
      await nextTick()
      fit()
      if (typeof ResizeObserver !== 'undefined' && rootEl.value) {
        observer?.disconnect()
        observer = new ResizeObserver(fit)
        observer.observe(rootEl.value)
      }
    } catch (err) {
      // Only a genuine 404 is a permanent dead-end (slug never existed / link
      // revoked). Everything else — 429 rate-limit, 5xx, network, timeout — is
      // transient: surface a retryable error so a temporary hiccup never tells
      // a visitor that a live link is "no longer available".
      if (err instanceof ApiError && err.status === 404) {
        state.value = 'notFound'
      } else {
        if (!(err instanceof ApiError)) console.error('[PublicCVView] load failed:', err)
        state.value = 'error'
      }
    }
  }

  onMounted(() => {
    addNoIndex()
    void load()
  })

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
    if (robotsMeta) document.head.removeChild(robotsMeta)
  })
</script>

<template>
  <div
    ref="rootEl"
    class="fixed inset-0 flex items-center justify-center bg-[var(--paper)] overflow-hidden"
  >
    <!-- Loading -->
    <div v-if="state === 'loading'" class="flex flex-col items-center gap-3 text-[var(--muted)]">
      <LoadingSpinner size="lg" />
      <p class="mono-eyebrow text-xs">{{ t('share.loading') }}</p>
    </div>

    <!-- Dead-end (404 / revoked) -->
    <div
      v-else-if="state === 'notFound'"
      class="flex flex-col items-center gap-4 px-6 text-center max-w-md"
    >
      <h1 class="font-display text-3xl text-[var(--ink)]">{{ t('share.notFoundTitle') }}</h1>
      <p class="text-[var(--muted)]">{{ t('share.notFoundDesc') }}</p>
      <a href="/" class="btn-primary mt-2">{{ t('share.backHome') }}</a>
    </div>

    <!-- Transient error (rate-limit / 5xx / network) — recoverable, offer retry -->
    <div
      v-else-if="state === 'error'"
      class="flex flex-col items-center gap-4 px-6 text-center max-w-md"
    >
      <h1 class="font-display text-3xl text-[var(--ink)]">{{ t('share.errorTitle') }}</h1>
      <p class="text-[var(--muted)]">{{ t('share.errorDesc') }}</p>
      <button type="button" class="btn-primary mt-2" @click="load">{{ t('share.retry') }}</button>
    </div>

    <!-- The shared CV -->
    <div
      v-else
      class="relative"
      :style="{ width: `${A4_WIDTH_PX * scale}px`, height: `${A4_HEIGHT_PX * scale}px` }"
    >
      <!-- Floating download control, top-right of the document -->
      <div class="absolute top-3 right-3 z-10">
        <button
          type="button"
          :disabled="pdfStatus === 'generating'"
          class="h-9 px-4 rounded-full flex items-center gap-2 text-white text-sm font-medium shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          style="background: var(--accent)"
          :aria-label="t('aria.downloadCv')"
          @click="handleDownload"
        >
          <LoadingSpinner v-if="pdfStatus === 'generating'" size="sm" />
          <svg
            v-else
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
              d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14"
            />
          </svg>
          <span>{{ t('share.download') }}</span>
        </button>
      </div>

      <!-- Scaled A4 document — wrapper carries the scaled footprint -->
      <div
        :style="{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX}px`,
        }"
      >
        <CVPreview :data="cv ?? undefined" />
      </div>
    </div>

    <ConfirmModal
      :visible="showOverflowConfirm"
      :title="t('builder.overflow.confirmTitle')"
      :message="t('builder.overflow.confirmMessage')"
      :confirm-label="t('builder.overflow.confirmLabel')"
      @confirm="confirmOverflowDownload"
      @cancel="showOverflowConfirm = false"
    />
  </div>
</template>
