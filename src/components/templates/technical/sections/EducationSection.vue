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
    style="margin-bottom: 14px;"
  >
    <h2 class="cv-section-heading">// Education</h2>
    <div
      v-for="(edu, index) in cvData.education"
      :key="edu.id"
      :style="index > 0 ? 'margin-top: 8px;' : ''"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <p style="font-size: 11.5px; font-weight: 700; color: #0f172a; margin: 0;">{{ edu.institution }}</p>
          <p style="font-size: 10px; color: #475569; margin: 1px 0 0 0;">
            {{ edu.degree }} in {{ edu.field }}<span v-if="edu.gpa"> · GPA: {{ edu.gpa }}</span>
          </p>
        </div>
        <p class="date-label">{{ edu.startDate }} – {{ edu.endDate }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .cv-section-heading {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    font-family: 'Courier New', Courier, monospace;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
    margin: 0 0 8px 0;
    letter-spacing: 0.01em;
  }

  .date-label {
    font-size: 9.5px;
    font-family: 'Courier New', Courier, monospace;
    color: #94a3b8;
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
