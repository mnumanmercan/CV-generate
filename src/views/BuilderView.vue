<script setup lang="ts">
  import { onMounted, watch, ref } from 'vue'
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
  const { cvData, saveIndicatorVisible } = storeToRefs(cvStore)
  const { status: pdfStatus, errorMessage: pdfError, exportPDF } = usePDFExport()

  // Start auto-save watcher
  useAutoSave()

  onMounted(() => {
    cvStore.loadFromStorage()
  })

  // Watch each section for changes and trigger preview highlight
  watch(
    () => cvData.value.personal,
    () => cvStore.triggerSectionHighlight('personal'),
    { deep: true },
  )
  watch(
    () => cvData.value.summary,
    () => cvStore.triggerSectionHighlight('summary'),
  )
  watch(
    () => cvData.value.experience,
    () => cvStore.triggerSectionHighlight('experience'),
    { deep: true },
  )
  watch(
    () => cvData.value.education,
    () => cvStore.triggerSectionHighlight('education'),
    { deep: true },
  )
  watch(
    () => cvData.value.skills,
    () => cvStore.triggerSectionHighlight('skills'),
    { deep: true },
  )
  watch(
    () => cvData.value.projects,
    () => cvStore.triggerSectionHighlight('projects'),
    { deep: true },
  )
  watch(
    () => cvData.value.certifications,
    () => cvStore.triggerSectionHighlight('certifications'),
    { deep: true },
  )

  // A4 preview scale — fits preview panel
  const previewScale = ref(0.72)

  // PDF download
  async function handleDownload(): Promise<void> {
    await exportPDF('cv-preview')
  }

  // Sections config
  const sections = [
    { key: 'personal' as SectionKey, title: 'Personal Info', icon: '👤', defaultOpen: true },
    { key: 'summary' as SectionKey, title: 'Professional Summary', icon: '📝', defaultOpen: false },
    { key: 'experience' as SectionKey, title: 'Work Experience', icon: '💼', defaultOpen: false },
    { key: 'education' as SectionKey, title: 'Education', icon: '🎓', defaultOpen: false },
    { key: 'skills' as SectionKey, title: 'Skills', icon: '⚙️', defaultOpen: false },
    { key: 'projects' as SectionKey, title: 'Projects', icon: '🚀', defaultOpen: false },
    { key: 'certifications' as SectionKey, title: 'Certifications', icon: '🏆', defaultOpen: false },
  ]
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
              @click="cvStore.clearData"
            >
              Clear all data
            </button>
          </div>
        </template>

        <!-- ── Preview Panel ────────────────────────────────── -->
        <template #preview>
          <div class="flex flex-col h-full">
            <!-- Preview toolbar -->
            <div
              class="flex items-center justify-between px-4 py-3 border-b border-white/5 sticky top-0 z-10"
              style="background: var(--bg-shell)"
            >
              <div class="flex items-center gap-2">
                <span class="text-xs text-secondary font-mono">A4 Preview</span>
                <span class="w-1 h-1 rounded-full bg-white/20" aria-hidden="true" />
                <span class="text-xs text-secondary font-mono">ATS</span>
              </div>

              <!-- PDF Download button -->
              <button
                type="button"
                :disabled="pdfStatus === 'generating'"
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
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

            <!-- A4 preview with scale transform to fit panel.
                 overflow-hidden is intentionally ABSENT from the inner wrapper:
                 the CV element must not be clipped in either the preview or PDF. -->
            <div
              class="flex-1 overflow-auto flex justify-center py-6 px-4"
              style="background: #18181f"
            >
              <div
                :style="{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                  // Preserve the layout space so the scroll container size
                  // reflects the scaled-down visual height, not the native 1123px.
                  height: `${1123 * previewScale}px`,
                  width: `${794 * previewScale}px`,
                  flexShrink: '0',
                }"
              >
                <CVPreview />
              </div>
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
