<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import type { SectionKey } from '@/types/cv.types'

  const cvStore = useCVStore()
  const { cvData, highlightedSection } = storeToRefs(cvStore)

  const pulsedSections = ref<Set<SectionKey>>(new Set())

  // Trigger section pulse animation when highlighted section changes
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

  // Helpers
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
    cv-a4 is the element exported to PDF.
    Dimensions: 794px × 1123px (A4 at 96dpi).
    ATS-compliant: single column, no tables, semantic headings only.
  -->
  <article
    id="cv-preview"
    class="cv-a4 p-10 text-[#1a1a2e] overflow-hidden"
    style="font-family: 'Inter', sans-serif"
    aria-label="CV Preview"
  >
    <!-- ── Personal Info ─────────────────────────────────────────── -->
    <header
      :class="['mb-5 pb-4 border-b-2 border-gray-200 transition-colors rounded', isPulsed('personal') ? 'section-pulse' : '']"
    >
      <h1 class="text-2xl font-bold text-gray-900 leading-tight">
        {{ cvData.personal.fullName || 'Your Name' }}
      </h1>
      <p class="text-sm font-semibold text-indigo-600 mt-0.5">
        {{ cvData.personal.jobTitle || 'Job Title' }}
      </p>

      <!-- Contact row -->
      <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
        <span v-if="cvData.personal.email">{{ cvData.personal.email }}</span>
        <span v-if="cvData.personal.phone">{{ cvData.personal.phone }}</span>
        <span v-if="cvData.personal.location">{{ cvData.personal.location }}</span>
        <span v-for="link in socialLinks" :key="link.label">
          {{ link.value }}
        </span>
      </div>
    </header>

    <!-- ── Professional Summary ──────────────────────────────────── -->
    <section
      v-if="cvData.summary"
      :class="['mb-4 rounded transition-colors', isPulsed('summary') ? 'section-pulse' : '']"
    >
      <h2 class="cv-section-heading">Professional Summary</h2>
      <p class="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
        {{ cvData.summary }}
      </p>
    </section>

    <!-- ── Work Experience ───────────────────────────────────────── -->
    <section
      v-if="hasExperience"
      :class="['mb-4 rounded transition-colors', isPulsed('experience') ? 'section-pulse' : '']"
    >
      <h2 class="cv-section-heading">Work Experience</h2>
      <div
        v-for="(exp, index) in cvData.experience"
        :key="exp.id"
        :class="index > 0 ? 'mt-3' : ''"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-900">{{ exp.position }}</p>
            <p class="text-xs text-gray-600">
              {{ exp.company }}<span v-if="exp.location"> · {{ exp.location }}</span>
            </p>
          </div>
          <p class="text-xs text-gray-500 shrink-0 ml-2">
            {{ exp.startDate }} – {{ exp.endDate || 'Present' }}
          </p>
        </div>
        <ul class="mt-1.5 pl-3 space-y-0.5" aria-label="Responsibilities">
          <li
            v-for="(bullet, bIdx) in exp.bullets.filter((b) => b.trim())"
            :key="bIdx"
            class="text-xs text-gray-700 leading-relaxed list-disc list-outside"
          >
            {{ bullet }}
          </li>
        </ul>
      </div>
    </section>

    <!-- ── Education ─────────────────────────────────────────────── -->
    <section
      v-if="hasEducation"
      :class="['mb-4 rounded transition-colors', isPulsed('education') ? 'section-pulse' : '']"
    >
      <h2 class="cv-section-heading">Education</h2>
      <div
        v-for="(edu, index) in cvData.education"
        :key="edu.id"
        :class="index > 0 ? 'mt-2' : ''"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-900">{{ edu.institution }}</p>
            <p class="text-xs text-gray-600">
              {{ edu.degree }} in {{ edu.field }}
              <span v-if="edu.gpa"> · GPA: {{ edu.gpa }}</span>
            </p>
          </div>
          <p class="text-xs text-gray-500 shrink-0 ml-2">
            {{ edu.startDate }} – {{ edu.endDate }}
          </p>
        </div>
      </div>
    </section>

    <!-- ── Skills ────────────────────────────────────────────────── -->
    <section
      v-if="hasSkills"
      :class="['mb-4 rounded transition-colors', isPulsed('skills') ? 'section-pulse' : '']"
    >
      <h2 class="cv-section-heading">Skills</h2>
      <div
        v-for="(skill, index) in cvData.skills"
        :key="skill.id"
        :class="['text-xs', index > 0 ? 'mt-1' : '']"
      >
        <span class="font-semibold text-gray-800">{{ skill.category }}: </span>
        <span class="text-gray-700">{{ skill.items.join(', ') }}</span>
      </div>
    </section>

    <!-- ── Projects ──────────────────────────────────────────────── -->
    <section
      v-if="hasProjects"
      :class="['mb-4 rounded transition-colors', isPulsed('projects') ? 'section-pulse' : '']"
    >
      <h2 class="cv-section-heading">Projects</h2>
      <div
        v-for="(project, index) in cvData.projects"
        :key="project.id"
        :class="index > 0 ? 'mt-3' : ''"
      >
        <div class="flex items-start justify-between">
          <p class="text-sm font-semibold text-gray-900">{{ project.name }}</p>
          <p v-if="project.link" class="text-xs text-indigo-600 ml-2 shrink-0">
            {{ project.link.replace('https://', '') }}
          </p>
        </div>
        <p class="text-xs text-gray-700 mt-0.5 leading-relaxed">{{ project.description }}</p>
        <p v-if="project.techStack.length" class="text-xs text-gray-500 mt-0.5">
          <span class="font-medium text-gray-600">Stack:</span>
          {{ project.techStack.join(', ') }}
        </p>
      </div>
    </section>

    <!-- ── Certifications ────────────────────────────────────────── -->
    <section
      v-if="hasCertifications"
      :class="['mb-4 rounded transition-colors', isPulsed('certifications') ? 'section-pulse' : '']"
    >
      <h2 class="cv-section-heading">Certifications</h2>
      <div
        v-for="(cert, index) in cvData.certifications"
        :key="cert.id"
        :class="['text-xs', index > 0 ? 'mt-1.5' : '']"
      >
        <div class="flex items-center justify-between">
          <div>
            <span class="font-semibold text-gray-900">{{ cert.name }}</span>
            <span class="text-gray-600"> · {{ cert.issuer }}</span>
            <span v-if="cert.credentialId" class="text-gray-500"> · ID: {{ cert.credentialId }}</span>
          </div>
          <span class="text-gray-500 ml-2 shrink-0">{{ cert.date }}</span>
        </div>
      </div>
    </section>
  </article>
</template>

<style scoped>
  .cv-section-heading {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #1a1a2e;
    border-bottom: 1.5px solid #e5e7eb;
    padding-bottom: 3px;
    margin-bottom: 6px;
  }
</style>
