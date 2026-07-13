import { onBeforeUnmount, onMounted, ref } from 'vue'
import { A4_HEIGHT_PX } from '@/constants/layout'

// Tolerance so sub-pixel rounding of the preview's own box never flags a
// perfectly one-page CV as overflowing.
const OVERFLOW_TOLERANCE_PX = 1

/**
 * Watches the CV preview element and reports whether its content exceeds one
 * A4 page. The preview renders with `min-height` (never clipped), so
 * `scrollHeight` reflects the full content height; a ResizeObserver keeps the
 * measurement current as the user types. `transform: scale()` on an ancestor
 * does not affect scrollHeight, so the measurement is zoom-independent.
 */
export function useCVOverflow(elementId = 'cv-preview') {
  const isOverflowing = ref(false)
  const contentHeight = ref(A4_HEIGHT_PX)

  let observer: ResizeObserver | null = null

  function measureNow(): void {
    const el = document.getElementById(elementId)
    if (!el) return
    contentHeight.value = el.scrollHeight
    isOverflowing.value = el.scrollHeight > A4_HEIGHT_PX + OVERFLOW_TOLERANCE_PX
  }

  onMounted(() => {
    measureNow()
    const el = document.getElementById(elementId)
    if (!el || typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver(measureNow)
    observer.observe(el)
  })

  onBeforeUnmount(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return { isOverflowing, contentHeight, measureNow }
}
