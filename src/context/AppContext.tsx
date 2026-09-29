import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Role, User } from '@/types';
import {
  fetchCurrentUser,
  getCachedUser,
  initialsOf,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from '@/lib/auth';
import { ApiError, setUnauthorizedHandler } from '@/lib/api';

export type Page =
  | 'login'
  | 'register'
  // driver
  | 'driver-dashboard'
  | 'driver-search'
  | 'driver-facility'
  | 'driver-reserve'
  | 'driver-session'
  | 'driver-reservations'
  | 'driver-history'
  | 'driver-vehicles'
  | 'driver-notifications'
  | 'driver-reviews'
  | 'driver-complaints'
  // staff
  | 'staff-dashboard'
  | 'staff-scanner'
  | 'staff-sessions'
  | 'staff-violations'
  | 'staff-spaces'
  | 'staff-activity'
  // operator
  | 'operator-dashboard'
  | 'operator-facilities'
  | 'operator-spaces'
  | 'operator-pricing'
  | 'operator-staff'
  | 'operator-reservations'
  | 'operator-analytics'
  | 'operator-events'
  | 'operator-complaints'
  | 'operator-violations'
  // admin
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-facilities'
  | 'admin-payments'
  | 'admin-complaints'
  | 'admin-audit'
  | 'admin-config';

const DASHBOARD_FOR_ROLE: Record<Role, Page> = {
  driver: 'driver-dashboard',
  staff: 'staff-dashboard',
  operator: 'operator-dashboard',
  admin: 'admin-dashboard',
};

function toUser(profile: AuthUser): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    avatar: initialsOf(profile.name) || profile.email.slice(0, 2).toUpperCase(),
    phone: profile.phone ?? undefined,
  };
}

export interface AuthResult {
  ok: boolean;
  /** Message to show under the form; the reason when `ok` is false. */
  message: string;
}

const OK: AuthResult = { ok: true, message: '' };

function failure(error: unknown): AuthResult {
  if (error instanceof ApiError) {
    return { ok: false, message: error.message };
  }
  return { ok: false, message: 'Something went wrong. Please try again.' };
}

interface AppState {
  currentUser: User | null;
  currentPage: Page;
  selectedFacilityId: string | null;
  selectedReservationId: string | null;
  /** False until the stored session has been checked, to avoid a login flash. */
  initialising: boolean;
  authPending: boolean;
  login: (input: LoginInput) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  navigate: (page: Page) => void;
  selectFacility: (id: string) => void;
  selectReservation: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [initialising, setInitialising] = useState(true);
  const [authPending, setAuthPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = getCachedUser();
      if (cached) {
        setCurrentUser(toUser(cached));
        setCurrentPage(DASHBOARD_FOR_ROLE[cached.role]);
      }

      const fresh = await fetchCurrentUser();
      if (cancelled) return;

      if (fresh) {
        setCurrentUser(toUser(fresh));
        setCurrentPage(DASHBOARD_FOR_ROLE[fresh.role]);
      } else if (cached) {
        setCurrentUser(null);
        setCurrentPage('login');
      }
      setInitialising(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // A 401 from any request drops the user back to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setCurrentUser(null);
      setCurrentPage('login');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const finishAuth = (profile: AuthUser) => {
    setCurrentUser(toUser(profile));
    setCurrentPage(DASHBOARD_FOR_ROLE[profile.role]);
    setSelectedFacilityId(null);
    setSelectedReservationId(null);
  };

  const login = useCallback(async (input: LoginInput): Promise<AuthResult> => {
    setAuthPending(true);
    try {
      finishAuth((await loginRequest(input)).user);
      return OK;
    } catch (error) {
      return failure(error);
    } finally {
      setAuthPending(false);
    }
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    setAuthPending(true);
    try {
      finishAuth((await registerRequest(input)).user);
      return OK;
    } catch (error) {
      return failure(error);
    } finally {
      setAuthPending(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setCurrentUser(null);
    setCurrentPage('login');
    setSelectedFacilityId(null);
    setSelectedReservationId(null);
  }, []);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const selectFacility = useCallback((id: string) => {
    setSelectedFacilityId(id);
    setCurrentPage('driver-facility');
    window.scrollTo(0, 0);
  }, []);

  const selectReservation = useCallback((id: string) => {
    setSelectedReservationId(id);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentPage,
        selectedFacilityId,
        selectedReservationId,
        initialising,
        authPending,
        login,
        register,
        logout,
        navigate,
        selectFacility,
        selectReservation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
