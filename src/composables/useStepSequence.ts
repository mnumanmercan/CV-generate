import { ref, onUnmounted } from 'vue'
import type { Directive, Ref } from 'vue'

/**
 * The "Just two steps" section plays a strictly sequential narrative:
 *
 *   write (step 1 streak) → download + progress bar (step 2) → send (step 2) → rest → repeat
 *
 * Rather than rely on independent infinite CSS loops staying phase-locked across
 * two components (fragile), a single conductor owns one `phase` value and cycles
 * it. Each StepCard plays its beat once when its phase is active. The loop is
 * gated to the section's visibility so it always starts cleanly at `write` when
 * the user actually sees it — and restarts from the top whenever it re-enters view.
 */
export type StepPhase = 'write' | 'download' | 'send' | 'rest'

export interface StepSequenceOptions {
  /** Per-phase durations (ms). Kept slightly longer than the matching CSS
   *  animation so each beat completes inside its phase with a small breath. */
  write?: number
  download?: number
  send?: number
  rest?: number
}

/** Order the conductor walks through, looping back to the start. */
const ORDER: StepPhase[] = ['write', 'download', 'send', 'rest']

export function useStepSequence(options: StepSequenceOptions = {}) {
  const durations: Record<StepPhase, number> = {
    write: options.write ?? 1000,
    download: options.download ?? 1300,
    send: options.send ?? 1100,
    rest: options.rest ?? 700,
  }

  const phase: Ref<StepPhase> = ref('rest')

  let timer: ReturnType<typeof setTimeout> | null = null
  let running = false

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function scheduleNext(current: StepPhase) {
    timer = setTimeout(() => {
      if (!running) return
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
      phase.value = next
      scheduleNext(next)
    }, durations[current])
  }

  function start() {
    if (running || prefersReducedMotion) return
    running = true
    // Always begin a fresh cycle at the write beat.
    phase.value = 'write'
    scheduleNext('write')
  }

  function stop() {
    running = false
    clearTimer()
    phase.value = 'rest'
  }

  const observers: IntersectionObserver[] = []

  const vStepSequence: Directive<HTMLElement> = {
    mounted(el) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) start()
          else stop()
        },
        { threshold: 0.2 },
      )
      observer.observe(el)
      observers.push(observer)
    },
  }

  onUnmounted(() => {
    stop()
    observers.forEach((o) => o.disconnect())
  })

  return { phase, vStepSequence }
}
