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
import { StorageError, isTerminalReason, type StorageErrorReason } from '@/services/storageErrors'
import { useUserStore } from '@/stores/userStore'
import { SAVE_INDICATOR_MS, SECTION_HIGHLIGHT_MS } from '@/constants/timing'

// A single failed save on a flaky connection shouldn't flash an alarming
// "not saved" state — transient reasons only surface after this many
// consecutive failures. Terminal reasons (too_large, quota…) surface at once.
const TRANSIENT_FAILURES_BEFORE_ALERT = 2

export const useCVStore = defineStore('cv', () => {
  const cvData = ref<CVData>(createEmptyCVData())
  const activeSection = ref<SectionKey | null>(null)
  const highlightedSection = ref<SectionKey | null>(null)
  const isSaving = ref(false)
  const loadingData = ref(false)
  const isLoaded = ref(false)
  const lastSavedAt = ref<Date | null>(null)
  const saveIndicatorVisible = ref(false)
  /** Set when saves are failing and the user must be told; null while healthy. */
  const lastSaveError = ref<{ reason: StorageErrorReason; message: string } | null>(null)
  let consecutiveTransientFailures = 0

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
    () => cvData.value.projects.length > 0 && cvData.value.projects.every((p) => p.name.trim()),
  )

  const isCertificationsComplete = computed(
    () =>
      cvData.value.certifications.length > 0 &&
      cvData.value.certifications.every((c) => c.name.trim()),
  )

  const isLanguagesComplete = computed(
    () => cvData.value.languages.length > 0 && cvData.value.languages.every((l) => l.name.trim()),
  )

  async function loadFromStorage(): Promise<void> {
    loadingData.value = true
    try {
      // Wait for an in-flight boot session probe to settle BEFORE reading, so a
      // cold load on a public route (/, /builder) reads from the correct backend
      // (cloud once logged in) rather than racing the local→cloud delegate swap.
      // No-op once the probe has resolved. Set loadingData first so any cvData
      // replacement during the wait still suppresses auto-save.
      await useUserStore().ensureSessionRestored()
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
    } finally {
      // Always clear the flag — a failed cloud load (offline / rate-limited)
      // must not leave loadingData stuck true, which would silently disable
      // auto-save for the rest of the session. The rejection still propagates
      // to the caller, which decides how to surface it.
      loadingData.value = false
    }
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
      lastSaveError.value = null
      consecutiveTransientFailures = 0
      saveIndicatorVisible.value = true
      setTimeout(() => {
        saveIndicatorVisible.value = false
      }, SAVE_INDICATOR_MS)
    } catch (err) {
      recordSaveFailure(err)
      // Re-throw so useAutoSave's rate-limit cooldown handling still runs.
      throw err
    } finally {
      isSaving.value = false
    }
  }

  function recordSaveFailure(err: unknown): void {
    const reason: StorageErrorReason = err instanceof StorageError ? err.reason : 'unknown'
    const message = err instanceof Error ? err.message : 'Save failed.'
    // rate_limited self-heals via useAutoSave's cooldown + trailing save —
    // showing an error for it would just alarm the user mid-typing-burst.
    if (reason === 'rate_limited') return
    if (isTerminalReason(reason)) {
      // Retrying the same payload can't fix these — tell the user now.
      lastSaveError.value = { reason, message }
      return
    }
    consecutiveTransientFailures += 1
    if (consecutiveTransientFailures >= TRANSIENT_FAILURES_BEFORE_ALERT) {
      lastSaveError.value = { reason, message }
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
    lastSaveError,
    isPersonalComplete,
    isSummaryComplete,
    isExperienceComplete,
    isEducationComplete,
    isSkillsComplete,
    isProjectsComplete,
    isCertificationsComplete,
    isLanguagesComplete,
    loadFromStorage,
    saveToStorage,
    setActiveSection,
    triggerSectionHighlight,
    setTemplate,
    setSectionOrder,
    clearData,
  }
})
