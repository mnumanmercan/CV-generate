<script setup lang="ts">
  import { onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import { RouterLink } from 'vue-router'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import BuilderToolSwitcher from '@/components/ui/BuilderToolSwitcher.vue'
  import SplitLayout from '@/components/ui/SplitLayout.vue'
  import FormSection from '@/components/form/FormSection.vue'
  import DetailsForm from '@/components/cover-letter/forms/DetailsForm.vue'
  import RecipientForm from '@/components/cover-letter/forms/RecipientForm.vue'
  import ContentForm from '@/components/cover-letter/forms/ContentForm.vue'
  import CoverLetterPreview from '@/components/cover-letter/CoverLetterPreview.vue'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'
  import { useCVStore } from '@/stores/cvStore'
  import { useUserStore } from '@/stores/userStore'
  import { usePDFExport } from '@/composables/usePDFExport'
  import { usePreviewZoom } from '@/composables/usePreviewZoom'

  onMounted(() => {
    document.title = 'Cover Letter — Resumark'
  })

  const coverLetterStore = useCoverLetterStore()
  const cvStore = useCVStore()
  const userStore = useUserStore()
  const { clData, saveIndicatorVisible } = storeToRefs(coverLetterStore)
  const { status: pdfStatus, errorMessage: pdfError, exportPDF } = usePDFExport()
  const { previewScale, previewScrollEl, ZOOM_MIN, ZOOM_MAX, zoomIn, zoomOut, fitToPanel } = usePreviewZoom()
  // previewScrollEl is bound via `ref="previewScrollEl"` in the template;
  // vue-tsc doesn't trace that through the composable destructure, so nudge
  // noUnusedLocals with an explicit read.
  void previewScrollEl

  /* ── Load stored data ─────────────────────────────────────── */
  onMounted(async () => {
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
  <div class="flex flex-col h-screen overflow-hidden" style="background: var(--bg-shell)">
    <AppHeader />
    <BuilderToolSwitcher />

    <!-- ── Pro gate overlay ──────────────────────────────────── -->
    <template v-if="!userStore.isPremium">
      <div class="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div
          class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
          style="background: rgba(8,145,178,0.12)"
          aria-hidden="true"
        >✍️</div>
        <h1 class="text-xl font-bold text-primary mb-2">Cover Letter Generator</h1>
        <p class="text-secondary text-sm max-w-sm mb-1.5">
          Create tailored cover letters that complement your CV and make every application stand out.
        </p>
        <p class="text-secondary text-sm max-w-sm mb-6">
          This feature is available on the <strong class="text-primary">Pro plan</strong>.
        </p>
        <RouterLink
          to="/pricing"
          class="shimmer-btn flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
        >
          Upgrade to Pro
          <svg class="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </RouterLink>
      </div>
    </template>

    <!-- ── Full editor (Pro) ─────────────────────────────────── -->
    <template v-else>
      <div class="flex-1 overflow-hidden">
        <SplitLayout>

          <!-- ── Form panel ──────────────────────────────────── -->
          <template #form>
            <div class="flex flex-col h-full overflow-y-auto">
              <!-- Panel header -->
              <div class="flex items-center justify-between px-5 py-3 border-b border-overlay/5 shrink-0">
                <h2 class="text-sm font-semibold text-primary">Cover Letter</h2>
                <Transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="opacity-0 translate-x-1"
                  enter-to-class="opacity-100 translate-x-0"
                  leave-active-class="transition duration-150 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <span
                    v-if="saveIndicatorVisible"
                    class="text-xs text-emerald-400 flex items-center gap-1"
                    aria-live="polite"
                  >
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd" />
                    </svg>
                    Saved
                  </span>
                </Transition>
              </div>

              <!-- Sections -->
              <div class="flex-1 overflow-y-auto p-4 space-y-3">
                <FormSection
                  title="Your Details"
                  icon="👤"
                  :default-open="true"
                  :completed="!!(clData.fullName && clData.email)"
                  :step-index="1"
                >
                  <DetailsForm />
                </FormSection>

                <FormSection
                  title="Recipient"
                  icon="🏢"
                  :default-open="false"
                  :completed="!!clData.companyName"
                  :step-index="2"
                >
                  <RecipientForm />
                </FormSection>

                <FormSection
                  title="Letter Content"
                  icon="✍️"
                  :default-open="false"
                  :completed="!!(clData.opening && clData.closing)"
                  :step-index="3"
                >
                  <ContentForm />
                </FormSection>

                <!-- Clear button -->
                <div class="pt-2 pb-4">
                  <button
                    type="button"
                    class="text-xs text-secondary/60 hover:text-secondary transition-colors"
                    @click="coverLetterStore.clearData()"
                  >Clear all data</button>
                </div>
              </div>
            </div>
          </template>

          <!-- ── Preview panel ────────────────────────────────── -->
          <template #preview>
            <div class="flex flex-col h-full" style="background: var(--preview-bg)">

              <!-- Controls strip -->
              <div
                class="flex items-center justify-between px-4 py-2 border-b border-overlay/5 shrink-0"
                style="background: var(--bg-surface)"
              >
                <!-- Zoom controls -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    :disabled="previewScale <= ZOOM_MIN"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-overlay/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Zoom out"
                    @click="zoomOut"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/>
                    </svg>
                  </button>
                  <span class="text-xs text-secondary font-mono w-9 text-center select-none tabular-nums">
                    {{ Math.round(previewScale * 100) }}%
                  </span>
                  <button
                    type="button"
                    :disabled="previewScale >= ZOOM_MAX"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-overlay/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Zoom in"
                    @click="zoomIn"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="ml-1 px-2 py-1 rounded-lg text-xs text-secondary hover:text-primary hover:bg-overlay/5 transition-colors"
                    aria-label="Fit to panel"
                    @click="fitToPanel"
                  >Fit</button>
                </div>

                <!-- Download button -->
                <button
                  type="button"
                  :disabled="pdfStatus === 'generating'"
                  class="shimmer-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  @click="handleDownload"
                >
                  <svg
                    v-if="pdfStatus === 'generating'"
                    class="w-3.5 h-3.5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <svg
                    v-else
                    class="w-3.5 h-3.5 opacity-80"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  {{ pdfStatus === 'generating' ? 'Generating…' : 'Download PDF' }}
                </button>
              </div>

              <!-- Error toast -->
              <div
                v-if="pdfStatus === 'error'"
                class="mx-4 mt-2 px-4 py-2.5 rounded-lg text-sm"
                style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.22); color: #ef4444"
                role="alert"
              >
                {{ pdfError || 'PDF generation failed. Please try again.' }}
              </div>

              <!-- A4 scroll area -->
              <div
                ref="previewScrollEl"
                class="flex-1 overflow-auto p-4 flex justify-center items-start"
              >
                <div
                  :style="{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top center',
                    height: `${1123 * previewScale}px`,
                    width: `${794 * previewScale}px`,
                    flexShrink: '0',
                  }"
                >
                  <CoverLetterPreview :cl-data="clData" />
                </div>
              </div>
            </div>
          </template>

        </SplitLayout>
      </div>
    </template>
  </div>
</template>
