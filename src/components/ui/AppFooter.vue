<script setup lang="ts">
  import { RouterLink } from 'vue-router'
</script>

<template>
  <footer
    class="border-t border-white/5 py-8 px-6"
    style="background: var(--bg-surface)"
  >
    <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2 group" aria-label="CV Generate home">
        <div class="w-6 h-6 rounded bg-accent flex items-center justify-center text-white text-xs font-bold group-hover:opacity-80 transition-opacity">
          CV
        </div>
        <span class="text-sm font-semibold text-secondary group-hover:text-primary transition-colors">CV Generate</span>
      </RouterLink>

      <!-- Nav -->
      <nav class="flex items-center gap-5 text-xs text-secondary" aria-label="Footer navigation">
        <RouterLink to="/builder" class="hover:text-primary transition-colors">Builder</RouterLink>
        <RouterLink to="/pricing" class="hover:text-primary transition-colors">Pricing</RouterLink>
        <a
          href="https://github.com/mnumanmercan/CV-generate"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary transition-colors"
        >
          GitHub
        </a>
      </nav>

      <!-- Copyright -->
      <p class="text-xs text-secondary/60">
        © {{ new Date().getFullYear() }} CV Generate
      </p>
    </div>
  </footer>
</template>
