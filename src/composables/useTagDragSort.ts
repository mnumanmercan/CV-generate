import { ref } from 'vue'

interface TagRef {
  groupId: string
  tag: string
}

/**
 * Drag-sort + keyboard reorder for plain string arrays grouped by an owner id
 * (e.g. skill.items per category). Tags are unique within a group, so the
 * string itself serves as the drag identity; moves across groups are no-ops.
 */
export function useTagDragSort(getItems: (groupId: string) => string[] | undefined) {
  const dragged = ref<TagRef | null>(null)
  const dragOver = ref<TagRef | null>(null)

  function hasActiveDrag(groupId?: string): boolean {
    if (!dragged.value) return false
    return groupId === undefined || dragged.value.groupId === groupId
  }

  function onDragStart(groupId: string, tag: string): void {
    dragged.value = { groupId, tag }
  }

  function onDragOver(groupId: string, tag: string): void {
    const current = dragged.value
    if (!current || current.groupId !== groupId || current.tag === tag) {
      dragOver.value = null
      return
    }
    dragOver.value = { groupId, tag }
  }

  function onDrop(groupId: string, targetTag: string): void {
    const current = dragged.value
    dragged.value = null
    dragOver.value = null
    if (!current || current.groupId !== groupId || current.tag === targetTag) return

    const items = getItems(groupId)
    if (!items) return
    const fromIdx = items.indexOf(current.tag)
    const toIdx = items.indexOf(targetTag)
    if (fromIdx === -1 || toIdx === -1) return

    const moved = items.splice(fromIdx, 1)[0]
    if (moved !== undefined) {
      items.splice(toIdx, 0, moved)
    }
  }

  function onDragEnd(): void {
    dragged.value = null
    dragOver.value = null
  }

  function move(groupId: string, tag: string, direction: -1 | 1): void {
    const items = getItems(groupId)
    if (!items) return
    const fromIdx = items.indexOf(tag)
    const toIdx = fromIdx + direction
    if (fromIdx === -1 || toIdx < 0 || toIdx >= items.length) return
    const moved = items.splice(fromIdx, 1)[0]
    if (moved !== undefined) {
      items.splice(toIdx, 0, moved)
    }
  }

  function isDragging(groupId: string, tag: string): boolean {
    return dragged.value?.groupId === groupId && dragged.value.tag === tag
  }

  function isDragOver(groupId: string, tag: string): boolean {
    return dragOver.value?.groupId === groupId && dragOver.value.tag === tag
  }

  return {
    dragged,
    hasActiveDrag,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    move,
    isDragging,
    isDragOver,
  }
}
