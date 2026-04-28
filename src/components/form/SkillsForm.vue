<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useDragSort } from '@/composables/useDragSort'
  import FormField from './FormField.vue'
  import { createSkill } from '@/types/cv.types'

  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const drag = useDragSort(computed(() => cvData.value.skills))

  // New tag input per skill category
  const tagInputs = ref<Record<string, string>>({})
  const duplicateWarnings = ref(new Set<string>())

  function addSkill(): void {
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

  function onTagKeydown(
    event: KeyboardEvent,
    skillId: string,
    index: number,
  ): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(skillId, index)
    }
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
      :aria-label="`Skill category ${index + 1}`"
      @dragstart="drag.onDragStart(skill.id)"
      @dragover.prevent="drag.onDragOver(skill.id)"
      @drop="drag.onDrop(skill.id)"
      @dragend="drag.onDragEnd"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-secondary cursor-grab" role="img" aria-label="Drag to reorder">⠿</span>
          <span class="text-sm font-semibold text-primary">
            {{ skill.category || `Category ${index + 1}` }}
          </span>
        </div>
        <button
          type="button"
          class="text-secondary hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
          :aria-label="`Remove skill category ${index + 1}`"
          @click="removeSkill(index)"
        >
          Remove
        </button>
      </div>

      <FormField
        :id="`skill-category-${skill.id}`"
        v-model="skill.category"
        label="Category"
        placeholder="Frontend, Backend, DevOps..."
        required
      />

      <!-- Tag chips -->
      <div class="mt-3">
        <p class="text-xs font-medium text-secondary font-mono uppercase tracking-wider mb-2">
          Skills <span class="normal-case font-sans">(press Enter or comma to add)</span>
        </p>

        <div class="flex flex-wrap gap-1.5 mb-2" :aria-label="`Skills in ${skill.category}`">
          <span
            v-for="(tag, tIdx) in skill.items"
            :key="tIdx"
            class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium animate-chip-in"
          >
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
        </div>

        <div class="flex gap-2">
          <input
            :id="`skill-tag-input-${skill.id}`"
            v-model="tagInputs[skill.id]"
            type="text"
            placeholder="Add skill..."
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
            Add
          </button>
        </div>
        <p
          v-if="duplicateWarnings.has(skill.id)"
          class="text-xs text-yellow-400 mt-1 flex items-center gap-1"
          role="alert"
        >
          <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          Already added
        </p>
      </div>
    </div>

    <button
      type="button"
      class="w-full py-3 rounded-xl border-2 border-dashed border-overlay/10 text-secondary text-sm hover:border-accent/50 hover:text-accent transition-colors flex items-center justify-center gap-2"
      @click="addSkill"
    >
      <span aria-hidden="true">+</span> Add Skill Category
    </button>
  </div>
</template>
