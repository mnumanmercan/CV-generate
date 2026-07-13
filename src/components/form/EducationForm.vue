<script setup lang="ts">
  import { computed, reactive } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useDragSort } from '@/composables/useDragSort'
  import FormField from './FormField.vue'
  import { createEducation } from '@/types/cv.types'
  import { validateDateFormat, validateDateRange } from '@/services/atsFormatter'
  import { useI18n } from '@/composables/useI18n'
  import { CV_LIMITS } from '@resumark/shared'

  const { t } = useI18n()
  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const drag = useDragSort(computed(() => cvData.value.education))

  const touchedFields = reactive(new Set<string>())

  function markTouched(eduId: string, field: string): void {
    touchedFields.add(`${eduId}-${field}`)
  }

  function isTouched(eduId: string, field: string): boolean {
    return touchedFields.has(`${eduId}-${field}`)
  }

  const educationLimitReached = computed(
    () => cvData.value.education.length >= CV_LIMITS.education.maxItems,
  )

  function addEducation(): void {
    if (educationLimitReached.value) return
    cvData.value.education.push(createEducation())
  }

  function removeEducation(index: number): void {
    cvData.value.education.splice(index, 1)
  }

  function getDateError(date: string): string {
    if (!date) return ''
    return validateDateFormat(date) ? '' : t('forms.errorDateFormat')
  }

  function getRangeError(start: string, end: string): string {
    if (!start || !end) return ''
    return validateDateRange(start, end) ? '' : t('forms.errorEndAfterStart')
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="(edu, index) in cvData.education"
      :key="edu.id"
      :class="[
        'rounded-xl border p-4 transition-all',
        drag.isDragging(edu.id) ? 'dragging border-overlay/5' : '',
        drag.isDragOver(edu.id) ? 'drag-over' : 'border-overlay/5',
      ]"
      draggable="true"
      :aria-label="t('forms.eduEntryLabel', { n: String(index + 1) })"
      @dragstart="drag.onDragStart(edu.id)"
      @dragover.prevent="drag.onDragOver(edu.id)"
      @drop="drag.onDrop(edu.id)"
      @dragend="drag.onDragEnd"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span
            class="text-secondary cursor-grab active:cursor-grabbing"
            role="img"
            :aria-label="t('forms.dragToReorder')"
            >⠿</span
          >
          <span class="text-sm font-semibold text-primary">
            {{ edu.institution || t('forms.eduEntryLabel', { n: String(index + 1) }) }}
          </span>
        </div>
        <button
          type="button"
          class="text-secondary hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
          :aria-label="`${t('forms.remove')} ${t('forms.eduEntryLabel', { n: String(index + 1) })}`"
          @click="removeEducation(index)"
        >
          {{ t('forms.remove') }}
        </button>
      </div>

      <div class="flex flex-col gap-3">
        <FormField
          :id="`edu-institution-${edu.id}`"
          v-model="edu.institution"
          :label="t('forms.eduInstitution')"
          placeholder="University of Technology"
          required
          :maxlength="CV_LIMITS.education.institution"
        />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            :id="`edu-degree-${edu.id}`"
            v-model="edu.degree"
            :label="t('forms.eduDegree')"
            placeholder="Bachelor of Science"
            required
            :maxlength="CV_LIMITS.education.degree"
          />
          <FormField
            :id="`edu-field-${edu.id}`"
            v-model="edu.field"
            :label="t('forms.eduField')"
            placeholder="Computer Science"
            required
            :maxlength="CV_LIMITS.education.field"
          />
          <FormField
            :id="`edu-start-${edu.id}`"
            v-model="edu.startDate"
            :label="t('forms.eduStartDate')"
            placeholder="MM/YYYY"
            :maxlength="CV_LIMITS.education.date"
            :error="isTouched(edu.id, 'startDate') ? getDateError(edu.startDate) : ''"
            @blur="markTouched(edu.id, 'startDate')"
          />
          <FormField
            :id="`edu-end-${edu.id}`"
            v-model="edu.endDate"
            :label="t('forms.eduEndDate')"
            placeholder="MM/YYYY"
            :maxlength="CV_LIMITS.education.date"
            :error="
              isTouched(edu.id, 'endDate')
                ? getDateError(edu.endDate) || getRangeError(edu.startDate, edu.endDate)
                : ''
            "
            @blur="markTouched(edu.id, 'endDate')"
          />
          <FormField
            :id="`edu-gpa-${edu.id}`"
            v-model="edu.gpa"
            :label="t('forms.eduGpa')"
            placeholder="3.8"
            :maxlength="CV_LIMITS.education.gpa"
          />
        </div>
      </div>
    </div>

    <button
      v-if="!educationLimitReached"
      type="button"
      class="w-full py-3 rounded-xl border-2 border-dashed border-overlay/10 text-secondary text-sm hover:border-accent/50 hover:text-accent transition-colors flex items-center justify-center gap-2"
      @click="addEducation"
    >
      <span aria-hidden="true">+</span> {{ t('forms.addEducation') }}
    </button>
    <p v-else class="text-center text-xs text-secondary py-2">
      {{ t('forms.limitReached', { n: String(CV_LIMITS.education.maxItems) }) }}
    </p>

    <!-- Layout option: keep Education full-width, or pull it into the compact
         bottom row beside Certifications & Languages (meta.educationInColumns). -->
    <div class="pt-3 border-t border-overlay/5">
      <p class="mono-eyebrow text-[10.5px] text-muted mb-2">{{ t('forms.eduLayoutLabel') }}</p>
      <div class="grid grid-cols-2 gap-2" role="radiogroup" :aria-label="t('forms.eduLayoutLabel')">
        <button
          type="button"
          role="radio"
          :aria-checked="!(cvData.meta.educationInColumns ?? false)"
          class="text-left rounded-xl border p-3 transition-all"
          :class="
            !(cvData.meta.educationInColumns ?? false)
              ? 'border-accent bg-accent/5'
              : 'border-overlay/10 hover:border-overlay/20'
          "
          @click="cvData.meta.educationInColumns = false"
        >
          <span class="block text-[12.5px] font-semibold text-primary">{{
            t('forms.eduLayoutFull')
          }}</span>
          <span class="block text-[11px] text-secondary mt-0.5">{{
            t('forms.eduLayoutFullDesc')
          }}</span>
        </button>

        <button
          type="button"
          role="radio"
          :aria-checked="cvData.meta.educationInColumns ?? false"
          class="text-left rounded-xl border p-3 transition-all"
          :class="
            (cvData.meta.educationInColumns ?? false)
              ? 'border-accent bg-accent/5'
              : 'border-overlay/10 hover:border-overlay/20'
          "
          @click="cvData.meta.educationInColumns = true"
        >
          <span class="block text-[12.5px] font-semibold text-primary">{{
            t('forms.eduLayoutColumns')
          }}</span>
          <span class="block text-[11px] text-secondary mt-0.5">{{
            t('forms.eduLayoutColumnsDesc')
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
