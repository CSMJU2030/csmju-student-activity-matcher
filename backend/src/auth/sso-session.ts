import { randomBytes, timingSafeEqual } from 'crypto';

/**
 * Central SSO cookies (auth-contract 1.1 §5.1–5.2).
 *
 * The session cookie carries the *Core Hub* access token, verified on every
 * request exactly like a Bearer token - the subsystem creates no session, no
 * password and no identity of its own. Cookie names start with the subsystem
 * id because every system runs on `localhost` in development and cookies are
 * not separated by port.
 */
export interface SsoCookieNames {
  /** `<subsystem>_access_token` - Path=/ */
  session: string;
  /** `<subsystem>_sso_state` - Path=/auth/callback, one sign-in only */
  state: string;
}

export function ssoCookieNames(subsystemId: string): SsoCookieNames {
  const base = subsystemId.replace(/-/g, '_');
  return { session: `${base}_access_token`, state: `${base}_sso_state` };
}

/** State cookies live at most 10 minutes (§5.2). */
export const STATE_TTL_SEC = 600;
export const STATE_COOKIE_PATH = '/auth/callback';

/** Reads one cookie out of a raw `Cookie:` header without extra dependencies. */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) {
    return null;
  }

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');

    if (separator === -1) {
      continue;
    }

    if (part.slice(0, separator).trim() !== name) {
      continue;
    }

    const value = part.slice(separator + 1).trim();

    return value.length > 0 ? decodeURIComponent(value) : null;
  }

  return null;
}

function serialise(name: string, value: string, path: string, maxAgeSec: number, secure: boolean): string {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`,
  ];
  if (secure) {
    attributes.push('Secure');
  }
  return attributes.join('; ');
}

/** Session cookie; `maxAgeSec` = token exp - now, never longer than the token. */
export function buildSessionCookie(names: SsoCookieNames, token: string, maxAgeSec: number, secure: boolean): string {
  return serialise(names.session, token, '/', maxAgeSec, secure);
}

export function clearSessionCookie(names: SsoCookieNames, secure: boolean): string {
  return serialise(names.session, '', '/', 0, secure);
}

export function buildStateCookie(names: SsoCookieNames, state: string, next: string, secure: boolean): string {
  return serialise(names.state, `${state}.${Buffer.from(next).toString('base64url')}`, STATE_COOKIE_PATH, STATE_TTL_SEC, secure);
}

export function clearStateCookie(names: SsoCookieNames, secure: boolean): string {
  return serialise(names.state, '', STATE_COOKIE_PATH, 0, secure);
}

/** ≥ 32 random bytes, base64url (§5.2). */
export function newState(): string {
  return randomBytes(32).toString('base64url');
}

/** Splits a state cookie value back into its state and (unvalidated) next path. */
export function parseStateCookie(value: string | null): { state: string; next: string } | null {
  if (!value) return null;
  const dot = value.indexOf('.');
  if (dot <= 0) return null;
  try {
    return { state: value.slice(0, dot), next: Buffer.from(value.slice(dot + 1), 'base64url').toString('utf8') };
  } catch {
    return null;
  }
}

/** Constant-time comparison of two state strings. */
export function sameState(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

const OWN_ORIGIN = 'http://subsystem.invalid';

/**
 * The `next` rules of §5.2: a same-origin path, 1-512 chars, starting with a
 * single "/", no backslash or control characters, and not under /auth.
 * Checked at /auth/login and again at the callback (the value comes back from a cookie).
 */
export function isSafeNext(next: unknown): next is string {
  if (typeof next !== 'string' || next.length < 1 || next.length > 512) return false;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(next)) return false;
  let url: URL;
  try {
    url = new URL(next, OWN_ORIGIN);
  } catch {
    return false;
  }
  if (url.origin !== OWN_ORIGIN) return false;
  return url.pathname !== '/auth' && !url.pathname.startsWith('/auth/');
}
