<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useDragSort } from '@/composables/useDragSort'
  import FormField from './FormField.vue'
  import { createEducation } from '@/types/cv.types'
  import { validateDateFormat, validateDateRange } from '@/services/atsFormatter'

  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const drag = useDragSort(computed(() => cvData.value.education))

  function addEducation(): void {
    cvData.value.education.push(createEducation())
  }

  function removeEducation(index: number): void {
    cvData.value.education.splice(index, 1)
  }

  function getDateError(date: string): string {
    if (!date) return ''
    return validateDateFormat(date) ? '' : 'Use MM/YYYY format.'
  }

  function getRangeError(start: string, end: string): string {
    if (!start || !end) return ''
    return validateDateRange(start, end) ? '' : 'End date must be after start date.'
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="(edu, index) in cvData.education"
      :key="edu.id"
      :class="[
        'rounded-xl border p-4 transition-all',
        drag.isDragging(edu.id) ? 'dragging border-white/5' : '',
        drag.isDragOver(edu.id) ? 'drag-over' : 'border-white/5',
      ]"
      draggable="true"
      :aria-label="`Education entry ${index + 1}`"
      @dragstart="drag.onDragStart(edu.id)"
      @dragover.prevent="drag.onDragOver(edu.id)"
      @drop="drag.onDrop(edu.id)"
      @dragend="drag.onDragEnd"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-secondary cursor-grab active:cursor-grabbing" aria-hidden="true">⠿</span>
          <span class="text-sm font-semibold text-primary">
            {{ edu.institution || `Education ${index + 1}` }}
          </span>
        </div>
        <button
          type="button"
          class="text-secondary hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
          :aria-label="`Remove education entry ${index + 1}`"
          @click="removeEducation(index)"
        >
          Remove
        </button>
      </div>

      <div class="flex flex-col gap-3">
        <FormField
          :id="`edu-institution-${edu.id}`"
          v-model="edu.institution"
          label="Institution"
          placeholder="University of Technology"
          required
        />
        <div class="grid grid-cols-2 gap-3">
          <FormField
            :id="`edu-degree-${edu.id}`"
            v-model="edu.degree"
            label="Degree"
            placeholder="Bachelor of Science"
            required
          />
          <FormField
            :id="`edu-field-${edu.id}`"
            v-model="edu.field"
            label="Field of Study"
            placeholder="Computer Science"
            required
          />
          <FormField
            :id="`edu-start-${edu.id}`"
            v-model="edu.startDate"
            label="Start Date"
            placeholder="09/2018"
            :error="getDateError(edu.startDate)"
          />
          <FormField
            :id="`edu-end-${edu.id}`"
            v-model="edu.endDate"
            label="End Date"
            placeholder="06/2022"
            :error="getDateError(edu.endDate) || getRangeError(edu.startDate, edu.endDate)"
          />
          <FormField
            :id="`edu-gpa-${edu.id}`"
            v-model="edu.gpa"
            label="GPA (optional)"
            placeholder="3.8"
          />
        </div>
      </div>
    </div>

    <button
      type="button"
      class="w-full py-3 rounded-xl border-2 border-dashed border-white/10 text-secondary text-sm hover:border-accent/50 hover:text-accent transition-colors flex items-center justify-center gap-2"
      @click="addEducation"
    >
      <span aria-hidden="true">+</span> Add Education
    </button>
  </div>
</template>
