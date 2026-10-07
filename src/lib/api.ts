/**
 * The single HTTP client every API call goes through.
 *
 * Responsibilities:
 *  - attach the JWT access token as `Authorization: Bearer <token>`
 *  - unwrap the backend's error envelope into a typed `ApiError`
 *  - on `401`, clear the token and hand control back to the app shell
 *
 * Nothing here imports React, so it can be used from services, stores or
 * components interchangeably.
 */

import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { clearToken, getToken } from './token';

/**
 * Base URL. Defaults to the proxy-relative `/api/v1`-style paths, which the
 * Vite dev server forwards to the backend. Set `VITE_API_URL` to an absolute
 * URL (e.g. `http://127.0.0.1:9999`) to call the backend directly instead.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

/**
 * Machine-readable codes defined in `app/core/errors.py`, plus the auth-domain
 * codes defined in `app/services/auth.py`.
 */
export type ApiErrorCode =
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'NOT_IMPLEMENTED'
  | 'DUPLICATE_KEY'
  | 'RATE_LIMITED'
  | 'REQUEST_TOO_LARGE'
  | 'DATABASE_UNAVAILABLE'
  | 'DATABASE_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_TOKEN'
  | 'TOKEN_REVOKED'
  | 'PASSWORD_CHANGED'
  | 'INVALID_RESET_TOKEN'
  | 'CURRENT_PASSWORD_INCORRECT'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_PENDING'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'ROLE_NOT_SELF_REGISTERABLE'
  | 'REGISTRATION_DUPLICATE'
  | 'VEHICLE_LIMIT_REACHED'
  | 'APP_ERROR';

/**
 * Codes that genuinely mean "this access token is finished". Only these may
 * clear the session.
 *
 * Everything else that happens to be a 401 is about the *request*, not the
 * session, and must leave the user signed in. `INVALID_CREDENTIALS` is the
 * important one to exclude: a failed login is a 401, and treating it as session
 * death would discard the credentials of a user who was never signed in.
 *
 * Kept in step with the 401s raised by `app/api/deps.py`, `app/core/security.py`
 * and `app/services/auth.py`.
 */
const SESSION_DEAD_CODES: ReadonlySet<string> = new Set<ApiErrorCode>([
  'UNAUTHORIZED', // no usable Authorization header / unknown role
  'INVALID_TOKEN', // garbage, malformed or expired token
  'TOKEN_REVOKED', // explicitly signed out
  'PASSWORD_CHANGED', // invalidated by a password reset or change
]);

/** Normalised failure thrown by every request, so callers never read Axios internals. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** True for the conditions worth showing the user verbatim. */
  get isNotImplemented(): boolean {
    return this.code === 'NOT_IMPLEMENTED';
  }
}

/** Notified when a request is rejected for authentication reasons. */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Registered by the app shell so a 401 can return the user to the login page. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

/**
 * Shared Axios instance.
 *
 * Deliberately does **not** set a default `Content-Type`. Axios sets
 * `application/json` itself for plain-object bodies, whereas a forced JSON
 * default breaks `FormData`: axios 1.x sees a JSON content type alongside a
 * `FormData` payload and converts the whole body to JSON, so the boundary is
 * lost and the server receives no file. Leaving the header unset lets the
 * browser set `multipart/form-data; boundary=...` for uploads.
 */
const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data as
      | { error?: { code?: string; message?: string; details?: unknown } }
      | undefined;
    const code = (payload?.error?.code as ApiErrorCode) ?? 'INTERNAL_ERROR';

    // A rejected token cannot be retried: drop it and let the shell re-auth.
    // Gated on the error *code*, not the status - a 401 that means "wrong
    // current password" or "bad login" says nothing about the session, and
    // clearing on those signs the user out for a typo.
    if (status === 401 && SESSION_DEAD_CODES.has(code)) {
      clearToken();
      onUnauthorized?.();
    }

    const message =
      payload?.error?.message ??
      (error.code === 'ECONNABORTED'
        ? 'The request timed out'
        : status === 0
          ? 'Cannot reach the ParkEasy server'
          : error.message);

    return Promise.reject(new ApiError(status, code, message, payload?.error?.details));
  },
);

/** `GET` returning the parsed body. */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.get<T>(url, config);
  return data;
}

/** `POST` returning the parsed body. */
export async function post<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await http.post<T>(url, body, config);
  return data;
}

/** `PATCH` returning the parsed body. */
export async function patch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await http.patch<T>(url, body, config);
  return data;
}

/** `DELETE` returning the parsed body. */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.delete<T>(url, config);
  return data;
}

export { http };
export const apiBaseUrl = BASE_URL;

/**
 * Turn a server-relative path (such as a `photoUrl`) into something usable in
 * an `<img src>`.
 *
 * `<img>` cannot send an `Authorization` header, which is why avatar URLs are
 * public; this only handles the *origin*. When `BASE_URL` is empty (the Vite
 * proxy case) the path is already correct, and when `VITE_API_URL` points at
 * the backend directly the prefix is what makes the image resolve.
 *
 * The join goes through `URL` rather than string concatenation: `BASE_URL` often
 * has a trailing slash and these paths always start with one, and plain `+`
 * would produce `//api/v1/avatars/...` - a URL the router does not match, so
 * every avatar 404s and renders as a broken image.
 */
export function apiUrl(path: string): string {
  if (!path) return path;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path; // already absolute
  if (!BASE_URL) return path; // same-origin behind the Vite proxy
  try {
    return new URL(path, BASE_URL).toString();
  } catch {
    return `${BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }
}
