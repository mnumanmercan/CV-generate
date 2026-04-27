<script setup lang="ts">
  import { computed } from 'vue'
  import type { CVData, SectionKey } from '@/types/cv.types'

  const props = defineProps<{
    cvData: CVData
    isPulsed: (section: SectionKey) => boolean
  }>()

  const hasEducation = computed(() => props.cvData.education.length > 0)
</script>

<template>
  <section
    v-if="hasEducation"
    :class="isPulsed('education') ? 'section-pulse' : ''"
    style="margin-bottom: 18px;"
  >
    <h2 class="cv-section-heading">Education</h2>
    <div
      v-for="(edu, index) in cvData.education"
      :key="edu.id"
      :style="index > 0 ? 'margin-top: 10px;' : ''"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <p style="font-size: 11.5px; font-weight: 700; color: #111827; margin: 0;">{{ edu.institution }}</p>
          <p style="font-size: 10.5px; color: #64748b; margin: 2px 0 0 0;">
            {{ edu.degree }} in {{ edu.field }}<span v-if="edu.gpa"> · GPA: {{ edu.gpa }}</span>
          </p>
        </div>
        <p style="font-size: 10px; color: #94a3b8; white-space: nowrap; margin: 0 0 0 12px; flex-shrink: 0;">
          {{ edu.startDate }} – {{ edu.endDate }}
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .cv-section-heading {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #94a3b8;
    border-left: 3px solid #B8532A;
    padding-left: 8px;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }
</style>
