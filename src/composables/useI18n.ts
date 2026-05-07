import { computed } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import en from '@/i18n/en'
import tr from '@/i18n/tr'
import type { Translations } from '@/i18n/index'

const locales: Record<string, Translations> = { en, tr }

export function useI18n() {
  const localeStore = useLocaleStore()
  const messages = computed<Translations>(() => locales[localeStore.locale] ?? locales.en)

  function resolve(key: string): unknown {
    return key.split('.').reduce<unknown>((obj, segment) => {
      if (obj == null || typeof obj !== 'object') return undefined
      return (obj as Record<string, unknown>)[segment]
    }, messages.value)
  }

  function t(key: string, params?: Record<string, string>): string {
    const raw = resolve(key)
    if (typeof raw !== 'string') {
      if (import.meta.env.DEV) console.warn(`[i18n] Missing or non-string key: "${key}"`)
      return key
    }
    if (!params) return raw
    return raw.replace(/\{(\w+)\}/g, (_, p) => params[p] ?? `{${p}}`)
  }

  function t_obj<T = unknown>(key: string): T {
    return resolve(key) as T
  }

  return {
    t,
    t_obj,
    locale: computed(() => localeStore.locale),
    setLocale: localeStore.setLocale,
  }
}
