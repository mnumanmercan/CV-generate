<script setup lang="ts">
  import { onMounted, watch, ref, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useAutoSave } from '@/composables/useAutoSave'
  import { usePDFExport } from '@/composables/usePDFExport'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import SplitLayout from '@/components/ui/SplitLayout.vue'
  import ToastNotification from '@/components/ui/ToastNotification.vue'
  import UpgradePrompt from '@/components/ui/UpgradePrompt.vue'
  import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
  import FormSection from '@/components/form/FormSection.vue'
  import PersonalInfoForm from '@/components/form/PersonalInfoForm.vue'
  import SummaryForm from '@/components/form/SummaryForm.vue'
  import ExperienceForm from '@/components/form/ExperienceForm.vue'
  import EducationForm from '@/components/form/EducationForm.vue'
  import SkillsForm from '@/components/form/SkillsForm.vue'
  import ProjectsForm from '@/components/form/ProjectsForm.vue'
  import CertificationsForm from '@/components/form/CertificationsForm.vue'
  import CVPreview from '@/components/preview/CVPreview.vue'
  import type { SectionKey } from '@/types/cv.types'

  const cvStore = useCVStore()
  const {
    cvData,
    saveIndicatorVisible,
    isPersonalComplete,
    isSummaryComplete,
    isExperienceComplete,
    isEducationComplete,
    isSkillsComplete,
    isProjectsComplete,
    isCertificationsComplete,
  } = storeToRefs(cvStore)
  const { status: pdfStatus, errorMessage: pdfError, exportPDF } = usePDFExport()

  // Start auto-save watcher
  useAutoSave()

  onMounted(() => {
    cvStore.loadFromStorage()
  })

  // Watch each section for changes and trigger preview highlight.
  // Guard with cvStore.loadingData so the initial data load (which replaces the
  // entire cvData object and fires all deep watchers) does not flash every
  // section in the preview on page load.
  watch(
    () => cvData.value.personal,
    () => { if (!cvStore.loadingData) cvStore.triggerSectionHighlight('personal') },
    { deep: true },
  )
  watch(
    () => cvData.value.summary,
    () => { if (!cvStore.loadingData) cvStore.triggerSectionHighlight('summary') },
  )
  watch(
    () => cvData.value.experience,
    () => { if (!cvStore.loadingData) cvStore.triggerSectionHighlight('experience') },
    { deep: true },
  )
  watch(
    () => cvData.value.education,
    () => { if (!cvStore.loadingData) cvStore.triggerSectionHighlight('education') },
    { deep: true },
  )
  watch(
    () => cvData.value.skills,
    () => { if (!cvStore.loadingData) cvStore.triggerSectionHighlight('skills') },
    { deep: true },
  )
  watch(
    () => cvData.value.projects,
    () => { if (!cvStore.loadingData) cvStore.triggerSectionHighlight('projects') },
    { deep: true },
  )
  watch(
    () => cvData.value.certifications,
    () => { if (!cvStore.loadingData) cvStore.triggerSectionHighlight('certifications') },
    { deep: true },
  )

  // A4 preview scale — CSS-only zoom, does NOT resize the element
  const previewScale = ref(1.0)
  const ZOOM_MIN = 0.55
  const ZOOM_MAX = 1.0
  const ZOOM_STEP = 0.10
  const previewScrollEl = ref<HTMLElement | null>(null)

  function zoomIn(): void {
    previewScale.value = Math.min(ZOOM_MAX, Math.round((previewScale.value + ZOOM_STEP) * 100) / 100)
  }

  function zoomOut(): void {
    previewScale.value = Math.max(ZOOM_MIN, Math.round((previewScale.value - ZOOM_STEP) * 100) / 100)
  }

  function fitToPanel(): void {
    if (!previewScrollEl.value) return
    const containerWidth = previewScrollEl.value.clientWidth - 32 // account for px-4 on each side
    const scale = Math.floor((containerWidth / 794) * 10) / 10
    previewScale.value = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale))
  }

  // PDF download
  async function handleDownload(): Promise<void> {
    await exportPDF('cv-preview')
  }

  // Sections config with reactive completion state
  const sections = computed(() => [
    { key: 'personal' as SectionKey, title: 'Personal Info', icon: '👤', defaultOpen: true, completed: isPersonalComplete.value },
    { key: 'summary' as SectionKey, title: 'Professional Summary', icon: '📝', defaultOpen: false, completed: isSummaryComplete.value },
    { key: 'experience' as SectionKey, title: 'Work Experience', icon: '💼', defaultOpen: false, completed: isExperienceComplete.value },
    { key: 'education' as SectionKey, title: 'Education', icon: '🎓', defaultOpen: false, completed: isEducationComplete.value },
    { key: 'skills' as SectionKey, title: 'Skills', icon: '⚙️', defaultOpen: false, completed: isSkillsComplete.value },
    { key: 'projects' as SectionKey, title: 'Projects', icon: '🚀', defaultOpen: false, completed: isProjectsComplete.value },
    { key: 'certifications' as SectionKey, title: 'Certifications', icon: '🏆', defaultOpen: false, completed: isCertificationsComplete.value },
  ])

  async function confirmClearData(): Promise<void> {
    if (window.confirm('Clear all CV data? This cannot be undone.')) {
      await cvStore.clearData()
    }
  }
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden" style="background: var(--bg-shell)">
    <AppHeader />

    <!-- Builder body -->
    <div class="flex-1 overflow-hidden">
      <SplitLayout>
        <!-- ── Form Panel ─────────────────────────────────────── -->
        <template #form>
          <div class="p-4">
            <!-- Header row -->
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold text-primary">CV Information</h2>
              <div
                v-if="saveIndicatorVisible"
                class="text-xs text-emerald-400 flex items-center gap-1 animate-fade-in"
                aria-live="polite"
                role="status"
              >
                <span aria-hidden="true">✓</span> Saved just now
              </div>
            </div>

            <!-- Accordion sections -->
            <FormSection
              v-for="(section, idx) in sections"
              :key="section.key"
              :title="section.title"
              :icon="section.icon"
              :default-open="section.defaultOpen"
              :step-index="idx"
              :completed="section.completed"
            >
              <PersonalInfoForm v-if="section.key === 'personal'" />
              <SummaryForm v-else-if="section.key === 'summary'" />
              <ExperienceForm v-else-if="section.key === 'experience'" />
              <EducationForm v-else-if="section.key === 'education'" />
              <SkillsForm v-else-if="section.key === 'skills'" />
              <ProjectsForm v-else-if="section.key === 'projects'" />
              <CertificationsForm v-else-if="section.key === 'certifications'" />
            </FormSection>

            <!-- Clear data -->
            <button
              type="button"
              class="w-full mt-2 py-2 text-xs text-secondary hover:text-red-400 transition-colors"
              @click="confirmClearData"
            >
              Clear all data
            </button>
          </div>
        </template>

        <!-- ── Preview Panel ────────────────────────────────── -->
        <template #preview>
          <!--
            flex-col so the scroll area (flex-1) and the bottom control strip
            are siblings — controls live entirely outside the scrollable content,
            so they can never overlap the CV document.
          -->
          <div class="flex flex-col h-full">

            <!-- A4 preview scroll area — fills all remaining height.
                 overflow-hidden is intentionally ABSENT from the inner wrapper:
                 the CV element must not be clipped in either the preview or PDF. -->
            <div
              ref="previewScrollEl"
              class="flex-1 overflow-auto flex justify-center py-6 px-4"
              style="background: var(--preview-bg)"
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
                <CVPreview />
              </div>
            </div>

            <!-- ── Bottom control strip ───────────────────────────── -->
            <!--
              Centered layout keeps controls away from the theme-toggle FAB
              (fixed bottom-5 right-5) which sits at the viewport's bottom-right
              corner just outside this panel.
            -->
            <div
              class="flex items-center justify-center gap-1.5 px-4 py-2 border-t border-overlay/5 shrink-0"
              style="background: var(--bg-surface)"
            >
              <!-- Zoom out -->
              <button
                type="button"
                :disabled="previewScale <= ZOOM_MIN"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-overlay/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Zoom out"
                @click="zoomOut"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" />
                </svg>
              </button>

              <span class="text-xs text-secondary font-mono w-9 text-center select-none tabular-nums">
                {{ Math.round(previewScale * 100) }}%
              </span>

              <!-- Zoom in -->
              <button
                type="button"
                :disabled="previewScale >= ZOOM_MAX"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-overlay/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Zoom in"
                @click="zoomIn"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <!-- Fit to panel -->
              <button
                type="button"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-overlay/5 transition-colors"
                aria-label="Fit to panel width"
                title="Fit to panel"
                @click="fitToPanel"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                </svg>
              </button>

              <!-- Divider -->
              <span class="w-px h-4 bg-overlay/10 mx-1" aria-hidden="true" />

              <!-- PDF Download -->
              <button
                type="button"
                :disabled="pdfStatus === 'generating'"
                :class="[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  pdfStatus === 'generating'
                    ? 'bg-accent/50 text-white/70 cursor-not-allowed'
                    : 'shimmer-btn text-white',
                ]"
                aria-label="Download CV as PDF"
                @click="handleDownload"
              >
                <LoadingSpinner v-if="pdfStatus === 'generating'" size="sm" />
                <span v-else aria-hidden="true">↓</span>
                {{ pdfStatus === 'generating' ? 'Generating...' : 'Download PDF' }}
              </button>
            </div>

          </div>
        </template>
      </SplitLayout>
    </div>

    <!-- Toast notifications -->
    <ToastNotification
      :visible="pdfStatus === 'success'"
      message="PDF downloaded successfully!"
      type="success"
    />
    <ToastNotification
      :visible="pdfStatus === 'error'"
      :message="pdfError || 'PDF generation failed. Please try again.'"
      type="error"
    />

    <!-- Upgrade modal -->
    <UpgradePrompt />
  </div>
</template>
