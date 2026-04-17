# Resumark — Project Status & Roadmap

> **Living project document** — compiled as of 2026-04-17 by the engineering & product leadership.
> Owners: Numan (founder/engineer). Branch-of-truth: `main`. Current working branch: `issues-fix`.

---

## Table of Contents

1. [Project Objective](#1-project-objective)
2. [Vision & Differentiators](#2-vision--differentiators)
3. [Target Users & Personas](#3-target-users--personas)
4. [Technical Infrastructure (Current State)](#4-technical-infrastructure-current-state)
5. [Repository & Code Structure](#5-repository--code-structure)
6. [Completed Work — Phase by Phase](#6-completed-work--phase-by-phase)
7. [Known Issues & Technical Debt](#7-known-issues--technical-debt)
8. [Roadmap — What's Next](#8-roadmap--whats-next)
9. [New Feature Ideas for Evaluation](#9-new-feature-ideas-for-evaluation)
10. [Architecture & Process Adjustments](#10-architecture--process-adjustments)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Success Metrics](#12-success-metrics)

---

## 1. Project Objective

**Resumark is a privacy-first, ATS-compliant professional CV builder delivered as a single-page web application.**

The product lets anyone — from a student writing their first résumé to a senior engineer updating theirs between jobs — build a polished, ATS-parseable CV in under five minutes. The user fills in a structured form on the left; a pixel-accurate A4 preview updates in real time on the right; one click exports a PDF that is identical to the preview.

Concretely, the project's objective is to deliver three things:

| Outcome | What it means |
|---|---|
| **Best-in-class default output** | A CV that passes every major ATS parser on first submission, with zero manual formatting by the user. |
| **No-friction entry** | Fully usable without an account; data lives in the user's own browser by default. Pro features (cloud sync, cover letters, multiple CVs) are opt-in. |
| **Sustainable monetisation** | A free-forever core with a thin, high-value Pro tier ($9/mo target) that funds ongoing development. |

Non-goals (explicit): graphical CVs with heavy visuals, multi-column creative layouts, AI-generated résumé content. These conflict with ATS compliance, which is the product's core value proposition.

---

## 2. Vision & Differentiators

The CV-builder market is crowded. Resumark's wedge is **correctness by default + respect for the user's data**.

| Competitor pattern | Resumark's stance |
|---|---|
| Two-column "designer" CVs that break ATS parsers | Single-column, standard-headings, machine-parseable text only |
| Mandatory sign-up behind a paywall to export | No account required; first export is free and immediate |
| Data shipped to a server on every keystroke | Default storage is `localStorage`; cloud sync is opt-in and only for Pro |
| Fixed templates with no live feedback | Real-time preview + inline ATS hints (weak phrases, date format, bullet length) |
| Slow, opaque PDF generation | Lazy-loaded `html2pdf.js`; the PDF is a direct capture of the DOM the user saw |

---

## 3. Target Users & Personas

1. **"First-time applicant"** — recent graduate, needs a clean CV fast, no idea what ATS means. Resumark's ATS hints educate them while they type.
2. **"Mid-career switcher"** — 3–8 years in a role, applying to 20+ positions, needs multiple CV variants. Pro tier's **Multiple CVs** + **Cover Letter** features target this persona.
3. **"Privacy-conscious senior"** — 10+ years, does not want their résumé sitting in another startup's database. The localStorage-only Free tier is built for them.

---

## 4. Technical Infrastructure (Current State)

### 4.1 Frontend stack

| Layer | Choice | Version | Rationale |
|---|---|---|---|
| Framework | Vue 3 | 3.5.x | Composition API maps cleanly to form↔preview reactivity |
| Language | TypeScript | 5.9.x, strict, zero `any` | Catches interface mismatches at build time |
| State | Pinia | 3.x | Lightweight; devtools-friendly; composition-style stores |
| Styling | TailwindCSS 3 + scoped CSS | 3.4.x | Utilities for layout; scoped `@keyframes` for animations |
| Router | Vue Router | 4.6.x | History mode; per-route guards |
| Build | Vite | 8.x | Sub-second HMR; dynamic chunk for html2pdf |
| PDF | html2pdf.js | 0.14.x | Single-dep pipeline: html2canvas + jsPDF |
| Drag | vue-draggable-plus | 0.6.x | Sortable.js wrapper with Vue 3 bindings |

### 4.2 Backend stack (scaffolded; `server/` workspace)

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 24 | Latest LTS; native fetch, test runner |
| HTTP | Express 5 | Mature, minimal; team familiarity |
| ORM | Prisma 7 | Type-safe queries; generates client from schema |
| Database | PostgreSQL 18 (local dev) | Relational fit for users/CVs/subscriptions; JSONB for CV content |
| Auth | JWT access + HttpOnly refresh cookie | Short-lived access token in memory; refresh is XSS-proof |
| Payments | Stripe (stub in place) | Industry-standard checkout + webhooks |

Approved as an Architecture Decision (ADR) on 2026-04-12.

### 4.3 Data model (authoritative)

Defined in `src/types/cv.types.ts` — used by frontend AND backend (via `packages/shared`).

```
CVData
├── personal      PersonalInfo      (name, title, contact, optional URLs, optional photo)
├── summary       string            (free text; 50–500 chars recommended)
├── experience    WorkExperience[]  (company, position, dates, location, bullets[])
├── education     Education[]       (institution, degree, field, dates, GPA)
├── skills        Skill[]           (category + items[] as chip tags)
├── projects      Project[]         (name, description, techStack[], link)
├── certifications Certification[]  (name, issuer, date, credentialId, credentialUrl)
└── meta          CVMeta            (createdAt, updatedAt, version, templateId, sectionOrder[])
```

Schema versioning is first-class: `CURRENT_VERSION = '1.1.0'` and `migrateCVData()` runs on every load. Future schema changes add a new migration case; old blobs upgrade transparently.

### 4.4 Storage abstraction (the keystone)

`DelegatingStorageService` wraps either `LocalStorageService` (guest) or `ApiCVStorageService` (logged-in). `userStore.logout()` / `_applyUser()` toggle the delegate. **Every component and store imports the delegate constant, never a concrete class** — so the 450-line frontend stays completely unaware of whether data lives in the browser or in Postgres.

```
cvStore ──► localStorageService (DelegatingStorageService)
                 │
                 ├─► LocalStorageService   (guest path)
                 └─► ApiCVStorageService    (authenticated path)
```

The same pattern applies to `coverLetterStorageService`.

### 4.5 Reactivity & auto-save chain

```
User types in FormField (v-model)
   └─► cvStore.cvData mutates (Pinia reactive ref)
         ├─► BuilderView snapshot watcher → cvStore.triggerSectionHighlight(key)
         │     └─► CVPreview animation plays for ~700ms
         └─► useAutoSave deep watcher → debounced 500ms
               └─► cvStore.saveToStorage()
                     └─► localStorageService.save() → delegate (Local or API)
                           └─► saveIndicatorVisible flashes for 2.5s
```

Guards in place:
- `loadingData` flag suppresses auto-save during initial hydration
- `isSaving` flag prevents concurrent saves
- `try/finally` ensures `isSaving` clears even when the API throws a `StorageError`
- `.catch()` on debounced saves prevents uncaught promise rejections

---

## 5. Repository & Code Structure

```
claude-cv/
├── src/                         # Vue 3 SPA
│   ├── main.ts                  # createApp → Pinia → restoreSession → Router → mount
│   ├── App.vue                  # <RouterView /> + ThemeToggle
│   │
│   ├── router/index.ts          # 7 routes + beforeEach guard + session-expiry listener
│   │
│   ├── views/
│   │   ├── HomeView.vue             # Landing: hero, personalised mockup, features, CTA
│   │   ├── BuilderView.vue          # Split-pane form ↔ preview; auto-save; PDF export
│   │   ├── CoverLetterView.vue      # Pro-only cover letter builder
│   │   ├── DashboardView.vue        # Plan-aware dashboard (Free vs Pro variants)
│   │   ├── PricingView.vue          # 3-tier pricing + FAQ
│   │   ├── LoginView.vue            # Email/password login
│   │   └── RegisterView.vue         # Email/password registration
│   │
│   ├── stores/
│   │   ├── cvStore.ts               # cvData, loadingData, isLoaded, load/save/clear
│   │   ├── coverLetterStore.ts      # clData + internal auto-save watcher
│   │   ├── userStore.ts             # auth state, delegate switching, upgrade modal
│   │   └── themeStore.ts            # dark/light with smooth CSS transition
│   │
│   ├── services/
│   │   ├── storageService.ts        # CV storage interface + Local + Delegating
│   │   ├── coverLetterStorageService.ts
│   │   ├── apiStorageService.ts     # ApiCVStorageService + ApiCoverLetterStorageService + StorageError
│   │   ├── apiClient.ts             # fetch wrapper: timeouts, refresh retry, session-expired event
│   │   └── atsFormatter.ts          # Pure validators & ATS hints
│   │
│   ├── composables/
│   │   ├── useAutoSave.ts           # Deep watch + 500ms debounce + .catch()
│   │   ├── usePDFExport.ts          # Neutralise transforms; await fonts; lazy-load html2pdf
│   │   ├── usePreviewZoom.ts        # Shared zoom logic for Builder + CoverLetter
│   │   ├── useScrollReveal.ts       # v-reveal directive via IntersectionObserver
│   │   ├── useDragSort.ts           # Generic { id: string }[] reorder helper
│   │   └── useSubscription.ts       # Plan definitions + Stripe-stub subscribe()
│   │
│   ├── components/
│   │   ├── form/                    # 7 section forms + FormField + FormSection + SkillsForm
│   │   ├── preview/                 # CVPreview + TemplatePicker
│   │   ├── templates/               # ClassicTemplate, ModernMinimalTemplate, TechnicalTemplate
│   │   │   ├── classic/sections/
│   │   │   ├── modern/sections/
│   │   │   ├── technical/sections/
│   │   │   └── registry.ts
│   │   ├── cover-letter/            # RecipientForm, DetailsForm, ContentForm, Preview
│   │   └── ui/                      # Header, Footer, Toast, Spinner, ConfirmModal, etc.
│   │
│   ├── types/
│   │   ├── cv.types.ts              # CVData + factories + migrateCVData()
│   │   ├── coverLetter.types.ts
│   │   └── router.d.ts              # RouteMeta augmentation
│   │
│   ├── constants/timing.ts          # Centralised debounce/flash durations
│   └── assets/main.css              # Tailwind + custom props + animations
│
├── server/                      # Express 5 + Prisma 7 backend (Node 24, Postgres 18)
│   ├── prisma/schema.prisma     # User, CV, CoverLetter, Subscription
│   └── src/                     # controllers, middleware, routes, services
│
├── packages/
│   └── shared/                  # Shared types between FE and BE
│
├── API_DOCS.md                  # REST endpoint contract
├── README.md                    # Public-facing overview
├── Resumark.md                  # ← you are here
└── [config: vite, tsconfig, tailwind, eslint, prettier, …]
```

---

## 6. Completed Work — Phase by Phase

### Phase 0 — MVP Foundation (✅ done)

**Scope:** single-page CV builder, local-only storage, PDF export.

- [x] Vue 3 + TypeScript + Vite scaffold with strict type-checking
- [x] Full `CVData` schema + factory functions + JSON serialisation
- [x] `LocalStorageService` with graceful failure (private browsing, quota, etc.)
- [x] 7 form sections with inline validation
- [x] Live A4 preview with inline styles (html2canvas-safe)
- [x] html2pdf.js pipeline with ancestor-transform neutralisation and font-readiness await
- [x] Pinia store for CV state with auto-save composable
- [x] Landing page, pricing page, routing

### Phase 1 — UX Polish & Feature Depth (✅ done)

**Scope:** everything that makes the MVP feel "shipped".

- [x] **Drag-to-reorder** — both within-section (bullets, list items) and across-section (page layout)
- [x] **ATS writing hints** — weak-phrase detection, bullet character limit, summary length, keyword density
- [x] **Section pulse animation** on edit (700ms flash on the changed section in the preview)
- [x] **Skill / tech chip-tag input** (Enter or comma to add, animated insertion)
- [x] **Mobile responsive** with tab-switcher between form and preview
- [x] **Three templates** — Classic, Modern Minimal, Technical — each with its own section sub-components
- [x] **Dark / light theme** with smooth CSS transition (rAF-guarded to prevent flicker)
- [x] **Schema migrations** (`CURRENT_VERSION` + `migrateCVData()`)

### Phase 2 — Auth, Cloud Sync, & Monetisation Scaffold (✅ done)

**Scope:** move the product from "local-only tool" to "account-backed SaaS".

- [x] **Dummy auth UI** — Login + Register pages with validation
- [x] **JWT auth flow** — access token (in-memory) + refresh token (HttpOnly cookie)
- [x] **Storage delegate pattern** — one-line switch between `LocalStorageService` and `ApiCVStorageService`
- [x] **Plan gating** — `userStore.isPremium` gates photo upload, extra templates, cover letter
- [x] **Dashboard** — plan-aware UI (Free variant vs Pro variant)
- [x] **Cover Letter Generator** — full Pro feature: recipient form, details, content, live preview, PDF export
- [x] **Upgrade modal** — triggered by any attempt to use a gated feature
- [x] **Backend v0** — Express 5 API with `/auth/*`, `/cv`, `/cover-letter`, Stripe stubs
- [x] **API documentation** (`API_DOCS.md`, 490+ lines)

### Phase 2.5 — Production Hardening (✅ done, on `issues-fix` branch)

**Scope:** architecture review response, runtime bug fixes, SPA state correctness.

- [x] **ADR-002 architecture review** — 23 issues identified across 10 subsystems
- [x] **Data safety** — deep-clone before save, try/finally on isSaving, Promise error propagation
- [x] **PDF correctness** — A4 overflow warning, inline font fallbacks, transform restoration
- [x] **Accessibility** — `role="radiogroup"` on template picker, roving tabindex, ARIA labels on drag handles
- [x] **API client** — AbortController timeout leak fixed, HTTPS production guard, session-expired event handling
- [x] **Router** — session-expiry listener registered inside `isReady()` (safe Pinia access), explicit guard return
- [x] **Stores** — single JSON-snapshot watcher replacing 7 deep watchers (~7× fewer Vue traversals per keystroke)
- [x] **Composables extracted** — `usePreviewZoom` eliminated ~40 lines of duplication between Builder & CoverLetter
- [x] **ConfirmModal** — replaces `window.confirm` with an accessible, teleported modal
- [x] **DX** — re-enabled `vue/multi-word-component-names`; removed redundant `jspdf` dep
- [x] **SkillsForm** — duplicate warning persists until refocus (was auto-dismissing too fast)
- [x] **Typography** — font fallbacks in all templates for reliable PDF rendering
- [x] **4 runtime bugs fixed**:
  1. `getBoundingClientRect` null inside RAF (captured event data synchronously)
  2. Uncaught `StorageError` in `useAutoSave` (added `.catch()`)
  3. Uncaught `StorageError` in `coverLetterStore` (added `.catch()`)
  4. Logout UI refresh on free user (fixed via clearData synchronous reset)
- [x] **SPA stale-data-after-logout** (root-cause fix):
  - `handleLogout` now uses `cvStore.clearData()` (synchronous in-memory reset) instead of `loadFromStorage()`
  - HomeView's personalised mockup is a `computed` from `cvStore.cvData`, not an independent localStorage read
  - `cvStore.isLoaded` flag added to skip redundant loads on HomeView mount
  - Eliminates the Vue-watcher race that caused stale data to flash after logout

---

## 7. Known Issues & Technical Debt

| # | Issue | Severity | Notes |
|---|---|---|---|
| 1 | **ESLint 10 flat config** not present | Low | Project has `.eslintrc.cjs`; ESLint 10 requires `eslint.config.js`. Lint is bypassed in favour of `vue-tsc --noEmit` + `vite build`. |
| 2 | **Backend integration not wired end-to-end** | Medium | `server/` runs; API endpoints exist; but no CI, no deployed environment, no smoke test harness. |
| 3 | **Stripe integration is a stub** | Medium | `useSubscription.subscribe()` doesn't open Checkout yet. Webhook handler is a no-op. |
| 4 | **html2pdf.js chunk is 935 KB (265 KB gzip)** | Low | Acceptable today; it's lazy-loaded on Download click. Consider `pdf-lib` in the future if size matters. |
| 5 | **No automated tests** | Medium | No unit/integration/e2e test suite. `atsFormatter.ts` pure functions are the lowest-hanging fruit for Vitest. |
| 6 | **Cover Letter API validation failures surface as warnings only** | Low | User sees no UI indication the save failed. Toast would improve feedback. |
| 7 | **Backend has no rate limiting on `/auth/*`** | Medium | Before public launch: add `express-rate-limit` on login/register to mitigate credential stuffing. |
| 8 | **No CSRF protection on state-changing endpoints** | Medium | Refresh token is HttpOnly, but the access-token path could still benefit from a SameSite strict policy review. |
| 9 | **Guest→Pro data migration on first login** is not implemented | Medium | If a guest user builds a CV then registers, their localStorage data does NOT upload to the cloud automatically. Silent data loss risk. |
| 10 | **Observability is console-only** | Medium | No structured logging, no Sentry, no metrics on backend. Harder to diagnose production issues. |

---

## 8. Roadmap — What's Next

Sequenced by dependency and user value. Each phase closes with a ship-able release.

### Phase 3 — Backend Wire-Up & Deploy (Next up)

**Goal:** take the `server/` workspace from "compiles" to "running in production".

- [ ] Provision Postgres 18 on managed host (Neon / Supabase / Railway)
- [ ] Provision backend host (Railway / Fly / Render)
- [ ] Set up CI on GitHub Actions: typecheck, build, Prisma migrate-deploy, deploy on green
- [ ] Add `express-rate-limit` to `/auth/login` and `/auth/register` (10 req / 15 min / IP)
- [ ] Add structured logging (pino) with request IDs
- [ ] Wire Sentry (or equivalent) on both FE and BE
- [ ] Smoke-test harness: register → login → save CV → load CV → delete → logout
- [ ] Production HTTPS enforcement (already guarded in `apiClient.ts`)

### Phase 4 — Monetisation Live

**Goal:** accept real payments; Pro features gated by verified subscription status.

- [ ] Stripe Checkout session creation endpoint
- [ ] Stripe webhook endpoint: `customer.subscription.*` events update `User.subscriptionStatus`
- [ ] Customer Portal link for subscription management
- [ ] Graceful downgrade path: when subscription lapses, cloud data becomes read-only; user can export but not save
- [ ] "Grace period" email sequence (1 day before, day of, 7 days after)
- [ ] Pricing page: replace "Subscribe" stub with real Checkout redirect

### Phase 5 — Guest→Pro Seamless Upgrade

**Goal:** zero data loss when a guest user decides to register.

- [ ] On successful registration, check for localStorage CV data
- [ ] If present, POST it to `/cv` (creates cloud record) and keep local copy as backup for 7 days
- [ ] Show a toast: "Your local CV has been saved to your account."
- [ ] Same flow for cover letter data

### Phase 6 — Multi-CV Support (major Pro feature)

**Goal:** Pro users can maintain several CV variants (e.g., "Frontend", "Full-stack", "Engineering Manager").

- [ ] Schema: `CV.label` (nullable string), `User.activeCvId`
- [ ] Dashboard CV grid with thumbnails, labels, last-edited
- [ ] "Duplicate CV" and "Rename" actions
- [ ] Builder URL param `/builder?cv=<id>` to select active CV
- [ ] Cap: 5 CVs for Pro, 20 for future Enterprise

### Phase 7 — Testing Infrastructure

**Goal:** regression-proof the product before major refactors.

- [ ] Vitest unit tests for `atsFormatter.ts` (pure functions, trivially testable)
- [ ] Vitest unit tests for store mutations (loadFromStorage, clearData, migrateCVData)
- [ ] Component tests for critical forms (PersonalInfo, Experience with drag-reorder, SkillsForm with chip input)
- [ ] Playwright e2e: happy path (register → build CV → export PDF → logout → login → CV restored)
- [ ] CI gate: all tests must pass before merge

---

## 9. New Feature Ideas for Evaluation

These are **under consideration**, not committed. Ranked by estimated impact × feasibility.

### High-value

1. **CV-to-Cover-Letter autofill** — one click drafts a cover letter with the user's name, most-recent role, and target company from the CV. Dramatically speeds up the Pro-tier use case.
2. **Shareable preview link** — read-only public URL (e.g., `resumark.app/p/abc123`) that recruiters can open. No file download needed. Great viral loop.
3. **PDF "theme packs"** — colour variants (navy, burgundy, forest) layered on top of the existing ATS-safe templates. Pro-only.
4. **LinkedIn import** — parse a LinkedIn profile export (JSON / PDF) into `CVData`. Removes the biggest entry-friction point.
5. **AI writing assistant** (gated carefully) — "rewrite this bullet in achievement form" suggestion that runs client-side via an Anthropic API proxy. Opt-in per field; never auto-applies; results are prefixed "Suggested".

### Medium-value

6. **Multi-language UI** — Turkish + English first (founder is TR-native; market is bilingual)
7. **Version history per CV** (Pro) — restore any of the last 30 auto-saves
8. **Resume score** — single 0–100 number summarising ATS compliance, keyword density, bullet quality
9. **"Tailor for this job"** — paste a job description, get highlighted keywords missing from CV
10. **Dark-mode PDF** — currently PDFs are always light; some users specifically want dark for digital portfolios

### Exploratory

11. **Browser extension** — "Apply with Resumark" button on LinkedIn, Indeed, Wellfound
12. **Email-a-copy** — send the PDF to yourself / to a recruiter from within the app
13. **Team accounts** (Enterprise tier) — career coaches managing CVs for multiple clients
14. **Referral program** — free month for every successful referral

### Explicitly declined (for now)

- Graphical / multi-column / "creative" templates → violates ATS-first principle
- AI cover letter autowrite from prompt → risk of generic output; user-edit cycle is the feature
- Video CV support → niche; no evidence of demand in target personas

---

## 10. Architecture & Process Adjustments

Lessons from the last 5 commits of production-hardening. These shape how we build going forward.

### Code-level patterns now canonical

- **Synchronous-first state resets** — any function that clears state should set the reactive ref before any `await`. We discovered that Vue watchers can race with async storage operations; synchronous resets eliminate the race.
- **Single source of truth per view** — HomeView used to have an independent localStorage read in parallel to `cvStore`. That second source drifted on logout. Rule: **if the data exists in a Pinia store, views read from the store**.
- **`.catch()` on every fire-and-forget Promise** — especially inside `setTimeout` callbacks. Uncaught promise rejections from the debounced auto-save surfaced as red errors in the console for the last two weeks before we plugged them.
- **Capture event data synchronously before `requestAnimationFrame`** — `event.currentTarget` is nulled by the browser after the handler returns. Always grab what you need into locals before the RAF.
- **`try/finally` around any `isSaving`-style flag** — a thrown error inside a critical section must not deadlock future saves.

### Process adjustments

- **ADR per major decision** — we already have ADR-001 (backend stack) and ADR-002 (architecture review). Continue this: every non-trivial fork in the road gets an ADR before code.
- **Pre-merge checklist** — typecheck (`vue-tsc --noEmit`) + production build (`vite build`) must both pass. ESLint is currently blocked by a tooling issue; re-enable after flat-config migration (low-priority).
- **Never commit without `git diff` first** — caught three accidental changes to `.vscode/extensions.json` already. Staging by explicit file, not `-A`.
- **Branch-per-scope** — `issues-fix` has become a multi-scope branch. Going forward, new scopes (Phase 3, Phase 4) get their own branches off `main`.

### Observability deficit

Today we diagnose bugs from user screenshots and console logs. Before a public launch we need:
- Frontend error tracking (Sentry)
- Backend structured logs (pino + log aggregator)
- Basic metrics: daily active users, CV saves, PDF exports, Pro conversions

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **html2pdf.js renders differently across browsers** | Medium | High | Cross-browser PDF snapshot tests (Playwright screenshot assertion) before each release |
| **User localStorage quota exceeded** (big CV + photo) | Low | Medium | Already handled with `try/catch` + graceful `isAvailable()` check; add user-facing warning when near quota |
| **Backend data loss** (no backup strategy yet) | High until Phase 3 | Catastrophic | Mandatory: managed Postgres with automatic daily backups before any real user data touches the system |
| **Stripe webhook spoofing** | Medium | High | Always verify `Stripe-Signature` header with `constructEvent()`; never trust request body alone |
| **Refresh token theft via XSS** | Low (HttpOnly) | High | Strict CSP; SRI on third-party scripts; ongoing audit for innerHTML/v-html usage |
| **Schema migration breaks old blobs** | Low | High | Every version bump ships with a `case` in `migrateCVData()` and a sample blob in test fixtures (to be added) |
| **Solo-dev bus factor** | High (team of 1) | Very high | Comprehensive ADRs, this document, and inline code comments; seek a second reviewer for high-risk PRs |

---

## 12. Success Metrics

What "shipped well" looks like, phase by phase.

### Phase 3 (Backend Live)

- 99.5% uptime on API endpoints (measured weekly)
- p95 API response time < 300 ms for `/cv` CRUD
- Zero data-loss incidents
- Authenticated user can go guest → register → save → logout → login → data present

### Phase 4 (Monetisation Live)

- First paying customer within 30 days of Stripe go-live
- Checkout conversion rate > 2% of Pro-CTA clicks
- Less than 5% failed payments

### Phase 5–6 (Guest→Pro + Multi-CV)

- > 80% of registering users who had localStorage data successfully upload it on first login
- Pro users who create ≥ 2 CVs within first week are 3× more likely to retain at month 3

### Long-term product KPIs

- Daily active users
- CVs exported per week
- Pro conversion rate from Free
- Monthly churn
- ATS-compliance-hint engagement (% of sessions where a hint was acted on)

---

## Appendix A — Current Git State

- Branch `main` — last release-worthy commit
- Branch `issues-fix` — Phase 2.5 production hardening (5 commits ahead, ready to merge after user verification)
- No open PRs

## Appendix B — Key Contacts & Resources

- Public repo: https://github.com/mnumanmercan/CV-generate
- API documentation: `API_DOCS.md`
- Architecture Decision Records: (to be consolidated in `docs/adr/` — see Phase 7)
- Public-facing overview: `README.md`

---

_This document is the source of truth for project state. Update it whenever a phase closes, a major decision is made, or a new risk emerges._
