<script setup lang="ts">
  import type { StepPhase } from '@/composables/useStepSequence'

  defineProps<{
    eyebrow: string
    numeral: string
    title: string
    description: string
    /** Preview image (placeholder for a short GIF) shown in the hover island. */
    media?: string
    /** Draw the flow connector toward the next step (false on the last step). */
    showConnector?: boolean
    /** Play the export/download animation (the final step's outcome). */
    showDownload?: boolean
    /** Current beat of the shared sequence; drives which animation plays. */
    phase?: StepPhase
  }>()
</script>

<!--
  One column in the "Just two steps" section. Huge sienna serif numeral above
  an editorial heading + lede. A dashed sienna connector flows from the numeral
  toward the next step (desktop), and hovering the card reveals a preview
  "island" pinned to the card's own width.
-->
<template>
  <div
    class="group relative flex flex-col"
    :class="{
      'is-write': phase === 'write',
      'is-download': phase === 'download',
      'is-send': phase === 'send',
    }"
    style="z-index: 9999 !important"
  >
    <p class="mono-eyebrow mb-4">{{ eyebrow }}</p>

    <!-- Numeral + flow connector toward the next step -->
    <div class="relative flex items-center mb-7">
      <div
        class="font-display leading-[0.85] shrink-0"
        :style="{
          color: 'var(--accent)',
          fontSize: 'clamp(72px, 9vw, 132px)',
          letterSpacing: '-0.04em',
        }"
      >
        {{ numeral }}
      </div>

      <div v-if="showConnector" class="step-flow hidden md:flex" aria-hidden="true">
        <span class="step-flow-line"></span>
        <span class="step-flow-comet">
          <i class="step-flow-trail step-flow-trail--3"></i>
          <i class="step-flow-trail step-flow-trail--2"></i>
          <i class="step-flow-trail step-flow-trail--1"></i>
          <i class="step-flow-lead"></i>
        </span>
        <svg class="step-flow-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </div>

      <!-- Export outcome: download icon pops, a fast bar fills, then it sends -->
      <div v-if="showDownload" class="step-download hidden md:flex" aria-hidden="true">
        <svg class="step-dl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.2"
            d="M12 3v11m0 0l-4-4m4 4l4-4M5 20h14"
          />
        </svg>
        <span class="step-dl-bar"><span class="step-dl-bar-fill"></span></span>
        <!-- Once the bar fills, a paper plane flies off — "sent". -->
        <svg class="step-send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 2 11 13" />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M22 2 15 22l-4-9-9-4 20-7z"
          />
        </svg>
      </div>
    </div>

    <h3 class="font-display text-[26px] leading-tight tracking-editorial text-ink mb-3">
      {{ title }}
    </h3>
    <p class="text-[15px] leading-[1.55] text-muted">
      {{ description }}
    </p>

    <!-- Hover preview island — pinned to this card's width, GIF slot inside -->
    <div v-if="media" class="step-preview" aria-hidden="true">
      <div class="step-preview-inner">
        <div class="step-preview-frame max-h-max">
          <img :src="media" alt="" class="step-preview-img w-full" loading="lazy" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* ── Flow connector ─────────────────────────────────────────────── */
  .step-flow {
    position: relative;
    flex: 1 1 auto;
    align-items: center;
    margin-left: 1.25rem;
    color: var(--accent);
  }

  /* One clean line — the "simplicity" of the path from writing to export. */
  .step-flow-line {
    flex: 1 1 auto;
    height: 2px;
    border-radius: 2px;
    background: var(--accent);
    opacity: 0.22;
  }

  .step-flow-arrow {
    width: 18px;
    height: 18px;
    margin-left: 6px;
    flex: none;
  }

  /*
    A bright streak zips fast from this step to the next — the "speed" cue.
    Built from solid dots (a leading head + a fading trail) rather than a
    gradient, so it reads as velocity while staying inside the design system.
  */
  .step-flow-comet {
    position: absolute;
    top: 50%;
    left: 0;
    display: flex;
    align-items: center;
    gap: 3px;
    opacity: 0;
    transform: translateY(-50%);
  }

  /* Plays once when the conductor is on the "write" beat. */
  .is-write .step-flow-comet {
    animation: step-flow-zip 0.9s cubic-bezier(0.45, 0, 0.15, 1) 1 both;
  }

  .step-flow-lead,
  .step-flow-trail {
    flex: none;
    border-radius: 9999px;
    background: var(--accent);
  }

  .step-flow-lead {
    width: 7px;
    height: 7px;
  }
  .step-flow-trail--1 {
    width: 5px;
    height: 5px;
    opacity: 0.55;
  }
  .step-flow-trail--2 {
    width: 4px;
    height: 4px;
    opacity: 0.32;
  }
  .step-flow-trail--3 {
    width: 3px;
    height: 3px;
    opacity: 0.16;
  }

  /* One self-contained dash across the line: appear → travel → fade. */
  @keyframes step-flow-zip {
    0% {
      left: 0;
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    70% {
      left: calc(100% - 26px);
      opacity: 1;
    }
    100% {
      left: calc(100% - 26px);
      opacity: 0;
    }
  }

  /*
    Step 2's outcome. Shares the same 4s cycle as the streak (both start at
    mount, so they stay phase-locked): the download icon pops as the streak
    lands (~22%), a fast bar fills, then a paper plane flies off — "sent" —
    before the next loop. Three beats: download → done → send.
  */
  .step-download {
    position: relative;
    flex: 1 1 auto;
    align-items: center;
    gap: 9px;
    margin-left: 1.25rem;
    color: var(--accent);
  }

  .step-dl-icon {
    flex: none;
    width: 18px;
    height: 18px;
    opacity: 0;
  }

  .step-dl-bar {
    position: relative;
    flex: 1 1 auto;
    height: 4px;
    border-radius: 9999px;
    overflow: hidden;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
  }

  .step-dl-bar-fill {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--accent);
    transform-origin: left center;
    transform: scaleX(0);
  }

  /* Download beat: icon pops and the bar fills, then both clear before send. */
  .is-download .step-dl-icon {
    animation: step-dl-icon 1.2s ease-out 1 both;
  }
  .is-download .step-dl-bar-fill {
    animation: step-dl-fill 1.2s cubic-bezier(0.3, 0, 0.2, 1) 1 both;
  }

  /* Paper plane: rests until the bar fills, then lifts off from just below
     the centre of the bar and fades — "sent". */
  .step-send-icon {
    position: absolute;
    left: 50%;
    top: 50%;
    margin-left: -9px;
    margin-top: 7px;
    width: 18px;
    height: 18px;
    opacity: 0;
  }

  /* Send beat: plays only after the download has fully cleared. */
  .is-send .step-send-icon {
    animation: step-send 1s ease-out 1 both;
  }

  /* Pops in with a small nudge, holds, then fades out by the end of the beat. */
  @keyframes step-dl-icon {
    0% {
      opacity: 0;
      transform: translateY(-3px);
    }
    12% {
      opacity: 1;
      transform: translateY(0);
    }
    18% {
      transform: translateY(2px);
    }
    24% {
      transform: translateY(0);
    }
    80% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  /* Fills to full, holds, then fades — so the bar is gone before "send". */
  @keyframes step-dl-fill {
    0% {
      transform: scaleX(0);
      opacity: 1;
    }
    60% {
      transform: scaleX(1);
      opacity: 1;
    }
    80% {
      transform: scaleX(1);
      opacity: 1;
    }
    100% {
      transform: scaleX(1);
      opacity: 0;
    }
  }

  /* Appears below the centre of where the bar was, lifts up, and fades. */
  @keyframes step-send {
    0% {
      opacity: 0;
      transform: translate(0, 4px) scale(0.85);
    }
    18% {
      opacity: 1;
      transform: translate(0, 0) scale(1);
    }
    45% {
      opacity: 1;
      transform: translate(1px, -3px) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(6px, -16px) scale(0.9);
    }
  }

  /* ── Hover preview island ───────────────────────────────────────── */
  .step-preview {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 1rem;
    z-index: 20;
    opacity: 0;
    transform: translateY(8px);
    pointer-events: none;
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }

  .step-preview-inner {
    padding: 8px;
    border-radius: 16px;
    background: var(--card);
    border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
    box-shadow:
      0 14px 36px rgba(0, 0, 0, 0.16),
      0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .step-preview-frame {
    overflow: hidden;
    border-radius: 10px;
    max-height: max-content !important;
  }

  .step-preview-img {
    display: block;
    width: 100%;
    height: auto;
  }

  /* Reveal only on true hover-capable devices (avoids sticky taps on touch). */
  @media (hover: hover) {
    .group:hover .step-preview,
    .group:focus-within .step-preview {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .step-flow-comet {
      animation: none;
      opacity: 0;
    }
    /* Rest in a completed state rather than animating. */
    .step-dl-icon {
      animation: none;
      opacity: 0.85;
      transform: none;
    }
    .step-dl-bar-fill {
      animation: none;
      transform: scaleX(1);
      opacity: 0.5;
    }
    .step-send-icon {
      animation: none;
      opacity: 0;
    }
    .step-preview {
      transition: opacity 0.2s ease;
      transform: none;
    }
  }
</style>
