<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    message: string
    type?: 'success' | 'error' | 'info'
    visible: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'success',
  })

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'i',
  }

  const colorMap = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-accent/20 border-accent/30 text-accent',
  }

  const icon = computed(() => iconMap[props.type])
  const colors = computed(() => colorMap[props.type])
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-2 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-2 scale-95"
  >
    <div
      v-if="visible"
      :class="['fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl', colors]"
      role="alert"
      aria-live="polite"
    >
      <span
        class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border"
        :class="colors"
        aria-hidden="true"
      >
        {{ icon }}
      </span>
      {{ message }}
    </div>
  </Transition>
</template>
