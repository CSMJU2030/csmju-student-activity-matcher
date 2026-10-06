/**
 * API client for the NestJS backend.
 *
 * Session = the HttpOnly cookie `<subsystem>_access_token` set by the SSO
 * callback (auth-contract §5). Page JavaScript never sees the token:
 * - in the browser, calls go to the same origin (`/api/v1`, proxied to the
 *   backend by next.config.ts) and the browser sends the cookie itself;
 * - on the server (RSC / server actions) the cookie is read from the incoming
 *   request and forwarded to the backend as a Bearer token.
 */
export const SESSION_COOKIE = 'csmju_student_activity_matcher_access_token';

const SERVER_BASE = `${(process.env.BACKEND_URL ?? 'http://127.0.0.1:3002').replace(/\/+$/, '')}/api/v1`;
const BROWSER_BASE = '/api/v1';

const isBrowser = () => typeof window !== 'undefined';

async function serverAuthHeader(): Promise<string | null> {
  try {
    const { cookies } = await import('next/headers');
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    return token ? `Bearer ${token}` : null;
  } catch {
    // Missing request scope (e.g. at build time)
    return null;
  }
}

/** Remember the last silent re-SSO so a broken session cannot loop (auth-contract §7). */
const RESSO_KEY = 'interest-match-resso-at';

/**
 * The session expired: send the whole page through `/auth/login`, which comes
 * back here silently while the Core Hub session lives (auth-contract §7).
 * Returns false (and does nothing) if we were just there less than 30 s ago.
 */
export function startReSso(): boolean {
  if (!isBrowser()) return false;
  try {
    const last = Number(sessionStorage.getItem(RESSO_KEY) ?? 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RESSO_KEY, String(Date.now()));
  } catch {
    // storage blocked - still renew, the 30 s guard is best effort
  }
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/auth/login?next=${encodeURIComponent(next)}`);
  return true;
}

export interface FetchOptions extends RequestInit {
  /** In the browser, a 401 starts a silent re-SSO unless this is false. */
  reauth?: boolean;
}

export async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  const { reauth = true, ...init } = options;
  const headers = new Headers(init.headers);

  if (isBrowser()) {
    const response = await fetch(`${BROWSER_BASE}${url}`, { cache: 'no-store', credentials: 'same-origin', ...init, headers });
    if (response.status === 401 && reauth) startReSso();
    return response;
  }

  const auth = await serverAuthHeader();
  if (auth) headers.set('Authorization', auth);
  return fetch(`${SERVER_BASE}${url}`, { cache: 'no-store', ...init, headers });
}

/** A non-2xx answer; `status` lets callers treat e.g. 404 as "not there" instead of an error. */
export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP error! status: ${status}`);
  }
}

/** GET + unwrap the `{ success, data }` envelope; throws HttpError on HTTP errors. */
export async function fetchJsonWithAuth(url: string, options: FetchOptions = {}) {
  const response = await fetchWithAuth(url, options);
  if (!response.ok) {
    throw new HttpError(response.status);
  }
  const json = await response.json();
  return json?.data !== undefined ? json.data : json;
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

/**
 * Mutation helper: sends JSON, unwraps the envelope and turns the backend's
 * `{ success: false, error: { message, details } }` into a readable string.
 */
export async function apiSend<T = unknown>(method: string, url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetchWithAuth(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok || json?.success === false) {
      // Validation errors put the useful part in `details` (one string per field).
      const details = json?.error?.details;
      const raw = Array.isArray(details) && details.length ? details : json?.error?.message ?? json?.message;
      const error = Array.isArray(raw) ? raw.join(', ') : raw || `ดำเนินการไม่สำเร็จ (${response.status}) กรุณาลองอีกครั้ง`;
      return { success: false, error, status: response.status };
    }
    return { success: true, data: (json?.data !== undefined ? json.data : json) as T };
  } catch {
    // Network failures surface as raw runtime text ("fetch failed"); show a Thai message instead.
    return { success: false, error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองอีกครั้ง', status: 0 };
  }
}

/** `?a=1&b=x` from an object, skipping empty values. */
export function toQuery(params: Record<string, string | number | boolean | string[] | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length) qs.set(key, value.join(','));
    } else {
      qs.set(key, String(value));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}
