/**
 * Store-level tests for CV variants.
 *
 * The contract worth pinning down is the one that is easy to break silently:
 *   1. Switching tabs must COMMIT the outgoing document, not drop its edits.
 *   2. Tailored sections (summary/experience/skills/projects) must never leak
 *      between variants.
 *   3. Shared sections (personal/education/certifications/languages) must
 *      follow the most-recently-edited variant into every sibling.
 *   4. `loadingData` must be true across the swap — auto-save suppression and
 *      BuilderView's drag-order re-sync both hang off that flag.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { watch } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useCVStore } from './cvStore'
import { localStorageService, type CVSummary } from '@/services/storageService'
import type { StorageService } from '@/services/storageService'
import { StorageError } from '@/services/storageErrors'
import { createEmptyCVData, type CVData } from '@/types/cv.types'
import { cloneCV } from '@/services/cvVariants'

/**
 * In-memory multi-document backend — the same shape ApiCVStorageService
 * presents, so the store is exercised through its real code path.
 */
function makeMultiStorage(seed: Array<{ id: string; title: string; content: CVData }>) {
  const rows = new Map<string, { title: string; content: CVData; updatedAt: string }>()
  seed.forEach((r, i) =>
    rows.set(r.id, {
      title: r.title,
      content: cloneCV(r.content),
      // Descending so seed[0] is "newest", matching GET /cv's ordering.
      updatedAt: new Date(Date.now() - i * 1000).toISOString(),
    }),
  )

  let activeId: string | null = seed[0]?.id ?? null
  let planLimit = Infinity

  const impl: StorageService = {
    supportsMultiple: true,
    async save(data) {
      if (!activeId) throw new StorageError('not_found', 'no active row')
      rows.get(activeId)!.content = cloneCV(data)
    },
    async load() {
      return activeId ? cloneCV(rows.get(activeId)!.content) : null
    },
    async clear() {
      if (activeId) rows.delete(activeId)
      activeId = null
    },
    getActiveId: () => activeId,
    setActiveId: (id) => {
      activeId = id
    },
    async list(): Promise<CVSummary[]> {
      return [...rows.entries()]
        .map(([id, r]) => ({ id, title: r.title, updatedAt: r.updatedAt }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
    async loadById(id) {
      const row = rows.get(id)
      return row ? cloneCV(row.content) : null
    },
    async saveById(id, data, title) {
      const row = rows.get(id)
      if (!row) throw new StorageError('not_found', 'missing row')
      row.content = cloneCV(data)
      if (title !== undefined) row.title = title
    },
    async create(data, title) {
      if (rows.size >= planLimit) throw new StorageError('plan_limit', 'cap reached')
      const id = `cv-${rows.size + 1}-${Math.random().toString(36).slice(2, 7)}`
      rows.set(id, { title, content: cloneCV(data), updatedAt: new Date().toISOString() })
      return { id, title, updatedAt: new Date().toISOString() }
    },
    async rename(id, title) {
      rows.get(id)!.title = title
    },
    async remove(id) {
      rows.delete(id)
      if (activeId === id) activeId = null
    },
  }

  return {
    impl,
    rows,
    setPlanLimit: (n: number) => {
      planLimit = n
    },
  }
}

function cvWith(fields: { name?: string; summary?: string; school?: string }): CVData {
  const d = createEmptyCVData()
  d.personal.fullName = fields.name ?? 'Ada Lovelace'
  d.summary = fields.summary ?? ''
  d.education = [
    {
      id: 'edu-1',
      institution: fields.school ?? 'Cambridge',
      degree: 'BSc',
      field: 'Maths',
      startDate: '2010',
      endDate: '2014',
    },
  ]
  return d
}

describe('cvStore — variants', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('lists variants from the backend and adopts the active id', async () => {
    const { impl } = makeMultiStorage([
      { id: 'cv-a', title: 'Acme — Backend', content: cvWith({}) },
      { id: 'cv-b', title: 'Startup — Fullstack', content: cvWith({}) },
    ])
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadVariants()

    expect(store.variants.map((v) => v.title)).toEqual(['Acme — Backend', 'Startup — Fullstack'])
    expect(store.activeVariantId).toBe('cv-a')
  })

  it('commits the outgoing document before swapping in the target', async () => {
    const { impl, rows } = makeMultiStorage([
      { id: 'cv-a', title: 'A', content: cvWith({ summary: 'original A' }) },
      { id: 'cv-b', title: 'B', content: cvWith({ summary: 'original B' }) },
    ])
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadFromStorage()
    await store.loadVariants()

    store.cvData.summary = 'edited A, never explicitly saved'
    await store.switchVariant('cv-b')

    // The edit was flushed on the way out, not lost.
    expect(rows.get('cv-a')!.content.summary).toBe('edited A, never explicitly saved')
    // And we are now genuinely editing B.
    expect(store.activeVariantId).toBe('cv-b')
    expect(store.cvData.summary).toBe('original B')
  })

  it('keeps tailored sections independent per variant', async () => {
    const { impl, rows } = makeMultiStorage([
      { id: 'cv-a', title: 'A', content: cvWith({ summary: 'backend pitch' }) },
      { id: 'cv-b', title: 'B', content: cvWith({ summary: 'data pitch' }) },
    ])
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadFromStorage()
    await store.loadVariants()

    await store.switchVariant('cv-b')
    store.cvData.summary = 'rewritten for the data role'
    store.cvData.skills.push({ id: 's1', category: 'Data', items: ['SQL'] })
    await store.switchVariant('cv-a')

    // A is untouched by B's tailoring.
    expect(store.cvData.summary).toBe('backend pitch')
    expect(store.cvData.skills).toHaveLength(0)
    expect(rows.get('cv-b')!.content.summary).toBe('rewritten for the data role')
  })

  it('propagates a shared-section edit into every sibling', async () => {
    const { impl, rows } = makeMultiStorage([
      { id: 'cv-a', title: 'A', content: cvWith({}) },
      { id: 'cv-b', title: 'B', content: cvWith({}) },
      { id: 'cv-c', title: 'C', content: cvWith({}) },
    ])
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadFromStorage()
    await store.loadVariants()

    // Visit B and C so they are cached, then return to A and change a shared field.
    await store.switchVariant('cv-b')
    await store.switchVariant('cv-c')
    await store.switchVariant('cv-a')

    store.cvData.personal.phone = '+90 555 000 00 00'
    store.cvData.education[0]!.institution = 'Oxford'
    await store.switchVariant('cv-b')

    expect(store.cvData.personal.phone).toBe('+90 555 000 00 00')
    expect(store.cvData.education[0]?.institution).toBe('Oxford')
    for (const id of ['cv-a', 'cv-b', 'cv-c']) {
      expect(rows.get(id)!.content.personal.phone).toBe('+90 555 000 00 00')
      expect(rows.get(id)!.content.education[0]?.institution).toBe('Oxford')
    }
  })

  it('repairs a never-loaded variant on first switch (self-healing reconcile)', async () => {
    // cv-b was last written before the shared edit — the exact state a browser
    // closed mid-session leaves behind.
    const { impl, rows } = makeMultiStorage([
      { id: 'cv-a', title: 'A', content: cvWith({}) },
      { id: 'cv-b', title: 'B', content: cvWith({ name: 'Stale Name', school: 'Stale School' }) },
    ])
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadFromStorage()
    await store.loadVariants()

    store.cvData.personal.fullName = 'Ada Lovelace'
    await store.switchVariant('cv-b')

    expect(store.cvData.personal.fullName).toBe('Ada Lovelace')
    expect(store.cvData.education[0]?.institution).toBe('Cambridge')
    expect(rows.get('cv-b')!.content.personal.fullName).toBe('Ada Lovelace')
  })

  it('holds loadingData true across the swap and clears it after', async () => {
    const { impl } = makeMultiStorage([
      { id: 'cv-a', title: 'A', content: cvWith({}) },
      { id: 'cv-b', title: 'B', content: cvWith({}) },
    ])
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadFromStorage()
    await store.loadVariants()

    // Record every loadingData transition across the swap. Auto-save
    // suppression and BuilderView's drag-order re-sync both key off this flag,
    // so it genuinely has to go true and come back down.
    const loadingSeen: boolean[] = []
    const stop = watch(
      () => store.loadingData,
      (v) => loadingSeen.push(v),
      { flush: 'sync' },
    )

    const pending = store.switchVariant('cv-b')
    expect(store.switchingVariant).toBe(true)
    await pending
    stop()

    expect(loadingSeen).toContain(true)
    expect(store.loadingData).toBe(false)
    expect(store.switchingVariant).toBe(false)
  })

  it('creates a variant seeded from the active document and switches to it', async () => {
    const { impl, rows } = makeMultiStorage([
      { id: 'cv-a', title: 'A', content: cvWith({ summary: 'shared starting point' }) },
    ])
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadFromStorage()
    await store.loadVariants()

    const id = await store.createVariant('Acme — Backend')

    expect(id).not.toBeNull()
    expect(store.activeVariantId).toBe(id)
    expect(store.variants.some((v) => v.title === 'Acme — Backend')).toBe(true)
    // Duplicate mode: the new variant starts from the existing document.
    expect(rows.get(id!)!.content.summary).toBe('shared starting point')
    expect(rows.get(id!)!.content.personal.fullName).toBe('Ada Lovelace')
  })

  it('returns null instead of throwing when the plan cap is reached', async () => {
    const { impl, setPlanLimit } = makeMultiStorage([
      { id: 'cv-a', title: 'A', content: cvWith({}) },
    ])
    setPlanLimit(1)
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadFromStorage()
    await store.loadVariants()

    await expect(store.createVariant('Nope')).resolves.toBeNull()
    // The cap must not present as a save failure — it is an upgrade prompt.
    expect(store.lastSaveError).toBeNull()
  })

  it('renames a variant', async () => {
    const { impl, rows } = makeMultiStorage([{ id: 'cv-a', title: 'Old', content: cvWith({}) }])
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadVariants()
    await store.renameVariant('cv-a', '  Acme — Backend  ')

    expect(rows.get('cv-a')!.title).toBe('Acme — Backend')
    expect(store.variants[0]!.title).toBe('Acme — Backend')
  })

  it('deletes a variant and moves to the newest remaining one', async () => {
    const { impl, rows } = makeMultiStorage([
      { id: 'cv-a', title: 'A', content: cvWith({ summary: 'A' }) },
      { id: 'cv-b', title: 'B', content: cvWith({ summary: 'B' }) },
    ])
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadFromStorage()
    await store.loadVariants()
    await store.deleteVariant('cv-a')

    expect(rows.has('cv-a')).toBe(false)
    expect(store.activeVariantId).toBe('cv-b')
    expect(store.cvData.summary).toBe('B')
  })

  it('refuses to delete the last remaining variant', async () => {
    const { impl, rows } = makeMultiStorage([{ id: 'cv-a', title: 'A', content: cvWith({}) }])
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadVariants()
    await store.deleteVariant('cv-a')

    expect(rows.has('cv-a')).toBe(true)
    expect(store.variants).toHaveLength(1)
  })

  it('clearData wipes only the tailored sections when siblings exist', async () => {
    const { impl, rows } = makeMultiStorage([
      { id: 'cv-a', title: 'A', content: cvWith({ summary: 'tailored pitch' }) },
      { id: 'cv-b', title: 'B', content: cvWith({}) },
    ])
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    await store.loadFromStorage()
    await store.loadVariants()
    await store.clearData()

    expect(store.cvData.summary).toBe('')
    // Shared facts survive — clearing one version must not blank the others
    // via the next propagation.
    expect(store.cvData.personal.fullName).toBe('Ada Lovelace')
    expect(store.cvData.education).toHaveLength(1)
    expect(rows.has('cv-a')).toBe(true)
  })
})
