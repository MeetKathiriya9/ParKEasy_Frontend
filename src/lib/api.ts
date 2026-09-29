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

/** Machine-readable codes defined in `app/core/errors.py`. */
export type ApiErrorCode =
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'NOT_IMPLEMENTED'
  | 'DUPLICATE_KEY'
  | 'DATABASE_ERROR'
  | 'APP_ERROR';

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

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
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

    // A rejected token cannot be retried: drop it and let the shell re-auth.
    if (status === 401) {
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

    return Promise.reject(
      new ApiError(status, (payload?.error?.code as ApiErrorCode) ?? 'INTERNAL_ERROR', message, payload?.error?.details),
    );
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
