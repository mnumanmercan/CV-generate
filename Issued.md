# Issue — CV data not populating on Dashboard/Builder after navigation or first login

## Symptom

Sometimes, when navigating from the home page to the builder, or right after logging
in for the first time, the Dashboard or Builder showed an empty CV even though the user
had already filled one out. A hard page refresh made the data appear.

## Root cause

CV loading was driven entirely by per-view `onMounted` hooks guarded by a sticky
`cvStore.isLoaded` flag, with **no reactive link to the auth / storage-delegate state**.
The store reads through a `DelegatingStorageService` whose delegate defaults to
**local** storage and is swapped to **cloud** only inside `userStore._applyUser()`
(login / register / session-restore).

Two compounding defects followed from that:

1. **Sticky `isLoaded` survived the local → cloud swap.** A guest/boot load set
   `isLoaded = true` against the *local* backend. When the delegate later swapped to
   cloud, nothing reset `isLoaded` and nothing re-loaded — so `if (!cvStore.isLoaded)`
   in BuilderView/HomeView skipped the cloud read, leaving the form blank.

2. **Public routes raced the async delegate swap.** `/` and `/builder` don't wait on
   `isSessionRestored`, so their cold load ran against the still-local delegate before
   `restoreSession()` (two network round-trips) wired up cloud storage — intermittently
   reading the wrong backend. (`/dashboard`, `/cover-letter` are `requiresAuth`, so
   their guard already waited — which is why refresh "fixed" it.)

## Fix (solutions A + B)

- **A — reload on every delegate swap.** Added `userStore._reloadActiveCV()`, which
  clears `cvStore.isLoaded` and re-reads from the now-active backend. It is called after
  the delegate swap in `loginWithCredentials`, `register`, `restoreSession` (when
  logged in), and `clearLocalSession`.
- **B — wait for the in-flight session probe before reading.** `restoreSession()` now
  memoizes its promise and exposes `ensureSessionRestored()`; `cvStore.loadFromStorage()`
  awaits it before reading, so public-route cold loads read from the correct backend.
  The restore-path reload in A runs *after* `isSessionRestored` flips, so it can't
  deadlock awaiting its own probe.

## Files touched

- `src/stores/userStore.ts` — `_reloadActiveCV()`, memoized `restoreSession()`,
  `ensureSessionRestored()`, reload calls on auth-state changes.
- `src/stores/cvStore.ts` — `loadFromStorage()` awaits `ensureSessionRestored()`.

## Verification

`npx vue-tsc --noEmit` clean; full Vitest suite passes (22/22).
