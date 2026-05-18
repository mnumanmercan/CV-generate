import { ref, onMounted, onUnmounted } from 'vue'

export interface TypewriterOptions {
  typeSpeed?: number
  deleteSpeed?: number
  pauseAfterType?: number
  pauseAfterDelete?: number
  initialDelay?: number
}

export function useTypewriter(text: string, options: TypewriterOptions = {}) {
  const typeSpeed = options.typeSpeed ?? 130
  const deleteSpeed = options.deleteSpeed ?? 65
  const pauseAfterType = options.pauseAfterType ?? 2600
  const pauseAfterDelete = options.pauseAfterDelete ?? 700
  const initialDelay = options.initialDelay ?? 900

  const displayed = ref('')
  const isActive = ref(true)
  let timer: ReturnType<typeof setTimeout> | null = null
  let forward = true
  let idx = 0

  function tick() {
    if (!isActive.value) return
    if (forward) {
      if (idx < text.length) {
        idx++
        displayed.value = text.slice(0, idx)
        timer = setTimeout(tick, typeSpeed)
      } else {
        timer = setTimeout(() => {
          forward = false
          tick()
        }, pauseAfterType)
      }
    } else {
      if (idx > 0) {
        idx--
        displayed.value = text.slice(0, idx)
        timer = setTimeout(tick, deleteSpeed)
      } else {
        timer = setTimeout(() => {
          forward = true
          tick()
        }, pauseAfterDelete)
      }
    }
  }

  function stop() {
    isActive.value = false
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  onMounted(() => {
    timer = setTimeout(tick, initialDelay)
  })

  onUnmounted(stop)

  return { displayed, isActive, stop }
}
