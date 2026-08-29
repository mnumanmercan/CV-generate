<script setup lang="ts">
  import { RouterView } from 'vue-router'
  import ThemeToggle from '@/components/ui/ThemeToggle.vue'
  import { useDocumentTitle } from '@/composables/useDocumentTitle'

  // Mounted once here so the tab title tracks both the route and the locale.
  useDocumentTitle()
</script>

<template>
  <RouterView />
  <div class="fixed bottom-5 right-5 z-[60]">
    <ThemeToggle />
  </div>
</template>
