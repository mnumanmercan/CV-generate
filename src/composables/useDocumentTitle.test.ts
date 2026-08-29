/**
 * The tab-title format is a UX contract: the page label has to survive the
 * browser's right-hand truncation, so it must come first everywhere except
 * home. These tests pin that, and that both locales stay short enough to read
 * in a crowded tab strip.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { formatPageTitle, setPageTitle, useDocumentTitle, BRAND } from './useDocumentTitle'
import en from '@/i18n/en'
import tr from '@/i18n/tr'

describe('formatPageTitle', () => {
  it('leads with the page so truncation eats the brand, not the meaning', () => {
    expect(formatPageTitle('Dashboard')).toBe('Dashboard · Resumark')
    expect(formatPageTitle('Dashboard').indexOf('Dashboard')).toBe(0)
  })

  it('leads with the brand on home, which has no page to name', () => {
    expect(formatPageTitle('ATS-Friendly CV Builder', true)).toBe(
      'Resumark — ATS-Friendly CV Builder',
    )
  })
})

describe('pageTitle labels', () => {
  const locales = { en, tr }

  for (const [name, messages] of Object.entries(locales)) {
    describe(name, () => {
      it('defines every label non-empty', () => {
        for (const [key, label] of Object.entries(messages.pageTitle)) {
          expect(label.trim(), `pageTitle.${key}`).not.toBe('')
        }
      })

      it('keeps inner-page labels short enough to read before the cut', () => {
        const { home: _home, ...innerPages } = messages.pageTitle
        for (const [key, label] of Object.entries(innerPages)) {
          expect(label.length, `pageTitle.${key} = "${label}"`).toBeLessThanOrEqual(16)
        }
      })

      it('never repeats the brand inside a label — formatPageTitle adds it', () => {
        for (const [key, label] of Object.entries(messages.pageTitle)) {
          expect(label, `pageTitle.${key}`).not.toContain(BRAND)
        }
      })
    })
  }

  it('words inner-page labels the same as the nav links that open them', () => {
    // A tab should read like the link the user clicked.
    expect(en.pageTitle.builder).toBe(en.nav.builder)
    expect(en.pageTitle.pricing).toBe(en.nav.pricing)
    expect(en.pageTitle.dashboard).toBe(en.nav.dashboard)
    expect(tr.pageTitle.builder).toBe(tr.nav.builder)
    expect(tr.pageTitle.pricing).toBe(tr.nav.pricing)
    expect(tr.pageTitle.dashboard).toBe(tr.nav.dashboard)
  })
})

describe('useDocumentTitle', () => {
  const blank = { template: '<div />' }

  function makeRouter() {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'home',
          component: blank,
          meta: { titleKey: 'pageTitle.home', brandFirst: true },
        },
        {
          path: '/pricing',
          name: 'pricing',
          component: blank,
          meta: { titleKey: 'pageTitle.pricing' },
        },
        {
          path: '/p/:slug',
          name: 'public-cv',
          component: blank,
          meta: { titleKey: 'pageTitle.sharedCV' },
        },
      ],
    })
  }

  async function mountHost(router: ReturnType<typeof makeRouter>) {
    const Host = defineComponent({ setup: () => useDocumentTitle(), template: '<div />' })
    mount(Host, { global: { plugins: [router] } })
    await router.isReady()
    await nextTick()
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    setPageTitle(null)
    document.title = ''
  })

  it('titles each route from its meta key', async () => {
    const router = makeRouter()
    await router.push('/pricing')
    await mountHost(router)
    expect(document.title).toBe('Pricing · Resumark')

    await router.push('/')
    await nextTick()
    expect(document.title).toBe('Resumark — ATS-Friendly CV Builder')
  })

  it("lets a page name the tab at runtime — the shared CV's owner", async () => {
    const router = makeRouter()
    await router.push('/p/abc')
    await mountHost(router)
    expect(document.title).toBe('Shared CV · Resumark')

    setPageTitle('Jane Doe')
    await nextTick()
    expect(document.title).toBe('Jane Doe · Resumark')
  })

  it('drops a runtime title between two shared links, which share a route name', async () => {
    const router = makeRouter()
    await router.push('/p/abc')
    await mountHost(router)
    setPageTitle('Jane Doe')
    await nextTick()

    // Same route name, different CV — the previous owner must not linger.
    await router.push('/p/xyz')
    await nextTick()
    expect(document.title).toBe('Shared CV · Resumark')
  })

  it('drops a runtime title when navigating away', async () => {
    const router = makeRouter()
    await router.push('/p/abc')
    await mountHost(router)
    setPageTitle('Jane Doe')
    await nextTick()

    await router.push('/pricing')
    await nextTick()
    expect(document.title).toBe('Pricing · Resumark')
  })
})
