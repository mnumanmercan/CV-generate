<script setup lang="ts">
  import { computed } from 'vue'
  import {
    MARK_BODY_ROWS,
    MARK_DOT,
    MARK_DOT_DIAMETER,
    MARK_OVERHANG,
    MARK_RULE,
    MARK_VIEWBOX,
  } from './brandMark.geometry'

  const props = withDefaults(
    defineProps<{
      /** Dot diameter in px — the mark scales off this so it can stand in for
       *  the bare sienna dot it replaces at any size. */
      dot?: number
      /** When false the mark is drawn statically, with no rest/hover states. */
      animated?: boolean
    }>(),
    { dot: MARK_DOT_DIAMETER, animated: true },
  )

  const scale = computed(() => props.dot / MARK_DOT_DIAMETER)

  /* At rest only the dot is painted, so the rows' overhang is pulled back with
     a negative margin — the lockup then measures exactly `dot` px wide and the
     resting logo is pixel-identical to the plain dot. */
  const style = computed(() => ({
    width: `${MARK_VIEWBOX.width * scale.value}px`,
    height: `${MARK_VIEWBOX.height * scale.value}px`,
    marginRight: props.animated ? `${-MARK_OVERHANG * scale.value}px` : '0px',
  }))
</script>

<!--
  The brand mark. Geometry (and the reasoning behind it) lives in
  brandMark.geometry.ts; motion lives in main.css under `.brand-*`.
-->
<template>
  <svg
    class="brand-mark"
    :class="{ 'brand-mark--animated': animated }"
    :viewBox="`0 0 ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`"
    :style="style"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <g class="bm-dot">
      <circle :cx="MARK_DOT.cx" :cy="MARK_DOT.cy" :r="MARK_DOT.r" />
    </g>
    <rect
      class="bm-rule"
      :x="MARK_RULE.x"
      :y="MARK_RULE.y"
      :width="MARK_RULE.width"
      :height="MARK_RULE.height"
      :rx="MARK_RULE.rx"
    />
    <rect
      v-for="(row, i) in MARK_BODY_ROWS"
      :key="i"
      class="bm-line"
      :class="`bm-line--${i + 1}`"
      :x="row.x"
      :y="row.y"
      :width="row.width"
      :height="row.height"
      :rx="row.rx"
    />
  </svg>
</template>
