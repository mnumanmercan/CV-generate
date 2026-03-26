import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  type CVData,
  type SectionKey,
  createEmptyCVData,
} from '@/types/cv.types'
import { localStorageService } from '@/services/storageService'

export const useCVStore = defineStore('cv', () => {
  const cvData = ref<CVData>(createEmptyCVData())
  const activeSection = ref<SectionKey | null>(null)
  const highlightedSection = ref<SectionKey | null>(null)
  const isSaving = ref(false)
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
    const stored = await localStorageService.load()
    if (stored) {
      cvData.value = stored
    }
  }

  async function saveToStorage(): Promise<void> {
    isSaving.value = true
    // Build a snapshot with the updated timestamp instead of mutating cvData
    // directly — mutating cvData here would re-trigger the deep watcher in
    // useAutoSave, creating an infinite save loop that causes the indicator
    // to flicker every 500ms.
    const snapshot: CVData = {
      ...cvData.value,
      meta: { ...cvData.value.meta, updatedAt: new Date().toISOString() },
    }
    await localStorageService.save(snapshot)
    isSaving.value = false
    lastSavedAt.value = new Date()
    saveIndicatorVisible.value = true
    setTimeout(() => {
      saveIndicatorVisible.value = false
    }, 2500)
  }

  function setActiveSection(section: SectionKey | null): void {
    activeSection.value = section
  }

  function triggerSectionHighlight(section: SectionKey): void {
    highlightedSection.value = section
    setTimeout(() => {
      highlightedSection.value = null
    }, 1300)
  }

  async function clearData(): Promise<void> {
    cvData.value = createEmptyCVData()
    await localStorageService.clear()
  }

  return {
    cvData,
    activeSection,
    highlightedSection,
    isSaving,
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
    clearData,
  }
})
