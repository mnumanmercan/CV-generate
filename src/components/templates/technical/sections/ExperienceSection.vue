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
    style="margin-bottom: 14px;"
  >
    <h2 class="cv-section-heading">// Experience</h2>
    <div
      v-for="(exp, index) in cvData.experience"
      :key="exp.id"
      :style="index > 0 ? 'margin-top: 11px;' : ''"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <p style="font-size: 11.5px; font-weight: 700; color: #0f172a; margin: 0;">{{ exp.position }}</p>
          <p style="font-size: 10px; color: #475569; margin: 1px 0 0 0;">
            {{ exp.company }}<span v-if="exp.location"> · {{ exp.location }}</span>
          </p>
        </div>
        <p class="date-label">{{ exp.startDate }} – {{ exp.endDate || 'Present' }}</p>
      </div>
      <ul style="margin: 4px 0 0 0; padding-left: 14px;" aria-label="Responsibilities">
        <li
          v-for="(bullet, bIdx) in exp.bullets.filter((b) => b.trim())"
          :key="bIdx"
          style="font-size: 10.5px; color: #334155; line-height: 1.55; margin-bottom: 1px;"
        >
          {{ bullet }}
        </li>
      </ul>
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
