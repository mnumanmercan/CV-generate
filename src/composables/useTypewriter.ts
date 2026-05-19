import { ref, onMounted, onUnmounted } from 'vue'

export interface TypewriterOptions {
  typeSpeed?: number
  deleteSpeed?: number
  pauseAfterType?: number
  pauseAfterDelete?: number
  initialDelay?: number
  /**
   * Stop after typing this many entries. The animation freezes on the
   * last entry fully typed (no further delete) and isActive flips to
   * false so consumers can hide cursors / blinking affordances.
   * Omit (or pass undefined) to loop forever.
   */
  maxCycles?: number
}

export function useTypewriter(texts: string | readonly string[], options: TypewriterOptions = {}) {
  const typeSpeed = options.typeSpeed ?? 170
  const deleteSpeed = options.deleteSpeed ?? 75
  const pauseAfterType = options.pauseAfterType ?? 2400
  const pauseAfterDelete = options.pauseAfterDelete ?? 700
  const initialDelay = options.initialDelay ?? 1000
  const maxCycles = options.maxCycles ?? 3

  const list: readonly string[] = typeof texts === 'string' ? [texts] : texts

  const displayed = ref('')
  const isActive = ref(true)
  let timer: ReturnType<typeof setTimeout> | null = null
  let forward = true
  let idx = 0
  let listIdx = 0
  let cyclesCompleted = 0

  function tick() {
    if (!isActive.value) return
    const current = list[listIdx] ?? ''
    if (forward) {
      if (idx < current.length) {
        idx++
        displayed.value = current.slice(0, idx)
        timer = setTimeout(tick, typeSpeed)
      } else {
        // Word fully typed.
        cyclesCompleted++
        if (maxCycles !== undefined && cyclesCompleted >= maxCycles) {
          // Final entry — leave it on screen, flip inactive, no delete.
          isActive.value = false
          return
        }
        timer = setTimeout(() => {
          forward = false
          tick()
        }, pauseAfterType)
      }
    } else {
      if (idx > 0) {
        idx--
        displayed.value = current.slice(0, idx)
        timer = setTimeout(tick, deleteSpeed)
      } else {
        listIdx = (listIdx + 1) % list.length
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
    // Manual stop (e.g. user focused the input) clears the displayed
    // text so the consumer can fall back to a clean static placeholder.
    // Natural completion via maxCycles intentionally does NOT clear,
    // leaving the final entry visible as the resting state.
    displayed.value = ''
  }

  onMounted(() => {
    timer = setTimeout(tick, initialDelay)
  })

  onUnmounted(stop)

  return { displayed, isActive, stop }
}
