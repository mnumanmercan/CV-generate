import { onScopeDispose, ref, type Ref } from 'vue'

export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return matches
  }

  const mq = window.matchMedia(query)
  matches.value = mq.matches

  const handler = (event: MediaQueryListEvent): void => {
    matches.value = event.matches
  }

  mq.addEventListener('change', handler)
  onScopeDispose(() => mq.removeEventListener('change', handler))

  return matches
}
