<script setup lang="ts">
  import type { CoverLetterData } from '@/types/coverLetter.types'

  defineProps<{ clData: CoverLetterData }>()
</script>

<template>
  <!-- A4 at 96dpi: 794 × 1122px (floor of 297mm × 96/25.4). Inline styles only for PDF fidelity. -->
  <article
    id="cover-letter-preview"
    style="
      width: 794px;
      min-height: 1122px;
      background: #ffffff;
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a2e;
      padding: 56px 64px;
      box-sizing: border-box;
      position: relative;
      box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35);
    "
  >
    <!-- ── Sender header ────────────────────────────────────── -->
    <header style="margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #0891B2;">
      <p
        style="
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
          letter-spacing: -0.3px;
        "
      >{{ clData.fullName || 'Your Name' }}</p>
      <p style="font-size: 13px; color: #475569; margin: 0 0 8px;">{{ clData.jobTitle }}</p>
      <p style="font-size: 12px; color: #64748b; margin: 0; display: flex; flex-wrap: wrap; gap: 0;">
        <span v-if="clData.email">{{ clData.email }}</span>
        <span v-if="clData.email && (clData.phone || clData.location)" style="margin: 0 8px; color: #cbd5e1;">·</span>
        <span v-if="clData.phone">{{ clData.phone }}</span>
        <span v-if="clData.phone && clData.location" style="margin: 0 8px; color: #cbd5e1;">·</span>
        <span v-if="clData.location">{{ clData.location }}</span>
      </p>
    </header>

    <!-- ── Date ────────────────────────────────────────────── -->
    <p style="font-size: 13px; color: #64748b; margin: 0 0 24px; text-align: right;">
      {{ clData.date }}
    </p>

    <!-- ── Recipient address block ─────────────────────────── -->
    <div style="margin-bottom: 28px;">
      <p
        v-if="clData.recipientName"
        style="font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 2px;"
      >{{ clData.recipientName }}<span v-if="clData.recipientTitle">, {{ clData.recipientTitle }}</span></p>
      <p
        v-if="clData.companyName"
        style="font-size: 13px; color: #0f172a; margin: 0 0 2px;"
      >{{ clData.companyName }}</p>
      <p
        v-if="clData.companyAddress"
        style="font-size: 13px; color: #475569; margin: 0; white-space: pre-line;"
      >{{ clData.companyAddress }}</p>
    </div>

    <!-- ── Salutation ──────────────────────────────────────── -->
    <p style="font-size: 13.5px; color: #0f172a; margin: 0 0 20px; font-weight: 500;">
      Dear {{ clData.recipientName || 'Hiring Manager' }},
    </p>

    <!-- ── Body ───────────────────────────────────────────── -->
    <div style="font-size: 13.5px; line-height: 1.75; color: #1e293b;">
      <p
        v-if="clData.opening"
        style="margin: 0 0 16px; white-space: pre-wrap;"
      >{{ clData.opening }}</p>
      <p
        v-if="clData.bodyWhy"
        style="margin: 0 0 16px; white-space: pre-wrap;"
      >{{ clData.bodyWhy }}</p>
      <p
        v-if="clData.bodyBring"
        style="margin: 0 0 16px; white-space: pre-wrap;"
      >{{ clData.bodyBring }}</p>
      <p
        v-if="clData.closing"
        style="margin: 0 0 32px; white-space: pre-wrap;"
      >{{ clData.closing }}</p>
    </div>

    <!-- ── Closing ─────────────────────────────────────────── -->
    <div style="font-size: 13.5px; color: #0f172a;">
      <p style="margin: 0 0 32px;">{{ clData.signature }}</p>
      <p style="font-weight: 600; margin: 0;">{{ clData.fullName || 'Your Name' }}</p>
    </div>

    <!-- Placeholder hint when letter is empty -->
    <div
      v-if="!clData.opening && !clData.bodyWhy && !clData.bodyBring"
      style="
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        opacity: 0.25;
      "
    >
      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#0891B2">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p style="font-size: 14px; color: #0891B2; margin-top: 12px; text-align: center;">
        Fill in the form to see your cover letter
      </p>
    </div>
  </article>
</template>
