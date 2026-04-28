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
    style="margin-bottom: 18px;"
  >
    <h2 class="cv-section-heading">Work Experience</h2>
    <div
      v-for="(exp, index) in cvData.experience"
      :key="exp.id"
      :style="index > 0 ? 'margin-top: 13px;' : ''"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <p style="font-size: 11.5px; font-weight: 700; color: #111827; margin: 0;">{{ exp.position }}</p>
          <p style="font-size: 10.5px; color: #64748b; margin: 2px 0 0 0;">
            {{ exp.company }}<span v-if="exp.location"> · {{ exp.location }}</span>
          </p>
        </div>
        <p style="font-size: 10px; color: #94a3b8; white-space: nowrap; margin: 0 0 0 12px; flex-shrink: 0;">
          {{ exp.startDate }} – {{ exp.endDate || 'Present' }}
        </p>
      </div>
      <ul style="margin: 5px 0 0 0; padding-left: 14px;" aria-label="Responsibilities">
        <li
          v-for="(bullet, bIdx) in exp.bullets.filter((b) => b.trim())"
          :key="bIdx"
          style="font-size: 10.5px; color: #374151; line-height: 1.6; margin-bottom: 2px;"
        >
          {{ bullet }}
        </li>
      </ul>
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
