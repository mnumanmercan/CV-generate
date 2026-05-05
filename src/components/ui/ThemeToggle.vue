<script setup lang="ts">
  import { useThemeStore } from '@/stores/themeStore'

  const themeStore = useThemeStore()
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="themeStore.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    :title="themeStore.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    @click="themeStore.toggleTheme()"
  >
    <!-- Sun icon (light mode) -->
    <svg
      class="theme-icon"
      :class="{ 'icon-visible': !themeStore.isDark, 'icon-hidden': themeStore.isDark }"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </svg>

    <!-- Moon icon (dark mode) -->
    <svg
      class="theme-icon"
      :class="{ 'icon-visible': themeStore.isDark, 'icon-hidden': !themeStore.isDark }"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  background: var(--card);
  color: var(--muted);
  cursor: pointer;
  transition:
    background 200ms ease,
    border-color 200ms ease,
    color 200ms ease,
    box-shadow 200ms ease;
}

.theme-toggle:hover {
  border-color: color-mix(in srgb, var(--ink) 28%, transparent);
  color: var(--ink);
  box-shadow: 0 1px 4px color-mix(in srgb, var(--ink) 8%, transparent);
}

.theme-icon {
  position: absolute;
  width: 16px;
  height: 16px;
  transition:
    opacity 250ms ease,
    transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-visible {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.icon-hidden {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
  pointer-events: none;
}
</style>
