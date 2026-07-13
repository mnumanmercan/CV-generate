/**
 * useCVOverflow measures the preview's scrollHeight against the A4 page
 * height. jsdom has no layout engine, so scrollHeight is stubbed per element
 * and ResizeObserver is replaced with a controllable fake.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { useCVOverflow } from './useCVOverflow'
import { A4_HEIGHT_PX } from '@/constants/layout'

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  callback: ResizeObserverCallback
  observed: Element[] = []
  disconnected = false

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    FakeResizeObserver.instances.push(this)
  }
  observe(el: Element): void {
    this.observed.push(el)
  }
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true
  }
  trigger(): void {
    this.callback([], this as unknown as ResizeObserver)
  }
}

function mountWithComposable(elementId: string): {
  result: ReturnType<typeof useCVOverflow>
  unmount: () => void
} {
  let result!: ReturnType<typeof useCVOverflow>
  const app = createApp(
    defineComponent({
      setup() {
        result = useCVOverflow(elementId)
        return () => h('div')
      },
    }),
  )
  const host = document.createElement('div')
  document.body.appendChild(host)
  app.mount(host)
  return {
    result,
    unmount: () => {
      app.unmount()
      host.remove()
    },
  }
}

function addPreviewEl(id: string, scrollHeight: number): HTMLElement {
  const el = document.createElement('div')
  el.id = id
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true })
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  FakeResizeObserver.instances = []
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('useCVOverflow', () => {
  it('reports overflow when content exceeds one A4 page', () => {
    addPreviewEl('cv-overflow-test', 1500)
    const { result, unmount } = mountWithComposable('cv-overflow-test')

    expect(result.isOverflowing.value).toBe(true)
    expect(result.contentHeight.value).toBe(1500)
    unmount()
  })

  it('reports no overflow for a one-page CV', () => {
    addPreviewEl('cv-fit-test', A4_HEIGHT_PX)
    const { result, unmount } = mountWithComposable('cv-fit-test')

    expect(result.isOverflowing.value).toBe(false)
    unmount()
  })

  it('re-measures when the observed element resizes', () => {
    const el = addPreviewEl('cv-resize-test', 1000)
    const { result, unmount } = mountWithComposable('cv-resize-test')
    expect(result.isOverflowing.value).toBe(false)

    Object.defineProperty(el, 'scrollHeight', { value: 1600, configurable: true })
    FakeResizeObserver.instances[0]!.trigger()

    expect(result.isOverflowing.value).toBe(true)
    expect(result.contentHeight.value).toBe(1600)
    unmount()
  })

  it('disconnects the observer on unmount', () => {
    addPreviewEl('cv-unmount-test', 1000)
    const { unmount } = mountWithComposable('cv-unmount-test')
    unmount()
    expect(FakeResizeObserver.instances[0]!.disconnected).toBe(true)
  })
})
