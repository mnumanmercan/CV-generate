<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import { useI18n } from '@/composables/useI18n'
  import BrandLogo from '@/components/ui/BrandLogo.vue'

  const { t } = useI18n()
</script>

<!--
  Editorial footer — paper bg, mono uppercase links, sienna-dot wordmark.
  Single thin top rule. Three-column on desktop, stacks on mobile.
-->
<template>
  <footer class="border-t border-overlay/8 py-7 px-6" style="background: var(--paper)">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <!-- Wordmark -->
      <BrandLogo size="sm" />

      <!-- Editorial nav -->
      <nav
        class="flex items-center gap-5 flex-wrap justify-center"
        :aria-label="t('aria.footerNav')"
      >
        <RouterLink
          to="/pricing"
          class="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors"
        >
          {{ t('footer.pricing') }}
        </RouterLink>
        <RouterLink
          to="/builder"
          class="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors"
        >
          {{ t('footer.builder') }}
        </RouterLink>
        <a
          href="https://github.com/mnumanmercan/CV-generate"
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors"
        >
          {{ t('footer.github') }}
        </a>
      </nav>

      <!-- Copyright + voice -->
      <p class="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted">
        {{ t('footer.copyright', { year: String(new Date().getFullYear()) }) }}
      </p>
    </div>
  </footer>
</template>
