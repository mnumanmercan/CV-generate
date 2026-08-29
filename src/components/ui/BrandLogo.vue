<script setup lang="ts">
  import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
  import { RouterLink } from 'vue-router'
  import { useI18n } from '@/composables/useI18n'
  import BrandMark from './BrandMark.vue'
  import { MARK_DOT_DIAMETER, MARK_OVERHANG } from './brandMark.geometry'

  const props = withDefaults(
    defineProps<{
      to?: string
      size?: 'sm' | 'md' | 'lg'
      /** Header/footer/auth get the hover reveal; the drawer's copy is static. */
      animated?: boolean
    }>(),
    { to: '/', size: 'md', animated: true },
  )

  const emit = defineEmits<{ click: [] }>()

  const { t } = useI18n()

  /* Dot diameter per size — these match the plain dots these lockups replaced
     (w-1.5 in the footer, w-2 everywhere else), so nothing shifts at rest. */
  const SIZES = {
    sm: { dot: 6, gap: 8, text: 'text-[18px]' },
    md: { dot: MARK_DOT_DIAMETER, gap: 10, text: 'text-[20px] md:text-[26px]' },
    lg: { dot: MARK_DOT_DIAMETER, gap: 10, text: 'text-[24px]' },
  } as const

  const variant = computed(() => SIZES[props.size])

  const rootStyle = computed(() => ({
    gap: `${variant.value.gap}px`,
    /* How far the wordmark slides to uncover the rows — transform only. */
    '--bm-shift': `${(MARK_OVERHANG * variant.value.dot) / MARK_DOT_DIAMETER}px`,
  }))

  /* Touch devices never hover, so the reveal would be undiscoverable there.
     Play it once on mount instead, then settle back to the resting dot. */
  const intro = ref(false)
  let introTimer: ReturnType<typeof setTimeout> | undefined

  onMounted(() => {
    if (!props.animated) return
    if (typeof window === 'undefined' || !window.matchMedia) return
    if (!window.matchMedia('(hover: none)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    intro.value = true
    introTimer = setTimeout(() => (intro.value = false), 1400)
  })

  onBeforeUnmount(() => clearTimeout(introTimer))
</script>

<!--
  The Resumark lockup: brand mark + wordmark. Single source for all five places
  the logo appears — header, footer, drawer, login, register.
-->
<template>
  <RouterLink
    :to="to"
    class="brand-logo flex items-center w-fit"
    :class="{ 'brand-logo--intro': intro }"
    :style="rootStyle"
    :aria-label="t('aria.resumeHome')"
    @click="emit('click')"
  >
    <BrandMark :dot="variant.dot" :animated="animated" />
    <span
      class="brand-wordmark font-display leading-none tracking-editorial text-ink"
      :class="variant.text"
    >
      Resumark
    </span>
  </RouterLink>
</template>
