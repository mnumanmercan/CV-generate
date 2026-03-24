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

  async function loadFromStorage(): Promise<void> {
    const stored = await localStorageService.load()
    if (stored) {
      cvData.value = stored
    }
  }

  async function saveToStorage(): Promise<void> {
    isSaving.value = true
    cvData.value.meta.updatedAt = new Date().toISOString()
    await localStorageService.save(cvData.value)
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
    }, 700)
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
    loadFromStorage,
    saveToStorage,
    setActiveSection,
    triggerSectionHighlight,
    clearData,
  }
})
