<script setup lang="ts">
  import { RouterView, useRoute } from 'vue-router'
  import ThemeToggle from '@/components/ui/ThemeToggle.vue'

  const route = useRoute()
</script>

<template>
  <RouterView />
  <ThemeToggle :bottom-offset="route.name === 'builder' ? 60 : 20" />
</template>
