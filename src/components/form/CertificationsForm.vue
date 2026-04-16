<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useDragSort } from '@/composables/useDragSort'
  import FormField from './FormField.vue'
  import { createCertification } from '@/types/cv.types'
  import { validateDateFormat } from '@/services/atsFormatter'

  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const drag = useDragSort(computed(() => cvData.value.certifications))

  function addCertification(): void {
    cvData.value.certifications.push(createCertification())
  }

  function removeCertification(index: number): void {
    cvData.value.certifications.splice(index, 1)
  }

  function getDateError(date: string): string {
    if (!date) return ''
    return validateDateFormat(date) ? '' : 'Use MM/YYYY format.'
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="(cert, index) in cvData.certifications"
      :key="cert.id"
      :class="[
        'rounded-xl border p-4 transition-all',
        drag.isDragging(cert.id) ? 'dragging border-overlay/5' : '',
        drag.isDragOver(cert.id) ? 'drag-over' : 'border-overlay/5',
      ]"
      draggable="true"
      :aria-label="`Certification entry ${index + 1}`"
      @dragstart="drag.onDragStart(cert.id)"
      @dragover.prevent="drag.onDragOver(cert.id)"
      @drop="drag.onDrop(cert.id)"
      @dragend="drag.onDragEnd"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-secondary cursor-grab" role="img" aria-label="Drag to reorder">⠿</span>
          <span class="text-sm font-semibold text-primary">
            {{ cert.name || `Certification ${index + 1}` }}
          </span>
        </div>
        <button
          type="button"
          class="text-secondary hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
          :aria-label="`Remove certification ${index + 1}`"
          @click="removeCertification(index)"
        >
          Remove
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <FormField
            :id="`cert-name-${cert.id}`"
            v-model="cert.name"
            label="Certification Name"
            placeholder="AWS Certified Solutions Architect"
            required
          />
        </div>
        <FormField
          :id="`cert-issuer-${cert.id}`"
          v-model="cert.issuer"
          label="Issuing Organization"
          placeholder="Amazon Web Services"
          required
        />
        <FormField
          :id="`cert-date-${cert.id}`"
          v-model="cert.date"
          label="Date"
          placeholder="06/2023"
          required
          :error="getDateError(cert.date)"
        />
        <FormField
          :id="`cert-id-${cert.id}`"
          v-model="cert.credentialId"
          label="Credential ID (optional)"
          placeholder="ABC-12345"
        />
        <FormField
          :id="`cert-url-${cert.id}`"
          v-model="cert.credentialUrl"
          label="Certificate URL (optional)"
          type="url"
          placeholder="https://www.credly.com/badges/…"
        />
      </div>
    </div>

    <button
      type="button"
      class="w-full py-3 rounded-xl border-2 border-dashed border-overlay/10 text-secondary text-sm hover:border-accent/50 hover:text-accent transition-colors flex items-center justify-center gap-2"
      @click="addCertification"
    >
      <span aria-hidden="true">+</span> Add Certification
    </button>
  </div>
</template>
