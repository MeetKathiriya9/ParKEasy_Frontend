import { get, post } from './api';
import { endpoints } from './endpoints';
import { clearToken, getStoredUser, getToken, setStoredUser, setToken } from './token';
import type { Role } from '@/types';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  facilityIds: string[];
  createdAt: string | null;
  lastLoginAt: string | null;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  role: Role;
  user: AuthUser;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const ROLES: Role[] = ['driver', 'staff', 'operator', 'admin'];

export const ROLE_LABELS: Record<Role, string> = {
  driver: 'Driver / Customer',
  staff: 'Parking Staff',
  operator: 'Operator / Manager',
  admin: 'Platform Admin',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  driver: 'Find and reserve parking spaces',
  staff: 'Manage check-in/out and violations',
  operator: 'Manage facilities and operations',
  admin: 'Manage the entire platform',
};

function persist(session: AuthSession): AuthSession {
  setToken(session.accessToken);
  setStoredUser(session.user);
  return session;
}

function clearSession(): void {
  clearToken();
}

/** `POST /auth/register` - creates the account and signs in immediately. */
export async function register(input: RegisterInput): Promise<AuthSession> {
  const body: Record<string, unknown> = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: input.role,
  };
  if (input.phone?.trim()) body.phone = input.phone.trim();

  return persist(await post<AuthSession>(endpoints.auth.register, body));
}

/** `POST /auth/login` - exchanges credentials for an access token. */
export async function login(input: LoginInput): Promise<AuthSession> {
  return persist(
    await post<AuthSession>(endpoints.auth.login, {
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  );
}

/**
 * `GET /auth/me` - confirms a stored token is still valid.
 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (!getToken()) return null;
  try {
    const user = await get<AuthUser>(endpoints.auth.me);
    setStoredUser(user);
    return user;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * `POST /auth/logout` - revokes the token server-side, then clears it locally.
 */
export async function logout(): Promise<void> {
  try {
    await post<{ message: string }>(endpoints.auth.logout);
  } catch {
    // Best effort - see the doc comment.
  } finally {
    clearSession();
  }
}

/** The cached profile from `localStorage`, used to render the shell on reload. */
export function getCachedUser(): AuthUser | null {
  return getStoredUser<AuthUser>();
}

/** Two-letter initials used by the avatar circles in the existing UI. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
