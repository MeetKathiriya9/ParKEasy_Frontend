/**
 * Access-token storage.
 *
 * Phase 1 auth decision: a JWT access token is kept in `localStorage` and sent
 * as `Authorization: Bearer <token>`. There is no refresh token, so a rejected
 * token means the user signs in again.
 *
 * Note: `localStorage` is readable by any script on the page, so an XSS bug
 * would expose the token. That is the accepted trade-off of the Bearer-only
 * strategy; switching to an httpOnly cookie is the alternative if it becomes a
 * concern.
 */

const TOKEN_KEY = 'parkeasy.accessToken';
const USER_KEY = 'parkeasy.authUser';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** The last known user profile, cached so a reload can render the shell. */
export function getStoredUser<T>(): T | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown): void {
  if (!isBrowser()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
