<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import AppHeader from '@/components/ui/AppHeader.vue'

  const features = [
    {
      icon: '⚡',
      title: 'Real-Time Preview',
      description: 'See your CV update live as you type — no refresh needed.',
    },
    {
      icon: '✓',
      title: 'ATS Compliant',
      description: 'Single-column, semantic format optimised for Applicant Tracking Systems.',
    },
    {
      icon: '📄',
      title: 'Pixel-Perfect PDF',
      description: 'Download a PDF that is identical to your on-screen preview.',
    },
    {
      icon: '💾',
      title: 'Auto-Save',
      description: 'Your progress is saved to localStorage automatically as you type.',
    },
    {
      icon: '🔑',
      title: 'ATS Keyword Hints',
      description: 'Real-time writing tips to boost your CV\'s keyword relevance.',
    },
    {
      icon: '🖱',
      title: 'Drag & Reorder',
      description: 'Drag sections and entries to reorder them instantly.',
    },
  ]
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-shell)">
    <AppHeader />

    <main class="flex-1 flex flex-col">
      <!-- Hero -->
      <section
        class="flex flex-col items-center justify-center text-center px-6 py-24 md:py-32"
        aria-labelledby="hero-heading"
      >
        <!-- Badge -->
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold mb-6 stagger-item"
        >
          <span aria-hidden="true">✦</span> ATS-Friendly · Free · No Sign-Up Required
        </div>

        <h1
          id="hero-heading"
          class="text-4xl md:text-6xl font-bold text-primary leading-tight max-w-3xl stagger-item"
          style="animation-delay: 60ms"
        >
          Build a
          <span
            class="text-transparent bg-clip-text"
            style="background-image: linear-gradient(135deg, #6366f1, #818cf8)"
          >
            Professional CV
          </span>
          in Minutes
        </h1>

        <p
          class="mt-5 text-secondary text-lg max-w-xl leading-relaxed stagger-item"
          style="animation-delay: 120ms"
        >
          Create an ATS-compliant resume with a live preview and instant PDF download.
          No account required — your data stays private in your browser.
        </p>

        <div
          class="flex flex-col sm:flex-row gap-3 mt-8 stagger-item"
          style="animation-delay: 180ms"
        >
          <RouterLink
            to="/builder"
            class="shimmer-btn px-7 py-3.5 rounded-xl text-white font-semibold text-base transition-all shadow-lg shadow-accent/20"
          >
            Get Started — It's Free
          </RouterLink>
          <RouterLink
            to="/pricing"
            class="px-7 py-3.5 rounded-xl border border-white/10 text-secondary font-medium text-base hover:text-primary hover:border-white/20 transition-colors"
          >
            View Plans
          </RouterLink>
        </div>
      </section>

      <!-- Feature grid -->
      <section
        class="px-6 pb-24 max-w-5xl mx-auto w-full"
        aria-labelledby="features-heading"
      >
        <h2
          id="features-heading"
          class="text-center text-2xl font-bold text-primary mb-12 stagger-item"
        >
          Everything you need to land the interview
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(feature, index) in features"
            :key="feature.title"
            class="p-5 rounded-2xl border border-white/5 hover:border-accent/30 transition-all stagger-item group"
            style="background: var(--bg-surface)"
            :style="{ animationDelay: `${(index + 1) * 60}ms` }"
          >
            <div
              class="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform"
              aria-hidden="true"
            >
              {{ feature.icon }}
            </div>
            <h3 class="text-sm font-semibold text-primary mb-1">{{ feature.title }}</h3>
            <p class="text-xs text-secondary leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/5 py-6 px-6 text-center text-xs text-secondary">
      © {{ new Date().getFullYear() }} CV Generate · Free ATS CV Builder
    </footer>
  </div>
</template>
