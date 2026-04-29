<script setup lang="ts">
  import { onMounted } from 'vue'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import AppFooter from '@/components/ui/AppFooter.vue'

  onMounted(() => {
    document.title = 'Teams — Resumark'
  })
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <AppHeader />

    <main class="flex-1 flex flex-col justify-center px-6 py-24 max-w-3xl mx-auto w-full">

      <div class="flex items-center gap-2.5 mb-8">
        <span class="w-1.5 h-1.5 rounded-full" :style="{ background: 'var(--accent)' }" aria-hidden="true" />
        <span class="mono-eyebrow">For Teams</span>
      </div>

      <h1
        class="font-display leading-[1.02] tracking-editorial text-ink mb-8"
        :style="{ fontSize: 'clamp(40px, 6vw, 72px)' }"
      >
        Built for one.<br />
        <span class="accent-italic">Scalable</span><span> for many.</span>
      </h1>

      <p class="text-[18px] leading-[1.6] text-muted max-w-xl mb-4">
        Whether you run a recruiting firm, a career centre, or a team of hiring
        managers — Resumark's team tier gives everyone the same ATS-safe builder
        under a single account with centralised billing.
      </p>

      <p class="text-[18px] leading-[1.6] text-muted max-w-xl mb-12">
        Team accounts are not self-serve yet. Send us a note and we will set
        you up directly.
      </p>

      <a
        href="mailto:hello@resumark.app"
        class="btn-primary self-start text-base"
      >
        Get in touch
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>

    </main>

    <AppFooter />
  </div>
</template>
