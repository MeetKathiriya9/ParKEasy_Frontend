import { SectionHeader, EmptyState } from '@/components/ui';
import { History } from 'lucide-react';

/**
 * Parking history comes from completed reservations/sessions, which the server
 * does not expose yet. Showing zeros and an empty state is the truthful view.
 */
export function DriverHistory() {
  return (
    <div>
      <SectionHeader title="Parking History" subtitle="View your past parking sessions and receipts" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Total Sessions</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Total Spent</p>
          <p className="text-2xl font-bold mt-1">$0.00</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Avg. Duration</p>
          <p className="text-2xl font-bold mt-1">0h</p>
        </div>
      </div>

      <EmptyState
        icon={<History size={28} />}
        title="No history yet"
        message="Your completed parking sessions will appear here once reservations and sessions are live."
      />
    </div>
  );
}
