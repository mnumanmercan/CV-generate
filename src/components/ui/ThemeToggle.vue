<script setup lang="ts">
  import { useThemeStore } from '@/stores/themeStore'

  const props = withDefaults(defineProps<{ bottomOffset?: number }>(), { bottomOffset: 20 })
  const themeStore = useThemeStore()
</script>

<template>
  <button
    type="button"
    class="fixed right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    :style="{
      bottom: `${props.bottomOffset}px`,
      background: 'var(--bg-surface)',
      border: '1px solid rgb(var(--overlay-rgb) / 0.12)',
      boxShadow: '0 4px 16px rgb(var(--overlay-rgb) / 0.10), 0 1px 4px rgb(var(--overlay-rgb) / 0.08)',
    }"
    :aria-label="themeStore.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    :title="themeStore.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    @click="themeStore.toggleTheme()"
  >
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 rotate-90 scale-50"
      enter-to-class="opacity-100 rotate-0 scale-100"
      leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100 rotate-0 scale-100"
      leave-to-class="opacity-0 -rotate-90 scale-50"
      mode="out-in"
    >
      <!-- Sun: shown in dark mode → click to go light -->
      <svg
        v-if="themeStore.isDark"
        key="sun"
        class="w-5 h-5 text-secondary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path stroke-linecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>

      <!-- Moon: shown in light mode → click to go dark -->
      <svg
        v-else
        key="moon"
        class="w-5 h-5 text-secondary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </Transition>
  </button>
</template>
