import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'cv-generate-theme'

export const useThemeStore = defineStore('theme', () => {
  // Read initial state directly from DOM (set by the inline anti-flash script)
  const isDark = ref(document.documentElement.classList.contains('dark'))

  function toggleTheme(): void {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
    // Apply the transition class first, then toggle .dark one frame later so the
    // browser has a stable "before" state to animate from — prevents the race
    // condition where both mutations land in the same style recalculation and the
    // preview background intermittently skips the transition.
    document.documentElement.classList.add('theme-transitioning')
    requestAnimationFrame(() => {
      document.documentElement.classList.toggle('dark', isDark.value)
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning')
      }, 350)
    })
  }

  return { isDark, toggleTheme }
})
