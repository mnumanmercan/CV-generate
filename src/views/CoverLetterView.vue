<script setup lang="ts">
  import { onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import BuilderToolSwitcher from '@/components/ui/BuilderToolSwitcher.vue'
  import SplitLayout from '@/components/ui/SplitLayout.vue'
  import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
  import FormSection from '@/components/form/FormSection.vue'
  import DetailsForm from '@/components/cover-letter/forms/DetailsForm.vue'
  import RecipientForm from '@/components/cover-letter/forms/RecipientForm.vue'
  import ContentForm from '@/components/cover-letter/forms/ContentForm.vue'
  import CoverLetterPreview from '@/components/cover-letter/CoverLetterPreview.vue'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'
  import { useCVStore } from '@/stores/cvStore'
  import { usePDFExport } from '@/composables/usePDFExport'
  import { usePreviewZoom } from '@/composables/usePreviewZoom'

  const coverLetterStore = useCoverLetterStore()
  const cvStore = useCVStore()
  const { clData, saveIndicatorVisible: showSaved } = storeToRefs(coverLetterStore)
  const { status: pdfStatus, errorMessage: pdfError, exportPDF } = usePDFExport()
  const { previewScale, previewScrollEl, ZOOM_MIN, ZOOM_MAX, zoomIn, zoomOut, fitToPanel } = usePreviewZoom()
  // previewScrollEl is bound via `ref="previewScrollEl"` in the template;
  // vue-tsc doesn't trace that through the composable destructure, so nudge
  // noUnusedLocals with an explicit read.
  void previewScrollEl

  /* ── Per-page title + lazy data load ─────────────────────────────────── */
  onMounted(async () => {
    document.title = 'Cover Letter — Resumark'
    // Load both stores in parallel — user may navigate directly to /cover-letter
    // without visiting /builder first, so cvStore may not have loaded yet.
    await Promise.all([
      coverLetterStore.loadFromStorage(),
      cvStore.loadFromStorage(),
    ])
    // Auto-populate from CV if sender fields are empty
    const isEmpty = !clData.value.fullName && !clData.value.email
    if (isEmpty) {
      coverLetterStore.populateFromCV(cvStore.cvData.personal)
    }
  })

  async function handleDownload(): Promise<void> {
    await exportPDF('cover-letter-preview')
  }
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden" style="background: var(--paper)">
    <AppHeader />
    <BuilderToolSwitcher />

    <!-- ── Full editor ──────────────────────────────────────── -->
    <div class="flex-1 overflow-hidden">
        <SplitLayout>

          <!-- ── Form panel ──────────────────────────────────── -->
          <template #form>
            <div class="px-6 pt-7 pb-8 max-w-[640px] mx-auto">
              <!-- Editorial heading -->
              <p class="mono-eyebrow mb-3">Cover Letter</p>
              <h2
                class="font-display leading-[1.05] tracking-editorial text-ink mb-7"
                :style="{ fontSize: 'clamp(28px, 3.4vw, 38px)' }"
              >
                Three sections.<br />
                <span class="accent-italic">One</span><span class="text-ink"> page.</span>
              </h2>

              <!-- Sections -->
              <FormSection
                title="Your Details"
                icon="◉"
                :default-open="true"
                :completed="!!(clData.fullName && clData.email)"
                :step-index="0"
              >
                <DetailsForm />
              </FormSection>

              <FormSection
                title="Recipient"
                icon="¶"
                :default-open="false"
                :completed="!!clData.companyName"
                :step-index="1"
              >
                <RecipientForm />
              </FormSection>

              <FormSection
                title="Letter Content"
                icon="✎"
                :default-open="false"
                :completed="!!(clData.opening && clData.closing)"
                :step-index="2"
              >
                <ContentForm />
              </FormSection>

              <!-- Clear data — quiet, never the headline action -->
              <button
                type="button"
                class="w-full mt-6 py-2 mono-eyebrow text-[10.5px] text-muted hover:text-ink transition-colors"
                @click="coverLetterStore.clearData()"
              >
                · Clear all data ·
              </button>
            </div>
          </template>

          <!-- ── Preview panel ────────────────────────────────── -->
          <template #preview>
            <div class="relative h-full">

              <!-- Error banner — floating alert at top of preview -->
              <div
                v-if="pdfStatus === 'error'"
                class="absolute top-4 left-5 right-5 z-10 px-4 py-2.5 rounded-lg text-[13px]"
                style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.22); color: #B42727"
                role="alert"
              >
                {{ pdfError || 'PDF generation failed. Please try again.' }}
              </div>

              <!-- A4 scroll area — fills the full panel height -->
              <div
                ref="previewScrollEl"
                class="h-full overflow-auto flex justify-center py-8 px-4"
                style="background: var(--paper2)"
              >
                <div
                  :style="{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top center',
                    height: `${1122 * previewScale}px`,
                    width: `${794 * previewScale}px`,
                    flexShrink: '0',
                  }"
                >
                  <CoverLetterPreview :cl-data="clData" />
                </div>
              </div>

              <!-- Floating save indicator — top-right -->
              <Transition
                enter-active-class="transition-opacity duration-200"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition-opacity duration-300"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <div
                  v-if="showSaved"
                  class="absolute top-4 right-5 z-10 flex items-center gap-2 rounded-full px-3 py-1.5"
                  style="background: var(--paper); box-shadow: 0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)"
                  aria-live="polite"
                  role="status"
                >
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background: #22C55E" aria-hidden="true" />
                  <span class="mono-eyebrow text-[10.5px]">Saved to this browser · just now</span>
                </div>
              </Transition>

              <!-- Floating zoom island — bottom-left -->
              <div
                class="absolute bottom-5 left-5 z-10 flex items-center gap-0.5 rounded-2xl px-2 py-1.5"
                style="background: var(--paper); box-shadow: 0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)"
              >
                <button
                  type="button"
                  :disabled="previewScale <= ZOOM_MIN"
                  class="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-overlay/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Zoom out"
                  @click="zoomOut"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" />
                  </svg>
                </button>

                <span class="mono-eyebrow text-[11px] tabular-nums w-9 text-center select-none">
                  {{ Math.round(previewScale * 100) }}%
                </span>

                <button
                  type="button"
                  :disabled="previewScale >= ZOOM_MAX"
                  class="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-overlay/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Zoom in"
                  @click="zoomIn"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                <div class="w-px h-3.5 mx-1 shrink-0 bg-overlay/15" aria-hidden="true" />

                <button
                  type="button"
                  class="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
                  aria-label="Fit to panel"
                  title="Fit to panel"
                  @click="fitToPanel"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                  </svg>
                </button>
              </div>

              <!-- Floating download island — bottom-right -->
              <div class="absolute bottom-5 right-5 z-10">
                <button
                  type="button"
                  :disabled="pdfStatus === 'generating'"
                  class="btn-primary text-[13px]"
                  style="box-shadow: 0 4px 16px rgba(184,83,42,0.22)"
                  aria-label="Download cover letter as PDF"
                  @click="handleDownload"
                >
                  <LoadingSpinner v-if="pdfStatus === 'generating'" size="sm" />
                  <span v-else aria-hidden="true">↓</span>
                  {{ pdfStatus === 'generating' ? 'Generating…' : 'Download PDF' }}
                </button>
              </div>

            </div>
          </template>

        </SplitLayout>
      </div>
  </div>
</template>
