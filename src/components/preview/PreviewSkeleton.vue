<script setup lang="ts">
  // Loading placeholder rendered in place of <CVPreview /> while a logged-in
  // user's cloud CV is still loading (empty store + load in flight). It mirrors
  // the A4 paper frame (794 × 1122px, white sheet, same shadow) so the swap to
  // the real preview is seamless — no size jump, no flash. Purely decorative.
</script>

<template>
  <div
    aria-hidden="true"
    class="cv-skeleton"
    style="
      width: 794px;
      min-height: 1122px;
      background: #ffffff;
      box-sizing: border-box;
      padding: 48px 56px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.55),
        0 2px 8px rgba(0, 0, 0, 0.35);
    "
  >
    <!-- Header block -->
    <div class="sk-line" style="width: 52%; height: 34px; margin-bottom: 14px" />
    <div class="sk-line" style="width: 34%; height: 18px; margin-bottom: 10px" />
    <div class="sk-line" style="width: 68%; height: 12px; margin-bottom: 40px" />

    <!-- Section blocks -->
    <template v-for="s in 4" :key="s">
      <div class="sk-line" style="width: 24%; height: 14px; margin-bottom: 16px" />
      <div class="sk-line" style="width: 100%; height: 11px; margin-bottom: 8px" />
      <div class="sk-line" style="width: 92%; height: 11px; margin-bottom: 8px" />
      <div class="sk-line" style="width: 96%; height: 11px; margin-bottom: 8px" />
      <div class="sk-line" style="width: 60%; height: 11px; margin-bottom: 34px" />
    </template>
  </div>
</template>

<style scoped>
  .sk-line {
    border-radius: 4px;
    background: linear-gradient(90deg, #eceef1 25%, #f5f6f8 37%, #eceef1 63%);
    background-size: 400% 100%;
    animation: sk-shimmer 1.4s ease infinite;
  }

  @keyframes sk-shimmer {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: 0 0;
    }
  }

  /* Respect users who prefer no motion — hold a static tint instead. */
  @media (prefers-reduced-motion: reduce) {
    .sk-line {
      animation: none;
    }
  }
</style>
