import { watch } from 'vue'
import { useCVStore } from '@/stores/cvStore'

const DEBOUNCE_MS = 500

export function useAutoSave() {
  const cvStore = useCVStore()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => cvStore.cvData,
    () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        cvStore.saveToStorage()
      }, DEBOUNCE_MS)
    },
    { deep: true },
  )
}
