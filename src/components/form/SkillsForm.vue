<script setup lang="ts">
  import { ref, computed, nextTick } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useDragSort } from '@/composables/useDragSort'
  import { useTagDragSort } from '@/composables/useTagDragSort'
  import FormField from './FormField.vue'
  import { createSkill } from '@/types/cv.types'
  import { useI18n } from '@/composables/useI18n'
  import { CV_LIMITS } from '@resumark/shared'

  const { t } = useI18n()
  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const drag = useDragSort(computed(() => cvData.value.skills))
  const tagDrag = useTagDragSort(
    (skillId) => cvData.value.skills.find((s) => s.id === skillId)?.items,
  )

  const tagInputs = ref<Record<string, string>>({})
  const duplicateWarnings = ref(new Set<string>())

  const categoryLimitReached = computed(
    () => cvData.value.skills.length >= CV_LIMITS.skills.maxItems,
  )

  function tagLimitReached(index: number): boolean {
    return (cvData.value.skills[index]?.items.length ?? 0) >= CV_LIMITS.skills.maxItemsPerCategory
  }

  function addSkill(): void {
    if (categoryLimitReached.value) return
    const skill = createSkill()
    cvData.value.skills.push(skill)
    tagInputs.value[skill.id] = ''
  }

  function removeSkill(index: number): void {
    cvData.value.skills.splice(index, 1)
  }

  function addTag(skillId: string, index: number): void {
    const input = (tagInputs.value[skillId] ?? '').trim()
    if (!input) return
    if (tagLimitReached(index)) return
    const skill = cvData.value.skills[index]
    if (skill) {
      if (skill.items.includes(input)) {
        duplicateWarnings.value.add(skillId)
        return
      }
      skill.items.push(input)
    }
    tagInputs.value[skillId] = ''
  }

  function clearDuplicateWarning(skillId: string): void {
    duplicateWarnings.value.delete(skillId)
  }

  function removeTag(skillIndex: number, tagIndex: number): void {
    cvData.value.skills[skillIndex]?.items.splice(tagIndex, 1)
  }

  function onTagKeydown(event: KeyboardEvent, skillId: string, index: number): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(skillId, index)
    }
  }

  // Chip drag events must not bubble to the category card, which is itself
  // draggable — but only while a chip drag is active, so card drags that pass
  // over a chip still reach the card's own handlers.
  function onChipDragStart(event: DragEvent, skillId: string, tag: string): void {
    event.stopPropagation()
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
    tagDrag.onDragStart(skillId, tag)
  }

  function onChipDragOver(event: DragEvent, skillId: string, tag: string): void {
    if (!tagDrag.hasActiveDrag(skillId)) return
    event.preventDefault()
    event.stopPropagation()
    tagDrag.onDragOver(skillId, tag)
  }

  function onChipDrop(event: DragEvent, skillId: string, tag: string): void {
    if (!tagDrag.hasActiveDrag(skillId)) return
    event.stopPropagation()
    tagDrag.onDrop(skillId, tag)
  }

  function onChipKeydown(event: KeyboardEvent, skillId: string, tag: string): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    // Moving a focused element in the DOM drops focus in most browsers;
    // refocus the same node so repeated arrow presses keep working.
    const chip = event.currentTarget as HTMLElement
    tagDrag.move(skillId, tag, event.key === 'ArrowLeft' ? -1 : 1)
    void nextTick(() => chip.focus())
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="(skill, index) in cvData.skills"
      :key="skill.id"
      :class="[
        'rounded-xl border p-4 transition-all',
        drag.isDragging(skill.id) ? 'dragging border-overlay/5' : '',
        drag.isDragOver(skill.id) ? 'drag-over' : 'border-overlay/5',
      ]"
      draggable="true"
      :aria-label="t('forms.skillCatEntryLabel', { n: String(index + 1) })"
      @dragstart="drag.onDragStart(skill.id)"
      @dragover.prevent="drag.onDragOver(skill.id)"
      @drop="drag.onDrop(skill.id)"
      @dragend="drag.onDragEnd"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-secondary cursor-grab" role="img" :aria-label="t('forms.dragToReorder')"
            >⠿</span
          >
          <span class="text-sm font-semibold text-primary">
            {{ skill.category || t('forms.skillCatEntryLabel', { n: String(index + 1) }) }}
          </span>
        </div>
        <button
          type="button"
          class="text-secondary hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
          :aria-label="`${t('forms.remove')} ${t('forms.skillCatEntryLabel', { n: String(index + 1) })}`"
          @click="removeSkill(index)"
        >
          {{ t('forms.remove') }}
        </button>
      </div>

      <FormField
        :id="`skill-category-${skill.id}`"
        v-model="skill.category"
        :label="t('forms.skillCategory')"
        placeholder="Frontend, Backend, DevOps..."
        required
        :maxlength="CV_LIMITS.skills.category"
      />

      <!-- Tag chips -->
      <div class="mt-3">
        <p class="text-xs font-medium text-secondary font-mono uppercase tracking-wider mb-2">
          Skills <span class="normal-case font-sans">({{ t('forms.skillsHint') }})</span>
        </p>

        <TransitionGroup
          tag="div"
          name="chip"
          enter-active-class="animate-chip-in"
          class="flex flex-wrap gap-1.5 mb-2"
          role="list"
          :aria-label="`Skills in ${skill.category}`"
        >
          <span
            v-for="(tag, tIdx) in skill.items"
            :key="tag"
            role="listitem"
            tabindex="0"
            draggable="true"
            :aria-label="t('forms.skillTagLabel', { tag })"
            :class="[
              'skill-chip relative flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium cursor-grab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              tagDrag.isDragging(skill.id, tag) ? 'dragging' : '',
              tagDrag.isDragOver(skill.id, tag) ? 'tag-drag-over' : '',
            ]"
            @dragstart="onChipDragStart($event, skill.id, tag)"
            @dragover="onChipDragOver($event, skill.id, tag)"
            @drop="onChipDrop($event, skill.id, tag)"
            @dragend.stop="tagDrag.onDragEnd"
            @keydown="onChipKeydown($event, skill.id, tag)"
          >
            <span class="skill-tooltip" aria-hidden="true">
              {{ t('forms.skillTagTooltip') }}
              <kbd>←</kbd>
              <kbd>→</kbd>
            </span>
            {{ tag }}
            <button
              type="button"
              class="hover:text-white transition-colors ml-0.5"
              :aria-label="`Remove skill ${tag}`"
              @click="removeTag(index, tIdx)"
            >
              ×
            </button>
          </span>
        </TransitionGroup>

        <div v-if="!tagLimitReached(index)" class="flex gap-2">
          <input
            :id="`skill-tag-input-${skill.id}`"
            v-model="tagInputs[skill.id]"
            type="text"
            :maxlength="CV_LIMITS.skills.item"
            :placeholder="t('forms.addSkillPlaceholder')"
            class="flex-1 px-3 py-2 text-sm rounded-lg"
            :aria-label="`Add skill to ${skill.category || 'category'}`"
            @keydown="onTagKeydown($event, skill.id, index)"
            @focus="clearDuplicateWarning(skill.id)"
          />
          <button
            type="button"
            class="px-3 py-2 rounded-lg bg-accent/20 text-accent text-sm hover:bg-accent/30 transition-colors"
            @click="addTag(skill.id, index)"
          >
            {{ t('forms.add') }}
          </button>
        </div>
        <p v-else class="text-xs text-secondary">
          {{ t('forms.limitReached', { n: String(CV_LIMITS.skills.maxItemsPerCategory) }) }}
        </p>
        <p
          v-if="duplicateWarnings.has(skill.id)"
          class="text-xs text-yellow-400 mt-1 flex items-center gap-1"
          role="alert"
        >
          <svg
            class="w-3 h-3 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          {{ t('forms.duplicateSkill') }}
        </p>
      </div>
    </div>

    <button
      v-if="!categoryLimitReached"
      type="button"
      class="w-full py-3 rounded-xl border-2 border-dashed border-overlay/10 text-secondary text-sm hover:border-accent/50 hover:text-accent transition-colors flex items-center justify-center gap-2"
      @click="addSkill"
    >
      <span aria-hidden="true">+</span> {{ t('forms.addSkillCategory') }}
    </button>
    <p v-else class="text-center text-xs text-secondary py-2">
      {{ t('forms.limitReached', { n: String(CV_LIMITS.skills.maxItems) }) }}
    </p>
  </div>
</template>

<style scoped>
  /* Drop-target indicator sized for chips — the global .drag-over dashed
     border shifts layout on these small rounded elements */
  .tag-drag-over {
    box-shadow: 0 0 0 2px var(--accent);
    opacity: 0.6;
  }

  /* Reorder hint popup above each chip */
  .skill-tooltip {
    position: absolute;
    bottom: calc(100% + 7px);
    left: 50%;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 6px;
    background: var(--ink);
    color: var(--paper);
    font-size: 0.65rem;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transform: translateX(-50%) translateY(3px);
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
    z-index: 20;
  }
  .skill-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: var(--ink);
  }
  .skill-tooltip kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 15px;
    height: 15px;
    padding: 0 2px;
    border: 1px solid color-mix(in oklab, var(--paper) 40%, transparent);
    border-radius: 3px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    line-height: 1;
  }
  /* Delayed on hover so it doesn't flash while scanning the list;
     immediate on keyboard focus */
  .skill-chip:hover > .skill-tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    transition-delay: 0.45s;
  }
  .skill-chip:focus-visible > .skill-tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  /* Hide before the browser captures the drag ghost (mousedown precedes
     dragstart) and while a drag is in flight */
  .skill-chip:active > .skill-tooltip,
  .skill-chip.dragging > .skill-tooltip {
    opacity: 0;
    transition: none;
  }

  /* FLIP transitions for the chip TransitionGroup */
  .chip-move {
    transition: transform 0.2s ease;
  }
  .chip-leave-active {
    position: absolute;
    transition: opacity 0.12s ease;
  }
  .chip-leave-to {
    opacity: 0;
  }
</style>
