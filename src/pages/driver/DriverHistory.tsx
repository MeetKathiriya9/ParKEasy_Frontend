import { useApp } from '@/context/AppContext';
import { SectionHeader, Badge, EmptyState } from '@/components/ui';
import { reservations } from '@/data/mockData';
import { History, MapPin, Car, Clock, CreditCard, Download } from 'lucide-react';

export function DriverHistory() {
  const { currentUser } = useApp();
  const history = reservations.filter((r) => r.userId === currentUser?.id && ['completed', 'cancelled', 'no-show'].includes(r.status));

  const totalSpent = history.filter((r) => r.paid).reduce((sum, r) => sum + r.totalCost, 0);
  const totalSessions = history.filter((r) => r.status === 'completed').length;

  return (
    <div>
      <SectionHeader title="Parking History" subtitle="View your past parking sessions and receipts" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Total Sessions</p>
          <p className="text-2xl font-bold mt-1">{totalSessions}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Total Spent</p>
          <p className="text-2xl font-bold mt-1">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Avg. Duration</p>
          <p className="text-2xl font-bold mt-1">{history.length > 0 ? (history.reduce((s, r) => s + r.durationHours, 0) / history.length).toFixed(1) : 0}h</p>
        </div>
      </div>

      {history.length === 0 ? (
        <EmptyState icon={<History size={28} />} title="No history yet" message="Your completed parking sessions will appear here." />
      ) : (
        <div className="space-y-3">
          {history.map((r) => (
            <div key={r.id} className="pe-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{r.facilityName}</p>
                    <Badge color={r.status === 'completed' ? 'gray' : r.status === 'cancelled' ? 'red' : 'amber'}>{r.status.replace('-', ' ')}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-[#8a98b5]">
                    <span className="flex items-center gap-1"><MapPin size={14} /> Space {r.spaceLabel || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Car size={14} /> {r.vehiclePlate}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(r.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {r.durationHours}h</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">${r.totalCost.toFixed(2)}</p>
                  {r.paid && <p className="text-xs text-[#10b981]">Paid</p>}
                </div>
              </div>
              {r.status === 'completed' && (
                <div className="flex gap-2 pt-3 border-t border-[#1e2d4d]">
                  <button className="pe-btn-ghost text-sm">
                    <Download size={14} /> Download Receipt
                  </button>
                  {r.evKwh && <Badge color="cyan"><CreditCard size={10} /> EV: {r.evKwh}kWh</Badge>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
