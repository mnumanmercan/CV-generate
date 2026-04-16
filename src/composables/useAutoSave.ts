import { watch } from 'vue'
import { useCVStore } from '@/stores/cvStore'
import { AUTOSAVE_DEBOUNCE_MS } from '@/constants/timing'

export function useAutoSave() {
  const cvStore = useCVStore()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => cvStore.cvData,
    () => {
      // Skip while loadFromStorage is replacing cvData — that replacement would
      // otherwise trigger an immediate save of the just-loaded data.
      if (cvStore.loadingData) return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        cvStore.saveToStorage()
      }, AUTOSAVE_DEBOUNCE_MS)
    },
    { deep: true },
  )
}
