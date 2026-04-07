<script setup lang="ts">
  import { computed, type Component } from 'vue'
  import type { CVData, SectionKey } from '@/types/cv.types'
  import ExperienceSection from './modern/sections/ExperienceSection.vue'
  import EducationSection from './modern/sections/EducationSection.vue'
  import SkillsSection from './modern/sections/SkillsSection.vue'
  import ProjectsSection from './modern/sections/ProjectsSection.vue'
  import CertificationsSection from './modern/sections/CertificationsSection.vue'

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
  <div style="padding: 44px 50px; box-sizing: border-box;">

    <!-- ── Personal Info ─────────────────────────────────────────── -->
    <header
      :class="['cv-header', isPulsed('personal') ? 'section-pulse' : '']"
      style="margin-bottom: 20px; padding-bottom: 14px; border-bottom: 3px solid #0891b2;"
    >
      <h1
        :style="{
          fontSize: '30px', fontWeight: '300',
          color: cvData.personal.fullName ? '#111827' : '#9ca3af',
          margin: '0 0 4px 0', lineHeight: '1.15', letterSpacing: '-0.3px'
        }"
      >
        {{ cvData.personal.fullName || 'Your Name' }}
      </h1>
      <p
        :style="{
          fontSize: '12.5px', fontWeight: '600',
          color: cvData.personal.jobTitle ? '#0891b2' : '#7dd3fc',
          margin: '0 0 8px 0', letterSpacing: '0.01em'
        }"
      >
        {{ cvData.personal.jobTitle || 'Job Title' }}
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 0; font-size: 10px; color: #64748b;">
        <span v-if="cvData.personal.email">{{ cvData.personal.email }}</span>
        <span v-if="cvData.personal.email && (cvData.personal.phone || cvData.personal.location || socialLinks.length)" style="margin: 0 8px;">·</span>
        <span v-if="cvData.personal.phone">{{ cvData.personal.phone }}</span>
        <span v-if="cvData.personal.phone && (cvData.personal.location || socialLinks.length)" style="margin: 0 8px;">·</span>
        <span v-if="cvData.personal.location">{{ cvData.personal.location }}</span>
        <template v-for="(link, i) in socialLinks" :key="link.label">
          <span v-if="cvData.personal.location || i > 0" style="margin: 0 8px;">·</span>
          <a :href="link.href" target="_blank" rel="noopener noreferrer" style="color: #0891b2; text-decoration: none;">{{ link.value }}</a>
        </template>
      </div>
    </header>

    <!-- ── Professional Summary ──────────────────────────────────── -->
    <section
      v-if="cvData.summary"
      :class="isPulsed('summary') ? 'section-pulse' : ''"
      style="margin-bottom: 18px;"
    >
      <h2 class="cv-section-heading">Professional Summary</h2>
      <p style="font-size: 10.5px; color: #374151; line-height: 1.7; white-space: pre-wrap; margin: 0;">
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
</style>
