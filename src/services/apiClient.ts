// In-memory access token store (never localStorage — matches RS256 arch decision)
let _accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

export const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api/v1'

// Guard against accidental HTTP in production — tokens must never travel in plaintext.
if (import.meta.env.PROD && !BASE_URL.startsWith('https://')) {
  console.error('[apiClient] VITE_API_URL must use HTTPS in production. Current:', BASE_URL)
}

/** Default timeout for all API requests (ms). Prevents hung connections. */
const REQUEST_TIMEOUT_MS = 15_000

/**
 * Typed API error. Carries the HTTP status and backend error code so callers
 * can branch on them without fragile message-substring matching.
 *
 * Example:
 *   try { await apiClient.get('/cv') }
 *   catch (err) {
 *     if (err instanceof ApiError && err.status === 404) { ... }
 *   }
 */
export class ApiError extends Error {
  // Declared as plain fields (not constructor-parameter properties) because
  // tsconfig.app.json has `erasableSyntaxOnly: true` — parameter-property
  // shorthand emits runtime assignments TS can't erase.
  readonly status: number
  readonly code: string | undefined
  /**
   * Parsed `Retry-After` (in ms) for 429 responses, when the server sent one.
   * Lets callers back off for exactly as long as the limiter window dictates
   * instead of guessing. Undefined for non-429s or when the header is absent.
   */
  readonly retryAfterMs: number | undefined

  constructor(status: number, code: string | undefined, message: string, retryAfterMs?: number) {
    super(message)
    this.status = status
    this.code = code
    this.retryAfterMs = retryAfterMs
    this.name = 'ApiError'
  }
}

/**
 * Thrown when the request aborts because it exceeded REQUEST_TIMEOUT_MS.
 * Distinct from a generic network error so UI can show a retry hint.
 */
export class TimeoutError extends Error {
  constructor() {
    super('Request timed out. Please check your connection and try again.')
    this.name = 'TimeoutError'
  }
}

interface RequestOptions extends RequestInit {
  /** Internal flag — prevents a retry from triggering another refresh attempt. */
  _retried?: boolean
  /**
   * Per-request override of REQUEST_TIMEOUT_MS. For endpoints whose happy path
   * is legitimately slow (AI cover-letter analysis runs 15–30s of LLM
   * generation) — the default would abort a request the server is still
   * successfully serving.
   */
  timeoutMs?: number
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  // Normalise via the Headers constructor so we correctly merge whichever
  // shape the caller passes (Headers instance, [[k,v]] tuples, or plain
  // object) — the previous `as Record<string, string>` cast silently dropped
  // entries for the first two shapes.
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (init.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value))
  }
  if (_accessToken) headers.set('Authorization', `Bearer ${_accessToken}`)

  // Abort the request after the timeout so a hung server doesn't leave the
  // app in a permanent loading state.
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), init.timeoutMs ?? REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: 'include', // send HttpOnly refresh cookie on /auth/* endpoints
      headers,
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new TimeoutError()
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  // Transparent token refresh on 401.
  // _retried flag ensures we only attempt one refresh per original request —
  // prevents an infinite loop when the refresh token itself is also invalid.
  //
  // /auth/refresh is excluded because refreshing inside a refresh is nonsense.
  // /auth/logout is excluded because logout IS the session-expiry pathway:
  // if the server 401s the logout (stale/revoked token) we should treat it as
  // "already logged out", NOT chase a refresh and dispatch session-expired —
  // the listener re-enters logout and creates an infinite dispatch loop.
  if (
    res.status === 401 &&
    !init._retried &&
    !path.endsWith('/auth/refresh') &&
    !path.endsWith('/auth/logout')
  ) {
    const refreshed = await tryRefresh()
    if (!refreshed) {
      window.dispatchEvent(new CustomEvent('resumark:session-expired'))
      throw new ApiError(401, 'SESSION_EXPIRED', 'Session expired. Please log in again.')
    }
    return request<T>(path, { ...init, _retried: true })
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; code?: string }
    }
    // On a 429, surface the server's Retry-After (seconds) as ms so callers
    // (e.g. the auto-save cool-down) can pause for exactly the limiter window
    // rather than retrying immediately and keeping the bucket saturated.
    let retryAfterMs: number | undefined
    if (res.status === 429) {
      const header = res.headers.get('Retry-After')
      const seconds = header ? Number(header) : NaN
      if (Number.isFinite(seconds) && seconds >= 0) retryAfterMs = seconds * 1000
    }
    throw new ApiError(
      res.status,
      body.error?.code,
      body.error?.message ?? `HTTP ${res.status}`,
      retryAfterMs,
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Single-flight guard. The refresh endpoint ROTATES (revokes the presented
// token, issues a new one), so two concurrent refreshes would race: the first
// revokes the token, the second arrives with that now-dead token and 401s,
// which logs the user out. Funnelling every caller through one shared promise
// guarantees a single in-flight refresh at a time — concurrent 401s and the
// boot-time session restore all await the same result.
let _refreshInFlight: Promise<boolean> | null = null

async function performRefresh(): Promise<boolean> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
    })
    if (!res.ok) return false
    const data = (await res.json()) as { accessToken: string }
    setAccessToken(data.accessToken)
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Refresh the access token, deduplicating concurrent callers onto one request.
 * Returns true (and sets the in-memory access token) on success. Never
 * dispatches `session-expired` — that decision belongs to the caller.
 */
function tryRefresh(): Promise<boolean> {
  if (_refreshInFlight) return _refreshInFlight
  _refreshInFlight = performRefresh().finally(() => {
    _refreshInFlight = null
  })
  return _refreshInFlight
}

// Exported so userStore.restoreSession() shares the same single-flight instead
// of firing its own parallel /auth/refresh on page load.
export { tryRefresh as refreshAccessToken }

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, opts?: { timeoutMs?: number }) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), timeoutMs: opts?.timeoutMs }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
