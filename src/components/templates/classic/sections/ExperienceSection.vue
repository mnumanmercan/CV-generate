<script setup lang="ts">
  import { computed } from 'vue'
  import type { CVData, SectionKey } from '@/types/cv.types'

  const props = defineProps<{
    cvData: CVData
    isPulsed: (section: SectionKey) => boolean
  }>()

  const hasExperience = computed(() => props.cvData.experience.length > 0)
</script>

<template>
  <section
    v-if="hasExperience"
    :class="isPulsed('experience') ? 'section-pulse' : ''"
    style="margin-bottom: 12px;"
  >
    <h2 class="cv-section-heading">Work Experience</h2>
    <div
      v-for="(exp, index) in cvData.experience"
      :key="exp.id"
      :style="index > 0 ? 'margin-top: 10px;' : ''"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <p style="font-size: 12px; font-weight: 700; color: #111827; margin: 0;">{{ exp.position }}</p>
          <p style="font-size: 10.5px; color: #4b5563; margin: 1px 0 0 0;">
            {{ exp.company }}<span v-if="exp.location"> | {{ exp.location }}</span>
          </p>
        </div>
        <p style="font-size: 10px; color: #6b7280; white-space: nowrap; margin: 0 0 0 12px; flex-shrink: 0;">
          {{ exp.startDate }} – {{ exp.endDate || 'Present' }}
        </p>
      </div>
      <ul style="margin: 4px 0 0 0; padding-left: 14px;" aria-label="Responsibilities">
        <li
          v-for="(bullet, bIdx) in exp.bullets.filter((b) => b.trim())"
          :key="bIdx"
          style="font-size: 10.5px; color: #374151; line-height: 1.55; margin-bottom: 1px;"
        >
          {{ bullet }}
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
  .cv-section-heading {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #111827;
    border-bottom: 1.5px solid #d1d5db;
    padding-bottom: 5px;
    margin: 0 0 6px 0;
  }
</style>
