<script setup lang="ts">
  import { computed, reactive } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useDragSort } from '@/composables/useDragSort'
  import FormField from './FormField.vue'
  import { createWorkExperience } from '@/types/cv.types'
  import {
    validateDateFormat,
    validateDateRange,
    analyzeBullet,
  } from '@/services/atsFormatter'

  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const drag = useDragSort(computed(() => cvData.value.experience))

  // Track which fields have been blurred so validation only shows after interaction
  const touchedFields = reactive(new Set<string>())

  function markTouched(expId: string, field: string): void {
    touchedFields.add(`${expId}-${field}`)
  }

  function isTouched(expId: string, field: string): boolean {
    return touchedFields.has(`${expId}-${field}`)
  }

  function addExperience(): void {
    cvData.value.experience.push(createWorkExperience())
  }

  function removeExperience(index: number): void {
    cvData.value.experience.splice(index, 1)
  }

  function toggleCurrentlyEmployed(index: number): void {
    const exp = cvData.value.experience[index]
    if (exp) {
      exp.endDate = exp.endDate === 'Present' ? '' : 'Present'
    }
  }

  function addBullet(expIndex: number): void {
    cvData.value.experience[expIndex]?.bullets.push('')
  }

  function removeBullet(expIndex: number, bulletIndex: number): void {
    cvData.value.experience[expIndex]?.bullets.splice(bulletIndex, 1)
  }

  function updateBullet(expIndex: number, bulletIndex: number, value: string): void {
    const exp = cvData.value.experience[expIndex]
    if (exp) {
      exp.bullets[bulletIndex] = value
    }
  }

  function getDateError(date: string, label: string): string {
    if (!date) return `${label} is required.`
    if (!validateDateFormat(date)) return 'Use MM/YYYY format.'
    return ''
  }

  function getRangeError(start: string, end: string): string {
    if (end === 'Present' || !start || !end) return ''
    if (!validateDateRange(start, end)) return 'End date must be after start date.'
    return ''
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Experience entries -->
    <div
      v-for="(exp, index) in cvData.experience"
      :key="exp.id"
      :class="[
        'rounded-xl border p-4 transition-all',
        drag.isDragging(exp.id) ? 'dragging border-overlay/5' : '',
        drag.isDragOver(exp.id) ? 'drag-over' : 'border-overlay/5',
      ]"
      draggable="true"
      :aria-label="`Work experience entry ${index + 1}`"
      @dragstart="drag.onDragStart(exp.id)"
      @dragover.prevent="drag.onDragOver(exp.id)"
      @drop="drag.onDrop(exp.id)"
      @dragend="drag.onDragEnd"
    >
      <!-- Entry header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <!-- Drag handle -->
          <span
            class="text-secondary cursor-grab active:cursor-grabbing"
            aria-hidden="true"
            title="Drag to reorder"
          >
            ⠿
          </span>
          <span class="text-sm font-semibold text-primary">
            {{ exp.position || `Experience ${index + 1}` }}
          </span>
        </div>
        <button
          type="button"
          class="text-secondary hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
          :aria-label="`Remove experience entry ${index + 1}`"
          @click="removeExperience(index)"
        >
          Remove
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <FormField
          :id="`exp-position-${exp.id}`"
          v-model="exp.position"
          label="Job Title"
          placeholder="Software Engineer"
          required
        />
        <FormField
          :id="`exp-company-${exp.id}`"
          v-model="exp.company"
          label="Company"
          placeholder="Acme Inc."
          required
        />
        <FormField
          :id="`exp-start-${exp.id}`"
          v-model="exp.startDate"
          label="Start Date"
          placeholder="MM/YYYY"
          required
          :error="isTouched(exp.id, 'startDate') ? getDateError(exp.startDate, 'Start date') : ''"
          @blur="markTouched(exp.id, 'startDate')"
        />
        <div>
          <FormField
            :id="`exp-end-${exp.id}`"
            v-model="exp.endDate"
            label="End Date"
            placeholder="MM/YYYY"
            :disabled="exp.endDate === 'Present'"
            :error="
              isTouched(exp.id, 'endDate') && exp.endDate !== 'Present'
                ? getRangeError(exp.startDate, exp.endDate) || getDateError(exp.endDate, 'End date')
                : ''
            "
            @blur="markTouched(exp.id, 'endDate')"
          />
          <label :for="`exp-current-${exp.id}`" class="mt-1.5 flex items-center gap-2 cursor-pointer w-fit">
            <input
              :id="`exp-current-${exp.id}`"
              type="checkbox"
              :checked="exp.endDate === 'Present'"
              class="rounded accent-cyan-500"
              style="width: 14px; height: 14px;"
              @change="toggleCurrentlyEmployed(index)"
            />
            <span class="text-xs text-secondary">I currently work here</span>
          </label>
        </div>
        <div class="col-span-2">
          <FormField
            :id="`exp-location-${exp.id}`"
            v-model="exp.location"
            label="Location"
            placeholder="New York, NY (optional)"
          />
        </div>
      </div>

      <!-- Bullet points -->
      <div class="mt-3">
        <p class="text-xs font-medium text-secondary font-mono uppercase tracking-wider mb-2">
          Bullet Points
        </p>
        <div class="flex flex-col gap-2">
          <div
            v-for="(bullet, bIdx) in exp.bullets"
            :key="bIdx"
            class="flex flex-col gap-1"
          >
            <div class="flex items-start gap-2">
              <span class="text-secondary mt-2 text-xs shrink-0" aria-hidden="true">•</span>
              <div class="flex-1">
                <input
                  :id="`bullet-${exp.id}-${bIdx}`"
                  :value="bullet"
                  type="text"
                  :placeholder="`Led cross-functional team of 5 engineers to deliver...`"
                  class="w-full px-3 py-2 text-sm rounded-lg"
                  :class="bullet.length > 120 ? 'border-yellow-500/50' : ''"
                  :aria-label="`Bullet point ${bIdx + 1} for ${exp.company || 'this position'}`"
                  @input="updateBullet(index, bIdx, ($event.target as HTMLInputElement).value)"
                />
                <!-- Bullet warnings -->
                <div
                  v-for="warn in analyzeBullet(bullet, bIdx)"
                  :key="warn.field"
                  class="mt-1 text-xs text-yellow-400 flex items-center gap-1"
                  role="alert"
                >
                  <span aria-hidden="true">⚠</span> {{ warn.message }}
                </div>
              </div>
              <button
                v-if="exp.bullets.length > 1"
                type="button"
                class="mt-2 text-secondary hover:text-red-400 transition-colors"
                :aria-label="`Remove bullet point ${bIdx + 1}`"
                @click="removeBullet(index, bIdx)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="mt-2 text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
          @click="addBullet(index)"
        >
          <span aria-hidden="true">+</span> Add bullet point
        </button>
      </div>
    </div>

    <!-- Add experience button -->
    <button
      type="button"
      class="w-full py-3 rounded-xl border-2 border-dashed border-overlay/10 text-secondary text-sm hover:border-accent/50 hover:text-accent transition-colors flex items-center justify-center gap-2"
      @click="addExperience"
    >
      <span aria-hidden="true">+</span> Add Work Experience
    </button>
  </div>
</template>
