import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import {
  type CVData,
  type SectionKey,
  createEmptyCVData,
  CURRENT_VERSION,
  migrateCVData,
} from '@/types/cv.types'
import { localStorageService, readLocalCVSync, type CVSummary } from '@/services/storageService'
import { StorageError, isTerminalReason, type StorageErrorReason } from '@/services/storageErrors'
import {
  applySharedSections,
  buildVariantSeed,
  clearTailoredSections,
  cloneCV,
} from '@/services/cvVariants'
import { useUserStore } from '@/stores/userStore'
import { SAVE_INDICATOR_MS, SECTION_HIGHLIGHT_MS } from '@/constants/timing'

// A single failed save on a flaky connection shouldn't flash an alarming
// "not saved" state — transient reasons only surface after this many
// consecutive failures. Terminal reasons (too_large, quota…) surface at once.
const TRANSIENT_FAILURES_BEFORE_ALERT = 2

/**
 * Seed the store from localStorage synchronously so the preview renders the
 * user's real CV on first paint instead of flashing the empty default. This is
 * a first-paint optimisation only — `loadFromStorage()` still runs on view
 * mount to reconcile against the active backend (identical local data for
 * guests → no visible change; the cloud copy for logged-in users). Migration
 * is guarded so a corrupt/legacy blob can never break app boot.
 */
function seedInitialCVData(): CVData {
  const stored = readLocalCVSync()
  if (!stored) return createEmptyCVData()
  try {
    return migrateCVData(stored)
  } catch {
    return createEmptyCVData()
  }
}

export const useCVStore = defineStore('cv', () => {
  // The ACTIVE variant's document. Deliberately a plain ref, exactly as before
  // variants existed: every form component binds `v-model="cvData.x.y"` through
  // storeToRefs, and CVPreview / usePDFExport / useAutoSave all read this one
  // ref. Siblings live in `variantCache` instead, so none of those consumers
  // needed to change.
  const cvData = ref<CVData>(seedInitialCVData())
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

  // ─── CV variants ────────────────────────────────────────────────────────────
  // A user's variants are simply all of their CVs — the Pro cap makes a
  // separate grouping column unnecessary, so `variants` is literally GET /cv.

  /** Tab strip source, newest-first. Empty on a single-CV (guest/free) backend. */
  const variants = ref<CVSummary[]>([])
  /** Loaded sibling documents, keyed by CV id. Never holds the active variant. */
  const variantCache = new Map<string, CVData>()
  /** Siblings whose shared sections were updated in memory and still need a PUT. */
  const dirtySiblings = new Set<string>()
  const activeVariantId = ref<string | null>(null)
  /** True while switchVariant is mid-swap — the tab strip disables during it. */
  const switchingVariant = ref(false)

  const canUseVariants = computed(() => localStorageService.supportsMultiple)
  const activeVariant = computed(
    () => variants.value.find((v) => v.id === activeVariantId.value) ?? null,
  )

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
      // Wait only until the active storage backend is known (decided by the
      // refresh probe, before the slower GET /user/me) so a cold load on a
      // public route (/, /builder) reads from the correct backend (cloud once
      // logged in) rather than racing the local→cloud delegate swap. This runs
      // the CV read in parallel with /user/me. No-op once resolved. Set
      // loadingData first so any cvData replacement during the wait still
      // suppresses auto-save.
      await useUserStore().ensureStorageBackendResolved()
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

  // ─── Variant actions ────────────────────────────────────────────────────────

  /**
   * Refresh the tab strip from the backend. Cheap — GET /cv is a slim list
   * (id/title/updatedAt), never the JSONB content — so siblings stay unloaded
   * until the user actually switches to one.
   */
  async function loadVariants(): Promise<void> {
    if (!localStorageService.supportsMultiple) {
      variants.value = []
      return
    }
    try {
      variants.value = await localStorageService.list()
      // Adopt whichever row load() already resolved as the active one.
      if (!activeVariantId.value) {
        activeVariantId.value = localStorageService.getActiveId() ?? variants.value[0]?.id ?? null
      }
    } catch (err) {
      // Non-fatal: the builder still works on the active CV, the strip just
      // shows a single tab. Don't surface this as a save error.
      console.warn('[cvStore] loadVariants failed:', err)
    }
  }

  /**
   * Push the shared sections of `source` into every cached sibling and mark
   * them for persistence. Variants that have never been loaded aren't in the
   * cache; they're brought up to date when they're first switched to.
   */
  function propagateSharedSections(source: CVData, sourceId: string | null): void {
    for (const [id, doc] of variantCache) {
      if (id === sourceId) continue
      applySharedSections(source, doc)
      dirtySiblings.add(id)
    }
  }

  /** Persist the siblings that propagation touched. Best-effort, backgrounded. */
  async function flushDirtySiblings(): Promise<void> {
    if (!localStorageService.supportsMultiple || dirtySiblings.size === 0) return
    const ids = [...dirtySiblings]
    dirtySiblings.clear()
    for (const id of ids) {
      const doc = id === activeVariantId.value ? cvData.value : variantCache.get(id)
      if (!doc) continue
      try {
        const snapshot = cloneCV(doc)
        snapshot.meta.updatedAt = new Date().toISOString()
        snapshot.meta.version = CURRENT_VERSION
        await localStorageService.saveById(id, snapshot)
      } catch (err) {
        // Re-queue so the next switch retries rather than losing the sync.
        dirtySiblings.add(id)
        console.warn(`[cvStore] failed to sync shared sections into ${id}:`, err)
      }
    }
  }

  /**
   * Make `id` the active variant.
   *
   * Order matters here. The outgoing document is flushed and cached first, its
   * shared sections propagate outward (it is by definition the most recently
   * edited), and only then does `loadingData` go true for the swap — which
   * suppresses auto-save, stops the preview flashing every section, and is the
   * one condition under which BuilderView re-syncs its drag-order list.
   */
  async function switchVariant(id: string): Promise<void> {
    if (switchingVariant.value || id === activeVariantId.value) return
    if (!localStorageService.supportsMultiple) return

    const outgoingId = activeVariantId.value
    switchingVariant.value = true
    try {
      if (outgoingId) {
        // Flush whatever the debounce hasn't written yet. A failure here is
        // already surfaced through lastSaveError; don't block the switch on it.
        try {
          await saveToStorage()
        } catch {
          /* surfaced via lastSaveError */
        }
        variantCache.set(outgoingId, cvData.value)
        propagateSharedSections(cvData.value, outgoingId)
      }

      loadingData.value = true

      let target = variantCache.get(id) ?? null
      if (!target) {
        const fetched = await localStorageService.loadById(id)
        target = fetched ? migrateCVData(fetched) : createEmptyCVData()
        // First time this variant has been loaded this session — its shared
        // sections may predate edits made in another tab. Repair from the
        // outgoing document and queue the write.
        if (outgoingId) {
          applySharedSections(cvData.value, target)
          dirtySiblings.add(id)
        }
      }
      variantCache.delete(id)

      activeVariantId.value = id
      localStorageService.setActiveId(id)
      cvData.value = target
      // Let every watcher observe loadingData === true before it clears —
      // same contract loadFromStorage() relies on.
      await nextTick()
      isLoaded.value = true
    } finally {
      loadingData.value = false
      switchingVariant.value = false
    }

    void flushDirtySiblings()
  }

  /**
   * Create a new variant seeded from the active one and switch to it.
   * Returns the new id, or null when the plan cap was hit (the caller turns
   * that into the upgrade prompt).
   */
  async function createVariant(
    title: string,
    mode: 'duplicate' | 'blank' = 'duplicate',
  ): Promise<string | null> {
    if (!localStorageService.supportsMultiple) return null
    // Commit the current doc first so the new variant inherits up-to-date
    // shared sections rather than a stale snapshot.
    try {
      await saveToStorage()
    } catch {
      /* surfaced via lastSaveError */
    }

    const seed = buildVariantSeed(cvData.value, mode)
    let created: CVSummary
    try {
      created = await localStorageService.create(seed, title)
    } catch (err) {
      if (err instanceof StorageError && err.reason === 'plan_limit') return null
      throw err
    }

    variants.value = [created, ...variants.value]
    variantCache.set(created.id, seed)
    await switchVariant(created.id)
    return created.id
  }

  async function renameVariant(id: string, title: string): Promise<void> {
    if (!localStorageService.supportsMultiple) return
    const trimmed = title.trim()
    if (!trimmed) return
    await localStorageService.rename(id, trimmed)
    variants.value = variants.value.map((v) => (v.id === id ? { ...v, title: trimmed } : v))
  }

  /**
   * Delete a variant. Refuses to remove the last one — an account with zero
   * CVs has no document for the builder to edit; "clear" is that action.
   */
  async function deleteVariant(id: string): Promise<void> {
    if (!localStorageService.supportsMultiple) return
    if (variants.value.length <= 1) return

    await localStorageService.remove(id)
    variants.value = variants.value.filter((v) => v.id !== id)
    variantCache.delete(id)
    dirtySiblings.delete(id)

    if (activeVariantId.value === id) {
      // Switch to the newest remaining variant. Clear the active pointer first
      // so switchVariant doesn't early-return on an id equality check.
      const next = variants.value[0]
      activeVariantId.value = null
      if (next) await switchVariant(next.id)
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

  /**
   * Reset the builder.
   *
   * With variants, this clears only the TAILORED sections of the active
   * variant. A full reset would blank the shared sections too, and those
   * propagate on the next tab switch — so "clear this version" would quietly
   * become "wipe the name and contact details out of all of them". Deleting a
   * whole variant is `deleteVariant`.
   *
   * On a single-CV backend (guest / free) the original behaviour is kept:
   * empty the document and drop it from storage entirely.
   */
  async function clearData(): Promise<void> {
    if (localStorageService.supportsMultiple && variants.value.length > 1) {
      clearTailoredSections(cvData.value)
      await saveToStorage()
      return
    }
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
    // variants
    variants,
    activeVariantId,
    activeVariant,
    switchingVariant,
    canUseVariants,
    loadVariants,
    switchVariant,
    createVariant,
    renameVariant,
    deleteVariant,
    loadFromStorage,
    saveToStorage,
    setActiveSection,
    triggerSectionHighlight,
    setTemplate,
    setSectionOrder,
    clearData,
  }
})
