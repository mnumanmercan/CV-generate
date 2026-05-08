<script setup lang="ts">
  import { useThemeStore } from '@/stores/themeStore'
  import { useI18n } from '@/composables/useI18n'

  const themeStore = useThemeStore()
  const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="themeStore.isDark ? t('aria.switchToLight') : t('aria.switchToDark')"
    :title="themeStore.isDark ? t('aria.switchToLight') : t('aria.switchToDark')"
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
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  background: var(--card);
  color: var(--muted);
  cursor: pointer;
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--ink) 6%, transparent),
    0 4px 14px color-mix(in srgb, var(--ink) 10%, transparent);
  transition:
    background 280ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 280ms cubic-bezier(0.4, 0, 0.2, 1),
    color 280ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 280ms cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-toggle:hover {
  border-color: color-mix(in srgb, var(--ink) 28%, transparent);
  color: var(--ink);
  transform: translateY(-1px);
  box-shadow:
    0 2px 4px color-mix(in srgb, var(--ink) 8%, transparent),
    0 8px 22px color-mix(in srgb, var(--ink) 14%, transparent);
}

.theme-toggle:active {
  transform: translateY(0);
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--ink) 6%, transparent),
    0 3px 10px color-mix(in srgb, var(--ink) 8%, transparent);
}

.theme-icon {
  position: absolute;
  width: 19px;
  height: 19px;
  transition:
    opacity 300ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
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
