<script setup lang="ts">
  import { onMounted, onUnmounted } from 'vue'

  const props = withDefaults(
    defineProps<{
      visible: boolean
      title?: string
      message: string
      confirmLabel?: string
      cancelLabel?: string
    }>(),
    {
      title: 'Are you sure?',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
    },
  )

  const emit = defineEmits<{
    confirm: []
    cancel: []
  }>()

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && props.visible) emit('cancel')
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'confirm-title' : undefined"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="emit('cancel')"
        />

        <!-- Dialog -->
        <div
          class="relative w-full max-w-sm rounded-2xl border border-overlay/10 p-6 shadow-2xl"
          style="background: var(--bg-surface)"
        >
          <h3
            id="confirm-title"
            class="text-base font-semibold text-primary mb-2"
          >
            {{ title }}
          </h3>
          <p class="text-sm text-secondary mb-6">{{ message }}</p>

          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary hover:bg-overlay/5 transition-colors"
              @click="emit('cancel')"
            >
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
              @click="emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
