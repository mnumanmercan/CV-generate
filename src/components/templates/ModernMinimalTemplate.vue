<script setup lang="ts">
  import { computed } from 'vue'
  import type { CVData, SectionKey } from '@/types/cv.types'

  const props = defineProps<{
    cvData: CVData
    isPulsed: (section: SectionKey) => boolean
  }>()

  const hasExperience = computed(() => props.cvData.experience.length > 0)
  const hasEducation = computed(() => props.cvData.education.length > 0)
  const hasSkills = computed(() => props.cvData.skills.length > 0)
  const hasProjects = computed(() => props.cvData.projects.length > 0)
  const hasCertifications = computed(() => props.cvData.certifications.length > 0)

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

    <!-- ── Work Experience ───────────────────────────────────────── -->
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

    <!-- ── Education ─────────────────────────────────────────────── -->
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

    <!-- ── Skills ────────────────────────────────────────────────── -->
    <section
      v-if="hasSkills"
      :class="isPulsed('skills') ? 'section-pulse' : ''"
      style="margin-bottom: 18px;"
    >
      <h2 class="cv-section-heading">Skills</h2>
      <div
        v-for="(skill, index) in cvData.skills"
        :key="skill.id"
        :style="index > 0 ? 'margin-top: 5px;' : ''"
        style="display: flex; align-items: flex-start; gap: 6px; flex-wrap: wrap;"
      >
        <span style="font-size: 10px; font-weight: 700; color: #374151; white-space: nowrap; padding-top: 1px;">
          {{ skill.category }}:
        </span>
        <div style="display: flex; flex-wrap: wrap; gap: 3px;">
          <span
            v-for="item in skill.items"
            :key="item"
            class="skill-chip"
          >
            {{ item }}
          </span>
        </div>
      </div>
    </section>

    <!-- ── Projects ──────────────────────────────────────────────── -->
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
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <p style="font-size: 11.5px; font-weight: 700; color: #111827; margin: 0;">{{ project.name }}</p>
          <p v-if="project.link" style="font-size: 10px; color: #0891b2; white-space: nowrap; margin: 0 0 0 12px; flex-shrink: 0;">
            {{ project.link.replace('https://', '') }}
          </p>
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

    <!-- ── Certifications ────────────────────────────────────────── -->
    <section
      v-if="hasCertifications"
      :class="isPulsed('certifications') ? 'section-pulse' : ''"
    >
      <h2 class="cv-section-heading">Certifications</h2>
      <div
        v-for="(cert, index) in cvData.certifications"
        :key="cert.id"
        :style="index > 0 ? 'margin-top: 6px;' : ''"
        style="display: flex; justify-content: space-between; align-items: baseline; font-size: 10.5px;"
      >
        <div>
          <span style="font-weight: 700; color: #111827;">{{ cert.name }}</span>
          <span style="color: #64748b;"> · {{ cert.issuer }}</span>
          <span v-if="cert.credentialId" style="color: #94a3b8;"> · ID: {{ cert.credentialId }}</span>
        </div>
        <span style="font-size: 10px; color: #94a3b8; white-space: nowrap; margin-left: 12px; flex-shrink: 0;">
          {{ cert.date }}
        </span>
      </div>
    </section>

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

  .skill-chip {
    display: inline-block;
    font-size: 9.5px;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 3px;
    padding: 1px 6px;
  }
</style>
