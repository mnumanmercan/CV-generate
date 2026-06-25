/** Milliseconds to debounce auto-save triggers after the last keystroke. */
export const AUTOSAVE_DEBOUNCE_MS = 500

/**
 * Fallback pause after a rate-limited (429) auto-save when the server sends no
 * `Retry-After` header. Matches the server read/write limiter window (60s) so
 * the bucket has fully reset before we retry — prevents the client from
 * hammering a limiter that's already saturated.
 */
export const RATE_LIMIT_COOLDOWN_MS = 60_000

/** How long the "Saved" indicator stays visible after a successful save. */
export const SAVE_INDICATOR_MS = 2500

/** How long a section highlight pulse lasts (triggered on preview click). */
export const SECTION_HIGHLIGHT_MS = 1300

/** How long the "success" PDF status badge stays visible. */
export const PDF_SUCCESS_RESET_MS = 3000

/** How long the "error" PDF status badge stays visible. */
export const PDF_ERROR_RESET_MS = 4000
