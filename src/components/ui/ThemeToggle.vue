<script setup lang="ts">
  import { useThemeStore } from '@/stores/themeStore'

  const themeStore = useThemeStore()
</script>

<!--
  Inline header pill — `[●  LIGHT]` / `[●  DARK]` with a small sienna dot
  + uppercase mono label. Lives inside AppHeader's right cluster (no fixed
  positioning). Click toggles the same store action as before.
-->
<template>
  <button
    type="button"
    class="inline-flex items-center gap-2 px-3 py-[7px] rounded-full border border-overlay/10 hover:border-overlay/25 transition-colors"
    style="background: var(--card)"
    :aria-label="themeStore.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    :title="themeStore.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    @click="themeStore.toggleTheme()"
  >
    <span
      class="w-1.5 h-1.5 rounded-full transition-transform"
      :style="{ background: 'var(--accent)' }"
      aria-hidden="true"
    />
    <span class="font-mono text-[10.5px] tracking-[0.16em] uppercase font-medium text-ink leading-none">
      {{ themeStore.isDark ? 'Dark' : 'Light' }}
    </span>
  </button>
</template>
