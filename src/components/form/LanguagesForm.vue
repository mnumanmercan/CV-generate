<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useDragSort } from '@/composables/useDragSort'
  import FormField from './FormField.vue'
  import { createLanguage, LANGUAGE_PROFICIENCY_LEVELS } from '@/types/cv.types'

  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const drag = useDragSort(computed(() => cvData.value.languages))

  function addLanguage(): void {
    cvData.value.languages.push(createLanguage())
  }

  function removeLanguage(index: number): void {
    cvData.value.languages.splice(index, 1)
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="(lang, index) in cvData.languages"
      :key="lang.id"
      :class="[
        'rounded-xl border p-4 transition-all',
        drag.isDragging(lang.id) ? 'dragging border-overlay/5' : '',
        drag.isDragOver(lang.id) ? 'drag-over' : 'border-overlay/5',
      ]"
      draggable="true"
      :aria-label="`Language entry ${index + 1}`"
      @dragstart="drag.onDragStart(lang.id)"
      @dragover.prevent="drag.onDragOver(lang.id)"
      @drop="drag.onDrop(lang.id)"
      @dragend="drag.onDragEnd"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-secondary cursor-grab" role="img" aria-label="Drag to reorder">⠿</span>
          <span class="text-sm font-semibold text-primary">
            {{ lang.name || `Language ${index + 1}` }}
          </span>
        </div>
        <button
          type="button"
          class="text-secondary hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
          :aria-label="`Remove language ${index + 1}`"
          @click="removeLanguage(index)"
        >
          Remove
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <FormField
          :id="`lang-name-${lang.id}`"
          v-model="lang.name"
          label="Language"
          placeholder="English"
          autocomplete="off"
          required
        />

        <!--
          Proficiency: a <select> rather than free-text so users converge on a
          shared vocabulary. We still allow blank (no proficiency stated) and
          a custom string can be edited later in storage if needed — but the
          dropdown nudges the right shape on first entry.
        -->
        <div>
          <label
            :for="`lang-prof-${lang.id}`"
            class="block text-xs font-medium text-secondary font-mono uppercase tracking-wider mb-1.5"
          >
            Proficiency
          </label>
          <select
            :id="`lang-prof-${lang.id}`"
            v-model="lang.proficiency"
            class="w-full px-3 py-2 text-sm rounded-lg"
            :aria-label="`Proficiency for ${lang.name || 'language'}`"
          >
            <option value="">Select level…</option>
            <option
              v-for="level in LANGUAGE_PROFICIENCY_LEVELS"
              :key="level"
              :value="level"
            >
              {{ level }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="w-full py-3 rounded-xl border-2 border-dashed border-overlay/10 text-secondary text-sm hover:border-accent/50 hover:text-accent transition-colors flex items-center justify-center gap-2"
      @click="addLanguage"
    >
      <span aria-hidden="true">+</span> Add Language
    </button>
  </div>
</template>
