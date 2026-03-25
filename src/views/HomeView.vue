<script setup lang="ts">
  import { ref, onUnmounted } from 'vue'
  import { RouterLink } from 'vue-router'
  import AppHeader from '@/components/ui/AppHeader.vue'

  /* ── Mouse-tracking aurora ────────────────────────────────────────────── */
  const cursorX = ref(50)
  const cursorY = ref(50)
  let rafPending = false

  function onMouseMove(e: MouseEvent): void {
    if (rafPending) return
    rafPending = true
    requestAnimationFrame(() => {
      const target = e.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      cursorX.value = ((e.clientX - rect.left) / rect.width) * 100
      cursorY.value = ((e.clientY - rect.top) / rect.height) * 100
      rafPending = false
    })
  }

  onUnmounted(() => {
    rafPending = false
  })

  /* ── Page data ────────────────────────────────────────────────────────── */
  const features = [
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>`,
      title: 'Real-Time Preview',
      description: 'Watch your CV update live on the right panel as you fill in the form — no page refresh needed.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      title: 'ATS Compliant',
      description: 'Single-column layout, standard section headings, and machine-readable text — passes all major ATS parsers.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>`,
      title: 'Pixel-Perfect PDF',
      description: 'The downloaded PDF is identical to the on-screen preview — same fonts, same spacing, same layout.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>`,
      title: 'Auto-Save',
      description: "Every keystroke is debounced and saved to your browser's localStorage — your work is never lost.",
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>`,
      title: 'ATS Writing Hints',
      description: 'Real-time warnings for weak phrases, short summaries, over-long bullets, and invalid date formats.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>`,
      title: 'Drag to Reorder',
      description: 'Rearrange experience entries, education, skills, and projects by dragging — no cut and paste.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z"/></svg>`,
      title: 'Skill Tag System',
      description: 'Add skills and technologies as animated chip tags — press Enter or comma to insert instantly.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>`,
      title: 'Privacy First',
      description: 'No account. No server. Your data never leaves your browser — stored locally, owned by you.',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Fill in your details',
      description: 'Use the accordion form on the left to enter personal info, experience, education, skills, projects, and certifications.',
    },
    {
      number: '02',
      title: 'Watch it come to life',
      description: 'The A4 preview on the right updates in real-time as you type. Sections pulse to confirm your changes.',
    },
    {
      number: '03',
      title: 'Download your PDF',
      description: 'Hit "Download PDF" — the file is pixel-identical to the preview, ATS-ready, and names itself after you.',
    },
  ]

  const stats = [
    { value: '7', label: 'CV Sections' },
    { value: 'A4', label: 'Exact Format' },
    { value: '0', label: 'Accounts Needed' },
    { value: '100%', label: 'Free to Start' },
  ]
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-shell)">
    <AppHeader />

    <main class="flex-1 flex flex-col">

      <!-- ── Hero ──────────────────────────────────────────────────────── -->
      <section
        class="relative flex flex-col items-center text-center px-6 pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden dot-grid"
        aria-labelledby="hero-heading"
        @mousemove="onMouseMove"
      >
        <!-- Aurora layer 1: cyan — follows cursor -->
        <div
          class="aurora-glow"
          :style="{
            background: `radial-gradient(600px circle at ${cursorX}% ${cursorY}%, rgba(8,145,178,0.13) 0%, transparent 70%)`,
          }"
          aria-hidden="true"
        />
        <!-- Aurora layer 2: teal/emerald — moves counter to cursor -->
        <div
          class="aurora-glow"
          :style="{
            background: `radial-gradient(500px circle at ${100 - cursorX}% ${100 - cursorY}%, rgba(13,148,136,0.10) 0%, transparent 65%)`,
          }"
          aria-hidden="true"
        />
        <!-- Static ambient glow -->
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] rounded-full opacity-8 pointer-events-none"
          style="background: radial-gradient(ellipse, rgba(8,145,178,0.18) 0%, transparent 70%)"
          aria-hidden="true"
        />

        <!-- Badge -->
        <div
          class="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold mb-6 stagger-item"
        >
          <span
            class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
            aria-hidden="true"
          />
          ATS-Friendly · Free · No Sign-Up Required
        </div>

        <h1
          id="hero-heading"
          class="relative text-4xl md:text-6xl font-bold text-primary leading-tight max-w-3xl stagger-item"
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
          class="relative mt-5 text-secondary text-lg max-w-xl leading-relaxed stagger-item"
          style="animation-delay: 120ms"
        >
          Create an ATS-compliant resume with a live preview and instant PDF download.
          No account required — your data stays private in your browser.
        </p>

        <div
          class="relative flex flex-col sm:flex-row gap-3 mt-8 stagger-item"
          style="animation-delay: 180ms"
        >
          <RouterLink
            to="/builder"
            class="shimmer-btn px-7 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg shadow-accent/20"
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

        <!-- Stats row -->
        <div
          class="relative flex flex-wrap justify-center gap-8 mt-14 stagger-item"
          style="animation-delay: 240ms"
          aria-label="Key statistics"
        >
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="flex flex-col items-center"
          >
            <span class="text-2xl font-bold text-primary">{{ stat.value }}</span>
            <span class="text-xs text-secondary mt-0.5">{{ stat.label }}</span>
          </div>
        </div>
      </section>

      <!-- ── CV preview mockup ──────────────────────────────────────────── -->
      <section class="px-6 pb-20 max-w-6xl mx-auto w-full" aria-label="CV builder preview mockup">
        <div
          class="rounded-2xl border border-white/5 overflow-hidden shadow-2xl shadow-black/40 stagger-item"
          style="background: #0d1117"
        >
          <!-- Fake browser chrome -->
          <div
            class="flex items-center gap-2 px-4 py-3 border-b border-white/5"
            style="background: #0a0e14"
            aria-hidden="true"
          >
            <span class="w-3 h-3 rounded-full bg-red-500/60" />
            <span class="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span class="w-3 h-3 rounded-full bg-green-500/60" />
            <div class="flex-1 mx-4 h-5 rounded-md bg-white/5 flex items-center px-3">
              <span class="text-secondary text-xs opacity-50">cv-generate.app/builder</span>
            </div>
            <!-- Fake toolbar buttons -->
            <div class="flex items-center gap-2 ml-2">
              <div class="h-5 w-16 rounded bg-accent/20 flex items-center justify-center">
                <span class="text-accent text-[9px] font-semibold">↓ PDF</span>
              </div>
            </div>
          </div>

          <!-- Split-screen mockup — made taller -->
          <div class="flex h-[420px] md:h-[520px]">
            <!-- Left: form panel -->
            <div
              class="w-[42%] border-r border-white/5 p-5 flex flex-col gap-2.5 overflow-hidden"
              style="background: var(--bg-surface)"
              aria-hidden="true"
            >
              <div class="flex items-center justify-between mb-1">
                <p class="text-xs text-secondary font-semibold">CV Information</p>
                <span class="text-[9px] text-emerald-400 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Saved
                </span>
              </div>

              <!-- Simulated form sections (taller, more detail) -->
              <div
                class="px-3 py-2.5 rounded-lg border border-accent/30 bg-accent/5"
                aria-hidden="true"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-primary font-semibold">👤 Personal Info</span>
                  <svg class="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </div>
                <!-- Fake input fields -->
                <div class="flex flex-col gap-1.5">
                  <div class="h-5 rounded bg-white/8 flex items-center px-2">
                    <span class="text-[8px] text-secondary/70">M. Numan MERCAN</span>
                  </div>
                  <div class="flex gap-1.5">
                    <div class="flex-1 h-5 rounded bg-white/8 flex items-center px-2">
                      <span class="text-[8px] text-secondary/70">Software Engineer</span>
                    </div>
                    <div class="flex-1 h-5 rounded bg-white/8 flex items-center px-2">
                      <span class="text-[8px] text-secondary/70">Istanbul, TR</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-for="label in ['📝  Summary', '💼  Work Experience', '🎓  Education', '⚙️  Skills', '🚀  Projects', '🏆  Certifications']"
                :key="label"
                class="flex items-center justify-between px-3 py-2 rounded-lg border border-white/5 hover:border-accent/20 transition-colors cursor-default"
              >
                <span class="text-xs text-secondary">{{ label }}</span>
                <svg class="w-3 h-3 text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <!-- Right: CV preview — larger and more detailed -->
            <div
              class="flex-1 flex justify-center items-start overflow-hidden p-5"
              style="background: #18181f"
            >
              <!-- Subtle glow behind paper -->
              <div
                class="absolute w-48 h-64 rounded-full pointer-events-none"
                style="background: radial-gradient(ellipse, rgba(8,145,178,0.06) 0%, transparent 70%)"
                aria-hidden="true"
              />
              <div
                class="bg-white rounded shadow-2xl shadow-black/50 w-full max-w-sm p-5 text-[#1a1a1a] relative"
                style="font-family: 'Inter', sans-serif; font-size: 8px; line-height: 1.55;"
                aria-hidden="true"
              >
                <!-- CV Header -->
                <div style="border-bottom: 1.5px solid #e5e7eb; padding-bottom: 7px; margin-bottom: 8px;">
                  <div style="font-size: 17px; font-weight: 800; color: #111; letter-spacing: -0.3px;">M. Numan MERCAN</div>
                  <div style="font-size: 10px; font-weight: 600; color: #0891B2; margin: 2px 0 4px;">Full-Stack Software Engineer</div>
                  <div style="font-size: 7.5px; color: #6b7280; display: flex; gap: 8px; flex-wrap: wrap;">
                    <span>numan@example.com</span>
                    <span>·</span>
                    <span>+90 555 000 00 00</span>
                    <span>·</span>
                    <span>Istanbul, Türkiye</span>
                    <span>·</span>
                    <span>linkedin.com/in/mnumanmercan</span>
                  </div>
                </div>

                <!-- Summary -->
                <div style="margin-bottom: 7px;">
                  <div style="font-size: 6.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; margin-bottom: 3px; color: #111;">Professional Summary</div>
                  <div style="color: #374151; line-height: 1.55;">Full-stack engineer with 4+ years delivering Vue/TypeScript SPAs and Node.js microservices at scale. Passionate about clean code, ATS-optimised content, and developer experience.</div>
                </div>

                <!-- Experience -->
                <div style="margin-bottom: 7px;">
                  <div style="font-size: 6.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; margin-bottom: 4px; color: #111;">Work Experience</div>
                  <div style="margin-bottom: 5px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                        <div style="font-weight: 700; font-size: 9px; color: #111;">Senior Software Engineer</div>
                        <div style="color: #6b7280; font-size: 7.5px;">TechCorp Inc. · Istanbul, TR</div>
                      </div>
                      <div style="color: #9ca3af; font-size: 7px; white-space: nowrap; margin-left: 8px;">03/2022 – Present</div>
                    </div>
                    <ul style="padding-left: 10px; margin-top: 3px; color: #374151;">
                      <li style="list-style: disc; margin-bottom: 1.5px;">Architected Vue 3 + TypeScript SPA reducing bundle size by 35%.</li>
                      <li style="list-style: disc; margin-bottom: 1.5px;">Led team of 4 to migrate monolith → microservices cutting latency 40%.</li>
                      <li style="list-style: disc;">Built real-time dashboard serving 50 k+ daily active users.</li>
                    </ul>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                        <div style="font-weight: 700; font-size: 9px; color: #111;">Frontend Developer</div>
                        <div style="color: #6b7280; font-size: 7.5px;">Startup Labs · Remote</div>
                      </div>
                      <div style="color: #9ca3af; font-size: 7px; white-space: nowrap; margin-left: 8px;">06/2020 – 02/2022</div>
                    </div>
                    <ul style="padding-left: 10px; margin-top: 3px; color: #374151;">
                      <li style="list-style: disc; margin-bottom: 1.5px;">Delivered 12+ feature releases across 3 product lines on schedule.</li>
                      <li style="list-style: disc;">Introduced component library that cut dev time by 25%.</li>
                    </ul>
                  </div>
                </div>

                <!-- Skills -->
                <div>
                  <div style="font-size: 6.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; margin-bottom: 3px; color: #111;">Skills</div>
                  <div style="color: #374151; margin-bottom: 2px;"><span style="font-weight: 700;">Frontend:</span> Vue 3, React, TypeScript, TailwindCSS, Vite</div>
                  <div style="color: #374151; margin-bottom: 2px;"><span style="font-weight: 700;">Backend:</span> Node.js, Express, PostgreSQL, MongoDB, Redis</div>
                  <div style="color: #374151;"><span style="font-weight: 700;">DevOps:</span> Docker, GitHub Actions, AWS EC2, Vercel</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── How it works ───────────────────────────────────────────────── -->
      <section class="px-6 pb-20 max-w-4xl mx-auto w-full" aria-labelledby="how-heading">
        <h2
          id="how-heading"
          class="text-center text-2xl font-bold text-primary mb-12 stagger-item"
        >
          How it works
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="(step, index) in steps"
            :key="step.number"
            class="flex flex-col gap-3 stagger-item"
            :style="{ animationDelay: `${index * 60}ms` }"
          >
            <div class="flex items-center gap-3">
              <span
                class="text-3xl font-black font-mono leading-none"
                style="color: rgba(8,145,178,0.30)"
                aria-hidden="true"
              >
                {{ step.number }}
              </span>
              <div class="flex-1 h-px bg-white/5" aria-hidden="true" />
            </div>
            <h3 class="text-base font-semibold text-primary">{{ step.title }}</h3>
            <p class="text-sm text-secondary leading-relaxed">{{ step.description }}</p>
          </div>
        </div>
      </section>

      <!-- ── Feature grid ───────────────────────────────────────────────── -->
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

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="(feature, index) in features"
            :key="feature.title"
            class="p-5 rounded-2xl border border-white/5 hover:border-accent/30 transition-all stagger-item group cursor-default"
            style="background: var(--bg-surface)"
            :style="{ animationDelay: `${(index + 1) * 40}ms` }"
          >
            <div
              class="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center mb-3 group-hover:bg-accent/25 transition-colors text-accent"
              aria-hidden="true"
              v-html="feature.icon"
              style="padding: 8px;"
            />
            <h3 class="text-sm font-semibold text-primary mb-1">{{ feature.title }}</h3>
            <p class="text-xs text-secondary leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </section>

      <!-- ── CTA banner ─────────────────────────────────────────────────── -->
      <section class="px-6 pb-24 max-w-3xl mx-auto w-full">
        <div
          class="rounded-2xl p-10 text-center border border-accent/20 stagger-item relative overflow-hidden"
          style="background: linear-gradient(135deg, rgba(8,145,178,0.10) 0%, rgba(13,148,136,0.05) 100%)"
        >
          <!-- Subtle corner glows -->
          <div
            class="absolute -top-10 -left-10 w-40 h-40 rounded-full pointer-events-none"
            style="background: radial-gradient(circle, rgba(8,145,178,0.15) 0%, transparent 70%)"
            aria-hidden="true"
          />
          <div
            class="absolute -bottom-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style="background: radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)"
            aria-hidden="true"
          />
          <h2 class="relative text-2xl font-bold text-primary mb-2">
            Ready to build your CV?
          </h2>
          <p class="relative text-secondary text-sm mb-6 max-w-xs mx-auto">
            It takes less than 5 minutes. No account needed.
          </p>
          <RouterLink
            to="/builder"
            class="relative shimmer-btn inline-block px-8 py-3.5 rounded-xl text-white font-semibold shadow-lg shadow-accent/20"
          >
            Start Building for Free
          </RouterLink>
        </div>
      </section>

    </main>

    <!-- Footer -->
    <footer
      class="border-t border-white/5 py-8 px-6"
      style="background: var(--bg-surface)"
    >
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded bg-accent flex items-center justify-center text-white text-xs font-bold">
            CV
          </div>
          <span class="text-sm font-semibold text-secondary">CV Generate</span>
        </div>
        <div class="flex items-center gap-5 text-xs text-secondary">
          <RouterLink to="/builder" class="hover:text-primary transition-colors">Builder</RouterLink>
          <RouterLink to="/pricing" class="hover:text-primary transition-colors">Pricing</RouterLink>
          <a
            href="https://github.com/mnumanmercan/CV-generate"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-primary transition-colors"
          >
            GitHub
          </a>
        </div>
        <p class="text-xs text-secondary">
          © {{ new Date().getFullYear() }} CV Generate
        </p>
      </div>
    </footer>
  </div>
</template>
