<script setup lang="ts">
  import { RouterLink } from 'vue-router'
</script>

<!--
  Editorial footer — paper bg, mono uppercase links, sienna-dot wordmark.
  Single thin top rule. Three-column on desktop, stacks on mobile.
-->
<template>
  <footer
    class="border-t border-overlay/8 py-7 px-6"
    style="background: var(--paper)"
  >
    <div
      class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <!-- Wordmark -->
      <RouterLink
        to="/"
        class="flex items-center gap-2 group"
        aria-label="Resumark home"
      >
        <span
          class="w-1.5 h-1.5 rounded-full shrink-0"
          :style="{ background: 'var(--accent)' }"
          aria-hidden="true"
        />
        <span class="font-display text-[18px] leading-none tracking-editorial text-ink group-hover:text-accent transition-colors">
          Resumark
        </span>
      </RouterLink>

      <!-- Editorial nav -->
      <nav
        class="flex items-center gap-5 flex-wrap justify-center"
        aria-label="Footer navigation"
      >
        <RouterLink
          to="/pricing"
          class="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors"
        >
          Pricing
        </RouterLink>
        <RouterLink
          to="/builder"
          class="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors"
        >
          Builder
        </RouterLink>
        <a
          href="https://github.com/mnumanmercan/CV-generate"
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors"
        >
          GitHub
        </a>
      </nav>

      <!-- Copyright + voice -->
      <p class="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted">
        © {{ new Date().getFullYear() }} · Resumark · Made for résumés
      </p>
    </div>
  </footer>
</template>
