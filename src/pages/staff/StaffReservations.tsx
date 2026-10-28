/**
 * Today's arrivals for staff (DOC section 21).
 *
 * Lists the reservations that start today in the staff member's facilities, so
 * the desk can see who is due and check them in without scanning. Check-in and
 * check-out call the same endpoints as the QR scanner, so the two screens can
 * never disagree about what a booking's state allows.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Badge, EmptyState, SectionHeader } from '@/components/ui';
import { formatDateTime, formatDuration, formatMoney } from '@/lib/format';
import { fetchFacilities } from '@/lib/facilities';
import {
  RESERVATION_STATUS_COLORS,
  RESERVATION_STATUS_LABELS,
  checkInReservation,
  checkOutReservation,
  fetchReservations,
  reservationErrorMessage,
} from '@/lib/reservations';
import type { Facility, ReservationRecord } from '@/types';
import {
  AlertCircle, CalendarCheck, Car, CheckCircle2, Clock, Loader2, LogIn, LogOut,
  RefreshCw, ScanLine, Search,
} from 'lucide-react';

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday(): Date {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

export function StaffReservations() {
  const { navigate } = useApp();
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [facilityId, setFacilityId] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [page, facilityList] = await Promise.all([
        fetchReservations({
          from: startOfToday().toISOString(),
          to: endOfToday().toISOString(),
          limit: 100,
          order: 'asc',
        }),
        fetchFacilities().catch(() => [] as Facility[]),
      ]);
      setReservations(page.items);
      setFacilities(facilityList);
    } catch (err) {
      setError(reservationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return reservations.filter((reservation) => {
      if (facilityId && reservation.facilityId !== facilityId) return false;
      if (!needle) return true;
      return (
        reservation.reference.toLowerCase().includes(needle) ||
        reservation.vehiclePlate.toLowerCase().includes(needle) ||
        reservation.facilityName.toLowerCase().includes(needle)
      );
    });
  }, [reservations, query, facilityId]);

  const counts = useMemo(
    () => ({
      confirmed: reservations.filter((row) => row.status === 'CONFIRMED').length,
      active: reservations.filter((row) => row.status === 'ACTIVE').length,
      completed: reservations.filter((row) => row.status === 'COMPLETED').length,
      other: reservations.filter((row) => !['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(row.status)).length,
    }),
    [reservations],
  );

  const handleAction = async (reservation: ReservationRecord) => {
    setBusyId(reservation.id);
    setError('');
    setNotice('');
    try {
      const result =
        reservation.status === 'CONFIRMED'
          ? await checkInReservation(reservation.id)
          : await checkOutReservation(reservation.id);
      setReservations((rows) =>
        rows.map((row) => (row.id === result.reservation.id ? result.reservation : row)),
      );
      setNotice(
        reservation.status === 'CONFIRMED'
          ? `${result.reservation.vehiclePlate} checked in to space ${result.session.spaceNumber}.`
          : `${result.reservation.vehiclePlate} checked out. Estimate ${formatMoney(result.session.amount, 2)}.`,
      );
    } catch (err) {
      setError(reservationErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Today's Arrivals"
        subtitle="Reservations due today across your facilities"
        action={
          <button type="button" onClick={() => void load()} className="pe-btn-outline">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <CountCard label="Due" value={counts.confirmed} color="text-[#3b82f6]" />
        <CountCard label="Parked" value={counts.active} color="text-[#10b981]" />
        <CountCard label="Completed" value={counts.completed} color="text-[#8a98b5]" />
        <CountCard label="Other" value={counts.other} color="text-[#f59e0b]" />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Reference, plate or facility"
            className="pe-input pl-9"
          />
        </div>
        <select
          value={facilityId}
          onChange={(event) => setFacilityId(event.target.value)}
          className="pe-input sm:w-64"
        >
          <option value="">All my facilities</option>
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5] flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 px-3 py-2 text-sm text-[#6ee7b7] flex items-center gap-2">
          <CheckCircle2 size={15} /> {notice}
        </div>
      )}

      {loading && reservations.length === 0 ? (
        <div className="pe-card p-10 flex items-center justify-center gap-2 text-sm text-[#8a98b5]">
          <Loader2 size={16} className="animate-spin" /> Loading today's arrivals
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={28} />}
          title="No reservations match"
          message={
            reservations.length === 0
              ? 'Nothing is booked to start today in your facilities.'
              : 'Clear the search or pick another facility.'
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((reservation) => (
            <div key={reservation.id} className="pe-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold">{reservation.facilityName}</p>
                  <p className="text-xs font-mono text-[#5a6a8a]">
                    {reservation.reference} · Space {reservation.spaceNumber}
                  </p>
                </div>
                <Badge color={RESERVATION_STATUS_COLORS[reservation.status]}>
                  {RESERVATION_STATUS_LABELS[reservation.status]}
                </Badge>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 text-sm text-[#8a98b5] mb-3">
                <span className="flex items-center gap-1.5">
                  <Car size={14} /> {reservation.vehiclePlate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> {formatDateTime(reservation.startTime)}
                </span>
                <span>{formatDuration(reservation.durationMinutes)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm">
                  <span className="text-[#8a98b5]">Estimate: </span>
                  {formatMoney(reservation.estimatedAmount, 2)}
                </p>
                <div className="flex gap-2">
                  {reservation.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() => void handleAction(reservation)}
                      disabled={busyId === reservation.id}
                      className="pe-btn-primary text-sm"
                    >
                      {busyId === reservation.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <LogIn size={14} />
                      )}
                      Check in
                    </button>
                  )}
                  {reservation.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => void handleAction(reservation)}
                      disabled={busyId === reservation.id}
                      className="pe-btn-primary text-sm bg-[#f59e0b] hover:bg-[#d97706]"
                    >
                      {busyId === reservation.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <LogOut size={14} />
                      )}
                      Check out
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-6">
        <button type="button" onClick={() => navigate('staff-scanner')} className="pe-btn-outline">
          <ScanLine size={15} /> Use the QR scanner instead
        </button>
      </div>
    </div>
  );
}

function CountCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="pe-card p-4">
      <p className="text-xs text-[#8a98b5]">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
