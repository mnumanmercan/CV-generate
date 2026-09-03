<script setup lang="ts">
  import { onMounted, watch, ref, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useAutoSave } from '@/composables/useAutoSave'
  import { usePDFExport, willOverflow } from '@/composables/usePDFExport'
  import { usePreviewZoom } from '@/composables/usePreviewZoom'
  import { useCVOverflow } from '@/composables/useCVOverflow'
  import { A4_HEIGHT_PX, A4_WIDTH_PX } from '@/constants/layout'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import BuilderToolSwitcher from '@/components/ui/BuilderToolSwitcher.vue'
  import SplitLayout from '@/components/ui/SplitLayout.vue'
  import ToastNotification from '@/components/ui/ToastNotification.vue'
  import UpgradePrompt from '@/components/ui/UpgradePrompt.vue'
  import ConfirmModal from '@/components/ui/ConfirmModal.vue'
  import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
  import VariantTabs from '@/components/builder/VariantTabs.vue'
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
  import PreviewSkeleton from '@/components/preview/PreviewSkeleton.vue'
  import { VueDraggable } from 'vue-draggable-plus'
  import { type SectionKey, DRAGGABLE_SECTION_KEYS } from '@/types/cv.types'
  import { SHARED_SECTION_KEYS } from '@resumark/shared'
  import { useI18n } from '@/composables/useI18n'
  import { useUserStore } from '@/stores/userStore'
  import { useRoute, useRouter } from 'vue-router'

  const cvStore = useCVStore()
  const userStore = useUserStore()
  const route = useRoute()
  const router = useRouter()
  const { t, t_obj } = useI18n()

  /**
   * Shared sections carry a marker in the form so it's clear the edit lands in
   * every version — but only once more than one version exists, otherwise it's
   * a promise about a feature the user isn't using.
   */
  const hasMultipleVariants = computed(() => cvStore.variants.length > 1)
  function sharedLabelFor(key: SectionKey): string | undefined {
    if (!hasMultipleVariants.value) return undefined
    return SHARED_SECTION_KEYS.includes(key) ? t('builder.variants.syncedBadge') : undefined
  }
  function sharedHintFor(key: SectionKey): string | undefined {
    if (!hasMultipleVariants.value) return undefined
    return SHARED_SECTION_KEYS.includes(key) ? t('builder.variants.syncedHint') : undefined
  }

  function sectionTitle(key: string): string {
    return t(`builder.sections.${key}`)
  }
  const {
    cvData,
    saveIndicatorVisible: showSaved,
    lastSaveError,
    isPersonalComplete,
    isSummaryComplete,
    isExperienceComplete,
    isEducationComplete,
    isSkillsComplete,
    isProjectsComplete,
    isCertificationsComplete,
    isLanguagesComplete,
  } = storeToRefs(cvStore)
  const { status: pdfStatus, errorMessage: pdfError, exportPDF } = usePDFExport()
  const { isOverflowing, contentHeight } = useCVOverflow('cv-preview')
  const { previewScale, previewScrollEl, ZOOM_MIN, ZOOM_MAX, zoomIn, zoomOut, fitToPanel } =
    usePreviewZoom()
  // previewScrollEl is bound in the template via `ref="previewScrollEl"` but
  // vue-tsc's noUnusedLocals doesn't trace template-ref usage through a
  // composable destructure, so acknowledge the read explicitly.
  void previewScrollEl

  // Start auto-save watcher
  useAutoSave()

  // The store is seeded synchronously from localStorage, so returning users
  // (and guests with saved data) already have their CV on first paint. The one
  // remaining empty→real swap is a logged-in user with no local copy (new
  // device / cleared storage) whose cloud CV is still loading. Show a skeleton
  // for exactly that window — an empty CV while a load is in flight OR before
  // the boot session probe has resolved (data may still be inbound).
  const isCvEmpty = computed(() => {
    const d = cvData.value
    return (
      !d.personal.fullName?.trim() &&
      !d.summary?.trim() &&
      d.experience.length === 0 &&
      d.education.length === 0 &&
      d.skills.length === 0 &&
      d.projects.length === 0 &&
      d.certifications.length === 0 &&
      d.languages.length === 0
    )
  })
  const showPreviewSkeleton = computed(
    () => isCvEmpty.value && (cvStore.loadingData || !userStore.isSessionRestored),
  )

  onMounted(async () => {
    // Read the deep-link id FIRST. `loadVariants()` below can settle
    // `activeVariantId`, which fires the URL-sync watcher and rewrites
    // route.params.id — so reading it afterwards would hand us the id we just
    // wrote, not the one the user navigated to.
    const requested = typeof route.params.id === 'string' ? route.params.id : null

    // Guard with isLoaded (matching HomeView) so navigating back into /builder
    // doesn't re-issue the CV read(s) every visit — the store is already
    // hydrated and re-loading only burns the read rate-limit budget.
    if (!cvStore.isLoaded) {
      await cvStore.loadFromStorage().catch(() => {
        // Cloud load failed (offline / rate-limited). The builder still works
        // on whatever is in the store; don't let the rejection go unhandled.
      })
    } else {
      // Already hydrated from a previous mount — the load watcher won't fire,
      // so re-sync the draggable order from the store directly (no network).
      applySectionOrder(cvData.value.meta.sectionOrder)
    }

    // Populate the version tab strip. Slim list read — no JSONB content — so
    // this costs one cheap request and siblings stay unloaded until switched to.
    await cvStore.loadVariants()

    // Deep link: /builder/:id opens that specific version.
    if (requested && requested !== cvStore.activeVariantId) {
      if (cvStore.variants.some((v) => v.id === requested)) {
        await cvStore.switchVariant(requested)
      } else {
        // Unknown or foreign id — drop the param rather than 404ing the view.
        void router.replace({ name: 'builder' })
      }
    }
  })

  // Keep the URL pointing at the version on screen so it can be bookmarked and
  // shared between the dashboard and the builder. `replace` so tab switching
  // doesn't stack history entries the back button has to walk through.
  watch(
    () => cvStore.activeVariantId,
    (id) => {
      if (!id || !hasMultipleVariants.value) return
      if (route.params.id === id) return
      void router.replace({ name: 'builder', params: { id } })
    },
  )

  // Watch each section for changes and trigger preview highlight.
  // Guard with cvStore.loadingData so the initial data load does not flash every
  // section in the preview on page load.
  // A single watcher with a snapshot comparison replaces 7 separate deep watchers,
  // reducing the number of traversals Vue performs on each keystroke.
  const SECTION_KEYS: SectionKey[] = [
    'personal',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
  ]
  const sectionSnapshots = new Map<SectionKey, string>()

  watch(
    () =>
      JSON.stringify([
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

  // PDF download — when the CV runs past one page, the export cuts everything
  // below the page-1 boundary, so ask for explicit confirmation first.
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

  // Save-failure surfacing: the pill (template) is persistent while the error
  // lasts; the toast fires once per transition into an error state so the
  // problem is noticed even if the pill is off-screen on mobile.
  const showSaveErrorToast = ref(false)
  let saveErrorToastTimer: ReturnType<typeof setTimeout> | null = null

  const saveErrorText = computed(() => {
    const reason = lastSaveError.value?.reason
    if (!reason) return ''
    switch (reason) {
      case 'too_large':
        return t('builder.saveError.tooLarge')
      case 'invalid':
        return t('builder.saveError.invalid')
      case 'quota_exceeded':
        return t('builder.saveError.quota')
      case 'unavailable':
        return t('builder.saveError.unavailable')
      case 'plan_limit':
        return t('builder.saveError.planLimit')
      default:
        return t('builder.saveError.network')
    }
  })

  watch(lastSaveError, (err, prev) => {
    if (err && !prev) {
      showSaveErrorToast.value = true
      if (saveErrorToastTimer) clearTimeout(saveErrorToastTimer)
      saveErrorToastTimer = setTimeout(() => {
        showSaveErrorToast.value = false
        saveErrorToastTimer = null
      }, 5000)
    }
    if (!err) showSaveErrorToast.value = false
  })

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

  // Static sections — always first, never draggable (title resolved via sectionTitle())
  const staticSections = computed(() => [
    {
      key: 'personal' as SectionKey,
      icon: '◉',
      defaultOpen: true,
      completed: isPersonalComplete.value,
      hasAI: false,
    },
    {
      key: 'summary' as SectionKey,
      icon: '§',
      defaultOpen: false,
      completed: isSummaryComplete.value,
      hasAI: true,
    },
  ])

  // Metadata map for draggable sections (icon only; title resolved via sectionTitle())
  const DRAGGABLE_META: Record<string, { icon: string }> = {
    experience: { icon: '▦' },
    education: { icon: '◊' },
    skills: { icon: '✦' },
    projects: { icon: '⎔' },
    certifications: { icon: '√' },
    languages: { icon: '❡' },
  }

  // Mutable ref — v-model target for VueDraggable. Holds key + metadata only;
  // completion state is kept separate (completionFor) so it stays reactive.
  const draggableSections = ref(
    DRAGGABLE_SECTION_KEYS.map((key) => ({ key, ...DRAGGABLE_META[key] })),
  )

  // Reactive completion map — read in template as completionFor[section.key]
  const completionFor = computed<Record<string, boolean>>(() => ({
    experience: isExperienceComplete.value,
    education: isEducationComplete.value,
    skills: isSkillsComplete.value,
    projects: isProjectsComplete.value,
    certifications: isCertificationsComplete.value,
    languages: isLanguagesComplete.value,
  }))

  // Rebuild draggableSections to match a stored section order, appending any
  // sections the stored order is missing (e.g. after a schema migration adds a
  // new section). Shared by the load watcher and the already-loaded mount path.
  function applySectionOrder(order: SectionKey[] | undefined): void {
    if (!order) return
    const known = order.filter((k) => k in DRAGGABLE_META) as SectionKey[]
    const missing = DRAGGABLE_SECTION_KEYS.filter((k) => !known.includes(k))
    draggableSections.value = [...known, ...missing].map((key) => ({
      key,
      ...DRAGGABLE_META[key],
    }))
  }

  // Sync draggableSections order from store after loadFromStorage completes.
  // The loadingData guard ensures this only runs during the initial load, not
  // after every setSectionOrder call (which would create a redundant re-sync).
  watch(
    () => cvData.value.meta.sectionOrder,
    (order) => {
      if (!cvStore.loadingData) return
      applySectionOrder(order)
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
          <div class="px-6 pt-7 pb-8 max-w-9/10 max-w-screen-lg mx-auto">
            <!-- Editorial heading -->
            <p class="mono-eyebrow mb-3">{{ t('builder.eyebrow') }}</p>
            <h2
              class="font-display leading-[1.05] tracking-editorial text-ink mb-7"
              :style="{ fontSize: 'clamp(28px, 3.4vw, 38px)' }"
            >
              {{ t('builder.headingLine1') }}<br />
              <span class="accent-italic">{{
                t_obj<{ accent: string }>('builder.headingLine2').accent
              }}</span
              ><span class="text-ink">{{
                t_obj<{ suffix: string }>('builder.headingLine2').suffix
              }}</span>
            </h2>

            <!-- CV version tabs — each tab is a full, standalone CV -->
            <VariantTabs />

            <!-- Static sections — Personal Info and Professional Summary -->
            <FormSection
              v-for="(section, idx) in staticSections"
              :key="section.key"
              :title="sectionTitle(section.key)"
              :icon="section.icon"
              :default-open="section.defaultOpen"
              :step-index="idx"
              :completed="section.completed"
              :ai-label="section.hasAI ? t('builder.aiBadge.label') : undefined"
              :ai-hint="section.hasAI ? t('builder.aiBadge.hint') : undefined"
              :shared-label="sharedLabelFor(section.key)"
              :shared-hint="sharedHintFor(section.key)"
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
              :delay="200"
              :delay-on-touch-only="true"
              :touch-start-threshold="5"
              @end="onSectionDragEnd"
            >
              <FormSection
                v-for="(section, idx) in draggableSections"
                :key="section.key"
                :title="sectionTitle(section.key)"
                :icon="section.icon"
                :default-open="false"
                :step-index="staticSections.length + idx"
                :completed="completionFor[section.key] ?? false"
                :draggable="true"
                :shared-label="sharedLabelFor(section.key)"
                :shared-hint="sharedHintFor(section.key)"
              >
                <ExperienceForm v-if="section.key === 'experience'" />
                <EducationForm v-else-if="section.key === 'education'" />
                <SkillsForm v-else-if="section.key === 'skills'" />
                <ProjectsForm v-else-if="section.key === 'projects'" />
                <CertificationsForm v-else-if="section.key === 'certifications'" />
                <LanguagesForm v-else-if="section.key === 'languages'" />
              </FormSection>
            </VueDraggable>

            <!-- Clear data — quiet, never the headline action -->
            <button
              type="button"
              class="w-full mt-6 py-2 mono-eyebrow text-[10.5px] text-muted hover:text-ink transition-colors"
              @click="showClearConfirm = true"
            >
              {{ t('builder.clearData') }}
            </button>
          </div>
        </template>

        <!-- ── Preview Panel ────────────────────────────────── -->
        <template #preview>
          <!--
            relative container so the floating zoom + download islands can be
            positioned absolute without affecting the scroll area layout.
            overflow-hidden is intentionally ABSENT from the inner CV wrapper
            so the CV element is never clipped in the preview or PDF.
          -->
          <div class="relative h-full">
            <!-- A4 preview scroll area — fills the full panel height -->
            <div
              ref="previewScrollEl"
              class="h-full overflow-auto flex justify-center py-8 px-4"
              style="background: var(--paper2)"
            >
              <!--
                Height tracks the real content height (not a fixed one page) so
                an overflowing CV stays reachable by scrolling. The dashed line
                marks where page 1 — the only page the PDF exports — ends.
              -->
              <div
                class="relative"
                :style="{
                  height: `${Math.max(A4_HEIGHT_PX, contentHeight) * previewScale}px`,
                  width: `${A4_WIDTH_PX * previewScale}px`,
                  flexShrink: '0',
                }"
              >
                <div
                  class="relative"
                  :style="{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                  }"
                >
                  <!--
                    CVPreview stays mounted at all times so #cv-preview exists
                    for useCVOverflow's observer. During a logged-in cold load
                    (empty store, cloud CV still inbound) the skeleton simply
                    overlays the empty template instead of replacing it, so the
                    swap to real data is invisible and overflow tracking keeps
                    working the moment the data lands.
                  -->
                  <CVPreview />
                  <PreviewSkeleton v-if="showPreviewSkeleton" class="absolute top-0 left-0" />
                </div>

                <div
                  v-if="isOverflowing"
                  class="absolute left-0 right-0 pointer-events-none"
                  :style="{
                    top: `${A4_HEIGHT_PX * previewScale}px`,
                    borderTop: '1px dashed var(--accent)',
                  }"
                  aria-hidden="true"
                >
                  <span
                    class="mono-eyebrow text-[9.5px] absolute right-0 -top-0.5 -translate-y-full px-1.5 py-0.5 rounded"
                    style="color: var(--accent); background: var(--paper)"
                  >
                    {{ t('builder.overflow.pageEnd') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Floating save indicator — top-left on desktop, top-center on mobile -->
            <Transition
              enter-active-class="transition-opacity duration-200"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-opacity duration-300"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-if="showSaved && !lastSaveError"
                class="absolute top-4 left-1/2 -translate-x-1/2 md:top-5 md:left-5 md:translate-x-0 z-10 flex items-center gap-2 rounded-full px-3 py-1.5"
                style="
                  background: var(--paper);
                  box-shadow:
                    0 2px 12px rgba(0, 0, 0, 0.08),
                    0 0 0 1px rgba(0, 0, 0, 0.06);
                "
                aria-live="polite"
                role="status"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  style="background: #22c55e"
                  aria-hidden="true"
                />
                <span class="mono-eyebrow text-[10.5px]">{{ t('builder.saved') }}</span>
              </div>
            </Transition>

            <!-- Persistent save-failure pill — stays until a save succeeds -->
            <div
              v-if="lastSaveError"
              class="absolute top-4 left-1/2 -translate-x-1/2 md:top-5 md:left-5 md:translate-x-0 z-10 flex items-center gap-2 rounded-full px-3 py-1.5"
              style="
                background: var(--paper);
                box-shadow:
                  0 2px 12px rgba(0, 0, 0, 0.08),
                  0 0 0 1px rgba(239, 68, 68, 0.35);
              "
              role="alert"
            >
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                style="background: #ef4444"
                aria-hidden="true"
              />
              <span class="mono-eyebrow text-[10.5px]">{{ saveErrorText }}</span>
            </div>

            <!-- Overflow badge — the CV no longer fits the one exported page -->
            <div
              v-if="isOverflowing"
              class="absolute top-14 left-1/2 -translate-x-1/2 md:top-16 md:left-5 md:translate-x-0 z-10 flex items-center gap-2 rounded-full px-3 py-1.5"
              style="
                background: var(--paper);
                box-shadow:
                  0 2px 12px rgba(0, 0, 0, 0.08),
                  0 0 0 1px rgba(0, 0, 0, 0.06);
              "
              role="status"
            >
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                style="background: var(--accent)"
                aria-hidden="true"
              />
              <span class="mono-eyebrow text-[10.5px]" style="color: var(--accent)">
                {{ t('builder.overflow.badge') }}
              </span>
            </div>

            <!-- Floating zoom island — bottom-left (desktop only) -->
            <div
              class="hidden md:flex absolute bottom-5 left-5 z-10 items-center gap-0.5 rounded-2xl px-2 py-1.5"
              style="
                background: var(--paper);
                box-shadow:
                  0 4px 16px rgba(0, 0, 0, 0.1),
                  0 0 0 1px rgba(0, 0, 0, 0.06);
              "
            >
              <button
                type="button"
                :disabled="previewScale <= ZOOM_MIN"
                class="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-overlay/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :aria-label="t('aria.zoomOut')"
                @click="zoomOut"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M20 12H4"
                  />
                </svg>
              </button>

              <span class="mono-eyebrow text-[11px] tabular-nums w-9 text-center select-none">
                {{ Math.round(previewScale * 100) }}%
              </span>

              <button
                type="button"
                :disabled="previewScale >= ZOOM_MAX"
                class="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-overlay/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :aria-label="t('aria.zoomIn')"
                @click="zoomIn"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>

              <div class="w-px h-3.5 mx-1 shrink-0 bg-overlay/15" aria-hidden="true" />

              <button
                type="button"
                class="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
                :aria-label="t('aria.fitToPanel')"
                :title="t('builder.fitPanel')"
                @click="fitToPanel"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5"
                  />
                </svg>
              </button>
            </div>

            <!-- Floating download island — top-right (desktop only) -->
            <div class="hidden md:block absolute top-5 right-5 z-10">
              <button
                type="button"
                :disabled="pdfStatus === 'generating'"
                class="btn-primary text-[13px]"
                style="box-shadow: 0 4px 16px rgba(184, 83, 42, 0.22)"
                :aria-label="t('aria.downloadCv')"
                @click="handleDownload"
              >
                <LoadingSpinner v-if="pdfStatus === 'generating'" size="sm" />
                <span v-else aria-hidden="true">↓</span>
                <!-- Intentionally not localized: button label stays English in all locales -->
                {{ pdfStatus === 'generating' ? 'Generating…' : 'Download PDF' }}
              </button>
            </div>

            <!-- Mobile consolidated pill — zoom + download icon -->
            <div
              class="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 rounded-2xl px-2 py-1.5"
              style="
                background: var(--paper);
                box-shadow:
                  0 4px 16px rgba(0, 0, 0, 0.12),
                  0 0 0 1px rgba(0, 0, 0, 0.06);
              "
            >
              <button
                type="button"
                :disabled="previewScale <= ZOOM_MIN"
                class="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-overlay/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :aria-label="t('aria.zoomOut')"
                @click="zoomOut"
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
                    d="M20 12H4"
                  />
                </svg>
              </button>

              <span class="mono-eyebrow text-[11px] tabular-nums w-9 text-center select-none">
                {{ Math.round(previewScale * 100) }}%
              </span>

              <button
                type="button"
                :disabled="previewScale >= ZOOM_MAX"
                class="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-overlay/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :aria-label="t('aria.zoomIn')"
                @click="zoomIn"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>

              <button
                type="button"
                class="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
                :aria-label="t('aria.fitToPanel')"
                :title="t('builder.fitPanel')"
                @click="fitToPanel"
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
                    stroke-width="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5"
                  />
                </svg>
              </button>

              <div class="w-px h-4 mx-1 shrink-0 bg-overlay/15" aria-hidden="true" />

              <button
                type="button"
                :disabled="pdfStatus === 'generating'"
                class="w-9 h-8 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-60"
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
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5m0 0l5-5m-5 5V4"
                  />
                </svg>
              </button>
            </div>
          </div>
        </template>
      </SplitLayout>
    </div>

    <!-- Toast notifications -->
    <ToastNotification
      :visible="pdfStatus === 'success'"
      :message="t('builder.toast.pdfSuccess')"
      type="success"
    />
    <ToastNotification
      :visible="pdfStatus === 'error'"
      :message="pdfError || t('builder.toast.pdfError')"
      type="error"
    />
    <ToastNotification
      :visible="showSaveErrorToast"
      :message="t('builder.saveError.toast')"
      type="error"
    />

    <!-- Upgrade modal -->
    <UpgradePrompt />

    <!-- Overflow export confirmation — export cuts everything below page 1 -->
    <ConfirmModal
      :visible="showOverflowConfirm"
      :title="t('builder.overflow.confirmTitle')"
      :message="t('builder.overflow.confirmMessage')"
      :confirm-label="t('builder.overflow.confirmLabel')"
      @confirm="confirmOverflowDownload"
      @cancel="showOverflowConfirm = false"
    />

    <!-- Clear data confirmation -->
    <ConfirmModal
      :visible="showClearConfirm"
      :title="t('builder.clearTitle')"
      :message="hasMultipleVariants ? t('builder.clearVariantMessage') : t('builder.clearMessage')"
      :confirm-label="t('builder.clearConfirm')"
      @confirm="confirmClearData"
      @cancel="showClearConfirm = false"
    />
  </div>
</template>
