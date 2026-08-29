/**
 * BrandLogo is the single source for the wordmark in all five places it
 * appears, so these tests pin the contract those call sites rely on: a
 * localised accessible name (the footer and drawer used to hard-code an
 * English one), and an `animated` flag the drawer turns off.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import BrandLogo from './BrandLogo.vue'
import { MARK_BODY_ROWS } from './brandMark.geometry'
import en from '@/i18n/en'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

async function mountLogo(props: Record<string, unknown> = {}) {
  const wrapper = mount(BrandLogo, { props, global: { plugins: [router] } })
  await router.isReady()
  return wrapper
}

describe('BrandLogo', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('links home with a localised accessible name', async () => {
    const wrapper = await mountLogo()
    const link = wrapper.get('a')

    expect(link.attributes('href')).toBe('/')
    expect(link.attributes('aria-label')).toBe(en.aria.resumeHome)
  })

  it('draws the full mark — dot, heading rule and every body row', async () => {
    const wrapper = await mountLogo()

    expect(wrapper.findAll('.bm-dot')).toHaveLength(1)
    expect(wrapper.findAll('.bm-rule')).toHaveLength(1)
    expect(wrapper.findAll('.bm-line')).toHaveLength(MARK_BODY_ROWS.length)
  })

  it('opts out of the reveal when animated is false', async () => {
    const animated = await mountLogo()
    expect(animated.get('svg').classes()).toContain('brand-mark--animated')

    const still = await mountLogo({ animated: false })
    expect(still.get('svg').classes()).not.toContain('brand-mark--animated')
  })

  it('cancels the rows’ overhang while animated so the resting dot sits where a bare dot would', async () => {
    // The mark is 30 units wide but only the 8-unit dot shows at rest; the
    // negative margin is what keeps the lockup measuring 8px.
    const animated = await mountLogo()
    expect(animated.get('svg').attributes('style')).toContain('margin-right: -22px')

    // Static copies paint all the rows, so they need the space for real.
    const still = await mountLogo({ animated: false })
    expect(still.get('svg').attributes('style')).toContain('margin-right: 0px')
  })

  it('scales the whole mark off the dot size', async () => {
    const small = await mountLogo({ size: 'sm' })
    // sm keeps the footer's original 6px dot: 30 x 6/8 = 22.5px wide.
    expect(small.get('svg').attributes('style')).toContain('width: 22.5px')
  })

  it('emits click so the drawer can close itself', async () => {
    const wrapper = await mountLogo()
    await wrapper.get('a').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
