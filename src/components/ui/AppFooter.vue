<script setup lang="ts">
  import { RouterLink } from 'vue-router'
</script>

<template>
  <footer
    class="border-t border-overlay/5 py-8 px-6"
    style="background: var(--bg-surface)"
  >
    <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2 group" aria-label="Resumark home">
        <div class="w-6 h-6 shrink-0 group-hover:opacity-80 transition-opacity">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <defs>
              <linearGradient id="ft-gem" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#06B6D4"/>
                <stop offset="50%" stop-color="#0891B2"/>
                <stop offset="100%" stop-color="#0D9488"/>
              </linearGradient>
            </defs>
            <path d="M8 4 H24 L30 14 L16 30 L2 14 Z" fill="url(#ft-gem)"/>
            <path d="M8 4 L16 14 L24 4" stroke="rgba(255,255,255,0.18)" stroke-width="0.75" fill="none"/>
            <line x1="2" y1="14" x2="30" y2="14" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
            <circle cx="21" cy="8" r="1.8" fill="white" opacity="0.5"/>
          </svg>
        </div>
        <span class="text-sm font-semibold text-secondary group-hover:text-primary transition-colors">Resumark</span>
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
        © {{ new Date().getFullYear() }} Resumark
      </p>
    </div>
  </footer>
</template>
