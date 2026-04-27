<script setup lang="ts">
  defineProps<{
    quote:   string
    name:    string
    role:    string
    outcome: string
    when:    string
  }>()
</script>

<!--
  Italic-serif testimonial card. The quote dominates; the outcome is a sienna
  one-liner separated by a hairline rule. No stars, no avatars — the voice
  carries the weight.
-->
<template>
  <figure class="paper-card p-7 flex flex-col">
    <p class="font-display italic text-[24px] md:text-[26px] leading-[1.4] text-ink2 tracking-editorial mb-7">
      &ldquo;{{ quote }}&rdquo;
    </p>
    <figcaption class="mt-auto">
      <p class="text-[14px] font-medium text-ink leading-tight">{{ name }}</p>
      <p class="text-[13px] text-muted leading-tight mt-0.5">{{ role }}</p>

      <div class="mt-5 pt-4 border-t border-overlay/8 flex items-center justify-between gap-3">
        <span
          class="text-[12.5px] font-medium leading-tight"
          :style="{ color:'var(--accent)' }"
        >{{ outcome }}</span>
        <span class="mono-eyebrow text-[10px] shrink-0">{{ when }}</span>
      </div>
    </figcaption>
  </figure>
</template>
