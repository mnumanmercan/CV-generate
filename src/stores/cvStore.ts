import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import {
  type CVData,
  type SectionKey,
  createEmptyCVData,
  CURRENT_VERSION,
  migrateCVData,
} from '@/types/cv.types'
import { localStorageService } from '@/services/storageService'
import {
  SAVE_INDICATOR_MS,
  SECTION_HIGHLIGHT_MS,
} from '@/constants/timing'

export const useCVStore = defineStore('cv', () => {
  const cvData = ref<CVData>(createEmptyCVData())
  const activeSection = ref<SectionKey | null>(null)
  const highlightedSection = ref<SectionKey | null>(null)
  const isSaving = ref(false)
  const loadingData = ref(false)
  const isLoaded = ref(false)
  const lastSavedAt = ref<Date | null>(null)
  const saveIndicatorVisible = ref(false)

  const isPersonalComplete = computed(() => {
    const p = cvData.value.personal
    return !!(p.fullName && p.email && p.phone && p.location && p.jobTitle)
  })

  const isSummaryComplete = computed(() => cvData.value.summary.trim().length >= 50)

  const isExperienceComplete = computed(
    () =>
      cvData.value.experience.length > 0 &&
      cvData.value.experience.every((e) => e.position.trim() && e.company.trim()),
  )

  const isEducationComplete = computed(
    () =>
      cvData.value.education.length > 0 &&
      cvData.value.education.every((e) => e.institution.trim()),
  )

  const isSkillsComplete = computed(
    () => cvData.value.skills.length > 0 && cvData.value.skills.some((s) => s.items.length > 0),
  )

  const isProjectsComplete = computed(
    () =>
      cvData.value.projects.length > 0 && cvData.value.projects.every((p) => p.name.trim()),
  )

  const isCertificationsComplete = computed(
    () =>
      cvData.value.certifications.length > 0 &&
      cvData.value.certifications.every((c) => c.name.trim()),
  )

  async function loadFromStorage(): Promise<void> {
    loadingData.value = true
    const stored = await localStorageService.load()
    if (stored) {
      // Run all pending migrations while loadingData is still true so
      // useAutoSave ignores this synthetic write.
      cvData.value = migrateCVData(stored)
    } else {
      // Storage is empty (e.g. after logout when the cloud user had no local
      // data). Reset to blank so stale in-memory data from the previous
      // session doesn't leak into the UI.
      cvData.value = createEmptyCVData()
    }
    // Wait for Vue to flush the queued watchers (triggered by the cvData
    // replacement above) BEFORE clearing the flag — this lets every watcher
    // see loadingData === true and bail out, preventing spurious auto-saves
    // and preview-section flashes on initial page load.
    await nextTick()
    isLoaded.value = true
    loadingData.value = false
  }

  async function saveToStorage(): Promise<void> {
    // Guard against concurrent saves (auto-save + manual save firing simultaneously).
    if (isSaving.value) return
    isSaving.value = true
    try {
      // Deep-clone before saving so mutations that happen while the async save is
      // in flight don't corrupt the snapshot. Shallow spread only copies the top
      // level — nested arrays (experience, education, bullets…) share references.
      const snapshot: CVData = JSON.parse(JSON.stringify(cvData.value)) as CVData
      snapshot.meta.updatedAt = new Date().toISOString()
      snapshot.meta.version = CURRENT_VERSION
      await localStorageService.save(snapshot)
      lastSavedAt.value = new Date()
      saveIndicatorVisible.value = true
      setTimeout(() => {
        saveIndicatorVisible.value = false
      }, SAVE_INDICATOR_MS)
    } finally {
      isSaving.value = false
    }
  }

  function setActiveSection(section: SectionKey | null): void {
    activeSection.value = section
  }

  function triggerSectionHighlight(section: SectionKey): void {
    highlightedSection.value = section
    setTimeout(() => {
      highlightedSection.value = null
    }, SECTION_HIGHLIGHT_MS)
  }

  function setTemplate(templateId: string): void {
    cvData.value.meta.templateId = templateId
  }

  function setSectionOrder(order: SectionKey[]): void {
    cvData.value.meta.sectionOrder = order
  }

  async function clearData(): Promise<void> {
    isLoaded.value = false
    cvData.value = createEmptyCVData()
    await localStorageService.clear()
  }

  return {
    cvData,
    activeSection,
    highlightedSection,
    isSaving,
    loadingData,
    isLoaded,
    lastSavedAt,
    saveIndicatorVisible,
    isPersonalComplete,
    isSummaryComplete,
    isExperienceComplete,
    isEducationComplete,
    isSkillsComplete,
    isProjectsComplete,
    isCertificationsComplete,
    loadFromStorage,
    saveToStorage,
    setActiveSection,
    triggerSectionHighlight,
    setTemplate,
    setSectionOrder,
    clearData,
  }
})
