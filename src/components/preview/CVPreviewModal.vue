<script setup lang="ts">
  import { nextTick, onUnmounted, ref, watch } from 'vue'
  import CVPreview from '@/components/preview/CVPreview.vue'
  import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
  import { usePDFExport } from '@/composables/usePDFExport'
  import { useI18n } from '@/composables/useI18n'

  // Read-only CV viewer. Renders the exact same #cv-preview element the builder
  // captures, so the PDF download here is byte-for-byte identical to the
  // builder's. No editing affordances — view and download only.
  const props = defineProps<{ visible: boolean }>()
  const emit = defineEmits<{ close: [] }>()

  const { t } = useI18n()
  const { status: pdfStatus, exportPDF } = usePDFExport()

  // ── Auto-fit the fixed 794px A4 preview into the available dialog width ──────
  // The preview is a rigid 794px wide; we scale it down (never up) so it fits
  // narrow viewports without a horizontal scrollbar. usePDFExport neutralizes
  // this transform before capture, so the scaling never affects the PDF.
  const A4_WIDTH_PX = 794
  const HORIZONTAL_PADDING_PX = 32
  const scrollEl = ref<HTMLElement | null>(null)
  const scale = ref(1)
  let observer: ResizeObserver | null = null

  function fit(): void {
    const el = scrollEl.value
    if (!el) return
    const available = el.clientWidth - HORIZONTAL_PADDING_PX
    scale.value = Math.min(1, Math.max(0.2, available / A4_WIDTH_PX))
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
      if (typeof ResizeObserver !== 'undefined' && scrollEl.value) {
        observer = new ResizeObserver(fit)
        observer.observe(scrollEl.value)
      }
    },
  )

  async function handleDownload(): Promise<void> {
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
      <div
        v-if="visible"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        :aria-label="t('preview.dialogLabel')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />

        <!-- Dialog shell -->
        <div
          class="relative flex flex-col w-full max-w-[880px] h-[90vh] rounded-2xl border border-overlay/10 shadow-2xl overflow-hidden"
          style="background: var(--paper)"
        >
          <!-- Top bar -->
          <header
            class="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-overlay/10"
          >
            <p class="mono-eyebrow text-[10.5px]">{{ t('preview.eyebrow') }}</p>

            <div class="flex items-center gap-2">
              <button
                type="button"
                :disabled="pdfStatus === 'generating'"
                class="btn-primary text-[13px]"
                :aria-label="t('aria.downloadCv')"
                @click="handleDownload"
              >
                <LoadingSpinner v-if="pdfStatus === 'generating'" size="sm" />
                <span v-else aria-hidden="true">↓</span>
                <!-- Intentionally not localized: matches the builder's download button -->
                {{ pdfStatus === 'generating' ? 'Generating…' : 'Download PDF' }}
              </button>

              <button
                type="button"
                class="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
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
          </header>

          <!-- Scrollable, auto-fitting preview surface -->
          <div
            ref="scrollEl"
            class="flex-1 overflow-auto flex justify-center py-6 px-4"
            style="background: var(--paper2)"
          >
            <div
              :style="{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: `${A4_WIDTH_PX * scale}px`,
                height: `${1122 * scale}px`,
                flexShrink: '0',
              }"
            >
              <CVPreview />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
