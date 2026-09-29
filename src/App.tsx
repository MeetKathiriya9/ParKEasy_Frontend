import { AppProvider, useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
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
  const { currentPage, currentUser } = useApp();

  if (!currentUser || currentPage === 'login') {
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
