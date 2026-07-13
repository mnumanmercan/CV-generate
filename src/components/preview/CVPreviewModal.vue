<script setup lang="ts">
  import { nextTick, onUnmounted, ref, watch } from 'vue'
  import CVPreview from '@/components/preview/CVPreview.vue'
  import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
  import ConfirmModal from '@/components/ui/ConfirmModal.vue'
  import { usePDFExport, willOverflow } from '@/composables/usePDFExport'
  import { useI18n } from '@/composables/useI18n'
  import { A4_WIDTH_PX, A4_HEIGHT_PX } from '@/constants/layout'

  // Read-only CV viewer. Renders the exact same #cv-preview element the builder
  // captures, so the PDF download here is identical to the builder's. The only
  // chrome is the dark overlay behind it and two icon controls floating in the
  // document's top-right corner — no window, no header.
  const props = defineProps<{ visible: boolean }>()
  const emit = defineEmits<{ close: [] }>()

  const { t } = useI18n()
  const { status: pdfStatus, exportPDF } = usePDFExport()

  // ── Fit the whole A4 document inside the viewport ───────────────────────────
  // The CV is a rigid 794×1122 (A4 at 96dpi). We scale it down so the ENTIRE
  // page is visible without scrolling — bounded by whichever of viewport height
  // or width is tighter — and never scale above 1. usePDFExport neutralizes this
  // transform before capture, so the scaling never affects the exported PDF.
  const VIEWPORT_MARGIN_PX = 40
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

  function teardownObserver(): void {
    observer?.disconnect()
    observer = null
  }

  watch(
    () => props.visible,
    async (open) => {
      document.body.style.overflow = open ? 'hidden' : ''
      if (!open) {
        teardownObserver()
        return
      }
      await nextTick()
      fit()
      if (typeof ResizeObserver !== 'undefined' && rootEl.value) {
        observer = new ResizeObserver(fit)
        observer.observe(rootEl.value)
      }
    },
  )

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

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && props.visible) emit('close')
  }

  window.addEventListener('keydown', onKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
    teardownObserver()
    document.body.style.overflow = ''
  })
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <!-- Overlay doubles as the backdrop; clicking it closes the popup. -->
      <div
        v-if="visible"
        ref="rootEl"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        :aria-label="t('preview.dialogLabel')"
        @click="emit('close')"
      >
        <!-- Only the CV document sits on the overlay; clicking it never closes. -->
        <div
          class="relative"
          :style="{ width: `${A4_WIDTH_PX * scale}px`, height: `${A4_HEIGHT_PX * scale}px` }"
          @click.stop
        >
          <!-- In-document controls, top-right corner -->
          <div class="absolute top-3 right-3 z-10 flex items-center gap-2">
            <button
              type="button"
              :disabled="pdfStatus === 'generating'"
              class="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
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
            </button>

            <button
              type="button"
              class="w-9 h-9 rounded-full flex items-center justify-center text-white bg-black/50 hover:bg-black/70 shadow-lg transition-colors"
              :aria-label="t('preview.close')"
              @click="emit('close')"
            >
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
                  d="M6 6l12 12M6 18L18 6"
                />
              </svg>
            </button>
          </div>

          <!-- The scaled A4 document. The wrapper carries the scaled footprint;
               the child renders at natural size and is scaled to fill it. -->
          <div
            :style="{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${A4_WIDTH_PX}px`,
              height: `${A4_HEIGHT_PX}px`,
            }"
          >
            <CVPreview />
          </div>
        </div>
      </div>
    </Transition>

    <ConfirmModal
      :visible="showOverflowConfirm"
      :title="t('builder.overflow.confirmTitle')"
      :message="t('builder.overflow.confirmMessage')"
      :confirm-label="t('builder.overflow.confirmLabel')"
      @confirm="confirmOverflowDownload"
      @cancel="showOverflowConfirm = false"
    />
  </Teleport>
</template>
