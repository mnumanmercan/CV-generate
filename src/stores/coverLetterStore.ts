import { defineStore } from 'pinia'
import { ref } from 'vue'
import { watch, nextTick } from 'vue'
import { type CoverLetterData, createEmptyCoverLetterData } from '@/types/coverLetter.types'
import type { PersonalInfo } from '@/types/cv.types'
import { coverLetterStorageService } from '@/services/coverLetterStorageService'

const DEBOUNCE_MS = 500

export const useCoverLetterStore = defineStore('coverLetter', () => {
  const clData = ref<CoverLetterData>(createEmptyCoverLetterData())
  const loadingData = ref(false)
  const isSaving = ref(false)
  const saveIndicatorVisible = ref(false)

  /* ── Auto-save watcher ──────────────────────────────────────── */
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => clData.value,
    () => {
      if (loadingData.value) return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        saveToStorage()
      }, DEBOUNCE_MS)
    },
    { deep: true },
  )

  /* ── Load ───────────────────────────────────────────────────── */
  async function loadFromStorage(): Promise<void> {
    loadingData.value = true
    const stored = await coverLetterStorageService.load()
    if (stored) {
      clData.value = stored
    }
    await nextTick()
    loadingData.value = false
  }

  /* ── Save ───────────────────────────────────────────────────── */
  async function saveToStorage(): Promise<void> {
    isSaving.value = true
    const snapshot: CoverLetterData = {
      ...clData.value,
      meta: { ...clData.value.meta, updatedAt: new Date().toISOString() },
    }
    await coverLetterStorageService.save(snapshot)
    isSaving.value = false
    saveIndicatorVisible.value = true
    setTimeout(() => {
      saveIndicatorVisible.value = false
    }, 2500)
  }

  /* ── Populate from CV personal info ─────────────────────────── */
  function populateFromCV(personal: PersonalInfo): void {
    clData.value.fullName = personal.fullName
    clData.value.jobTitle = personal.jobTitle
    clData.value.email    = personal.email
    clData.value.phone    = personal.phone
    clData.value.location = personal.location
  }

  /* ── Clear ──────────────────────────────────────────────────── */
  async function clearData(): Promise<void> {
    clData.value = createEmptyCoverLetterData()
    await coverLetterStorageService.clear()
  }

  return {
    clData,
    loadingData,
    isSaving,
    saveIndicatorVisible,
    loadFromStorage,
    saveToStorage,
    populateFromCV,
    clearData,
  }
})
