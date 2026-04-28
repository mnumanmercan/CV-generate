<script setup lang="ts">
  import { onMounted, watch, ref, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useAutoSave } from '@/composables/useAutoSave'
  import { usePDFExport } from '@/composables/usePDFExport'
  import { usePreviewZoom } from '@/composables/usePreviewZoom'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import BuilderToolSwitcher from '@/components/ui/BuilderToolSwitcher.vue'
  import SplitLayout from '@/components/ui/SplitLayout.vue'
  import ToastNotification from '@/components/ui/ToastNotification.vue'
  import UpgradePrompt from '@/components/ui/UpgradePrompt.vue'
  import ConfirmModal from '@/components/ui/ConfirmModal.vue'
  import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
  import FormSection from '@/components/form/FormSection.vue'
  import PersonalInfoForm from '@/components/form/PersonalInfoForm.vue'
  import SummaryForm from '@/components/form/SummaryForm.vue'
  import ExperienceForm from '@/components/form/ExperienceForm.vue'
  import EducationForm from '@/components/form/EducationForm.vue'
  import SkillsForm from '@/components/form/SkillsForm.vue'
  import ProjectsForm from '@/components/form/ProjectsForm.vue'
  import CertificationsForm from '@/components/form/CertificationsForm.vue'
  import LanguagesForm from '@/components/form/LanguagesForm.vue'
  import CVPreview from '@/components/preview/CVPreview.vue'
  import TemplatePicker from '@/components/preview/TemplatePicker.vue'
  import { VueDraggable } from 'vue-draggable-plus'
  import { type SectionKey, DRAGGABLE_SECTION_KEYS } from '@/types/cv.types'

  const cvStore = useCVStore()
  const {
    cvData,
    isPersonalComplete,
    isSummaryComplete,
    isExperienceComplete,
    isEducationComplete,
    isSkillsComplete,
    isProjectsComplete,
    isCertificationsComplete,
    isLanguagesComplete,
  } = storeToRefs(cvStore)
  const { status: pdfStatus, errorMessage: pdfError, overflowWarning: pdfOverflow, exportPDF } = usePDFExport()
  const { previewScale, previewScrollEl, ZOOM_MIN, ZOOM_MAX, zoomIn, zoomOut, fitToPanel } = usePreviewZoom()
  // previewScrollEl is bound in the template via `ref="previewScrollEl"` but
  // vue-tsc's noUnusedLocals doesn't trace template-ref usage through a
  // composable destructure, so acknowledge the read explicitly.
  void previewScrollEl

  // Start auto-save watcher
  useAutoSave()

  onMounted(() => {
    document.title = 'CV Builder — Resumark'
    cvStore.loadFromStorage()
  })

  // Watch each section for changes and trigger preview highlight.
  // Guard with cvStore.loadingData so the initial data load does not flash every
  // section in the preview on page load.
  // A single watcher with a snapshot comparison replaces 7 separate deep watchers,
  // reducing the number of traversals Vue performs on each keystroke.
  const SECTION_KEYS: SectionKey[] = ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages']
  const sectionSnapshots = new Map<SectionKey, string>()

  watch(
    () => JSON.stringify([
      cvData.value.personal,
      cvData.value.summary,
      cvData.value.experience,
      cvData.value.education,
      cvData.value.skills,
      cvData.value.projects,
      cvData.value.certifications,
      cvData.value.languages,
    ]),
    (newJson) => {
      if (cvStore.loadingData) {
        // Seed snapshots on initial load so the first real edit triggers correctly.
        const parsed = JSON.parse(newJson) as unknown[]
        SECTION_KEYS.forEach((key, i) => sectionSnapshots.set(key, JSON.stringify(parsed[i])))
        return
      }
      const parsed = JSON.parse(newJson) as unknown[]
      for (let i = 0; i < SECTION_KEYS.length; i++) {
        const snap = JSON.stringify(parsed[i])
        if (sectionSnapshots.get(SECTION_KEYS[i]) !== snap) {
          sectionSnapshots.set(SECTION_KEYS[i], snap)
          cvStore.triggerSectionHighlight(SECTION_KEYS[i])
        }
      }
    },
    { deep: false },
  )

  // PDF download
  async function handleDownload(): Promise<void> {
    await exportPDF('cv-preview')
  }

  // ── Section config ──────────────────────────────────────────────────────────
  //
  // Editorial decorative glyphs in place of the previous emoji icon set, so
  // the form panel reads as one continuous typographic surface (no platform
  // emoji rendering, no colour break against the paper-and-ink palette):
  //
  //   ◉  Personal Info        — filled circle, "you are here"
  //   §  Professional Summary — section glyph, the writer's mark
  //   ▦  Work Experience       — solid grid, the body of work
  //   ◊  Education            — lozenge, formal stamp
  //   ✦  Skills               — four-point sparkle
  //   ⎔  Projects             — hex, the made-thing glyph
  //   √  Certifications       — check radical, the verified mark
  //   ❡  Languages            — pilcrow turn, the speech glyph

  // Static sections — always first, never draggable
  const staticSections = computed(() => [
    { key: 'personal' as SectionKey, title: 'Personal Info',         icon: '◉', defaultOpen: true,  completed: isPersonalComplete.value },
    { key: 'summary'  as SectionKey, title: 'Professional Summary',  icon: '§', defaultOpen: false, completed: isSummaryComplete.value },
  ])

  // Metadata map for draggable sections (non-reactive title/icon only)
  const DRAGGABLE_META: Record<string, { title: string; icon: string }> = {
    experience:     { title: 'Work Experience', icon: '▦' },
    education:      { title: 'Education',       icon: '◊' },
    skills:         { title: 'Skills',          icon: '✦' },
    projects:       { title: 'Projects',        icon: '⎔' },
    certifications: { title: 'Certifications',  icon: '√' },
    languages:      { title: 'Languages',       icon: '❡' },
  }

  // Mutable ref — v-model target for VueDraggable. Holds key + metadata only;
  // completion state is kept separate (completionFor) so it stays reactive.
  const draggableSections = ref(
    DRAGGABLE_SECTION_KEYS.map((key) => ({ key, ...DRAGGABLE_META[key] })),
  )

  // Reactive completion map — read in template as completionFor[section.key]
  const completionFor = computed<Record<string, boolean>>(() => ({
    experience:     isExperienceComplete.value,
    education:      isEducationComplete.value,
    skills:         isSkillsComplete.value,
    projects:       isProjectsComplete.value,
    certifications: isCertificationsComplete.value,
    languages:      isLanguagesComplete.value,
  }))

  // Sync draggableSections order from store after loadFromStorage completes.
  // The loadingData guard ensures this only runs during the initial load, not
  // after every setSectionOrder call (which would create a redundant re-sync).
  watch(
    () => cvData.value.meta.sectionOrder,
    (order) => {
      if (!order || !cvStore.loadingData) return
      const known = order.filter((k) => k in DRAGGABLE_META) as SectionKey[]
      const missing = DRAGGABLE_SECTION_KEYS.filter((k) => !known.includes(k))
      draggableSections.value = [...known, ...missing].map((key) => ({ key, ...DRAGGABLE_META[key] }))
    },
  )

  function onSectionDragEnd(): void {
    cvStore.setSectionOrder(draggableSections.value.map((s) => s.key))
  }

  const showClearConfirm = ref(false)

  async function confirmClearData(): Promise<void> {
    showClearConfirm.value = false
    await cvStore.clearData()
  }
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden" style="background: var(--paper)">
    <AppHeader />
    <BuilderToolSwitcher />

    <!-- Builder body -->
    <div class="flex-1 overflow-hidden">
      <SplitLayout>
        <!-- ── Form Panel ─────────────────────────────────────── -->
        <template #form>
          <div class="px-6 pt-7 pb-8 max-w-[640px] mx-auto">
            <!-- Editorial heading -->
            <p class="mono-eyebrow mb-3">CV Information</p>
            <h2
              class="font-display leading-[1.05] tracking-editorial text-ink mb-7"
              :style="{ fontSize: 'clamp(28px, 3.4vw, 38px)' }"
            >
              Eight sections.<br />
              <span class="accent-italic">Drag</span><span class="text-ink"> to reorder.</span>
            </h2>

            <!-- Static sections — Personal Info and Professional Summary -->
            <FormSection
              v-for="(section, idx) in staticSections"
              :key="section.key"
              :title="section.title"
              :icon="section.icon"
              :default-open="section.defaultOpen"
              :step-index="idx"
              :completed="section.completed"
            >
              <PersonalInfoForm v-if="section.key === 'personal'" />
              <SummaryForm v-else-if="section.key === 'summary'" />
            </FormSection>

            <!-- Draggable sections — Experience through Certifications -->
            <VueDraggable
              v-model="draggableSections"
              tag="div"
              :animation="220"
              easing="cubic-bezier(0.25, 1, 0.5, 1)"
              ghost-class="section-ghost"
              chosen-class="section-chosen"
              handle=".drag-handle"
              @end="onSectionDragEnd"
            >
              <FormSection
                v-for="(section, idx) in draggableSections"
                :key="section.key"
                :title="section.title"
                :icon="section.icon"
                :default-open="false"
                :step-index="staticSections.length + idx"
                :completed="completionFor[section.key] ?? false"
                :draggable="true"
              >
                <ExperienceForm     v-if="section.key === 'experience'" />
                <EducationForm      v-else-if="section.key === 'education'" />
                <SkillsForm         v-else-if="section.key === 'skills'" />
                <ProjectsForm       v-else-if="section.key === 'projects'" />
                <CertificationsForm v-else-if="section.key === 'certifications'" />
                <LanguagesForm      v-else-if="section.key === 'languages'" />
              </FormSection>
            </VueDraggable>

            <!-- Clear data — quiet, never the headline action -->
            <button
              type="button"
              class="w-full mt-6 py-2 mono-eyebrow text-[10.5px] text-muted hover:text-ink transition-colors"
              @click="showClearConfirm = true"
            >
              · Clear all data ·
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

            <!-- Top toolbar: A4 indicator + template picker -->
            <TemplatePicker />

            <!-- A4 preview scroll area — fills all remaining height.
                 overflow-hidden is intentionally ABSENT from the inner wrapper:
                 the CV element must not be clipped in either the preview or PDF. -->
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
                <CVPreview />
              </div>
            </div>

            <!-- ── Bottom control strip ───────────────────────────── -->
            <div
              class="flex items-center justify-between px-5 py-3 border-t border-overlay/8 shrink-0"
              style="background: var(--paper)"
            >
              <!-- Zoom controls -->
              <div class="flex items-center gap-1">
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
                  aria-label="Fit to panel width"
                  title="Fit to panel"
                  @click="fitToPanel"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                  </svg>
                </button>
              </div>

              <!-- PDF Download — the headline action, ink pill -->
              <button
                type="button"
                :disabled="pdfStatus === 'generating'"
                class="btn-primary text-[13px]"
                aria-label="Download CV as PDF"
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
    <ToastNotification
      :visible="pdfOverflow && pdfStatus === 'success'"
      message="Your CV exceeds one page — some content at the bottom may be cut off in the PDF."
      type="info"
    />

    <!-- Upgrade modal -->
    <UpgradePrompt />

    <!-- Clear data confirmation -->
    <ConfirmModal
      :visible="showClearConfirm"
      title="Clear all CV data?"
      message="This will permanently remove all your CV information. This action cannot be undone."
      confirm-label="Clear data"
      @confirm="confirmClearData"
      @cancel="showClearConfirm = false"
    />
  </div>
</template>
