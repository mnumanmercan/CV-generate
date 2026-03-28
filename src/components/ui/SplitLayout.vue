<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'

  /* ── Mobile tab ───────────────────────────────────────────────────────── */
  const mobileTab = ref<'form' | 'preview'>('form')

  /* ── Responsive breakpoint tracking ─────────────────────────────────── */
  // We need to know whether we're on desktop so we can skip applying the
  // inline width on mobile (where panels are tab-switched, not side-by-side).
  const isDesktop = ref(false)
  let mq: MediaQueryList | null = null

  function onMqChange(e: MediaQueryListEvent): void {
    isDesktop.value = e.matches
  }

  /* ── Resizable split ──────────────────────────────────────────────────── */
  const DEFAULT_PCT = 42   // form panel default width %
  const MIN_PCT     = 20   // narrowest the form panel can go
  const MAX_PCT     = 72   // widest the form panel can go

  const formPct      = ref(DEFAULT_PCT)
  const containerRef = ref<HTMLElement | null>(null)
  const isDragging   = ref(false)

  function applyX(clientX: number): void {
    if (!containerRef.value) return
    const { left, width } = containerRef.value.getBoundingClientRect()
    formPct.value = Math.min(MAX_PCT, Math.max(MIN_PCT, ((clientX - left) / width) * 100))
  }

  function onMouseMove(e: MouseEvent): void { applyX(e.clientX) }

  function onTouchMove(e: TouchEvent): void {
    e.preventDefault()
    applyX(e.touches[0].clientX)
  }

  function stopDrag(): void {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup',   stopDrag)
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend',  stopDrag)
  }

  function onHandleMouseDown(e: MouseEvent): void {
    e.preventDefault()
    isDragging.value = true
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   stopDrag)
  }

  function onHandleTouchStart(e: TouchEvent): void {
    e.preventDefault()
    isDragging.value = true
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend',  stopDrag)
  }

  /* ── Lifecycle ────────────────────────────────────────────────────────── */
  onMounted(() => {
    mq = window.matchMedia('(min-width: 768px)')
    isDesktop.value = mq.matches
    mq.addEventListener('change', onMqChange)
  })

  onUnmounted(() => {
    mq?.removeEventListener('change', onMqChange)
    stopDrag()
  })
</script>

<template>
  <div class="flex flex-col h-full">

    <!-- ── Mobile tab bar ─────────────────────────────────────────────── -->
    <div
      class="md:hidden flex border-b border-overlay/10 sticky top-0 z-10"
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

    <!-- ── Panel row ──────────────────────────────────────────────────── -->
    <!--
      Single element used for both mobile and desktop to keep form components
      mounted at all times (unmounting would lose local field state).
      On desktop we apply inline widths; on mobile the panels are
      shown/hidden via class and the inline width is omitted (isDesktop guard).
    -->
    <div
      ref="containerRef"
      class="flex flex-1 overflow-hidden"
      :style="isDragging ? 'cursor: col-resize; user-select: none' : ''"
    >
      <!-- Form panel -->
      <section
        :class="[
          'overflow-y-auto transition-none',
          // Mobile visibility
          mobileTab === 'form' ? 'block' : 'hidden md:block',
          // Desktop sizing: flex-none so it respects the explicit width
          'md:flex-none',
        ]"
        :style="isDesktop ? {
          width: `${formPct}%`,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--drag-center-line)',
        } : {
          width: '100%',
          background: 'var(--bg-surface)',
        }"
        aria-label="CV form"
      >
        <slot name="form" />
      </section>

      <!-- ── Drag handle (desktop only) ──────────────────────────────── -->
      <div
        class="hidden md:flex relative flex-none w-[7px] z-20 items-center justify-center cursor-col-resize"
        :style="{
          background: isDragging
            ? 'rgba(8,145,178,0.18)'
            : 'var(--drag-handle-bg)',
          transition: 'background 0.15s',
        }"
        aria-hidden="true"
        @mousedown="onHandleMouseDown"
        @touchstart.prevent="onHandleTouchStart"
      >
        <!-- Vertical centre-line -->
        <div
          class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px pointer-events-none"
          :style="{
            background: isDragging ? 'rgba(8,145,178,0.55)' : 'var(--drag-center-line)',
            transition: 'background 0.15s',
          }"
        />
        <!-- Grip dots -->
        <div
          class="relative flex flex-col gap-[4px] pointer-events-none"
          :style="{
            opacity: isDragging ? '1' : '0.35',
            transition: 'opacity 0.15s',
          }"
        >
          <span
            v-for="i in 5"
            :key="i"
            class="w-[3px] h-[3px] rounded-full"
            :style="{ background: isDragging ? '#0891B2' : '#94A3B8' }"
          />
        </div>
        <!-- Hover overlay (CSS group-hover alternative) -->
        <div class="absolute inset-0 opacity-0 hover:opacity-100 pointer-events-none"
          style="background: rgba(8,145,178,0.08); transition: opacity 0.15s"
        />
      </div>

      <!-- Preview panel -->
      <section
        :class="[
          'min-w-0 overflow-y-auto',
          mobileTab === 'preview' ? 'block' : 'hidden md:block',
          'md:flex-1',
        ]"
        :style="isDesktop
          ? { background: 'var(--bg-shell)' }
          : { width: '100%', background: 'var(--bg-shell)' }"
        aria-label="CV preview"
      >
        <slot name="preview" />
      </section>
    </div>

  </div>
</template>
