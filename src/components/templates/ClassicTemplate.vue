<script setup lang="ts">
  import { computed, type Component } from 'vue'
  import type { CVData, SectionKey } from '@/types/cv.types'
  import ExperienceSection from './classic/sections/ExperienceSection.vue'
  import EducationSection from './classic/sections/EducationSection.vue'
  import SkillsSection from './classic/sections/SkillsSection.vue'
  import ProjectsSection from './classic/sections/ProjectsSection.vue'
  import CertificationsSection from './classic/sections/CertificationsSection.vue'

  const props = defineProps<{
    cvData: CVData
    isPulsed: (section: SectionKey) => boolean
    sectionOrder: SectionKey[]
  }>()

  const sectionMap: Partial<Record<SectionKey, Component>> = {
    experience: ExperienceSection,
    education: EducationSection,
    skills: SkillsSection,
    projects: ProjectsSection,
    certifications: CertificationsSection,
  }

  const orderedSections = computed(() =>
    props.sectionOrder.filter((key) => key in sectionMap),
  )

  const socialLinks = computed(() => {
    const p = props.cvData.personal
    const links: Array<{ label: string; value: string; href: string }> = []
    if (p.linkedin) links.push({ label: 'LinkedIn', value: p.linkedin.replace('https://', ''), href: p.linkedin })
    if (p.github) links.push({ label: 'GitHub', value: p.github.replace('https://', ''), href: p.github })
    if (p.website) links.push({ label: 'Website', value: p.website.replace('https://', ''), href: p.website })
    return links
  })
</script>

<template>
  <!-- 48px 52px ≈ 12.7mm 13.7mm margins — ATS resume guides recommend ≥0.5in (~13mm). -->
  <div style="padding: 48px 52px; box-sizing: border-box;">

    <!-- ── Personal Info ─────────────────────────────────────────── -->
    <header
      :class="['cv-header', isPulsed('personal') ? 'section-pulse' : '']"
      style="margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;"
    >
      <h1
        :style="{
          fontSize: '26px', fontWeight: '700',
          color: cvData.personal.fullName ? '#111827' : '#9ca3af',
          margin: '0 0 2px 0', lineHeight: '1.2'
        }"
      >
        {{ cvData.personal.fullName || 'Your Name' }}
      </h1>
      <p
        :style="{
          fontSize: '12px', fontWeight: '600',
          color: cvData.personal.jobTitle ? '#B8532A' : '#D5916F',
          margin: '0 0 6px 0'
        }"
      >
        {{ cvData.personal.jobTitle || 'Job Title' }}
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 0; font-size: 10px; color: #4b5563;">
        <span v-if="cvData.personal.email">{{ cvData.personal.email }}</span>
        <span v-if="cvData.personal.email && (cvData.personal.phone || cvData.personal.location || socialLinks.length)" style="margin: 0 8px;">|</span>
        <span v-if="cvData.personal.phone">{{ cvData.personal.phone }}</span>
        <span v-if="cvData.personal.phone && (cvData.personal.location || socialLinks.length)" style="margin: 0 8px;">|</span>
        <span v-if="cvData.personal.location">{{ cvData.personal.location }}</span>
        <template v-for="(link, i) in socialLinks" :key="link.label">
          <span v-if="cvData.personal.location || i > 0" style="margin: 0 8px;">|</span>
          <a :href="link.href" target="_blank" rel="noopener noreferrer" style="color: #4b5563; text-decoration: none;">{{ link.value }}</a>
        </template>
      </div>
    </header>

    <!-- ── Professional Summary ──────────────────────────────────── -->
    <section
      v-if="cvData.summary"
      :class="isPulsed('summary') ? 'section-pulse' : ''"
      style="margin-bottom: 12px;"
    >
      <h2 class="cv-section-heading">Professional Summary</h2>
      <p style="font-size: 10.5px; color: #374151; line-height: 1.6; white-space: pre-wrap; margin: 0;">
        {{ cvData.summary }}
      </p>
    </section>

    <!-- ── Ordered Sections ──────────────────────────────────────── -->
    <template v-for="key in orderedSections" :key="key">
      <component
        :is="sectionMap[key]"
        :cv-data="cvData"
        :is-pulsed="isPulsed"
      />
    </template>

  </div>
</template>

<style scoped>
  .cv-section-heading {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    /* 0.04em — tight enough to preserve the all-caps "section heading" feel
       without tripping OCR tokenizers that read wide letter-spacing as
       "S K I L L S" (the old 0.10em frequently broke this on ATS scans). */
    letter-spacing: 0.04em;
    color: #111827;
    border-bottom: 1.5px solid #d1d5db;
    padding-bottom: 3px;
    margin: 0 0 6px 0;
  }
</style>
