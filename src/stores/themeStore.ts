import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'cv-generate-theme'
const TRANSITION_DURATION_MS = 350

export const useThemeStore = defineStore('theme', () => {
  // Read initial state directly from DOM (set by the inline anti-flash script)
  const isDark = ref(document.documentElement.classList.contains('dark'))

  // Track pending animation timers so they can be cancelled on rapid toggles.
  let rafId: number | null = null
  let transitionTimerId: ReturnType<typeof setTimeout> | null = null

  function toggleTheme(): void {
    // Cancel any in-flight animation from a previous toggle.
    if (rafId !== null) cancelAnimationFrame(rafId)
    if (transitionTimerId !== null) clearTimeout(transitionTimerId)

    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
    // Apply the transition class first, then toggle .dark one frame later so the
    // browser has a stable "before" state to animate from — prevents the race
    // condition where both mutations land in the same style recalculation and the
    // preview background intermittently skips the transition.
    document.documentElement.classList.add('theme-transitioning')
    rafId = requestAnimationFrame(() => {
      rafId = null
      document.documentElement.classList.toggle('dark', isDark.value)
      transitionTimerId = setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning')
        transitionTimerId = null
      }, TRANSITION_DURATION_MS)
    })
  }

  return { isDark, toggleTheme }
})
