<script setup lang="ts">
  import { computed } from 'vue'
  import type { CVData, SectionKey } from '@/types/cv.types'

  const props = defineProps<{
    cvData: CVData
    isPulsed: (section: SectionKey) => boolean
  }>()

  const hasProjects = computed(() => props.cvData.projects.length > 0)
</script>

<template>
  <section
    v-if="hasProjects"
    :class="isPulsed('projects') ? 'section-pulse' : ''"
    style="margin-bottom: 18px;"
  >
    <h2 class="cv-section-heading">Projects</h2>
    <div
      v-for="(project, index) in cvData.projects"
      :key="project.id"
      :style="index > 0 ? 'margin-top: 12px;' : ''"
    >
      <div style="display: flex; align-items: center; gap: 6px;">
        <p style="font-size: 11.5px; font-weight: 700; color: #111827; margin: 0;">{{ project.name }}</p>
        <a
          v-if="project.link"
          :href="project.link"
          target="_blank"
          rel="noopener noreferrer"
          :title="project.link"
          style="display: inline-flex; align-items: center; flex-shrink: 0; color: #0891b2; text-decoration: none; line-height: 1;"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
      <p style="font-size: 10.5px; color: #374151; margin: 3px 0 4px 0; line-height: 1.6;">{{ project.description }}</p>
      <div v-if="project.techStack.length" style="display: flex; flex-wrap: wrap; gap: 3px;">
        <span
          v-for="tech in project.techStack"
          :key="tech"
          class="skill-chip"
        >
          {{ tech }}
        </span>
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
    border-left: 3px solid #0891b2;
    padding-left: 8px;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  .skill-chip {
    display: inline-block;
    font-size: 9.5px;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 3px;
    padding: 1px 6px;
  }
</style>
