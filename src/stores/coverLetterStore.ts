import { defineStore } from 'pinia'
import { ref } from 'vue'
import { watch, nextTick } from 'vue'
import {
  type CoverLetterData,
  createEmptyCoverLetterData,
  migrateCoverLetterData,
} from '@/types/coverLetter.types'
import type { PersonalInfo } from '@/types/cv.types'
import {
  coverLetterStorageService,
  readLocalCoverLetterSync,
} from '@/services/coverLetterStorageService'
import { useUserStore } from '@/stores/userStore'
import { AUTOSAVE_DEBOUNCE_MS, SAVE_INDICATOR_MS } from '@/constants/timing'

/**
 * Seed the store from localStorage synchronously so the preview renders the
 * last-saved letter on first paint instead of flashing the empty default.
 * A first-paint optimisation only — `loadFromStorage()` still reconciles
 * against the active backend on mount. Migration is guarded so a corrupt/legacy
 * blob can never break app boot.
 */
function seedInitialCoverLetterData(): CoverLetterData {
  const stored = readLocalCoverLetterSync()
  if (!stored) return createEmptyCoverLetterData()
  try {
    return migrateCoverLetterData(stored)
  } catch {
    return createEmptyCoverLetterData()
  }
}

export const useCoverLetterStore = defineStore('coverLetter', () => {
  const clData = ref<CoverLetterData>(seedInitialCoverLetterData())
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
        saveToStorage().catch((err) => {
          console.warn('[coverLetterStore] auto-save failed:', err)
        })
      }, AUTOSAVE_DEBOUNCE_MS)
    },
    { deep: true },
  )

  /* ── Load ───────────────────────────────────────────────────── */
  async function loadFromStorage(): Promise<void> {
    loadingData.value = true
    try {
      // Wait only until the active storage backend is known (decided by the
      // refresh probe, before the slower GET /user/me) so a cold load reads
      // from the correct backend (cloud once logged in) rather than racing the
      // local→cloud delegate swap. This runs the cover-letter read in parallel
      // with /user/me. No-op once resolved.
      await useUserStore().ensureStorageBackendResolved()
      const stored = await coverLetterStorageService.load()
      if (stored) {
        clData.value = migrateCoverLetterData(stored)
      } else {
        clData.value = createEmptyCoverLetterData()
      }
      await nextTick()
    } finally {
      // Always clear — a failed cloud load must not leave loadingData stuck true,
      // which would silently disable auto-save for the rest of the session.
      loadingData.value = false
    }
  }

  /* ── Save ───────────────────────────────────────────────────── */
  async function saveToStorage(): Promise<void> {
    if (isSaving.value) return
    isSaving.value = true
    try {
      const snapshot: CoverLetterData = JSON.parse(JSON.stringify(clData.value)) as CoverLetterData
      snapshot.meta.updatedAt = new Date().toISOString()
      await coverLetterStorageService.save(snapshot)
      saveIndicatorVisible.value = true
      setTimeout(() => {
        saveIndicatorVisible.value = false
      }, SAVE_INDICATOR_MS)
    } finally {
      isSaving.value = false
    }
  }

  /* ── Populate from CV personal info ─────────────────────────── */
  function populateFromCV(personal: PersonalInfo): void {
    clData.value.fullName = personal.fullName
    clData.value.jobTitle = personal.jobTitle
    clData.value.email = personal.email
    clData.value.phone = personal.phone
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
