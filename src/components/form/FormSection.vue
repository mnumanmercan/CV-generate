<!-- Reusable accordion-style collapsible section wrapper -->
<script setup lang="ts">
  import { ref } from 'vue'

  interface Props {
    title: string
    icon?: string
    defaultOpen?: boolean
    completed?: boolean
    stepIndex?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    defaultOpen: false,
    completed: false,
    stepIndex: 0,
  })

  const isOpen = ref(props.defaultOpen)

  function toggle(): void {
    isOpen.value = !isOpen.value
  }
</script>

<template>
  <div
    class="border border-overlay/5 rounded-xl overflow-hidden mb-3 stagger-item"
    :style="{ animationDelay: `${stepIndex * 60}ms` }"
  >
    <!-- Section header / toggle -->
    <button
      type="button"
      class="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-overlay/5 transition-colors group"
      :aria-expanded="isOpen"
      :aria-controls="`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`"
      @click="toggle"
    >
      <div class="flex items-center gap-3">
        <!-- Step indicator -->
        <div
          :class="[
            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all',
            completed
              ? 'bg-emerald-500 text-white'
              : isOpen
                ? 'bg-accent text-white'
                : 'bg-overlay/10 text-secondary',
          ]"
          aria-hidden="true"
        >
          <span v-if="completed">✓</span>
          <span v-else>{{ stepIndex + 1 }}</span>
        </div>

        <!-- Icon + Title -->
        <span v-if="icon" class="text-base" aria-hidden="true">{{ icon }}</span>
        <span
          :class="[
            'text-sm font-semibold transition-colors',
            isOpen ? 'text-primary' : 'text-secondary group-hover:text-primary',
          ]"
        >
          {{ title }}
        </span>
      </div>

      <!-- Chevron -->
      <svg
        :class="['w-4 h-4 text-secondary transition-transform duration-200', isOpen ? 'rotate-180' : '']"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Section content -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-[2000px]"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 max-h-[2000px]"
      leave-to-class="opacity-0 max-h-0"
    >
      <div
        v-show="isOpen"
        :id="`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`"
        class="px-4 pb-4 pt-1"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>
