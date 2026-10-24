import { useApp } from '@/context/AppContext';
import { SectionHeader, EmptyState } from '@/components/ui';
import { CalendarCheck } from 'lucide-react';

/**
 * Reservations are not implemented on the server yet (`/reservations` answers
 * `501`), so this page shows the honest empty state instead of sample rows.
 */
export function DriverReservations() {
  const { navigate } = useApp();

  return (
    <div>
      <SectionHeader title="My Reservations" subtitle="Manage your parking reservations" />
      <EmptyState
        icon={<CalendarCheck size={28} />}
        title="No reservations"
        message="Reservations open once the reservations group is implemented. Until then you can search and view facilities."
      />
      <div className="flex justify-center">
        <button onClick={() => navigate('driver-search')} className="pe-btn-primary">Find Parking</button>
      </div>
    </div>
  );
}
