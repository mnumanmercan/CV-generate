<script setup lang="ts">
  import { onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import { RouterLink } from 'vue-router'
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
  import { useUserStore } from '@/stores/userStore'
  import { usePDFExport } from '@/composables/usePDFExport'
  import { usePreviewZoom } from '@/composables/usePreviewZoom'

  const coverLetterStore = useCoverLetterStore()
  const cvStore = useCVStore()
  const userStore = useUserStore()
  const { clData } = storeToRefs(coverLetterStore)
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

    <!-- ── Pro gate (free-tier visitors) ────────────────────── -->
    <template v-if="!userStore.isPremium">
      <div class="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <span
          class="font-display italic mb-7 leading-none"
          :style="{ fontSize: '64px', color: 'var(--accent)' }"
          aria-hidden="true"
        >✎</span>
        <p class="mono-eyebrow mb-3">Pro feature</p>
        <h1
          class="font-display leading-[1.05] tracking-editorial text-ink mb-4"
          :style="{ fontSize: 'clamp(36px, 5vw, 56px)' }"
        >
          A second page<br />
          for the <span class="accent-italic">why</span>.
        </h1>
        <p class="text-muted text-[15px] max-w-[440px] mb-8 leading-[1.55]">
          Cover letters live alongside your CV — same data, same fonts, same
          tone. Available on the Pro plan.
        </p>
        <RouterLink to="/pricing" class="btn-primary text-sm">
          Upgrade to Pro
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
            <div class="flex flex-col h-full">

              <!-- Top toolbar: format label + download -->
              <div
                class="flex items-center justify-between px-5 py-3 border-b border-overlay/8 shrink-0"
                style="background: var(--paper)"
              >
                <span class="mono-eyebrow">A4 · LETTER</span>

                <button
                  type="button"
                  :disabled="pdfStatus === 'generating'"
                  class="btn-primary text-[13px]"
                  aria-label="Download cover letter as PDF"
                  @click="handleDownload"
                >
                  <LoadingSpinner v-if="pdfStatus === 'generating'" size="sm" />
                  <span v-else aria-hidden="true">↓</span>
                  {{ pdfStatus === 'generating' ? 'Generating…' : 'Download PDF' }}
                </button>
              </div>

              <!-- Error banner -->
              <div
                v-if="pdfStatus === 'error'"
                class="mx-5 mt-3 px-4 py-2.5 rounded-lg text-[13px]"
                style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.22); color: #B42727"
                role="alert"
              >
                {{ pdfError || 'PDF generation failed. Please try again.' }}
              </div>

              <!-- A4 scroll area -->
              <div
                ref="previewScrollEl"
                class="flex-1 overflow-auto flex justify-center py-8 px-4"
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

              <!-- Bottom zoom strip -->
              <div
                class="flex items-center justify-center gap-1 px-4 py-2 border-t border-overlay/8 shrink-0"
                style="background: var(--paper)"
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
            </div>
          </template>

        </SplitLayout>
      </div>
    </template>
  </div>
</template>
