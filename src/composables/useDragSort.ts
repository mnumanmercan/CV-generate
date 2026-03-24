import { ref } from 'vue'

// Accepts both Ref<T[]> and ComputedRef<T[]> via the structural { readonly value: T[] } type
export function useDragSort<T extends { id: string }>(items: { readonly value: T[] }) {
  const draggedId = ref<string | null>(null)
  const dragOverId = ref<string | null>(null)

  function onDragStart(id: string): void {
    draggedId.value = id
  }

  function onDragOver(id: string): void {
    if (draggedId.value === id) return
    dragOverId.value = id
  }

  function onDrop(targetId: string): void {
    if (!draggedId.value || draggedId.value === targetId) {
      draggedId.value = null
      dragOverId.value = null
      return
    }

    const list = items.value
    const fromIdx = list.findIndex((i) => i.id === draggedId.value)
    const toIdx = list.findIndex((i) => i.id === targetId)

    if (fromIdx === -1 || toIdx === -1) return

    const moved = list.splice(fromIdx, 1)[0]
    if (moved) {
      list.splice(toIdx, 0, moved)
    }

    draggedId.value = null
    dragOverId.value = null
  }

  function onDragEnd(): void {
    draggedId.value = null
    dragOverId.value = null
  }

  function isDragging(id: string): boolean {
    return draggedId.value === id
  }

  function isDragOver(id: string): boolean {
    return dragOverId.value === id
  }

  return {
    draggedId,
    dragOverId,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    isDragging,
    isDragOver,
  }
}
