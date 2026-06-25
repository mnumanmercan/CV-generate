import { watch, onBeforeUnmount } from 'vue'
import { useCVStore } from '@/stores/cvStore'
import { StorageError } from '@/services/apiStorageService'
import { AUTOSAVE_DEBOUNCE_MS, RATE_LIMIT_COOLDOWN_MS } from '@/constants/timing'

export function useAutoSave() {
  const cvStore = useCVStore()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // When the server rate-limits a save (429), retrying on the very next
  // keystroke just keeps the limiter bucket saturated — and because a failed
  // resolve never caches the CV id, the storm self-sustains. Instead we pause
  // auto-save until `cooldownUntil`, then fire ONE trailing save so edits made
  // during the pause aren't lost if the user stops typing.
  let cooldownUntil = 0
  let cooldownTimer: ReturnType<typeof setTimeout> | null = null

  function runSave(): void {
    cvStore.saveToStorage().catch((err) => {
      if (err instanceof StorageError && err.reason === 'rate_limited') {
        const wait = err.retryAfterMs ?? RATE_LIMIT_COOLDOWN_MS
        cooldownUntil = Date.now() + wait
        if (cooldownTimer) clearTimeout(cooldownTimer)
        // Trailing save when the window resets — flushes whatever the user
        // typed during the pause without waiting for their next edit.
        cooldownTimer = setTimeout(() => {
          cooldownUntil = 0
          cooldownTimer = null
          cvStore.saveToStorage().catch((e) => console.warn('[useAutoSave] save failed:', e))
        }, wait)
        console.warn(`[useAutoSave] rate limited — pausing auto-save for ${wait}ms`)
        return
      }
      // Other storage errors (API validation, network) are logged but not
      // re-thrown — an auto-save failure should not crash the app. The user
      // can keep editing and the next auto-save cycle will retry.
      console.warn('[useAutoSave] save failed:', err)
    })
  }

  watch(
    () => cvStore.cvData,
    () => {
      // Skip while loadFromStorage is replacing cvData — that replacement would
      // otherwise trigger an immediate save of the just-loaded data.
      if (cvStore.loadingData) return
      // Paused after a 429 — the trailing cooldown save will flush pending edits.
      if (Date.now() < cooldownUntil) return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(runSave, AUTOSAVE_DEBOUNCE_MS)
    },
    { deep: true },
  )

  // Clear pending timers when the host component unmounts so a mid-debounce
  // navigation doesn't fire `saveToStorage` against a torn-down store (which
  // would either no-op or, worse, race with the next mount's load and clobber
  // freshly-loaded data with the pre-unmount snapshot).
  onBeforeUnmount(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (cooldownTimer) {
      clearTimeout(cooldownTimer)
      cooldownTimer = null
    }
  })
}
