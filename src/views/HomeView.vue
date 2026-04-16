<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { RouterLink } from 'vue-router'
  import AppHeader from '@/components/ui/AppHeader.vue'
  import AppFooter from '@/components/ui/AppFooter.vue'
  import FeatureIcon from '@/components/ui/FeatureIcon.vue'
  import { useScrollReveal } from '@/composables/useScrollReveal'
  import { useUserStore } from '@/stores/userStore'
  import { localStorageService } from '@/services/storageService'
  import type { CVData } from '@/types/cv.types'

  const userStore = useUserStore()

  /* ── Per-page title ───────────────────────────────────────────────────── */
  onMounted(() => {
    document.title = 'Resumark — Build a Professional CV Free'
  })

  /* ── Mouse-tracking aurora ────────────────────────────────────────────── */
  const cursorX = ref<number | null>(null)
  const cursorY = ref<number | null>(null)
  const isTouchDevice = ref(false)
  let rafId: number | null = null

  onMounted(() => {
    isTouchDevice.value = 'ontouchstart' in window
  })

  function onMouseMove(e: MouseEvent): void {
    if (rafId !== null) return
    // Capture target and coordinates synchronously — e.currentTarget is nulled
    // after the event handler returns (browser reuses the event object), so
    // reading it inside requestAnimationFrame would throw.
    const target = e.currentTarget as HTMLElement | null
    if (!target) return
    const rect = target.getBoundingClientRect()
    const clientX = e.clientX
    const clientY = e.clientY
    rafId = requestAnimationFrame(() => {
      cursorX.value = ((clientX - rect.left) / rect.width) * 100
      cursorY.value = ((clientY - rect.top) / rect.height) * 100
      rafId = null
    })
  }

  onUnmounted(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  })

  // Computed aurora styles — avoid non-null assertions in template
  const aurora1Style = computed(() =>
    cursorX.value !== null
      ? { background: `radial-gradient(820px circle at ${cursorX.value}% ${cursorY.value}%, rgba(8,145,178,0.14) 0%, transparent 70%)` }
      : {},
  )
  const aurora2Style = computed(() =>
    cursorX.value !== null
      ? { background: `radial-gradient(680px circle at ${100 - (cursorX.value as number)}% ${100 - (cursorY.value as number)}%, rgba(13,148,136,0.11) 0%, transparent 65%)` }
      : {},
  )

  /* ── Scroll reveal directive ──────────────────────────────────────────── */
  const { vReveal } = useScrollReveal()

  /* ── Personalized mockup ──────────────────────────────────────────────── */
  const storedCV = ref<CVData | null>(null)

  async function refreshStoredCV(): Promise<void> {
    const data = await localStorageService.load()
    storedCV.value = data?.personal?.fullName?.trim() ? data : null
  }

  onMounted(refreshStoredCV)

  // Re-read when auth state changes (e.g. logout while already on homepage —
  // router.push('/') won't re-mount the component, so onMounted won't re-fire).
  watch(() => userStore.isLoggedIn, refreshStoredCV)

  function trunc(s: string | undefined, len: number): string {
    if (!s) return ''
    return s.length > len ? s.slice(0, len) + '…' : s
  }

  const mockPersonal = computed(() =>
    storedCV.value?.personal?.fullName?.trim() ? storedCV.value.personal : null,
  )
  const mockExp = computed(() =>
    storedCV.value?.experience?.length ? storedCV.value.experience[0] : null,
  )
  const mockEdu = computed(() =>
    storedCV.value?.education?.length ? storedCV.value.education[0] : null,
  )
  const mockSkills = computed(() =>
    storedCV.value?.skills?.length ? storedCV.value.skills.slice(0, 2) : null,
  )

  /* ── Page data ────────────────────────────────────────────────────────── */
  const stats = [
    { value: '< 5 min', label: 'Build Time' },
    { value: '100%', label: 'ATS Compliant' },
    { value: '0', label: 'Server Uploads' },
    { value: 'Free', label: 'Forever' },
  ]

  const features = [
    {
      icon: 'lightning',
      title: 'Real-Time Preview',
      description: 'Your CV updates live on every keystroke — see exactly how it looks before you export.',
    },
    {
      icon: 'check',
      title: 'ATS Compliant',
      description: 'Single-column layout, standard headings, and machine-readable text — passes all major ATS parsers.',
    },
    {
      icon: 'pdf',
      title: 'Pixel-Perfect PDF',
      description: 'The exported PDF is identical to the on-screen preview — same fonts, same spacing, every time.',
    },
    {
      icon: 'refresh',
      title: 'Auto-Save',
      description: 'Every change is debounced and saved to your browser — your work is never lost between sessions.',
    },
    {
      icon: 'chat',
      title: 'ATS Writing Hints',
      description: 'Real-time warnings for weak phrases, short summaries, over-long bullets, and bad date formats.',
    },
    {
      icon: 'drag',
      title: 'Drag to Reorder',
      description: 'Rearrange experience, education, skills, and projects by dragging — no copy-pasting needed.',
    },
    {
      icon: 'tag',
      title: 'Skill Tag System',
      description: 'Add skills as chip tags — press Enter or comma to insert instantly. Clean, readable output.',
    },
    {
      icon: 'lock',
      title: 'Privacy First',
      description: 'No account. No server. Your data stays in your browser — owned entirely by you.',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Fill in your details',
      description: 'Work through 7 smart sections — personal info, experience, education, skills, and more. Writing hints guide you as you go.',
    },
    {
      number: '02',
      title: 'Watch it come to life',
      description: 'Your A4 CV updates in real-time on the right panel. Every change is reflected instantly — no guessing how it will look.',
    },
    {
      number: '03',
      title: 'Download and apply',
      description: 'One click exports a pixel-perfect, ATS-ready PDF. The file names itself after you. Apply with confidence.',
    },
  ]

  const testimonials = [
    {
      name: 'Alex K.',
      role: 'Software Engineer',
      text: 'Built my CV in under 10 minutes. The ATS hints caught weak phrases I never would have noticed. Got 3 interview calls the same week.',
      stars: 5,
    },
    {
      name: 'Priya M.',
      role: 'Product Manager',
      text: 'The real-time preview is a game changer. I could see exactly what my CV would look like on paper as I typed. Landed the role two weeks later.',
      stars: 5,
    },
    {
      name: 'James T.',
      role: 'Data Scientist',
      text: 'No sign-up, no bloat. I was skeptical about a free tool but the PDF is indistinguishable from paid alternatives. Will use for every application.',
      stars: 5,
    },
  ]
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-shell)">
    <AppHeader />

    <main class="flex-1 flex flex-col">

      <!-- ── Hero (2-col on lg) ──────────────────────────────────────────── -->
      <section
        class="section-visible relative overflow-hidden dot-grid"
        aria-labelledby="hero-heading"
        @mousemove="onMouseMove"
      >
        <!-- Autonomous ambient aurora -->
        <div class="aurora-ambient" aria-hidden="true" />

        <!-- Mouse-tracking glow (only after first mousemove; touch fallback below) -->
        <template v-if="!isTouchDevice">
          <div v-if="cursorX !== null" class="aurora-glow" :style="aurora1Style" aria-hidden="true" />
          <div v-if="cursorX !== null" class="aurora-glow" :style="aurora2Style" aria-hidden="true" />
        </template>
        <!-- Static centered glow for touch devices -->
        <div
          v-if="isTouchDevice"
          class="aurora-glow"
          style="background: radial-gradient(820px circle at 50% 40%, rgba(8,145,178,0.12) 0%, transparent 70%)"
          aria-hidden="true"
        />

        <!-- Two-column layout -->
        <div class="relative max-w-7xl mx-auto px-6 pt-16 pb-12 md:pt-20 md:pb-16">
          <div class="flex flex-col lg:flex-row items-center gap-10 lg:gap-12">

            <!-- Left: Copy (narrower, fixed width) -->
            <div class="w-full lg:w-[420px] xl:w-[460px] shrink-0 flex flex-col items-center lg:items-start text-center lg:text-left">
              <!-- Badge -->
              <div
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold mb-6 stagger-item"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                ATS-Friendly · Free · No Sign-Up Required
              </div>

              <h1
                id="hero-heading"
                class="text-4xl md:text-5xl xl:text-6xl font-bold text-primary leading-tight stagger-item"
                style="animation-delay: 60ms"
              >
                Build a
                <span
                  class="text-transparent bg-clip-text"
                  style="background-image: linear-gradient(135deg, #0891B2 0%, #06B6D4 50%, #0D9488 100%)"
                >
                  Professional CV
                </span>
                in Minutes
              </h1>

              <p
                class="mt-5 text-secondary text-lg max-w-lg leading-relaxed stagger-item"
                style="animation-delay: 120ms"
              >
                Create an ATS-compliant resume with a live preview and instant PDF export.
                No account needed — your data stays private in your browser.
              </p>

              <!-- CTAs -->
              <div
                class="flex flex-col sm:flex-row gap-3 mt-8 stagger-item"
                style="animation-delay: 180ms"
              >
                <RouterLink
                  to="/builder"
                  class="shimmer-btn px-7 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg shadow-accent/20"
                >
                  Start Building Free
                </RouterLink>
                <RouterLink
                  to="/pricing"
                  class="group px-7 py-3.5 rounded-xl border border-overlay/20 text-primary font-medium text-base hover:border-accent/40 hover:bg-accent/5 transition-all flex items-center justify-center gap-2"
                >
                  See Plans
                  <span class="text-xs text-accent group-hover:text-accent/80 transition-colors">Free forever</span>
                </RouterLink>
              </div>

              <!-- Stats -->
              <div
                class="flex flex-wrap justify-center lg:justify-start gap-6 mt-10 stagger-item"
                style="animation-delay: 240ms"
                aria-label="Key figures"
              >
                <div
                  v-for="stat in stats"
                  :key="stat.label"
                  class="flex flex-col items-center lg:items-start"
                >
                  <span class="text-xl font-bold text-primary leading-none">{{ stat.value }}</span>
                  <span class="text-xs text-secondary mt-1">{{ stat.label }}</span>
                </div>
              </div>
            </div>

            <!-- Right: Product mockup -->
            <div class="flex-1 min-w-0 w-full stagger-item flex flex-col" style="animation-delay: 100ms" aria-hidden="true">
              <div
                class="rounded-2xl border border-overlay/5 overflow-hidden shadow-2xl shadow-black/50"
                style="background: var(--mockup-bg)"
              >
                <!-- Browser chrome -->
                <div
                  class="flex items-center gap-2 px-4 py-3 border-b border-overlay/5"
                  style="background: var(--mockup-chrome)"
                >
                  <span class="w-3 h-3 rounded-full bg-red-500/60" />
                  <span class="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <span class="w-3 h-3 rounded-full bg-green-500/60" />
                  <div class="flex-1 mx-4 h-5 rounded-md bg-overlay/5 flex items-center px-3">
                    <span class="text-secondary text-xs opacity-50">resumark.app/builder</span>
                  </div>
                  <div class="h-5 w-16 rounded bg-accent/20 flex items-center justify-center ml-2">
                    <span class="text-accent text-[9px] font-semibold">↓ PDF</span>
                  </div>
                </div>

                <!-- Split mockup -->
                <div class="flex ">
                  <!-- Form panel -->
                  <div
                    class="w-[40%] border-r border-overlay/5 p-4 flex flex-col gap-2 overflow-hidden"
                    style="background: var(--bg-surface)"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <p class="text-xs text-secondary font-semibold">CV Information</p>
                      <span class="text-[9px] text-emerald-400 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Saved
                      </span>
                    </div>

                    <!-- Open personal section -->
                    <div class="px-3 py-2.5 rounded-lg border border-accent/30 bg-accent/5">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-primary font-semibold">👤 Personal Info</span>
                        <svg class="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                      <div class="flex flex-col gap-1.5">
                        <div class="h-5 rounded bg-overlay/8 flex items-center px-2">
                          <span class="text-[8px] text-secondary/70">{{ trunc(mockPersonal?.fullName ?? 'Alex Johnson', 28) }}</span>
                        </div>
                        <div class="flex gap-1.5">
                          <div class="flex-1 h-5 rounded bg-overlay/8 flex items-center px-2">
                            <span class="text-[8px] text-secondary/70">{{ trunc(mockPersonal?.jobTitle ?? 'Software Engineer', 22) }}</span>
                          </div>
                          <div class="flex-1 h-5 rounded bg-overlay/8 flex items-center px-2">
                            <span class="text-[8px] text-secondary/70">{{ trunc(mockPersonal?.location ?? 'San Francisco, CA', 20) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Collapsed sections -->
                    <div
                      v-for="label in ['📝 Summary', '💼 Work Experience', '🎓 Education', '⚙️ Skills', '🚀 Projects', '🏆 Certifications']"
                      :key="label"
                      class="flex items-center justify-between px-3 py-2 rounded-lg border border-overlay/5"
                    >
                      <span class="text-xs text-secondary">{{ label }}</span>
                      <svg class="w-3 h-3 text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <!-- CV preview panel -->
                  <div class="flex-1 flex justify-center items-start overflow-hidden p-5" style="background: var(--preview-bg)">
                    <div
                      class="bg-white rounded shadow-xl w-full max-w-[320px] p-5 text-[#1a1a1a]"
                      style="font-family: 'Inter', sans-serif; font-size: 9.5px; line-height: 1.6"
                    >
                      <div style="border-bottom: 1.5px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 9px;">
                        <div style="font-size: 20px; font-weight: 800; color: #111; letter-spacing: -0.4px;">{{ trunc(mockPersonal?.fullName ?? 'Alex Johnson', 30) }}</div>
                        <div style="font-size: 12px; font-weight: 600; color: #0891B2; margin: 3px 0 4px;">{{ trunc(mockPersonal?.jobTitle ?? 'Senior Software Engineer', 36) }}</div>
                        <div style="font-size: 9px; color: #6b7280; display: flex; gap: 8px; flex-wrap: wrap;">
                          <span>{{ trunc(mockPersonal?.email ?? 'alex@example.com', 24) }}</span><span>·</span>
                          <span>{{ trunc(mockPersonal?.phone ?? '+1 415 000 0000', 18) }}</span><span>·</span>
                          <span>{{ trunc(mockPersonal?.location ?? 'San Francisco, CA', 20) }}</span>
                        </div>
                      </div>
                      <div style="margin-bottom: 8px;">
                        <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 5px; color: #111;">Work Experience</div>
                        <div style="display: flex; justify-content: space-between;">
                          <div>
                            <div style="font-weight: 700; font-size: 11px; color: #111;">{{ trunc(mockExp?.position ?? 'Senior Software Engineer', 30) }}</div>
                            <div style="color: #6b7280; font-size: 9px;">{{ trunc(mockExp ? (mockExp.company + (mockExp.location ? ' · ' + mockExp.location : '')) : 'TechCorp Inc. · San Francisco', 32) }}</div>
                          </div>
                          <div style="color: #9ca3af; font-size: 8.5px; white-space: nowrap; margin-left: 8px;">{{ mockExp ? (mockExp.startDate + ' – ' + (mockExp.endDate || 'Present')) : '03/2022 – Present' }}</div>
                        </div>
                        <ul style="padding-left: 11px; margin-top: 3px; color: #374151;">
                          <template v-if="mockExp?.bullets?.length">
                            <li
                              v-for="(b, i) in mockExp.bullets.slice(0, 3)"
                              :key="i"
                              :style="{ listStyle: 'disc', marginBottom: i < 2 ? '2px' : '0' }"
                            >{{ trunc(b, 58) }}</li>
                          </template>
                          <template v-else>
                            <li style="list-style: disc; margin-bottom: 2px;">Reduced bundle size by 35% via Vue 3 migration.</li>
                            <li style="list-style: disc; margin-bottom: 2px;">Led team of 4 to cut API latency by 40%.</li>
                            <li style="list-style: disc;">Shipped real-time dashboard for 50 k+ DAUs.</li>
                          </template>
                        </ul>
                      </div>
                      <div style="margin-bottom: 8px;">
                        <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 5px; color: #111;">Education</div>
                        <div style="display: flex; justify-content: space-between;">
                          <div>
                            <div style="font-weight: 700; font-size: 11px; color: #111;">{{ trunc(mockEdu ? ((mockEdu.degree ?? '') + (mockEdu.field ? ' ' + mockEdu.field : '')) : 'B.S. Computer Science', 28) }}</div>
                            <div style="color: #6b7280; font-size: 9px;">{{ trunc(mockEdu?.institution ?? 'UC Berkeley', 22) }}</div>
                          </div>
                          <div style="color: #9ca3af; font-size: 8.5px; white-space: nowrap; margin-left: 8px;">{{ mockEdu ? ((mockEdu.startDate ?? '') + ' – ' + (mockEdu.endDate ?? '')) : '2018 – 2022' }}</div>
                        </div>
                      </div>
                      <div>
                        <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 5px; color: #111;">Skills</div>
                        <template v-if="mockSkills">
                          <div
                            v-for="(skill, i) in mockSkills"
                            :key="skill.category"
                            :style="{ color: '#374151', marginBottom: i < mockSkills.length - 1 ? '2px' : '0' }"
                          ><span style="font-weight: 700;">{{ trunc(skill.category, 14) }}:</span> {{ trunc(skill.items.join(', '), 40) }}</div>
                        </template>
                        <template v-else>
                          <div style="color: #374151; margin-bottom: 2px;"><span style="font-weight: 700;">Frontend:</span> Vue 3, React, TypeScript, Tailwind</div>
                          <div style="color: #374151;"><span style="font-weight: 700;">Backend:</span> Node.js, PostgreSQL, Redis, Docker</div>
                        </template>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <!-- ── Personalized CTA bubble — below the mockup ──────────── -->
              <!-- Shown only when the user already has saved CV data.         -->
              <Transition
                appear
                enter-active-class="transition-all duration-[700ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                enter-from-class="opacity-0 translate-y-4 scale-95"
                enter-to-class="opacity-100 translate-y-0 scale-100"
              >
                <div
                  v-if="mockPersonal"
                  class="mt-3 rounded-2xl border border-overlay/8 flex items-center justify-between gap-4 px-5 py-4"
                  style="background: var(--bg-surface); box-shadow: 0 4px 24px rgba(8,145,178,0.18), 0 1px 8px rgba(0,0,0,0.08)"
                >
                  <!-- Avatar + name + status line -->
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style="background: linear-gradient(135deg, #0891B2, #0D9488)"
                    >
                      {{ mockPersonal.fullName.charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-primary truncate leading-snug">{{ trunc(mockPersonal.fullName, 32) }}</p>
                      <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                        <span class="text-xs text-secondary">Your CV is saved — continue where you left off</span>
                      </div>
                    </div>
                  </div>
                  <!-- CTA -->
                  <RouterLink
                    to="/builder"
                    class="shrink-0 shimmer-btn text-white text-sm font-semibold rounded-xl px-5 py-2.5 whitespace-nowrap"
                  >
                    Continue CV →
                  </RouterLink>
                </div>
              </Transition>
            </div>

          </div>
        </div>
      </section>

      <!-- ── How it works ───────────────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 py-20 max-w-4xl mx-auto w-full"
        aria-labelledby="how-heading"
      >
        <div class="text-center mb-12 reveal-item">
          <p class="text-xs font-mono text-accent uppercase tracking-widest mb-2">Simple process</p>
          <h2 id="how-heading" class="text-2xl font-bold text-primary">How it works</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="(step, index) in steps"
            :key="step.number"
            class="feature-card flex flex-col gap-3 p-6 rounded-2xl reveal-item"
            :style="{ animationDelay: `${index * 80}ms` }"
          >
            <div class="flex items-center gap-3">
              <span
                class="text-3xl font-black font-mono leading-none"
                style="color: rgba(8,145,178,0.35)"
                aria-hidden="true"
              >
                {{ step.number }}
              </span>
              <div class="flex-1 h-px bg-overlay/5" aria-hidden="true" />
            </div>
            <h3 class="text-base font-semibold text-primary">{{ step.title }}</h3>
            <p class="text-sm text-secondary leading-relaxed">{{ step.description }}</p>
          </div>
        </div>
      </section>

      <!-- ── Feature grid ───────────────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 pb-20 max-w-5xl mx-auto w-full"
        aria-labelledby="features-heading"
      >
        <div class="text-center mb-12 reveal-item">
          <p class="text-xs font-mono text-accent uppercase tracking-widest mb-2">Everything included</p>
          <h2 id="features-heading" class="text-2xl font-bold text-primary">
            Everything you need to land the interview
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(feature, index) in features"
            :key="feature.title"
            class="feature-card p-5 rounded-2xl reveal-item group cursor-default"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <div
              class="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center mb-3 group-hover:bg-accent/25 transition-colors text-accent p-2"
              aria-hidden="true"
            >
              <FeatureIcon :name="feature.icon" />
            </div>
            <h3 class="text-sm font-semibold text-primary mb-1">{{ feature.title }}</h3>
            <p class="text-xs text-secondary leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </section>

      <!-- ── Testimonials ───────────────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 pb-20 max-w-4xl mx-auto w-full"
        aria-labelledby="testimonials-heading"
      >
        <div class="text-center mb-12 reveal-item">
          <p class="text-xs font-mono text-accent uppercase tracking-widest mb-2">From real users</p>
          <h2 id="testimonials-heading" class="text-2xl font-bold text-primary">
            Job seekers who built their CV here
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            v-for="(t, index) in testimonials"
            :key="t.name"
            class="feature-card p-5 rounded-2xl flex flex-col gap-4 reveal-item"
            :style="{ animationDelay: `${index * 80}ms` }"
          >
            <!-- Stars -->
            <div class="flex gap-0.5" aria-label="5 out of 5 stars">
              <svg
                v-for="i in t.stars"
                :key="i"
                class="w-3.5 h-3.5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.958c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.285-3.958a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.951-.69L9.049 2.927z" />
              </svg>
            </div>

            <p class="text-sm text-secondary leading-relaxed flex-1">
              "{{ t.text }}"
            </p>

            <div class="flex items-center gap-2.5 pt-3 border-t border-overlay/5">
              <div
                class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0"
                aria-hidden="true"
              >
                {{ t.name.charAt(0) }}
              </div>
              <div>
                <p class="text-xs font-semibold text-primary">{{ t.name }}</p>
                <p class="text-xs text-secondary">{{ t.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── CTA banner ─────────────────────────────────────────────────── -->
      <section
        v-reveal
        class="px-6 pb-24 max-w-3xl mx-auto w-full"
      >
        <div
          class="rounded-2xl p-10 text-center border border-accent/20 reveal-item relative overflow-hidden"
          style="background: linear-gradient(135deg, rgba(8,145,178,0.10) 0%, rgba(13,148,136,0.05) 100%)"
        >
          <div
            class="absolute -top-12 -left-12 w-48 h-48 rounded-full pointer-events-none"
            style="background: radial-gradient(circle, rgba(8,145,178,0.15) 0%, transparent 70%)"
            aria-hidden="true"
          />
          <div
            class="absolute -bottom-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
            style="background: radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)"
            aria-hidden="true"
          />
          <h2 class="relative text-2xl font-bold text-primary mb-2">
            Your next job starts here
          </h2>
          <p class="relative text-secondary text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Join professionals who built their CV in under 5 minutes.
            Free, private, and ATS-ready.
          </p>
          <RouterLink
            to="/builder"
            class="relative shimmer-btn inline-block px-8 py-3.5 rounded-xl text-white font-semibold shadow-lg shadow-accent/20"
          >
            Build Your CV Now
          </RouterLink>
        </div>
      </section>

    </main>

    <AppFooter />
  </div>
</template>
