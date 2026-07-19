import { describe, expect, it } from 'vitest'
import { useTagDragSort } from './useTagDragSort'

function setup(groups: Record<string, string[]> = { cat1: ['Vue', 'React', 'Svelte'] }) {
  const sort = useTagDragSort((id) => groups[id])
  return { groups, sort }
}

describe('useTagDragSort', () => {
  describe('drag and drop', () => {
    it('moves the dragged tag forward to the drop target position', () => {
      const { groups, sort } = setup()
      sort.onDragStart('cat1', 'Vue')
      sort.onDrop('cat1', 'Svelte')
      expect(groups.cat1).toEqual(['React', 'Svelte', 'Vue'])
    })

    it('moves the dragged tag backward to the drop target position', () => {
      const { groups, sort } = setup()
      sort.onDragStart('cat1', 'Svelte')
      sort.onDrop('cat1', 'Vue')
      expect(groups.cat1).toEqual(['Svelte', 'Vue', 'React'])
    })

    it('ignores drops onto the dragged tag itself', () => {
      const { groups, sort } = setup()
      sort.onDragStart('cat1', 'Vue')
      sort.onDrop('cat1', 'Vue')
      expect(groups.cat1).toEqual(['Vue', 'React', 'Svelte'])
    })

    it('ignores drops across groups', () => {
      const { groups, sort } = setup({ cat1: ['Vue', 'React'], cat2: ['Node', 'Deno'] })
      sort.onDragStart('cat1', 'Vue')
      sort.onDrop('cat2', 'Deno')
      expect(groups.cat1).toEqual(['Vue', 'React'])
      expect(groups.cat2).toEqual(['Node', 'Deno'])
    })

    it('ignores drops without a preceding drag start', () => {
      const { groups, sort } = setup()
      sort.onDrop('cat1', 'React')
      expect(groups.cat1).toEqual(['Vue', 'React', 'Svelte'])
    })

    it('clears drag state after drop and after drag end', () => {
      const { sort } = setup()
      sort.onDragStart('cat1', 'Vue')
      sort.onDragOver('cat1', 'React')
      sort.onDrop('cat1', 'React')
      expect(sort.hasActiveDrag()).toBe(false)
      expect(sort.isDragOver('cat1', 'React')).toBe(false)

      sort.onDragStart('cat1', 'Vue')
      sort.onDragEnd()
      expect(sort.hasActiveDrag()).toBe(false)
    })
  })

  describe('state queries', () => {
    it('reports the dragged tag and scopes hasActiveDrag by group', () => {
      const { sort } = setup({ cat1: ['Vue'], cat2: ['Node'] })
      expect(sort.hasActiveDrag()).toBe(false)
      sort.onDragStart('cat1', 'Vue')
      expect(sort.isDragging('cat1', 'Vue')).toBe(true)
      expect(sort.hasActiveDrag()).toBe(true)
      expect(sort.hasActiveDrag('cat1')).toBe(true)
      expect(sort.hasActiveDrag('cat2')).toBe(false)
    })

    it('only marks drag-over targets in the dragged group', () => {
      const { sort } = setup({ cat1: ['Vue', 'React'], cat2: ['Node'] })
      sort.onDragStart('cat1', 'Vue')
      sort.onDragOver('cat2', 'Node')
      expect(sort.isDragOver('cat2', 'Node')).toBe(false)
      sort.onDragOver('cat1', 'React')
      expect(sort.isDragOver('cat1', 'React')).toBe(true)
      sort.onDragOver('cat1', 'Vue')
      expect(sort.isDragOver('cat1', 'React')).toBe(false)
    })
  })

  describe('keyboard move', () => {
    it('moves a tag one position left or right', () => {
      const { groups, sort } = setup()
      sort.move('cat1', 'React', -1)
      expect(groups.cat1).toEqual(['React', 'Vue', 'Svelte'])
      sort.move('cat1', 'React', 1)
      expect(groups.cat1).toEqual(['Vue', 'React', 'Svelte'])
    })

    it('clamps at both ends of the list', () => {
      const { groups, sort } = setup()
      sort.move('cat1', 'Vue', -1)
      sort.move('cat1', 'Svelte', 1)
      expect(groups.cat1).toEqual(['Vue', 'React', 'Svelte'])
    })

    it('ignores unknown tags and unknown groups', () => {
      const { groups, sort } = setup()
      sort.move('cat1', 'Angular', 1)
      sort.move('nope', 'Vue', 1)
      expect(groups.cat1).toEqual(['Vue', 'React', 'Svelte'])
    })
  })
})
