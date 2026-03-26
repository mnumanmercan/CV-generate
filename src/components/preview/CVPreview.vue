<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import type { SectionKey } from '@/types/cv.types'

  const cvStore = useCVStore()
  const { cvData, highlightedSection } = storeToRefs(cvStore)

  const pulsedSections = ref<Set<SectionKey>>(new Set())

  watch(highlightedSection, (section) => {
    if (section) {
      pulsedSections.value.add(section)
      setTimeout(() => {
        pulsedSections.value.delete(section)
      }, 700)
    }
  })

  function isPulsed(section: SectionKey): boolean {
    return pulsedSections.value.has(section)
  }

  const hasExperience = computed(() => cvData.value.experience.length > 0)
  const hasEducation = computed(() => cvData.value.education.length > 0)
  const hasSkills = computed(() => cvData.value.skills.length > 0)
  const hasProjects = computed(() => cvData.value.projects.length > 0)
  const hasCertifications = computed(() => cvData.value.certifications.length > 0)

  const socialLinks = computed(() => {
    const p = cvData.value.personal
    const links: Array<{ label: string; value: string; href: string }> = []
    if (p.linkedin) links.push({ label: 'LinkedIn', value: p.linkedin.replace('https://', ''), href: p.linkedin })
    if (p.github) links.push({ label: 'GitHub', value: p.github.replace('https://', ''), href: p.github })
    if (p.website) links.push({ label: 'Website', value: p.website.replace('https://', ''), href: p.website })
    return links
  })
</script>

<template>
  <!--
    #cv-preview is the EXACT element captured by html2pdf.js.

    Rules that ensure PDF === preview:
    - Width is fixed at 794px (A4 at 96 dpi). NO overflow-hidden — clipping
      causes silent content loss in both preview and PDF.
    - min-height: 1123px so an empty CV shows as A4 proportions.
    - No CSS transform on this element or any ancestor at export time
      (usePDFExport neutralizes parent transforms before capture).
    - PDF margin is 0 — internal p-[28px] provides all spacing.
    - Fonts: Inter loaded from Google Fonts; document.fonts.ready is awaited
      in usePDFExport before capture.
  -->
  <article
    id="cv-preview"
    aria-label="CV Preview"
    style="
      width: 794px;
      min-height: 1123px;
      background: #ffffff;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 40px 44px;
      box-sizing: border-box;
      box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35);
    "
  >
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
          color: cvData.personal.jobTitle ? '#4f46e5' : '#c4b5fd',
          margin: '0 0 6px 0'
        }"
      >
        {{ cvData.personal.jobTitle || 'Job Title' }}
      </p>

      <!-- Contact row — matches reference: email · phone · location · links -->
      <div style="display: flex; flex-wrap: wrap; gap: 0; font-size: 10px; color: #4b5563;">
        <span v-if="cvData.personal.email">{{ cvData.personal.email }}</span>
        <span v-if="cvData.personal.email && (cvData.personal.phone || cvData.personal.location || socialLinks.length)" style="margin: 0 8px;">·</span>
        <span v-if="cvData.personal.phone">{{ cvData.personal.phone }}</span>
        <span v-if="cvData.personal.phone && (cvData.personal.location || socialLinks.length)" style="margin: 0 8px;">·</span>
        <span v-if="cvData.personal.location">{{ cvData.personal.location }}</span>
        <template v-for="(link, i) in socialLinks" :key="link.label">
          <span v-if="cvData.personal.location || i > 0" style="margin: 0 8px;">·</span>
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

    <!-- ── Work Experience ───────────────────────────────────────── -->
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
            <p style="font-size: 11.5px; font-weight: 700; color: #111827; margin: 0;">{{ exp.position }}</p>
            <p style="font-size: 10.5px; color: #4b5563; margin: 1px 0 0 0;">
              {{ exp.company }}<span v-if="exp.location"> · {{ exp.location }}</span>
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

    <!-- ── Education ─────────────────────────────────────────────── -->
    <section
      v-if="hasEducation"
      :class="isPulsed('education') ? 'section-pulse' : ''"
      style="margin-bottom: 12px;"
    >
      <h2 class="cv-section-heading">Education</h2>
      <div
        v-for="(edu, index) in cvData.education"
        :key="edu.id"
        :style="index > 0 ? 'margin-top: 8px;' : ''"
      >
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <p style="font-size: 11.5px; font-weight: 700; color: #111827; margin: 0;">{{ edu.institution }}</p>
            <p style="font-size: 10.5px; color: #4b5563; margin: 1px 0 0 0;">
              {{ edu.degree }} in {{ edu.field }}<span v-if="edu.gpa"> · GPA: {{ edu.gpa }}</span>
            </p>
          </div>
          <p style="font-size: 10px; color: #6b7280; white-space: nowrap; margin: 0 0 0 12px; flex-shrink: 0;">
            {{ edu.startDate }} – {{ edu.endDate }}
          </p>
        </div>
      </div>
    </section>

    <!-- ── Skills ────────────────────────────────────────────────── -->
    <section
      v-if="hasSkills"
      :class="isPulsed('skills') ? 'section-pulse' : ''"
      style="margin-bottom: 12px;"
    >
      <h2 class="cv-section-heading">Skills</h2>
      <div
        v-for="(skill, index) in cvData.skills"
        :key="skill.id"
        :style="index > 0 ? 'margin-top: 3px;' : ''"
        style="font-size: 10.5px;"
      >
        <span style="font-weight: 700; color: #111827;">{{ skill.category }}: </span>
        <span style="color: #374151;">{{ skill.items.join(', ') }}</span>
      </div>
    </section>

    <!-- ── Projects ──────────────────────────────────────────────── -->
    <section
      v-if="hasProjects"
      :class="isPulsed('projects') ? 'section-pulse' : ''"
      style="margin-bottom: 12px;"
    >
      <h2 class="cv-section-heading">Projects</h2>
      <div
        v-for="(project, index) in cvData.projects"
        :key="project.id"
        :style="index > 0 ? 'margin-top: 10px;' : ''"
      >
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <p style="font-size: 11.5px; font-weight: 700; color: #111827; margin: 0;">{{ project.name }}</p>
          <p v-if="project.link" style="font-size: 10px; color: #4f46e5; white-space: nowrap; margin: 0 0 0 12px; flex-shrink: 0;">
            {{ project.link.replace('https://', '') }}
          </p>
        </div>
        <p style="font-size: 10.5px; color: #374151; margin: 3px 0 2px 0; line-height: 1.55;">{{ project.description }}</p>
        <p v-if="project.techStack.length" style="font-size: 10px; color: #4b5563; margin: 0;">
          <span style="font-weight: 600; color: #111827;">Stack: </span>{{ project.techStack.join(', ') }}
        </p>
      </div>
    </section>

    <!-- ── Certifications ────────────────────────────────────────── -->
    <section
      v-if="hasCertifications"
      :class="isPulsed('certifications') ? 'section-pulse' : ''"
    >
      <h2 class="cv-section-heading">Certifications</h2>
      <div
        v-for="(cert, index) in cvData.certifications"
        :key="cert.id"
        :style="index > 0 ? 'margin-top: 5px;' : ''"
        style="display: flex; justify-content: space-between; align-items: baseline; font-size: 10.5px;"
      >
        <div>
          <span style="font-weight: 700; color: #111827;">{{ cert.name }}</span>
          <span style="color: #4b5563;"> · {{ cert.issuer }}</span>
          <span v-if="cert.credentialId" style="color: #6b7280;"> · ID: {{ cert.credentialId }}</span>
        </div>
        <span style="font-size: 10px; color: #6b7280; white-space: nowrap; margin-left: 12px; flex-shrink: 0;">
          {{ cert.date }}
        </span>
      </div>
    </section>
  </article>
</template>

<style scoped>
  .cv-section-heading {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    color: #111827;
    border-bottom: 1.5px solid #d1d5db;
    padding-bottom: 3px;
    margin: 0 0 6px 0;
  }
</style>
