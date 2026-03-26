import { watch } from 'vue'
import { useCVStore } from '@/stores/cvStore'

const DEBOUNCE_MS = 500

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
      }, DEBOUNCE_MS)
    },
    { deep: true },
  )
}
