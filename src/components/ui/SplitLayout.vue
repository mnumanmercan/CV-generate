<script setup lang="ts">
  import { ref } from 'vue'

  // Mobile: toggle between form and preview
  const mobileTab = ref<'form' | 'preview'>('form')
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Mobile tab switcher -->
    <div
      class="md:hidden flex border-b border-white/10 sticky top-0 z-10"
      style="background: var(--bg-shell)"
      role="tablist"
      aria-label="Toggle form or preview"
    >
      <button
        role="tab"
        :aria-selected="mobileTab === 'form'"
        :class="[
          'flex-1 py-3 text-sm font-medium transition-colors',
          mobileTab === 'form'
            ? 'text-accent border-b-2 border-accent'
            : 'text-secondary hover:text-primary',
        ]"
        @click="mobileTab = 'form'"
      >
        Form
      </button>
      <button
        role="tab"
        :aria-selected="mobileTab === 'preview'"
        :class="[
          'flex-1 py-3 text-sm font-medium transition-colors',
          mobileTab === 'preview'
            ? 'text-accent border-b-2 border-accent'
            : 'text-secondary hover:text-primary',
        ]"
        @click="mobileTab = 'preview'"
      >
        Preview
      </button>
    </div>

    <!-- Desktop: side-by-side panels -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left panel: Form (45%) -->
      <section
        :class="[
          'flex-none overflow-y-auto transition-all duration-300',
          // Desktop: always visible
          'md:block md:w-[45%]',
          // Mobile: conditional
          mobileTab === 'form' ? 'block w-full' : 'hidden',
        ]"
        style="background: var(--bg-surface); border-right: 1px solid rgba(255,255,255,0.05)"
        aria-label="CV form"
      >
        <slot name="form" />
      </section>

      <!-- Right panel: Preview (55%) -->
      <section
        :class="[
          'flex-1 overflow-y-auto transition-all duration-300',
          // Mobile: conditional
          mobileTab === 'preview' ? 'block' : 'hidden md:block',
        ]"
        style="background: var(--bg-shell)"
        aria-label="CV preview"
      >
        <slot name="preview" />
      </section>
    </div>
  </div>
</template>
