<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import AppFooter from '@/components/ui/AppFooter.vue'
  import { useI18n } from '@/composables/useI18n'

  const { t, t_obj } = useI18n()
  const teamsHeading = computed(() => t_obj<{ prefix: string; accent: string; suffix: string }>('teams.heading'))

  onMounted(() => {
    document.title = 'Teams — Resumark'
  })
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <AppHeader />

    <main class="flex-1 flex flex-col justify-center px-4 sm:px-6 py-16 sm:py-24 max-w-3xl mx-auto w-full">

      <div class="flex items-center gap-2.5 mb-6 sm:mb-8">
        <span class="w-1.5 h-1.5 rounded-full" :style="{ background: 'var(--accent)' }" aria-hidden="true" />
        <span class="mono-eyebrow">{{ t('teams.eyebrow') }}</span>
      </div>

      <h1
        class="font-display leading-[1.02] tracking-editorial text-ink mb-6 sm:mb-8"
        :style="{ fontSize: 'clamp(32px, 6vw, 72px)' }"
      >
        {{ teamsHeading.prefix }}<span class="accent-italic">{{ teamsHeading.accent }}</span>{{ teamsHeading.suffix }}
      </h1>

      <p class="text-base sm:text-[18px] leading-[1.6] text-muted max-w-xl mb-4">
        {{ t('teams.desc1') }}
      </p>

      <p class="text-base sm:text-[18px] leading-[1.6] text-muted max-w-xl mb-10 sm:mb-12">
        {{ t('teams.desc2') }}
      </p>

      <a
        href="mailto:hello@resumark.app"
        class="btn-primary self-start text-base"
      >
        {{ t('teams.cta') }}
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>

    </main>

    <AppFooter />
  </div>
</template>
