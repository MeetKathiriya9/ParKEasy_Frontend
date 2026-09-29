import { AppProvider, useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DriverDashboard } from '@/pages/driver/DriverDashboard';
import { DriverSearch } from '@/pages/driver/DriverSearch';
import { DriverFacility } from '@/pages/driver/DriverFacility';
import { DriverSession } from '@/pages/driver/DriverSession';
import { DriverReservations } from '@/pages/driver/DriverReservations';
import { DriverHistory } from '@/pages/driver/DriverHistory';
import { DriverVehicles } from '@/pages/driver/DriverVehicles';
import { DriverNotifications } from '@/pages/driver/DriverNotifications';
import { DriverReviews, DriverComplaints } from '@/pages/driver/DriverReviews';
import { StaffDashboard } from '@/pages/staff/StaffDashboard';
import { StaffScanner } from '@/pages/staff/StaffScanner';
import { StaffViolations } from '@/pages/staff/StaffViolations';
import { StaffSpaces, StaffSessions, StaffActivity } from '@/pages/staff/StaffPages';
import { OperatorDashboard } from '@/pages/operator/OperatorDashboard';
import { OperatorFacilities } from '@/pages/operator/OperatorFacilities';
import {
  OperatorSpaces, OperatorPricing, OperatorStaff, OperatorReservations,
  OperatorAnalytics, OperatorEvents, OperatorComplaints, OperatorViolations,
} from '@/pages/operator/OperatorPages';
import {
  AdminDashboard, AdminUsers, AdminFacilities, AdminPayments,
  AdminComplaints, AdminAudit, AdminConfig,
} from '@/pages/admin/AdminPages';

function Router() {
  const { currentUser, currentPage, initialising } = useApp();

  // Wait for the stored-session check before deciding what to render, otherwise
  // a reload flashes the login page for an already-authenticated user.
  if (initialising) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1e2d4d] border-t-[#2563eb] animate-spin" />
      </div>
    );
  }

  // Signed out: the only two pages available are login and register. This has
  // to branch on `currentPage` before the login fallback, otherwise requesting
  // 'register' while logged out is immediately swallowed by `!currentUser`.
  if (!currentUser) {
    return currentPage === 'register' ? <RegisterPage /> : <LoginPage />;
  }

  if (currentPage === 'login' || currentPage === 'register') {
    return <LoginPage />;
  }

  const pageMap: Record<string, React.ReactNode> = {
    'driver-dashboard': <DriverDashboard />,
    'driver-search': <DriverSearch />,
    'driver-facility': <DriverFacility />,
    'driver-session': <DriverSession />,
    'driver-reservations': <DriverReservations />,
    'driver-history': <DriverHistory />,
    'driver-vehicles': <DriverVehicles />,
    'driver-notifications': <DriverNotifications />,
    'driver-reviews': <DriverReviews />,
    'driver-complaints': <DriverComplaints />,
    'staff-dashboard': <StaffDashboard />,
    'staff-scanner': <StaffScanner />,
    'staff-sessions': <StaffSessions />,
    'staff-violations': <StaffViolations />,
    'staff-spaces': <StaffSpaces />,
    'staff-activity': <StaffActivity />,
    'operator-dashboard': <OperatorDashboard />,
    'operator-facilities': <OperatorFacilities />,
    'operator-spaces': <OperatorSpaces />,
    'operator-pricing': <OperatorPricing />,
    'operator-staff': <OperatorStaff />,
    'operator-reservations': <OperatorReservations />,
    'operator-analytics': <OperatorAnalytics />,
    'operator-events': <OperatorEvents />,
    'operator-complaints': <OperatorComplaints />,
    'operator-violations': <OperatorViolations />,
    'admin-dashboard': <AdminDashboard />,
    'admin-users': <AdminUsers />,
    'admin-facilities': <AdminFacilities />,
    'admin-payments': <AdminPayments />,
    'admin-complaints': <AdminComplaints />,
    'admin-audit': <AdminAudit />,
    'admin-config': <AdminConfig />,
  };

  return <AppLayout>{pageMap[currentPage] || <DriverDashboard />}</AppLayout>;
}

function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}

export default App;
