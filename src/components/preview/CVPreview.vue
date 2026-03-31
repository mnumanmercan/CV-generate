<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { getTemplate } from '@/components/templates/registry'
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

  const activeTemplate = computed(() => getTemplate(cvData.value.meta.templateId))
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
    - PDF margin is 0 — internal padding is set per template.
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
      box-sizing: border-box;
      box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35);
    "
  >
    <component
      :is="activeTemplate.component"
      :cv-data="cvData"
      :is-pulsed="isPulsed"
    />
  </article>
</template>
