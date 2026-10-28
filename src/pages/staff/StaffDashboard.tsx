import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StatCard, SectionHeader, Badge, ProgressBar } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { fetchFacilities, FACILITY_STATUS_COLORS, FACILITY_STATUS_LABELS } from '@/lib/facilities';
import type { Facility } from '@/types';
import {
  AlertTriangle, Building2, CalendarCheck, Car, CheckCircle2, Clock, Loader2, RefreshCw,
  ScanLine, Wrench,
} from 'lucide-react';

function loadErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Your session has expired. Sign in again.';
    if (err.status === 403) return 'You do not have access to these facilities.';
    return err.message;
  }
  return err instanceof Error ? err.message : 'Could not load your facilities.';
}

export function StaffDashboard() {
  const { currentUser, navigate } = useApp();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchFacilities();
        if (!cancelled) {
          setFacilities(list);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(loadErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = async () => {
    setLoading(true);
    setError('');
    try {
      setFacilities(await fetchFacilities());
    } catch (err) {
      setError(loadErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const totals = facilities.reduce(
    (sum, facility) => ({
      available: sum.available + facility.spaceCounts.available,
      occupied: sum.occupied + facility.spaceCounts.occupied,
      reserved: sum.reserved + facility.spaceCounts.reserved,
      maintenance: sum.maintenance + facility.spaceCounts.maintenance,
      total: sum.total + facility.spaceCounts.total,
    }),
    { available: 0, occupied: 0, reserved: 0, maintenance: 0, total: 0 },
  );

  return (
    <div>
      <SectionHeader
        title="Staff Dashboard"
        subtitle={
          facilities.length === 0
            ? 'No facility assigned yet'
            : facilities.map((facility) => facility.name).join(' · ')
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5] flex items-center gap-2"
        >
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Building2 size={20} />}
          label="Facilities Assigned"
          value={String(facilities.length)}
          accent="blue"
        />
        <StatCard
          icon={<Car size={20} />}
          label="Available Spaces"
          value={String(totals.available)}
          accent="green"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Occupied"
          value={String(totals.occupied)}
          accent="amber"
        />
        <StatCard
          icon={<Wrench size={20} />}
          label="Maintenance"
          value={String(totals.maintenance)}
          accent="cyan"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="pe-card p-5">
          <h2 className="font-semibold text-lg mb-4">Facility Status</h2>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#8a98b5]">
              <Loader2 size={16} className="animate-spin" />
              Loading your facilities
            </div>
          ) : facilities.length === 0 ? (
            <div className="text-center py-8">
              <Building2 size={28} className="mx-auto text-[#5a6a8a] mb-2" />
              <p className="text-sm text-[#8a98b5] mb-3">
                {currentUser?.name ?? 'Your account'} is not assigned to a facility yet. Ask your
                operator to assign one.
              </p>
              {error && (
                <button type="button" onClick={retry} className="pe-btn-outline">
                  <RefreshCw size={16} /> Try again
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {facilities.map((facility) => {
                const counts = facility.spaceCounts;
                const used = counts.occupied + counts.reserved;
                const percent = counts.total === 0 ? 0 : Math.round((used / counts.total) * 100);
                return (
                  <div key={facility.id}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{facility.name}</p>
                        <p className="text-xs text-[#5a6a8a] truncate">{facility.address}</p>
                      </div>
                      <Badge color={FACILITY_STATUS_COLORS[facility.status]}>
                        {FACILITY_STATUS_LABELS[facility.status]}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <div className="bg-[#0b1220] rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-[#10b981]">{counts.available}</p>
                        <p className="text-xs text-[#8a98b5]">Available</p>
                      </div>
                      <div className="bg-[#0b1220] rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-[#f59e0b]">{counts.reserved}</p>
                        <p className="text-xs text-[#8a98b5]">Reserved</p>
                      </div>
                      <div className="bg-[#0b1220] rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-[#ef4444]">{counts.occupied}</p>
                        <p className="text-xs text-[#8a98b5]">Occupied</p>
                      </div>
                      <div className="bg-[#0b1220] rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-[#5a6a8a]">{counts.maintenance}</p>
                        <p className="text-xs text-[#8a98b5]">Maint.</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-[#8a98b5] mb-1">
                      <span>Occupancy</span>
                      <span>{percent}%</span>
                    </div>
                    <ProgressBar value={used} max={Math.max(counts.total, 1)} color="#f59e0b" />
                  </div>
                );
              })}
              {percentWarning(facilities) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
                  <AlertTriangle size={18} className="text-[#f59e0b]" />
                  <p className="text-sm text-[#f59e0b] font-medium">
                    A facility is nearing capacity.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pe-card p-5">
          <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate('staff-reservations')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] hover:bg-[#1e2d4d] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-[#2563eb]/15 flex items-center justify-center text-[#3b82f6]">
                <CalendarCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-medium">Today's Arrivals</p>
                <p className="text-xs text-[#8a98b5]">Check in or out a reservation</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('staff-scanner')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] hover:bg-[#1e2d4d] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-[#2563eb]/15 flex items-center justify-center text-[#3b82f6]">
                <ScanLine size={18} />
              </div>
              <div>
                <p className="text-sm font-medium">Scan QR Code</p>
                <p className="text-xs text-[#8a98b5]">Check-in or check-out a vehicle</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('staff-violations')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] hover:bg-[#1e2d4d] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-[#ef4444]/15 flex items-center justify-center text-[#ef4444]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-sm font-medium">Record Violation</p>
                <p className="text-xs text-[#8a98b5]">Log a parking violation</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('staff-spaces')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] hover:bg-[#1e2d4d] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-[#10b981]/15 flex items-center justify-center text-[#10b981]">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-sm font-medium">Update Space Status</p>
                <p className="text-xs text-[#8a98b5]">Mark spaces as available/maintenance</p>
              </div>
            </button>
          </div>
          <p className="text-xs text-[#5a6a8a] mt-4">
            Reservations, QR check-in/out and space status are live for your assigned facilities.
            Violations are not switched on yet.
          </p>
        </div>
      </div>
    </div>
  );
}

/** True when any assigned facility is at or above 85% used. */
function percentWarning(facilities: Facility[]): boolean {
  return facilities.some((facility) => {
    const counts = facility.spaceCounts;
    if (counts.total === 0) return false;
    return (counts.occupied + counts.reserved) / counts.total > 0.85;
  });
}
