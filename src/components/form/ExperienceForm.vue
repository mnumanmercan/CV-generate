<script setup lang="ts">
  import { computed, reactive } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useDragSort } from '@/composables/useDragSort'
  import FormField from './FormField.vue'
  import { createWorkExperience } from '@/types/cv.types'
  import { validateDateFormat, validateDateRange, analyzeBullet } from '@/services/atsFormatter'
  import { useI18n } from '@/composables/useI18n'

  const { t } = useI18n()
  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const drag = useDragSort(computed(() => cvData.value.experience))

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

  function getDateError(date: string, isStart: boolean): string {
    if (!date) return isStart ? t('forms.errorStartRequired') : t('forms.errorDateFormat')
    if (!validateDateFormat(date)) return t('forms.errorDateFormat')
    return ''
  }

  function getRangeError(start: string, end: string): string {
    if (end === 'Present' || !start || !end) return ''
    if (!validateDateRange(start, end)) return t('forms.errorEndAfterStart')
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
      :aria-label="t('forms.expEntryLabel', { n: String(index + 1) })"
      @dragstart="drag.onDragStart(exp.id)"
      @dragover.prevent="drag.onDragOver(exp.id)"
      @drop="drag.onDrop(exp.id)"
      @dragend="drag.onDragEnd"
    >
      <!-- Entry header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span
            class="text-secondary cursor-grab active:cursor-grabbing"
            role="img"
            :aria-label="t('forms.dragToReorder')"
            :title="t('forms.dragToReorder')"
          >
            ⠿
          </span>
          <span class="text-sm font-semibold text-primary">
            {{ exp.position || t('forms.expEntryLabel', { n: String(index + 1) }) }}
          </span>
        </div>
        <button
          type="button"
          class="text-secondary hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
          :aria-label="`${t('forms.remove')} ${t('forms.expEntryLabel', { n: String(index + 1) })}`"
          @click="removeExperience(index)"
        >
          {{ t('forms.remove') }}
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          :id="`exp-position-${exp.id}`"
          v-model="exp.position"
          :label="t('forms.expJobTitle')"
          placeholder="Software Engineer"
          required
        />
        <FormField
          :id="`exp-company-${exp.id}`"
          v-model="exp.company"
          :label="t('forms.expCompany')"
          placeholder="Acme Inc."
          required
        />
        <FormField
          :id="`exp-start-${exp.id}`"
          v-model="exp.startDate"
          :label="t('forms.expStartDate')"
          placeholder="MM/YYYY"
          required
          :error="isTouched(exp.id, 'startDate') ? getDateError(exp.startDate, true) : ''"
          @blur="markTouched(exp.id, 'startDate')"
        />
        <div>
          <FormField
            :id="`exp-end-${exp.id}`"
            v-model="exp.endDate"
            :label="t('forms.expEndDate')"
            placeholder="MM/YYYY"
            :disabled="exp.endDate === 'Present'"
            :error="
              isTouched(exp.id, 'endDate') && exp.endDate !== 'Present'
                ? getRangeError(exp.startDate, exp.endDate) || getDateError(exp.endDate, false)
                : ''
            "
            @blur="markTouched(exp.id, 'endDate')"
          />
          <label
            :for="`exp-current-${exp.id}`"
            class="mt-1.5 flex items-center gap-2 cursor-pointer w-fit"
          >
            <input
              :id="`exp-current-${exp.id}`"
              type="checkbox"
              :checked="exp.endDate === 'Present'"
              class="rounded accent-cyan-500"
              style="width: 14px; height: 14px"
              @change="toggleCurrentlyEmployed(index)"
            />
            <span class="text-xs text-secondary">{{ t('forms.currentlyWorkHere') }}</span>
          </label>
        </div>
        <div class="sm:col-span-2">
          <FormField
            :id="`exp-location-${exp.id}`"
            v-model="exp.location"
            :label="t('forms.expLocation')"
            placeholder="New York, NY (optional)"
          />
        </div>
      </div>

      <!-- Bullet points -->
      <div class="mt-3">
        <p class="text-xs font-medium text-secondary font-mono uppercase tracking-wider mb-2">
          {{ t('forms.bulletPoints') }}
        </p>
        <div class="flex flex-col gap-2">
          <div v-for="(bullet, bIdx) in exp.bullets" :key="bIdx" class="flex flex-col gap-1">
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
                  {{ warn.message }}
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
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
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
          <span aria-hidden="true">+</span> {{ t('forms.addBullet') }}
        </button>
      </div>
    </div>

    <!-- Add experience button -->
    <button
      type="button"
      class="w-full py-3 rounded-xl border-2 border-dashed border-overlay/10 text-secondary text-sm hover:border-accent/50 hover:text-accent transition-colors flex items-center justify-center gap-2"
      @click="addExperience"
    >
      <span aria-hidden="true">+</span> {{ t('forms.addExperience') }}
    </button>
  </div>
</template>
