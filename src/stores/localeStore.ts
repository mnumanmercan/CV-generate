import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Locale } from '@/i18n/index'

const STORAGE_KEY = 'resumark-locale'

export const useLocaleStore = defineStore('locale', () => {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
  const locale = ref<Locale>(stored === 'tr' ? 'tr' : 'en')

  document.documentElement.lang = locale.value

  function setLocale(newLocale: Locale): void {
    locale.value = newLocale
    localStorage.setItem(STORAGE_KEY, newLocale)
    document.documentElement.lang = newLocale
  }

  return { locale, setLocale }
})
