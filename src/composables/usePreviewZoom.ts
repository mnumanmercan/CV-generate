import { computed, onScopeDispose, ref, watch } from 'vue'
import { useMediaQuery } from './useMediaQuery'

const ZOOM_MAX = 1.0
const ZOOM_STEP = 0.1
const A4_WIDTH_PX = 794
const MOBILE_ZOOM_FLOOR = 0.35
const DESKTOP_ZOOM_FLOOR = 0.55
const RESIZE_DEBOUNCE_MS = 150

export function usePreviewZoom() {
  const previewScale = ref(1.0)
  const previewScrollEl = ref<HTMLElement | null>(null)
  const isMobile = useMediaQuery('(max-width: 767px)')

  // Reactive zoom floor — lower on mobile so the preview fits narrow viewports.
  // Export as `ZOOM_MIN` for backward-compatible template bindings.
  const ZOOM_MIN = computed(() => (isMobile.value ? MOBILE_ZOOM_FLOOR : DESKTOP_ZOOM_FLOOR))

  function zoomIn(): void {
    previewScale.value = Math.min(
      ZOOM_MAX,
      Math.round((previewScale.value + ZOOM_STEP) * 100) / 100,
    )
  }

  function zoomOut(): void {
    previewScale.value = Math.max(
      ZOOM_MIN.value,
      Math.round((previewScale.value - ZOOM_STEP) * 100) / 100,
    )
  }

  function fitToPanel(): void {
    if (!previewScrollEl.value) return
    const containerWidth = previewScrollEl.value.clientWidth - 32
    const scale = Math.floor((containerWidth / A4_WIDTH_PX) * 100) / 100
    previewScale.value = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN.value, scale))
  }

  // Re-fit when the preview container resizes (covers viewport resize, mobile
  // rotation, and SplitLayout's mobile↔desktop flip — all without a separate
  // matchMedia listener).
  let observer: ResizeObserver | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleFit(): void {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (isMobile.value) fitToPanel()
    }, RESIZE_DEBOUNCE_MS)
  }

  watch(previewScrollEl, (el, _prev, onCleanup) => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    if (!el || typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver(scheduleFit)
    observer.observe(el)
    onCleanup(() => {
      if (observer) {
        observer.disconnect()
        observer = null
      }
    })
  })

  // When the breakpoint flips, re-fit so the new floor takes effect immediately.
  watch(isMobile, (mobile) => {
    if (mobile) scheduleFit()
  })

  onScopeDispose(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (observer) observer.disconnect()
  })

  return {
    previewScale,
    previewScrollEl,
    ZOOM_MIN,
    ZOOM_MAX,
    isMobile,
    zoomIn,
    zoomOut,
    fitToPanel,
  }
}
