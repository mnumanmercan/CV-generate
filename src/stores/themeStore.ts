import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'cv-generate-theme'

export const useThemeStore = defineStore('theme', () => {
  // Read initial state directly from DOM (set by the inline anti-flash script)
  const isDark = ref(document.documentElement.classList.contains('dark'))

  function toggleTheme(): void {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
    // Briefly add transition class so all CSS-var changes animate smoothly
    document.documentElement.classList.add('theme-transitioning')
    document.documentElement.classList.toggle('dark', isDark.value)
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
    }, 350)
  }

  return { isDark, toggleTheme }
})
