import { onUnmounted } from 'vue'
import type { Directive } from 'vue'

/**
 * Returns a `v-reveal` directive that adds `section-visible` to an element
 * when it enters the viewport. Child `.reveal-item` elements will then
 * play their entrance animation via CSS.
 */
export function useScrollReveal() {
  const observers: IntersectionObserver[] = []

  onUnmounted(() => {
    observers.forEach((o) => o.disconnect())
  })

  const vReveal: Directive<HTMLElement> = {
    mounted(el) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add('section-visible')
            observer.disconnect()
          }
        },
        { threshold: 0.06, rootMargin: '0px 0px -50px 0px' },
      )
      observer.observe(el)
      observers.push(observer)
    },
  }

  return { vReveal }
}
