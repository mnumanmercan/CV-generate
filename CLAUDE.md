# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

### Frontend (run from repo root)
```bash
npm run dev            # Vite dev server on :5173 (proxies /api → :3000)
npm run build          # vue-tsc type-check + Vite production build
npm run test           # Vitest (jsdom, runs once)
npm run test:watch     # Vitest watch mode
npm run lint           # ESLint with auto-fix
npm run format         # Prettier over src/**/*.{ts,vue,css}
npx vue-tsc --noEmit   # Type-check only (faster than full build)
```

### Backend (run from repo root)
```bash
npm run dev:server          # tsx watch (hot-reload) on :3000
npm run test:server         # Vitest (node env)
npm run build --workspace=server

# Prisma (run from repo root or server/)
npm run db:migrate --workspace=server   # create & apply migration
npm run db:push --workspace=server      # sync schema without migration file
npm run db:generate --workspace=server  # regenerate Prisma client after schema change
npm run db:studio --workspace=server    # visual DB browser
npm run db:seed --workspace=server
```

### Shared package (must rebuild after schema/type changes)
```bash
npm run build:shared   # tsc compile → packages/shared/dist/
```

### Run a single test file
```bash
npx vitest run src/stores/cvStore.test.ts
npx vitest run --workspace=server src/services/auth.service.test.ts
```

---

## Monorepo Layout

```
/                        ← frontend (Vue 3 / Vite / Pinia / Tailwind)
  src/
    types/cv.types.ts    ← frontend source of truth for CVData interfaces + migrations
    stores/              ← Pinia: cvStore, userStore, themeStore, coverLetterStore
    services/            ← storageService, apiClient, apiStorageService, atsFormatter
    composables/         ← useAutoSave, usePDFExport, useSubscription, useScrollReveal…
    views/               ← page-level components
    components/          ← ui/, builder/, home/, pricing/
    router/index.ts      ← route guards, session-restore gate, session-expiry listener
  packages/shared/       ← @resumark/shared: Zod schemas + TS type re-exports
    src/schemas/         ← cv.schema.ts, coverLetter.schema.ts, auth.schema.ts…
    src/types/           ← mirror of frontend types (keep in sync manually)
  server/                ← Express 5 API
    prisma/schema.prisma ← PostgreSQL via Prisma 7
    src/
      config/env.ts      ← Zod-parsed env vars; process.exit(1) on invalid config
      middleware/        ← authenticate, validate, rateLimiter, errorHandler
      routes/            ← auth, cv, coverLetter, billing, user, waitlist
      services/          ← business logic layer (called by controllers)
      controllers/       ← thin HTTP handlers
      utils/             ← jwt.ts, apiError.ts
```

---

## Critical Architecture Patterns

### Adding a new CVData field
Changes are required in **three places** — missing any one silently drops data:

1. **`src/types/cv.types.ts`** — add to the TypeScript interface + update `migrateCVData()` if existing stored documents won't have the field
2. **`packages/shared/src/types/cv.types.ts`** — mirror the interface change (kept in sync manually)
3. **`packages/shared/src/schemas/cv.schema.ts`** — add to the Zod schema

Then run `npm run build:shared` so the server picks up the new schema. Zod's `z.object()` **strips unknown keys** — if the Zod schema is missing a field, the `validate()` middleware silently discards it before any controller or Prisma JSONB write sees it.

### Storage delegate pattern
`DelegatingStorageService` (in `storageService.ts`) wraps either `LocalStorageService` (guests) or `ApiCVStorageService` (logged-in). `userStore` calls `setDelegate()` on login/logout. `cvStore` only ever calls `localStorageService.save/load/clear()` — it never knows which backend is active.

### Auto-save chain
`useAutoSave()` deep-watches `cvStore.cvData` with a 500ms debounce. It skips saves while `cvStore.loadingData` is true (prevents re-saving the just-loaded data). Both `/builder` and `HomeView` mount `useAutoSave()`.

### Authentication (RS256 JWT)
- **Access token**: in-memory only (`_accessToken` in `apiClient.ts`), never localStorage
- **Refresh token**: HttpOnly cookie, hashed in the `Token` table, checked against a Redis blacklist (`bl:{jti}`)
- `authenticate` middleware is strict (401 if absent); `authenticateOptional` never blocks
- On persistent 401s, `apiClient` dispatches `resumark:session-expired` — the router listener calls `userStore.clearLocalSession()` (not `logout()`) to avoid a second failing API call

### CV schema versioning
`CURRENT_VERSION = '1.2.0'` in `src/types/cv.types.ts`. `migrateCVData()` runs on every `loadFromStorage()`. Add a new `case` for each version bump; cases fall through to fill all migration steps.

### Zod validation middleware
`validate(schema)` replaces `req.body` with `result.data` (the Zod-parsed, stripped output). All API routes that accept a body use it.

---

## Design System

Defined in `src/assets/main.css`. CSS custom properties are the source of truth — Tailwind extends map to them.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#F6F2EA` | `#1A1916` | Page background |
| `--ink` | `#12110F` | `#F6F2EA` | Primary text |
| `--accent` | `#B8532A` | `#D97E4F` | Sienna — single accent color |
| `--muted` | ~`#7A766B` | darker | Secondary text |

**Typography rules:**
- `font-display` (Instrument Serif) — headlines only; use `accent-italic` for the one italic emphasis word per headline
- `font-sans` (DM Sans) — all UI chrome
- Inter — inside CV preview and PDF export only (inline styles, for html2canvas reliability)
- `mono-eyebrow` utility — JetBrains Mono, uppercase, `letter-spacing: 0.16em`; use for section eyebrows and labels

**Tailwind utilities to prefer:** `paper-card`, `btn-primary`, `btn-ghost`, `btn-accent`, `mono-eyebrow`, `accent-italic`, `font-display`, `tracking-editorial`

No gradients. No teal. No emoji. Sienna is the only accent.

---

## Environment Variables (server)

Required: `DATABASE_URL`, `JWT_PRIVATE_KEY_B64`, `JWT_PUBLIC_KEY_B64`

Optional (features degrade gracefully if absent):
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — token blacklisting; falls back to in-process MemoryStore
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO_*` — billing returns 503 without them
- `RESEND_API_KEY` — email (password reset, verify) returns 503 without it

`env.ts` validates all vars at startup via Zod and calls `process.exit(1)` on failure.

---

## Rate Limiters

Five named limiters in `server/src/middleware/rateLimiter.ts`:
- `authLimiter` — 10 req / 15 min (login, register)
- `passwordResetLimiter` — 5 req / hr
- `refreshLimiter` — 30 req / min
- `apiWriteLimiter` — 60 req / min (CV save, cover letter save)
- `apiReadLimiter` — 120 req / min
- `waitlistLimiter` — 3 req / hr

When `UPSTASH_REDIS_REST_URL` is configured, counters are shared via Redis; otherwise per-process MemoryStore.

---

## Plan / Feature Gating

`TEMPLATE_PLAN_MAP` and `ALLOWED_TEMPLATES_BY_PLAN` in `packages/shared/src/constants/plans.ts` control which templates each plan unlocks. `CV_LIMIT` caps how many CVs a FREE user can store. `useSubscription.ts` composable exposes the Pro features list and plan comparison data to the pricing UI.

`authorize` middleware (server) checks `req.user.plan` for plan-gated routes. `userStore.isPremium` gates Pro UI affordances on the frontend.
