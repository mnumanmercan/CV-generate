# CV Generate

> **ATS-Friendly Professional CV Builder** — built with Vue 3, TypeScript, and TailwindCSS.

A full-stack web application that lets users compose their CV via a structured form and watch a pixel-accurate A4 preview update in real-time. The finished document can be downloaded as an ATS-compliant PDF in one click.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture Decisions](#architecture-decisions)
  - [Storage Abstraction Layer](#storage-abstraction-layer)
  - [ATS Compliance Engine](#ats-compliance-engine)
  - [PDF Export Pipeline](#pdf-export-pipeline)
  - [Real-Time Preview](#real-time-preview)
- [CV Sections](#cv-sections)
- [Design System](#design-system)
- [Phase 2 Roadmap](#phase-2-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Feature | Description |
|---|---|
| **Split-screen builder** | 45% form panel + 55% live A4 preview on the same page |
| **Real-time preview** | Every keystroke updates the CV preview instantly via Pinia reactive state |
| **Section pulse** | Changed sections flash briefly to confirm the user's edit |
| **ATS-compliant output** | Single-column, no tables, no images in flow, standard headings, selectable PDF text |
| **Pixel-perfect PDF** | `html2pdf.js` captures the exact DOM element — what you see is what you download |
| **Auto-save** | Debounced (500ms) write to `localStorage` after every change; "Saved just now" indicator |
| **7 form sections** | Personal Info, Summary, Work Experience, Education, Skills, Projects, Certifications |
| **Drag-to-reorder** | All list sections (experience, education, skills, projects, certifications) are reorderable via drag-and-drop |
| **Skill/tech chip tags** | Press `Enter` or `,` to add animated chip tags; click `×` to remove |
| **ATS writing hints** | Real-time warnings for weak phrases, summary length, bullet character limits, date format errors |
| **Keyword density hints** | Suggests adding role-relevant keywords when the summary is thin |
| **Inline validation** | Email (RFC), phone (E.164 / local), URL (`https://` required), date (MM/YYYY) |
| **Premium feature gating** | Photo upload and extra templates are gated behind `isPremium`; clicking opens an upgrade modal |
| **Pricing page** | Free / Pro / Enterprise tier cards with FAQ section |
| **Mobile responsive** | Stacked layout on small screens with a tab switcher between form and preview |

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| **Framework** | Vue 3 (Composition API, `<script setup>`) | Reactive primitives map cleanly to form↔preview binding |
| **Language** | TypeScript (strict mode, zero `any`) | Catches interface mismatches early; all CV data is fully typed |
| **State** | Pinia | Lightweight, devtools-friendly; stores form data and UI state separately |
| **Styling** | TailwindCSS v3 + scoped CSS | Utilities for layout/spacing; scoped `@keyframes` for animations |
| **PDF** | html2pdf.js (lazy-loaded) | html2canvas renders the live DOM; jsPDF converts to A4 |
| **Build** | Vite 8 | Sub-second HMR; tree-shaking keeps html2pdf.js in its own async chunk |
| **Router** | Vue Router 4 | Hash-free history routes; route guard stub for future `/dashboard` |
| **Fonts** | DM Sans (UI) · Inter (CV) · JetBrains Mono (labels) | Google Fonts; Inter is serif-free and highly ATS-safe |
| **Lint / Format** | ESLint + Prettier | Enforces `no-any`, unused vars, and consistent style |

---

## Screenshots

### Home page
Landing page with hero, split-screen mockup, "How it works" steps, and feature grid.

### Builder
Full split-screen CV builder with the accordion form (left) and live A4 preview (right).

### CV Output
The generated CV matches the reference layout:

```
Muhammed Numan MERCAN
Full-stack Developer

email · phone · location · linkedin · github · website

PROFESSIONAL SUMMARY
───────────────────────────────────────────────────────────
Fullstack Developer with strong proficiency in JavaScript...

WORK EXPERIENCE
───────────────────────────────────────────────────────────
Web Developer                               04/2024 – 08/2025
Insider One · Istanbul, TURKIYE
  • Developing and integrating products in an agile team.
  • Proficient in CSS, JavaScript (jQuery), Git, and Go.

EDUCATION
───────────────────────────────────────────────────────────
Kocaeli University                          09/2020 – 09/2023
Bachelor of Science in Computer Engineering · GPA: 3.18

SKILLS
───────────────────────────────────────────────────────────
Tech: Javascript, Typescript, Vue, PostgreSQL, MongoDB, CSS
General: Fast Learning, Team player

PROJECTS
───────────────────────────────────────────────────────────
FULL-STACK LEARNING MANAGEMENT SYSTEM       youtube.com/...
Learning Management System integrating Jotform tutorials.
Stack: React, MySQL, Figma, TailwindCSS

CERTIFICATIONS
───────────────────────────────────────────────────────────
Javascript Algorithm and Data Structures · FreeCodeCamp   01/2023
EFSet English Certificate · EFSet                         07/2022
```

### Pricing page
Three-tier pricing cards (Free / Pro / Enterprise) with FAQ accordion.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mnumanmercan/CV-generate.git
cd CV-generate

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check with `vue-tsc` then bundle for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across all `.ts` and `.vue` files |
| `npm run format` | Run Prettier across all source files |

---

## Project Structure

```
src/
│
├── assets/
│   └── main.css               # Tailwind directives + CSS custom properties
│                              # + global animations (shimmer, slideUp, pulseBg)
│
├── components/
│   ├── form/
│   │   ├── FormField.vue      # Reusable labeled input (text/textarea/url/tel/email)
│   │   │                      # Accepts string | undefined for optional fields
│   │   ├── FormSection.vue    # Collapsible accordion section with step indicator
│   │   ├── PersonalInfoForm.vue   # Full name, job title, contact, optional URLs
│   │   │                          # Premium-gated photo upload zone
│   │   ├── SummaryForm.vue        # Textarea + character counter + ATS hints
│   │   ├── ExperienceForm.vue     # Dynamic list; drag-sort; bullet warnings
│   │   ├── EducationForm.vue      # Dynamic list; drag-sort; date validation
│   │   ├── SkillsForm.vue         # Category + chip tag input (Enter / comma)
│   │   ├── ProjectsForm.vue       # Tech stack chips + URL validation
│   │   └── CertificationsForm.vue # Date + credential ID
│   │
│   ├── preview/
│   │   └── CVPreview.vue      # A4 article (794×1123px, inline styles for
│   │                          # reliable html2canvas serialisation).
│   │                          # Reacts to highlightedSection from cvStore
│   │                          # to play the section-pulse CSS animation.
│   │
│   └── ui/
│       ├── AppHeader.vue      # Sticky glassmorphism header with nav + CTA
│       ├── SplitLayout.vue    # 45/55 split; tab switcher on mobile
│       ├── ToastNotification.vue  # success / error / info with enter/leave transitions
│       ├── LoadingSpinner.vue     # Configurable size/color spinner
│       └── UpgradePrompt.vue  # Backdrop modal triggered by userStore.openUpgradeModal()
│
├── composables/
│   ├── useAutoSave.ts         # watch(cvData, deep) → debounce 500ms → cvStore.saveToStorage()
│   ├── usePDFExport.ts        # Neutralises ancestor transforms, awaits document.fonts.ready,
│   │                          # lazy-imports html2pdf.js, restores transforms in finally
│   ├── useSubscription.ts     # Plan definitions + subscribe() stub (Phase 2)
│   └── useDragSort.ts         # Generic drag-and-drop reorder for any { id: string }[]
│
├── services/
│   ├── storageService.ts      # StorageService interface + LocalStorageService impl.
│   │                          # Swap to MongoDBService in Phase 2 by changing one export.
│   └── atsFormatter.ts        # Pure functions: validateDateFormat, validateDateRange,
│                              # normalizeHeading, stripSpecialChars, analyzeSummary,
│                              # analyzeBullet, getKeywordHints, validateUrl, validateEmail,
│                              # validatePhone, getFullCVWarnings
│
├── stores/
│   ├── cvStore.ts             # cvData ref, activeSection, highlightedSection,
│   │                          # saveIndicatorVisible, loadFromStorage, saveToStorage,
│   │                          # triggerSectionHighlight, clearData
│   └── userStore.ts           # isPremium (false in Phase 1), showUpgradeModal,
│                              # openUpgradeModal(featureName), closeUpgradeModal
│
├── types/
│   ├── cv.types.ts            # All interfaces: PersonalInfo, WorkExperience, Education,
│   │                          # Skill, Project, Certification, CVData, CVMeta
│   │                          # + factory functions: createWorkExperience(), createSkill(), …
│   └── router.d.ts            # RouteMeta augmentation (title?, requiresPremium?)
│
├── router/
│   └── index.ts               # / → Home, /builder → Builder, /pricing → Pricing,
│                              # /dashboard → stub (redirects to /pricing if !isPremium)
│
├── views/
│   ├── HomeView.vue           # Landing page: hero, split-screen mockup, steps, features, CTA
│   ├── BuilderView.vue        # Full-height split-screen; section watch triggers highlights;
│   │                          # PDF button with spinner; save indicator; UpgradePrompt
│   ├── PricingView.vue        # 3-tier pricing cards + FAQ accordion (details/summary)
│   └── DashboardView.vue      # Phase 2 stub
│
└── main.ts                    # createApp → Pinia → Router → mount
```

---

## Architecture Decisions

### Storage Abstraction Layer

`storageService.ts` exports a `StorageService` interface:

```typescript
interface StorageService {
  save(data: CVData): Promise<void>
  load(): Promise<CVData | null>
  clear(): Promise<void>
}
```

**Phase 1** exports `localStorageService` — a `LocalStorageService` singleton that writes to `window.localStorage` with graceful handling when localStorage is unavailable (private browsing, quota exceeded).

**Phase 2** will introduce a `MongoDBService` that calls a REST API. Because all stores and components import the `localStorageService` constant (not the class), swapping to MongoDB requires changing **one line**:

```typescript
// storageService.ts — the only line that changes in Phase 2:
export const localStorageService: StorageService = new MongoDBService(API_BASE_URL)
```

No component or store code needs to change.

---

### ATS Compliance Engine

`atsFormatter.ts` is a collection of pure functions — no Vue, no state, easily unit-tested.

| Function | Purpose |
|---|---|
| `validateDateFormat(date)` | Accepts `MM/YYYY` or `Present`; returns `boolean` |
| `validateDateRange(start, end)` | Ensures end ≥ start by comparing month and year integers |
| `normalizeHeading(raw)` | Maps synonyms ("Employment" → "Work Experience") to ATS-standard labels |
| `stripSpecialChars(text)` | Removes characters that ATS parsers often fail on |
| `analyzeSummary(summary)` | Returns `ATSWarning[]` for length < 50 or > 500 chars |
| `analyzeBullet(bullet, i)` | Returns `ATSWarning[]` for bullets > 120 chars |
| `getKeywordHints(summary)` | Detects weak phrases ("responsible for", "helped with") and low word count |
| `validateUrl(url)` | Requires `https://` protocol via `URL` constructor |
| `validateEmail(email)` | RFC-compliant regex |
| `validatePhone(phone)` | Accepts E.164 and common local formats |
| `getFullCVWarnings(cv)` | Runs all validations across the entire `CVData` object |

Warnings are displayed inline in the form components using `role="alert"` for accessibility.

---

### PDF Export Pipeline

The export pipeline in `usePDFExport.ts` solves five issues that caused divergence between the on-screen preview and the downloaded PDF:

1. **`transform: scale()` on parent wrapper** — `html2canvas` includes ancestor transforms in its render context. The A4 preview is visually scaled to 72% to fit the panel. Before capture, the composable walks up the DOM, records every transformed ancestor's inline style, sets them to `none`, and restores all of them in a `finally` block.

2. **Double margin** — html2pdf's `margin` option was set to 10mm on top of the CV's own `padding: 40px`. This compressed the content area to 190mm and triggered an involuntary 9% scale-down. Margin is now `[0, 0, 0, 0]`; the CV's internal padding provides all whitespace.

3. **Font readiness** — `await document.fonts.ready` ensures Inter (loaded asynchronously from Google Fonts) is fully rendered before html2canvas rasterises the element.

4. **Scroll offset** — `scrollX: 0, scrollY: 0` passed to html2canvas options plus a manual `.scrollTop = 0` on the preview container prevent cropping when the user has scrolled down.

5. **Clipping** — `overflow-hidden` was removed from the `<article>` element. Combined with `min-height: 1123px` (not `max-height`), the element grows to fit all content.

The `<article id="cv-preview">` element uses **inline styles** instead of Tailwind utility classes. Inline styles are always present in the computed style at serialisation time; class-based styles depend on the stylesheet being fully applied, which can cause subtle differences under `html2canvas`.

---

### Real-Time Preview

The reactivity chain:

```
User types in FormField (v-model)
  → updates cvData in cvStore (Pinia ref)
    → BuilderView watch() fires
      → cvStore.triggerSectionHighlight('experience')
        → CVPreview watch(highlightedSection) fires
          → pulsedSections.add('experience')
            → isPulsed() returns true for ~700ms
              → section-pulse CSS animation plays
    → useAutoSave watch(cvData, deep) fires (debounced 500ms)
      → localStorageService.save(cvData)
        → saveIndicatorVisible = true for 2.5s
```

Each section has a dedicated `watch()` in `BuilderView.vue` (rather than one deep watcher on the entire `cvData` object) so only the changed section triggers a highlight, not the whole document.

---

## CV Sections

| # | Section | Key Fields |
|---|---|---|
| 1 | **Personal Info** | Full name, job title, email, phone, location, LinkedIn, GitHub, website, photo (Pro) |
| 2 | **Professional Summary** | Free text (50–500 chars recommended); keyword hints; weak-phrase detection |
| 3 | **Work Experience** | Company, position, start/end date, location, bullet points (max 120 chars each) |
| 4 | **Education** | Institution, degree, field of study, start/end date, GPA (optional) |
| 5 | **Skills** | Category name + chip tag items (Enter / comma to add) |
| 6 | **Projects** | Name, description, tech stack chips, optional project URL |
| 7 | **Certifications** | Name, issuing org, date (MM/YYYY), optional credential ID |

All list sections (3–7) support **drag-to-reorder** and **add / remove** entries.

---

## Design System

### Color Palette (CSS custom properties)

| Variable | Value | Usage |
|---|---|---|
| `--bg-shell` | `#0F0F13` | Page background |
| `--bg-surface` | `#1A1A24` | Card / panel background |
| `--accent` | `#6366F1` | Primary action color (Indigo 500) |
| `--cv-bg` | `#FFFFFF` | CV document background |
| `--text-primary` | `#E2E8F0` | Primary UI text |
| `--text-secondary` | `#94A3B8` | Muted labels and descriptions |

### Typography

| Font | Usage | Weight |
|---|---|---|
| **DM Sans** | All UI chrome (buttons, labels, nav) | 300–700 |
| **Inter** | CV document content (preview + PDF) | 300–700 |
| **JetBrains Mono** | Form field labels, badges, counters | 400–500 |

### Animation Catalogue

| Class / Keyframe | Effect | Used on |
|---|---|---|
| `stagger-item` | `translateY(20px) → 0` + opacity, with `nth-child` delays | Page sections on load |
| `section-pulse` | Background flashes `#6366F120` for 700ms | CV preview section on edit |
| `animate-chip-in` | `scale(0.8) → 1` + opacity | Skill / tech tag on insert |
| `shimmer-btn` | Gradient sweeps from left to right | Download + CTA buttons on hover |
| `animate-spin` | Continuous rotation | Loading spinner during PDF generation |

---

## Phase 2 Roadmap

Phase 2 introduces authentication, cloud persistence, and monetisation. The codebase is pre-scaffolded for all of these:

| Feature | Scaffold location | Notes |
|---|---|---|
| **MongoDB storage** | `storageService.ts` — `StorageService` interface | Replace exported singleton; no component changes |
| **User authentication** | `userStore.ts` — `isPremium` flag | Connect to JWT/OAuth provider; update flag from API |
| **Dashboard** | `DashboardView.vue` (stub) + route guard in `router/index.ts` | Implement multi-CV management UI |
| **Payment** | `useSubscription.ts` — `subscribe()` stub | Wire to Stripe/Paddle in `subscribe()` |
| **Profile photo** | `PersonalInfoForm.vue` — upload zone | `canUploadPhoto` computed is already gated |
| **Premium templates** | `userStore.canUseExtraTemplates` | Add template selector to `BuilderView` |
| **REST API** | Not yet implemented | Will expose `/api/cv` CRUD endpoints |

---

## Contributing

1. Fork the repository and create a feature branch from `main`
2. Follow existing conventions: PascalCase components, `use` prefix composables, `camelCase.types.ts` type files
3. No `any` types — use `unknown` + type guards where the type cannot be determined at compile time
4. All new form validation must go through `atsFormatter.ts` (pure functions, no Vue dependencies)
5. Run `npm run lint && npm run build` before opening a pull request

---

## License

MIT — see [LICENSE](./LICENSE) for details.
