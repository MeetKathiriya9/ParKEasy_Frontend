import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Role, User } from '@/types';
import { users } from '@/data/mockData';

export type Page =
  | 'login'
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

interface AppState {
  currentUser: User | null;
  currentPage: Page;
  selectedFacilityId: string | null;
  selectedReservationId: string | null;
  login: (role: Role) => void;
  logout: () => void;
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

  const login = (role: Role) => {
    const user = users.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
      const dash: Record<Role, Page> = {
        driver: 'driver-dashboard',
        staff: 'staff-dashboard',
        operator: 'operator-dashboard',
        admin: 'admin-dashboard',
      };
      setCurrentPage(dash[role]);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentPage('login');
  };

  const navigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const selectFacility = (id: string) => {
    setSelectedFacilityId(id);
    setCurrentPage('driver-facility');
    window.scrollTo(0, 0);
  };

  const selectReservation = (id: string) => {
    setSelectedReservationId(id);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentPage,
        selectedFacilityId,
        selectedReservationId,
        login,
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
