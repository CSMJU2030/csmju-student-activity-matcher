const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

export const ACCESS_TOKEN_KEY = 'csmju2030-access-token';

async function getToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    // Client-side fetching
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  // Server-side fetching (SSR / Server Components / Actions)
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    return cookieStore.get(ACCESS_TOKEN_KEY)?.value || cookieStore.get('core_hub_access_token')?.value || null;
  } catch {
    // Missing headers context when not in request scope
    return null;
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${BASE_URL}${url}`, {
    cache: "no-store",
    ...options,
    headers,
  });
}

/** GET + unwrap the `{ success, data }` envelope; throws on HTTP errors. */
export async function fetchJsonWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetchWithAuth(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const json = await response.json();
  return json?.data !== undefined ? json.data : json;
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

/**
 * Mutation helper: sends JSON, unwraps the envelope and turns the backend's
 * `{ success: false, error: { message } }` into a readable error string.
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
      const raw = json?.error?.message ?? json?.message;
      const error = Array.isArray(raw) ? raw.join(', ') : raw || `Request failed (${response.status})`;
      return { success: false, error, status: response.status };
    }
    return { success: true, data: (json?.data !== undefined ? json.data : json) as T };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error', status: 0 };
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
