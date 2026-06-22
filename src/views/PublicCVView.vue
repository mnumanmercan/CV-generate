<script setup lang="ts">
  import { nextTick, onMounted, onUnmounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import CVPreview from '@/components/preview/CVPreview.vue'
  import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
  import { usePDFExport } from '@/composables/usePDFExport'
  import { useI18n } from '@/composables/useI18n'
  import { fetchPublicCV } from '@/services/cvShareService'
  import { ApiError } from '@/services/apiClient'
  import type { CVData } from '@/types/cv.types'

  const route = useRoute()
  const { t } = useI18n()
  const { status: pdfStatus, exportPDF } = usePDFExport()

  type ViewState = 'loading' | 'ready' | 'notFound'
  const state = ref<ViewState>('loading')
  const cv = ref<CVData | null>(null)

  // ── Fit the rigid A4 document (794×1122) into the viewport, never above 1 ────
  // Same approach as CVPreviewModal; usePDFExport neutralizes this transform
  // before capture, so the exported PDF is unaffected.
  const A4_WIDTH_PX = 794
  const A4_HEIGHT_PX = 1122
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

  async function handleDownload(): Promise<void> {
    await exportPDF('cv-preview')
  }

  onMounted(async () => {
    addNoIndex()
    const slug = String(route.params.slug ?? '')
    try {
      const data = await fetchPublicCV(slug)
      cv.value = data.content
      state.value = 'ready'
      await nextTick()
      fit()
      if (typeof ResizeObserver !== 'undefined' && rootEl.value) {
        observer = new ResizeObserver(fit)
        observer.observe(rootEl.value)
      }
    } catch (err) {
      // Any failure (404, turned-off link, network) lands on the same dead-end
      // screen — we never reveal whether a slug ever existed.
      if (!(err instanceof ApiError)) console.error('[PublicCVView] load failed:', err)
      state.value = 'notFound'
    }
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
  </div>
</template>
