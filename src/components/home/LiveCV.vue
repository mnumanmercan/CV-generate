<script setup lang="ts">
  import { computed } from 'vue'
  import { useCVStore } from '@/stores/cvStore'

  const cvStore = useCVStore()

  /**
   * Default sample shown to first-time visitors who haven't started a CV yet.
   * Once the user has saved data via /builder, the live store data takes over
   * so the homepage hero feels personal even before they click anywhere.
   */
  const sample = {
    personal: {
      fullName: 'Maya Okafor',
      jobTitle: 'Senior Product Designer',
      location: 'Brooklyn, NY',
      email:    'maya@example.com',
      phone:    '+1 718 555 0142',
    },
    experience: [
      {
        company:   'Northwind Studio',
        position:  'Senior Product Designer',
        location:  'New York, NY',
        startDate: 'Mar 2022',
        endDate:   'Present',
        bullets: [
          'Led the design system migration that cut new-feature design time by 38%.',
          'Shipped seven flows for the relaunch — every one measured against WCAG AA.',
        ],
      },
    ],
    education: [
      {
        institution: 'RISD',
        degree:      'BFA',
        field:       'Graphic Design',
        startDate:   '2014',
        endDate:     '2018',
      },
    ],
    skills: [
      { category: 'Design',    items: ['Figma', 'Sketch', 'Prototyping'] },
      { category: 'Front-end', items: ['HTML', 'CSS', 'JavaScript'] },
    ],
  }

  // Switch the entire dataset wholesale rather than mixing user fields with
  // sample fields — that would produce visually awkward "Alex / Northwind"
  // hybrids on a half-filled CV.
  const hasUserData = computed(() => !!cvStore.cvData?.personal?.fullName?.trim())
  const data = computed(() => (hasUserData.value ? cvStore.cvData : sample))

  function trunc(s: string | undefined, len: number): string {
    if (!s) return ''
    return s.length > len ? s.slice(0, len) + '…' : s
  }
</script>

<!--
  Mini résumé preview rendered in Inter (matches /builder live preview + the
  exported PDF). Inline styles intentional: this card mirrors the print-side
  paper exactly so the homepage hero is a faithful "what you'll get" demo.
-->
<template>
  <div
    class="rounded-xl shadow-2xl shadow-black/15 p-7 w-full max-w-[400px] border border-overlay/8"
    style="background:#FFFFFF;color:#1a1a1a;font-family:'Inter',sans-serif;font-size:10.5px;line-height:1.65"
  >
    <!-- Header -->
    <div style="border-bottom:1px solid rgba(0,0,0,0.10);padding-bottom:11px;margin-bottom:13px">
      <div style="font-size:23px;font-weight:700;color:#111;letter-spacing:-0.012em;line-height:1.1">
        {{ trunc(data.personal.fullName, 30) }}
      </div>
      <div :style="{ fontSize:'13px', fontWeight:500, color:'var(--accent)', margin:'5px 0 6px' }">
        {{ trunc(data.personal.jobTitle, 36) }}
      </div>
      <div style="font-size:9.5px;color:#6b7280;display:flex;gap:6px;flex-wrap:wrap">
        <span>{{ trunc(data.personal.email, 24) }}</span>
        <span>·</span>
        <span>{{ trunc(data.personal.phone, 18) }}</span>
        <span>·</span>
        <span>{{ trunc(data.personal.location, 22) }}</span>
      </div>
    </div>

    <!-- Experience -->
    <div v-if="data.experience?.length" style="margin-bottom:11px">
      <div :style="{ fontSize:'8.5px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.16em', borderBottom:'1px solid rgba(0,0,0,0.10)', paddingBottom:'3px', marginBottom:'7px', color:'var(--accent)' }">
        Experience
      </div>
      <div v-for="(job, i) in data.experience.slice(0, 1)" :key="i">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div>
            <div style="font-weight:600;font-size:11.5px;color:#111;letter-spacing:-0.005em">
              {{ trunc(job.position, 30) }}
            </div>
            <div style="color:#6b7280;font-size:9.5px;margin-top:1px">
              {{ trunc(job.company + (job.location ? ' · ' + job.location : ''), 38) }}
            </div>
          </div>
          <div style="color:#9ca3af;font-size:9px;white-space:nowrap;margin-left:8px">
            {{ job.startDate }} – {{ job.endDate || 'Present' }}
          </div>
        </div>
        <ul v-if="job.bullets?.length" style="padding-left:13px;margin-top:5px;color:#374151">
          <li
            v-for="(b, bi) in job.bullets.slice(0, 2)"
            :key="bi"
            :style="{ listStyle:'disc', marginBottom: bi === 0 ? '2px' : '0' }"
          >{{ trunc(b, 64) }}</li>
        </ul>
      </div>
    </div>

    <!-- Education -->
    <div v-if="data.education?.length" style="margin-bottom:11px">
      <div :style="{ fontSize:'8.5px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.16em', borderBottom:'1px solid rgba(0,0,0,0.10)', paddingBottom:'3px', marginBottom:'7px', color:'var(--accent)' }">
        Education
      </div>
      <div
        v-for="(ed, i) in data.education.slice(0, 1)"
        :key="i"
        style="display:flex;justify-content:space-between;align-items:baseline"
      >
        <div>
          <div style="font-weight:600;font-size:11px;color:#111">
            {{ trunc((ed.degree ?? '') + (ed.field ? ' ' + ed.field : ''), 30) }}
          </div>
          <div style="color:#6b7280;font-size:9.5px">{{ trunc(ed.institution, 24) }}</div>
        </div>
        <div style="color:#9ca3af;font-size:9px;white-space:nowrap;margin-left:8px">
          {{ ed.startDate }} – {{ ed.endDate }}
        </div>
      </div>
    </div>

    <!-- Skills -->
    <div v-if="data.skills?.length">
      <div :style="{ fontSize:'8.5px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.16em', borderBottom:'1px solid rgba(0,0,0,0.10)', paddingBottom:'3px', marginBottom:'7px', color:'var(--accent)' }">
        Skills
      </div>
      <div
        v-for="(skill, i) in data.skills.slice(0, 2)"
        :key="skill.category"
        :style="{ color:'#374151', marginBottom: i < Math.min(data.skills.length, 2) - 1 ? '3px' : '0', fontSize:'10px' }"
      >
        <span style="font-weight:600">{{ trunc(skill.category, 14) }}:</span>
        {{ trunc(skill.items.join(', '), 44) }}
      </div>
    </div>
  </div>
</template>
