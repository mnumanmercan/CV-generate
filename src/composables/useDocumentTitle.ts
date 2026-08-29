import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

export const BRAND = 'Resumark'

/**
 * The single owner of `document.title`. Nothing else should assign to it —
 * titles used to be set in two places at once (route meta *and* each view's
 * onMounted), which had already drifted out of sync.
 *
 * Format is page-first, brand-last. Browsers elide titles from the right, and
 * a tab strip with a handful of tabs open shows barely a dozen characters, so
 * "Resumark — Build a Professional Résumé Free" renders as "Resumark — Build
 * a Prof…" — every tab identical, none of them useful. Leading with the page
 * means the truncation eats the sacrificial half. The brand is not lost: the
 * favicon carries it.
 *
 * Home is the exception — it has no page to name, so the brand leads there.
 */
export function formatPageTitle(label: string, brandFirst = false): string {
  return brandFirst ? `${BRAND} — ${label}` : `${label} · ${BRAND}`
}

/**
 * A page-supplied label that replaces the route's static one — for titles only
 * known at runtime, like the person named on a shared CV. Cleared automatically
 * on navigation, so a stale name can never outlive its page.
 */
const override = ref<string | null>(null)

export function setPageTitle(label: string | null): void {
  override.value = label
}

/** Call once, from App.vue. Keeps the title in step with the route and locale. */
export function useDocumentTitle(): void {
  const route = useRoute()
  const { t, locale } = useI18n()

  // fullPath, not name: /p/:slug → /p/:slug is a real page change that keeps
  // the same route name, and the previous CV's owner must not linger.
  watch(
    () => route.fullPath,
    () => {
      override.value = null
    },
  )

  watch(
    [() => route.meta.titleKey, () => route.meta.brandFirst, override, locale],
    ([titleKey, brandFirst, custom]) => {
      const label = custom ?? (typeof titleKey === 'string' ? t(titleKey) : null)
      // No label yet (the very first tick, before the initial route resolves):
      // leave index.html's title in place rather than blanking the tab.
      if (!label) return
      document.title = formatPageTitle(label, brandFirst === true)
    },
    { immediate: true },
  )
}
