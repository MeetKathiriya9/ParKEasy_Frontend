import { useApp } from '@/context/AppContext';
import { SectionHeader } from '@/components/ui';
import { Clock } from 'lucide-react';

/**
 * There is no session to show: the sessions group is still a `501` stub, so
 * the page reports that honestly rather than rendering a fabricated session.
 */
export function DriverSession() {
  const { navigate } = useApp();

  return (
    <div>
      <SectionHeader title="Active Parking Session" subtitle="Your current parking session details" />
      <div className="pe-card p-10 text-center">
        <Clock size={40} className="mx-auto text-[#5a6a8a] mb-3" />
        <p className="text-[#8a98b5] mb-1">No active parking session</p>
        <p className="text-xs text-[#5a6a8a] mb-4">
          Live sessions switch on when the reservations group lands.
        </p>
        <button onClick={() => navigate('driver-search')} className="pe-btn-primary">Find Parking</button>
      </div>
    </div>
  );
}
