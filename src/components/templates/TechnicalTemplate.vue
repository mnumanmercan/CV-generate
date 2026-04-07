<script setup lang="ts">
  import { computed, type Component } from 'vue'
  import type { CVData, SectionKey } from '@/types/cv.types'
  import ExperienceSection from './technical/sections/ExperienceSection.vue'
  import EducationSection from './technical/sections/EducationSection.vue'
  import SkillsSection from './technical/sections/SkillsSection.vue'
  import ProjectsSection from './technical/sections/ProjectsSection.vue'
  import CertificationsSection from './technical/sections/CertificationsSection.vue'

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
    const links: Array<{ label: string; value: string; href: string; prefix: string }> = []
    if (p.linkedin) links.push({ label: 'LinkedIn', value: p.linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\/?/, ''), href: p.linkedin, prefix: 'in/' })
    if (p.github) links.push({ label: 'GitHub', value: p.github.replace(/https?:\/\/(www\.)?github\.com\//, ''), href: p.github, prefix: 'gh/' })
    if (p.website) links.push({ label: 'Website', value: p.website.replace('https://', ''), href: p.website, prefix: 'web/' })
    return links
  })
</script>

<template>
  <div style="padding: 40px 44px; box-sizing: border-box;">

    <!-- ── Personal Info ─────────────────────────────────────────── -->
    <header
      :class="['cv-header', isPulsed('personal') ? 'section-pulse' : '']"
      style="margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;"
    >
      <h1
        :style="{
          fontSize: '22px', fontWeight: '700',
          color: cvData.personal.fullName ? '#0f172a' : '#94a3b8',
          margin: '0 0 2px 0', lineHeight: '1.2'
        }"
      >
        {{ cvData.personal.fullName || 'Your Name' }}
      </h1>
      <p
        :style="{
          fontSize: '11px', fontWeight: '500',
          color: cvData.personal.jobTitle ? '#475569' : '#94a3b8',
          margin: '0 0 6px 0', letterSpacing: '0.02em'
        }"
      >
        {{ cvData.personal.jobTitle || 'Job Title' }}
      </p>

      <!-- Contact row — compact with monospace links -->
      <div style="display: flex; flex-wrap: wrap; gap: 0; font-size: 9.5px; color: #64748b; font-family: 'Courier New', Courier, monospace;">
        <span v-if="cvData.personal.email">{{ cvData.personal.email }}</span>
        <span v-if="cvData.personal.email && (cvData.personal.phone || cvData.personal.location || socialLinks.length)" style="margin: 0 7px; color: #cbd5e1;">|</span>
        <span v-if="cvData.personal.phone">{{ cvData.personal.phone }}</span>
        <span v-if="cvData.personal.phone && (cvData.personal.location || socialLinks.length)" style="margin: 0 7px; color: #cbd5e1;">|</span>
        <span v-if="cvData.personal.location">{{ cvData.personal.location }}</span>
        <template v-for="(link, i) in socialLinks" :key="link.label">
          <span v-if="cvData.personal.location || i > 0" style="margin: 0 7px; color: #cbd5e1;">|</span>
          <a :href="link.href" target="_blank" rel="noopener noreferrer" style="color: #0891b2; text-decoration: none;">
            <span style="color: #94a3b8;">{{ link.prefix }}</span>{{ link.value }}
          </a>
        </template>
      </div>
    </header>

    <!-- ── Professional Summary ──────────────────────────────────── -->
    <section
      v-if="cvData.summary"
      :class="isPulsed('summary') ? 'section-pulse' : ''"
      style="margin-bottom: 14px;"
    >
      <h2 class="cv-section-heading">// Summary</h2>
      <p style="font-size: 10.5px; color: #334155; line-height: 1.6; white-space: pre-wrap; margin: 0;">
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
    font-weight: 700;
    color: #64748b;
    font-family: 'Courier New', Courier, monospace;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
    margin: 0 0 8px 0;
    letter-spacing: 0.01em;
  }
</style>
