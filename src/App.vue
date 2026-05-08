<script setup lang="ts">
  import { RouterView } from 'vue-router'
  import ThemeToggle from '@/components/ui/ThemeToggle.vue'
</script>

<template>
  <RouterView />
  <div class="fixed bottom-5 right-5 z-[60]">
    <ThemeToggle />
  </div>
</template>
