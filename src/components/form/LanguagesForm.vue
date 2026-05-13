<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useDragSort } from '@/composables/useDragSort'
  import FormField from './FormField.vue'
  import { createLanguage, LANGUAGE_PROFICIENCY_LEVELS } from '@/types/cv.types'
  import { useI18n } from '@/composables/useI18n'

  const { t } = useI18n()
  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const drag = useDragSort(computed(() => cvData.value.languages))

  const PROFICIENCY_KEY_MAP: Record<string, string> = {
    Native: 'forms.levelNative',
    Fluent: 'forms.levelFluent',
    Professional: 'forms.levelProfessional',
    Conversational: 'forms.levelConversational',
    Basic: 'forms.levelBasic',
  }

  function proficiencyLabel(level: string): string {
    const key = PROFICIENCY_KEY_MAP[level]
    return key ? t(key) : level
  }

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
      :aria-label="t('forms.langEntryLabel', { n: String(index + 1) })"
      @dragstart="drag.onDragStart(lang.id)"
      @dragover.prevent="drag.onDragOver(lang.id)"
      @drop="drag.onDrop(lang.id)"
      @dragend="drag.onDragEnd"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-secondary cursor-grab" role="img" :aria-label="t('forms.dragToReorder')"
            >⠿</span
          >
          <span class="text-sm font-semibold text-primary">
            {{ lang.name || t('forms.langEntryLabel', { n: String(index + 1) }) }}
          </span>
        </div>
        <button
          type="button"
          class="text-secondary hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
          :aria-label="`${t('forms.remove')} ${t('forms.langEntryLabel', { n: String(index + 1) })}`"
          @click="removeLanguage(index)"
        >
          {{ t('forms.remove') }}
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          :id="`lang-name-${lang.id}`"
          v-model="lang.name"
          :label="t('forms.language')"
          placeholder="English"
          autocomplete="off"
          required
        />

        <!--
          Proficiency: stored value is always English (data portability).
          Display labels are translated at render time via PROFICIENCY_KEY_MAP.
        -->
        <div>
          <label
            :for="`lang-prof-${lang.id}`"
            class="block text-xs font-medium text-secondary font-mono uppercase tracking-wider mb-1.5"
          >
            {{ t('forms.proficiency') }}
          </label>
          <select
            :id="`lang-prof-${lang.id}`"
            v-model="lang.proficiency"
            class="w-full px-3 py-2 text-sm rounded-lg"
            :aria-label="`${t('forms.proficiency')} ${lang.name || ''}`"
          >
            <option value="">{{ t('forms.selectLevel') }}</option>
            <option v-for="level in LANGUAGE_PROFICIENCY_LEVELS" :key="level" :value="level">
              {{ proficiencyLabel(level) }}
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
      <span aria-hidden="true">+</span> {{ t('forms.addLanguage') }}
    </button>
  </div>
</template>
