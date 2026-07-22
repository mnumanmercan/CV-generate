<script setup lang="ts">
  import { computed } from 'vue'
  import { useCVStore } from '@/stores/cvStore'
  import { useTypewriter } from '@/composables/useTypewriter'
  import { DEMO_NAMES, DEMO_ROLES } from './heroDemoSamples'

  const cvStore = useCVStore()

  const { displayed: animatedName, isActive: isNameAnimating } = useTypewriter(DEMO_NAMES)
  const { displayed: animatedRole, isActive: isRoleAnimating } = useTypewriter(DEMO_ROLES, {
    typeSpeed: 130,
    deleteSpeed: 90,
    initialDelay: 1400,
    pauseAfterType: 1800,
  })

  /**
   * Static "Maya" sample — the homepage hero is a fixed marketing mockup and
   * never renders the visitor's stored CV wholesale (that lives in /builder).
   * The preview operates in two clearly-separated modes:
   *
   *   1. Empty cvData (nothing typed in the mini-demo)
   *       → Render this sample verbatim. Every section filled, full mockup.
   *
   *   2. Mini-demo edits (homepage form has been touched)
   *       → Overlay the touched mini-demo fields (fullName, role, company,
   *         started, highlight) onto this sample, keeping the rest of the
   *         persona intact so the preview stays visually complete.
   */
  const sample = {
    personal: {
      fullName: 'Maya Okafor',
      jobTitle: 'Senior Product Designer',
      location: 'Brooklyn, NY',
      email: 'maya@example.com',
      phone: '+1 718 555 0142',
    },
    experience: [
      {
        company: 'Northwind Studio',
        position: 'Senior Product Designer',
        location: 'New York, NY',
        startDate: 'Mar 2022',
        endDate: 'Present',
        bullets: [
          'Led the design system migration that cut new-feature design time by 38%.',
          'Shipped seven flows for the relaunch — every one measured against WCAG AA.',
        ],
      },
      {
        company: 'Arc Digital',
        position: 'UX Designer',
        location: 'New York, NY',
        startDate: 'Jun 2019',
        endDate: 'Feb 2022',
        bullets: ['Redesigned onboarding flow, reducing drop-off by 24% in the first quarter.'],
      },
    ],
    education: [
      {
        institution: 'RISD',
        degree: 'BFA',
        field: 'Graphic Design',
        startDate: '2014',
        endDate: '2018',
      },
    ],
    skills: [
      { category: 'Design', items: ['Figma', 'Sketch', 'Prototyping'] },
      { category: 'Front-end', items: ['HTML', 'CSS', 'JavaScript'] },
      { category: 'Tools', items: ['Jira', 'Notion', 'Linear'] },
    ],
  }

  /**
   * Has the mini-demo been touched at all? This guards the "fully empty →
   * return sample verbatim" short-circuit below, so the initial first-visit
   * render is GUARANTEED to be the full mockup with zero overlay logic.
   */
  const hasMiniDemoData = computed(() => {
    const d = cvStore.cvData
    return !!(
      d.personal.fullName?.trim() ||
      d.experience[0]?.position?.trim() ||
      d.experience[0]?.company?.trim() ||
      d.experience[0]?.startDate?.trim() ||
      d.experience[0]?.bullets?.[0]?.trim()
    )
  })

  /**
   * Compose the rendered data along the two modes called out at the top:
   *
   *   1. (nothing typed)  → sample verbatim — the initial mockup state
   *   2. hasMiniDemoData  → sample with mini-demo header fields overlaid
   *
   * Rendering is synchronous off the store (seeded from localStorage on first
   * paint), so the hero is stable — there is no default→real swap.
   */
  const data = computed(() => {
    // Mode 1: nothing typed → render the sample untouched (the default mockup).
    if (!hasMiniDemoData.value) return sample

    // Mode 2: per-field overlay — mix the mini-demo header fields with sample.
    const exp0 = cvStore.cvData.experience[0]
    const userFullName = cvStore.cvData.personal.fullName?.trim()
    return {
      personal: {
        ...sample.personal,
        // The visitor's typed name is the headline — overlay it onto the sample.
        fullName: userFullName || sample.personal.fullName,
        // Mirror the typed Role under the name as well — keeps the preview lively.
        jobTitle: exp0?.position?.trim() || sample.personal.jobTitle,
      },
      experience: [
        {
          ...sample.experience[0],
          position: exp0?.position?.trim() || sample.experience[0].position,
          company: exp0?.company?.trim() || sample.experience[0].company,
          startDate: exp0?.startDate?.trim() || sample.experience[0].startDate,
          endDate: exp0?.endDate || sample.experience[0].endDate,
          bullets: [
            // Highlight overlays the first canned bullet; the second canned
            // bullet stays so the preview never thins to a single line mid-edit.
            exp0?.bullets?.[0]?.trim() || sample.experience[0].bullets[0],
            sample.experience[0].bullets[1],
          ],
        },
        sample.experience[1],
      ],
      education: sample.education,
      skills: sample.skills,
    }
  })

  function trunc(s: string | undefined, len: number): string {
    if (!s) return ''
    return s.length > len ? s.slice(0, len) + '…' : s
  }

  /**
   * Per-field "user has typed this" signals. Deliberately NOT derived
   * from the global hasMiniDemoData — typing a name must freeze ONLY
   * the name animation, and typing a role must freeze ONLY the role
   * animation. The two header slots are independent.
   */
  const userTypedName = computed(() => !!cvStore.cvData.personal.fullName?.trim())
  const userTypedRole = computed(() => !!cvStore.cvData.experience[0]?.position?.trim())

  /**
   * Header name shown in the preview. Three cases:
   *   • The visitor has typed a name in the mini-demo → show it (truncated).
   *   • Animation is mid-cycle (incl. pause between words) → show
   *     animatedName verbatim, even if it's "" during the inter-word
   *     pause. Falling back to a sample here would flash the canonical
   *     name and read as a glitch.
   *   • Animation is finished (natural completion) → show the last
   *     typed word, falling back to the canonical sample if absent.
   */
  const headerName = computed(() => {
    if (userTypedName.value) {
      return trunc(data.value.personal.fullName, 34)
    }
    if (isNameAnimating.value) return animatedName.value
    return animatedName.value || trunc(data.value.personal.fullName, 34)
  })

  const headerRole = computed(() => {
    if (userTypedRole.value) {
      return trunc(data.value.personal.jobTitle, 42)
    }
    if (isRoleAnimating.value) return animatedRole.value
    return animatedRole.value || trunc(data.value.personal.jobTitle, 42)
  })
</script>

<!--
  Mini résumé preview rendered in Inter (matches /builder live preview + the
  exported PDF). Inline styles intentional: this card mirrors the print-side
  paper exactly so the homepage hero is a faithful "what you'll get" demo.
-->
<template>
  <div
    class="rounded-xl shadow-2xl shadow-black/20 p-9 w-full max-w-[500px] border border-overlay/8"
    style="
      background: #ffffff;
      color: #1a1a1a;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      line-height: 1.65;
    "
  >
    <!-- Header -->
    <div
      style="border-bottom: 1px solid rgba(0, 0, 0, 0.1); padding-bottom: 14px; margin-bottom: 16px"
    >
      <div
        style="
          font-size: 28px;
          font-weight: 700;
          color: #111;
          letter-spacing: -0.012em;
          line-height: 1.1;
          display: flex;
          align-items: baseline;
        "
      >
        <span>{{ headerName }}</span>
        <span v-if="!userTypedName && isNameAnimating" class="typewriter-cursor" aria-hidden="true"
          >|</span
        >
      </div>
      <div
        :style="{
          fontSize: '15.5px',
          fontWeight: 500,
          color: 'var(--accent)',
          margin: '6px 0 8px',
          display: 'flex',
          alignItems: 'baseline',
        }"
      >
        <span>{{ headerRole }}</span>
        <span v-if="!userTypedRole && isRoleAnimating" class="typewriter-cursor" aria-hidden="true"
          >|</span
        >
      </div>
      <div style="font-size: 11px; color: #6b7280; display: flex; gap: 6px; flex-wrap: wrap">
        <span>{{ trunc(data.personal.email, 28) }}</span>
        <span>·</span>
        <span>{{ trunc(data.personal.phone, 20) }}</span>
        <span>·</span>
        <span>{{ trunc(data.personal.location, 26) }}</span>
      </div>
    </div>

    <!-- Experience -->
    <div v-if="data.experience?.length" style="margin-bottom: 14px">
      <div
        :style="{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          borderBottom: '1px solid rgba(0,0,0,0.10)',
          paddingBottom: '3px',
          marginBottom: '8px',
          color: 'var(--accent)',
        }"
      >
        Experience
      </div>
      <div
        v-for="(job, i) in data.experience.slice(0, 2)"
        :key="i"
        :style="{ marginBottom: i < data.experience.slice(0, 2).length - 1 ? '10px' : '0' }"
      >
        <div style="display: flex; justify-content: space-between; align-items: baseline">
          <div>
            <div style="font-weight: 600; font-size: 13.5px; color: #111; letter-spacing: -0.005em">
              {{ trunc(job.position, 36) }}
            </div>
            <div style="color: #6b7280; font-size: 11px; margin-top: 1px">
              {{ trunc(job.company + (job.location ? ' · ' + job.location : ''), 46) }}
            </div>
          </div>
          <div style="color: #9ca3af; font-size: 10.5px; white-space: nowrap; margin-left: 8px">
            {{ job.startDate }} – {{ job.endDate || 'Present' }}
          </div>
        </div>
        <ul v-if="job.bullets?.length" style="padding-left: 14px; margin-top: 5px; color: #374151">
          <li
            v-for="(b, bi) in job.bullets.slice(0, 2)"
            :key="bi"
            :style="{ listStyle: 'disc', marginBottom: bi === 0 ? '3px' : '0' }"
          >
            {{ trunc(b, 76) }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Education -->
    <div v-if="data.education?.length" style="margin-bottom: 14px">
      <div
        :style="{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          borderBottom: '1px solid rgba(0,0,0,0.10)',
          paddingBottom: '3px',
          marginBottom: '8px',
          color: 'var(--accent)',
        }"
      >
        Education
      </div>
      <div
        v-for="(ed, i) in data.education.slice(0, 1)"
        :key="i"
        style="display: flex; justify-content: space-between; align-items: baseline"
      >
        <div>
          <div style="font-weight: 600; font-size: 13px; color: #111">
            {{ trunc((ed.degree ?? '') + (ed.field ? ' ' + ed.field : ''), 36) }}
          </div>
          <div style="color: #6b7280; font-size: 11px">{{ trunc(ed.institution, 30) }}</div>
        </div>
        <div style="color: #9ca3af; font-size: 10.5px; white-space: nowrap; margin-left: 8px">
          {{ ed.startDate }} – {{ ed.endDate }}
        </div>
      </div>
    </div>

    <!-- Skills -->
    <div v-if="data.skills?.length">
      <div
        :style="{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          borderBottom: '1px solid rgba(0,0,0,0.10)',
          paddingBottom: '3px',
          marginBottom: '8px',
          color: 'var(--accent)',
        }"
      >
        Skills
      </div>
      <div
        v-for="(skill, i) in data.skills.slice(0, 3)"
        :key="skill.category"
        :style="{
          color: '#374151',
          marginBottom: i < Math.min(data.skills.length, 3) - 1 ? '4px' : '0',
          fontSize: '12px',
        }"
      >
        <span style="font-weight: 600">{{ trunc(skill.category, 16) }}:</span>
        {{ trunc(skill.items.join(', '), 56) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
  .typewriter-cursor {
    font-weight: 300;
    font-size: 0.95em;
    color: #b8532a;
    margin-left: 1px;
    animation: tw-blink 0.75s step-end infinite;
  }

  @keyframes tw-blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>
