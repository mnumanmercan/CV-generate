import { ref } from 'vue'

const ZOOM_MIN = 0.55
const ZOOM_MAX = 1.0
const ZOOM_STEP = 0.1
const A4_WIDTH_PX = 794

export function usePreviewZoom() {
  const previewScale = ref(1.0)
  const previewScrollEl = ref<HTMLElement | null>(null)

  function zoomIn(): void {
    previewScale.value = Math.min(ZOOM_MAX, Math.round((previewScale.value + ZOOM_STEP) * 100) / 100)
  }

  function zoomOut(): void {
    previewScale.value = Math.max(ZOOM_MIN, Math.round((previewScale.value - ZOOM_STEP) * 100) / 100)
  }

  function fitToPanel(): void {
    if (!previewScrollEl.value) return
    const containerWidth = previewScrollEl.value.clientWidth - 32
    const scale = Math.floor((containerWidth / A4_WIDTH_PX) * 10) / 10
    previewScale.value = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale))
  }

  return {
    previewScale,
    previewScrollEl,
    ZOOM_MIN,
    ZOOM_MAX,
    zoomIn,
    zoomOut,
    fitToPanel,
  }
}
