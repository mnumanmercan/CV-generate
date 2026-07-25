<script setup lang="ts">
  // Loading placeholder rendered over <CoverLetterPreview /> while a logged-in
  // user's cloud letter is still loading (empty store + load in flight). It
  // mirrors the A4 letter frame (794 × 1122px, white sheet, same padding +
  // shadow) so the swap to the real letter is seamless. Purely decorative.
</script>

<template>
  <div
    aria-hidden="true"
    class="cl-skeleton"
    style="
      width: 794px;
      min-height: 1122px;
      background: #ffffff;
      box-sizing: border-box;
      padding: 56px 64px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.55),
        0 2px 8px rgba(0, 0, 0, 0.35);
    "
  >
    <!-- Sender header -->
    <div style="padding-bottom: 20px; margin-bottom: 32px; border-bottom: 2px solid #eceef1">
      <div class="sk-line" style="width: 38%; height: 26px; margin-bottom: 10px" />
      <div class="sk-line" style="width: 24%; height: 13px; margin-bottom: 10px" />
      <div class="sk-line" style="width: 52%; height: 11px" />
    </div>

    <!-- Date (right-aligned) -->
    <div class="sk-line" style="width: 22%; height: 12px; margin: 0 0 24px auto" />

    <!-- Recipient block -->
    <div style="margin-bottom: 28px">
      <div class="sk-line" style="width: 30%; height: 12px; margin-bottom: 6px" />
      <div class="sk-line" style="width: 24%; height: 12px; margin-bottom: 6px" />
      <div class="sk-line" style="width: 40%; height: 12px" />
    </div>

    <!-- Salutation -->
    <div class="sk-line" style="width: 26%; height: 13px; margin-bottom: 20px" />

    <!-- Body paragraphs -->
    <template v-for="p in 4" :key="p">
      <div class="sk-line" style="width: 100%; height: 11px; margin-bottom: 8px" />
      <div class="sk-line" style="width: 97%; height: 11px; margin-bottom: 8px" />
      <div class="sk-line" style="width: 99%; height: 11px; margin-bottom: 8px" />
      <div class="sk-line" style="width: 64%; height: 11px; margin-bottom: 22px" />
    </template>

    <!-- Signature -->
    <div class="sk-line" style="width: 18%; height: 12px; margin: 26px 0 14px" />
    <div class="sk-line" style="width: 28%; height: 13px" />
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
