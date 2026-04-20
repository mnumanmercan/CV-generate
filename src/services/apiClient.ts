// In-memory access token store (never localStorage — matches RS256 arch decision)
let _accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

export const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api/v1'

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
  readonly code:   string | undefined

  constructor(status: number, code: string | undefined, message: string) {
    super(message)
    this.status = status
    this.code   = code
    this.name   = 'ApiError'
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
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`

  // Abort the request after REQUEST_TIMEOUT_MS so a hung server doesn't
  // leave the app in a permanent loading state.
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

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
  if (res.status === 401
      && !init._retried
      && !path.endsWith('/auth/refresh')
      && !path.endsWith('/auth/logout')) {
    const refreshed = await tryRefresh()
    if (!refreshed) {
      window.dispatchEvent(new CustomEvent('resumark:session-expired'))
      throw new ApiError(401, 'SESSION_EXPIRED', 'Session expired. Please log in again.')
    }
    return request<T>(path, { ...init, _retried: true })
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string; code?: string } }
    throw new ApiError(
      res.status,
      body.error?.code,
      body.error?.message ?? `HTTP ${res.status}`,
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

async function tryRefresh(): Promise<boolean> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
      signal:      controller.signal,
    })
    if (!res.ok) return false
    const data = await res.json() as { accessToken: string }
    setAccessToken(data.accessToken)
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timeoutId)
  }
}

export const apiClient = {
  get:    <T>(path: string)                   => request<T>(path),
  post:   <T>(path: string, body?: unknown)   => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body?: unknown)   => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown)   => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                   => request<T>(path, { method: 'DELETE' }),
}
