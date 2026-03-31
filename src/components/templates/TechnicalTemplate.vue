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

    <!-- ── Skills (moved to top) ─────────────────────────────────── -->
    <section
      v-if="hasSkills"
      :class="isPulsed('skills') ? 'section-pulse' : ''"
      style="margin-bottom: 14px;"
    >
      <h2 class="cv-section-heading">// Skills</h2>
      <div
        v-for="(skill, index) in cvData.skills"
        :key="skill.id"
        :style="index > 0 ? 'margin-top: 5px;' : ''"
        style="display: flex; align-items: flex-start; gap: 8px;"
      >
        <span class="skill-category-label">{{ skill.category }}</span>
        <div style="display: flex; flex-wrap: wrap; gap: 3px; flex: 1;">
          <span
            v-for="item in skill.items"
            :key="item"
            class="tech-chip"
          >
            {{ item }}
          </span>
        </div>
      </div>
    </section>

    <!-- ── Work Experience ───────────────────────────────────────── -->
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

    <!-- ── Projects ──────────────────────────────────────────────── -->
    <section
      v-if="hasProjects"
      :class="isPulsed('projects') ? 'section-pulse' : ''"
      style="margin-bottom: 14px;"
    >
      <h2 class="cv-section-heading">// Projects</h2>
      <div
        v-for="(project, index) in cvData.projects"
        :key="project.id"
        :style="index > 0 ? 'margin-top: 10px;' : ''"
      >
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <p style="font-size: 11.5px; font-weight: 700; color: #0f172a; margin: 0;">{{ project.name }}</p>
          <a
            v-if="project.link"
            :href="project.link"
            target="_blank"
            rel="noopener noreferrer"
            style="font-size: 9.5px; color: #0891b2; white-space: nowrap; margin: 0 0 0 12px; flex-shrink: 0; font-family: 'Courier New', Courier, monospace; text-decoration: none;"
          >
            {{ project.link.replace('https://', '') }}
          </a>
        </div>
        <p style="font-size: 10.5px; color: #334155; margin: 3px 0 4px 0; line-height: 1.55;">{{ project.description }}</p>
        <div v-if="project.techStack.length" style="display: flex; flex-wrap: wrap; gap: 3px;">
          <span
            v-for="tech in project.techStack"
            :key="tech"
            class="tech-chip"
          >
            {{ tech }}
          </span>
        </div>
      </div>
    </section>

    <!-- ── Education ─────────────────────────────────────────────── -->
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

    <!-- ── Certifications ────────────────────────────────────────── -->
    <section
      v-if="hasCertifications"
      :class="isPulsed('certifications') ? 'section-pulse' : ''"
    >
      <h2 class="cv-section-heading">// Certifications</h2>
      <div
        v-for="(cert, index) in cvData.certifications"
        :key="cert.id"
        :style="index > 0 ? 'margin-top: 5px;' : ''"
        style="display: flex; justify-content: space-between; align-items: baseline; font-size: 10.5px;"
      >
        <div>
          <span style="font-weight: 700; color: #0f172a;">{{ cert.name }}</span>
          <span style="color: #475569;"> · {{ cert.issuer }}</span>
          <span v-if="cert.credentialId" style="color: #94a3b8; font-family: 'Courier New', Courier, monospace; font-size: 9.5px;"> · {{ cert.credentialId }}</span>
        </div>
        <p class="date-label" style="margin: 0 0 0 12px;">{{ cert.date }}</p>
      </div>
    </section>

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

  .tech-chip {
    display: inline-block;
    font-size: 9px;
    font-family: 'Courier New', Courier, monospace;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 2px;
    padding: 1px 5px;
    color: #374151;
  }

  .skill-category-label {
    font-size: 9.5px;
    font-weight: 700;
    font-family: 'Courier New', Courier, monospace;
    color: #0f172a;
    white-space: nowrap;
    min-width: 110px;
    padding-top: 2px;
  }

  .date-label {
    font-size: 9.5px;
    font-family: 'Courier New', Courier, monospace;
    color: #94a3b8;
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
