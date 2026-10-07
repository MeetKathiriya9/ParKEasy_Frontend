/**
 * The signed-in user's profile (DOC sections 18/21).
 *
 * Thin wrappers over the `/users/me` routes, mirroring `lib/auth.ts` so pages
 * never build a URL or reach for Axios directly.
 *
 * `email` is absent from the update input on purpose: the server does not
 * accept it and answers a `422`, so offering it here would only invite a
 * request that cannot succeed.
 */

import { del, get, patch, post } from './api';
import { endpoints } from './endpoints';
import type { AuthUser } from './auth';

export interface ProfileUpdateInput {
  name?: string;
  /** `null` clears the number; omit the key to leave it as it is. */
  phone?: string | null;
}

/** `GET /users/me` - the stored profile, fresher than the cached session copy. */
export async function fetchProfile(): Promise<AuthUser> {
  return get<AuthUser>(endpoints.users.me);
}

/** `PATCH /users/me` - partial update; send only the fields that changed. */
export async function updateProfile(input: ProfileUpdateInput): Promise<AuthUser> {
  return patch<AuthUser>(endpoints.users.updateMe, input);
}

/**
 * `POST /users/me/photo` - upload or replace the avatar.
 *
 * The `FormData` is passed through untouched. Axios must be left to hand it to
 * the browser so the `multipart/form-data` boundary is generated - see the note
 * on the shared instance in `lib/api.ts`.
 */
export async function uploadPhoto(file: File): Promise<AuthUser> {
  const form = new FormData();
  form.append('file', file);
  return post<AuthUser>(endpoints.users.photo, form);
}

/** `DELETE /users/me/photo` - remove the avatar and its stored file. */
export async function removePhoto(): Promise<AuthUser> {
  return del<AuthUser>(endpoints.users.photo);
}

/** Largest file the client will send. Matches `AVATAR_MAX_BYTES` on the server. */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Formats the server will accept. The server re-checks by decoding the bytes. */
export const ACCEPTED_PHOTO_TYPES = 'image/jpeg,image/png,image/webp';
