<script setup lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg'
    color?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 'md',
    color: 'white',
  })

  const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' }
</script>

<template>
  <span
    :class="['inline-block rounded-full border-2 border-transparent animate-spin', sizeMap[props.size]]"
    :style="`border-top-color: ${color}; border-right-color: ${color}40`"
    role="status"
    aria-label="Loading"
  />
</template>
