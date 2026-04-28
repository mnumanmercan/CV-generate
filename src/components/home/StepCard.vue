<script setup lang="ts">
  defineProps<{
    eyebrow:     string
    numeral:     string
    title:       string
    description: string
  }>()
</script>

<!--
  One column in the "Three steps. No blank page." section. Huge sienna
  serif numeral above an editorial heading + lede. Numeral scales with
  viewport so it stays legible from 320px → 1440px without overflowing.
-->
<template>
  <div class="flex flex-col">
    <p class="mono-eyebrow mb-4">{{ eyebrow }}</p>

    <div
      class="font-display leading-[0.85] mb-7"
      :style="{ color:'var(--accent)', fontSize:'clamp(72px, 9vw, 132px)', letterSpacing:'-0.04em' }"
    >
      {{ numeral }}
    </div>

    <h3 class="font-display text-[26px] leading-tight tracking-editorial text-ink mb-3">
      {{ title }}
    </h3>
    <p class="text-[15px] leading-[1.55] text-muted">
      {{ description }}
    </p>
  </div>
</template>
