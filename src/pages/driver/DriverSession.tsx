/**
 * The driver's current parking session, read from `/sessions/active`.
 *
 * A session starts at staff check-in and ends at staff check-out, so this page
 * is read-only: it shows the space, entry time, elapsed stay and the base-rate
 * estimate the server will settle on. It refreshes itself so a check-in at the
 * barrier appears without a reload.
 */

import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Badge, SectionHeader } from '@/components/ui';
import { formatDateTime, formatDuration, formatMoney } from '@/lib/format';
import { SESSION_STATUS_COLORS, SESSION_STATUS_LABELS, fetchActiveSession, fetchReservations, reservationErrorMessage } from '@/lib/reservations';
import type { ReservationRecord, SessionRecord } from '@/types';
import {
  AlertCircle, CalendarClock, Car, Clock, Loader2, MapPin, RefreshCw, Timer,
} from 'lucide-react';

function elapsedMinutes(entryTime: string): number {
  const started = Date.parse(entryTime);
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 60_000));
}

export function DriverSession() {
  const { navigate } = useApp();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [upcoming, setUpcoming] = useState<ReservationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    setError('');
    try {
      const active = await fetchActiveSession();
      setSession(active);
      if (!active) {
        const page = await fetchReservations({ status: 'CONFIRMED', limit: 1, order: 'asc' });
        setUpcoming(page.items[0] ?? null);
      } else {
        setUpcoming(null);
      }
    } catch (err) {
      setError(reservationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = window.setInterval(() => {
      setNow(Date.now());
      void load();
    }, 30_000);
    return () => window.clearInterval(refresh);
  }, [load]);

  const elapsed = session ? Math.max(elapsedMinutes(session.entryTime), Math.floor((now - Date.parse(session.entryTime)) / 60_000)) : 0;

  return (
    <div>
      <SectionHeader
        title="Active Parking Session"
        subtitle="Your current parking session details"
        action={
          <button type="button" onClick={() => void load()} className="pe-btn-outline">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5] flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {loading && !session ? (
        <div className="pe-card p-10 flex items-center justify-center gap-2 text-sm text-[#8a98b5]">
          <Loader2 size={16} className="animate-spin" /> Checking for an active session
        </div>
      ) : session ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="pe-card p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm text-[#8a98b5]">Parked at</p>
                  <h2 className="text-2xl font-bold">{session.facilityName}</h2>
                  <p className="text-sm text-[#8a98b5] flex items-center gap-1.5 mt-1">
                    <MapPin size={14} /> Space {session.spaceNumber}
                  </p>
                </div>
                <Badge color={SESSION_STATUS_COLORS[session.status]}>
                  {SESSION_STATUS_LABELS[session.status]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0b1220] rounded-lg p-4">
                  <p className="text-xs text-[#8a98b5]">Elapsed</p>
                  <p className="text-2xl font-bold text-[#3b82f6] mt-1">{formatDuration(elapsed)}</p>
                </div>
                <div className="bg-[#0b1220] rounded-lg p-4">
                  <p className="text-xs text-[#8a98b5]">Estimated amount</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatMoney(session.amount, 2)}
                    <span className="block text-[10px] font-normal text-[#5a6a8a] mt-0.5">base-rate estimate</span>
                  </p>
                </div>
              </div>

              {session.overstayMinutes > 0 && (
                <div className="mt-4 rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-2 text-sm text-[#fcd34d] flex items-center gap-2">
                  <Timer size={15} /> {formatDuration(session.overstayMinutes)} past the booked end.
                </div>
              )}

              <div className="mt-4 rounded-lg border border-[#1e2d4d] bg-[#0b1220] p-4 space-y-2 text-sm">
                <Row label="Reference" value={session.reference} mono />
                <Row label="Vehicle" value={session.vehiclePlate} />
                <Row label="Entry" value={formatDateTime(session.entryTime)} />
                <Row label="Booking" value={session.reservationId} mono />
              </div>
            </div>

            <div className="pe-card p-5">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock size={16} className="text-[#3b82f6]" /> Leaving
              </h3>
              <p className="text-sm text-[#8a98b5]">
                Staff close the session at the exit barrier. The final duration and amount are
                settled then; payment is handled separately.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="pe-card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Car size={16} className="text-[#10b981]" /> At a glance
              </h3>
              <ul className="space-y-2 text-sm text-[#8a98b5]">
                <li className="flex items-start gap-2">
                  <Clock size={14} className="text-[#10b981] mt-0.5" /> Started {formatDateTime(session.entryTime)}
                </li>
                <li className="flex items-start gap-2">
                  <Timer size={14} className="text-[#10b981] mt-0.5" /> {formatDuration(session.durationMinutes)} recorded
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={14} className="text-[#10b981] mt-0.5" /> Space {session.spaceNumber}
                </li>
              </ul>
            </div>
            <button type="button" onClick={() => navigate('driver-reservations')} className="pe-btn-outline w-full">
              <CalendarClock size={15} /> My reservations
            </button>
          </div>
        </div>
      ) : (
        <div className="pe-card p-10 text-center">
          <Clock size={40} className="mx-auto text-[#5a6a8a] mb-3" />
          <p className="text-[#8a98b5] mb-1">No active parking session</p>
          <p className="text-xs text-[#5a6a8a] mb-4">
            A session begins when staff check in your reservation.
          </p>

          {upcoming && (
            <div className="max-w-md mx-auto mb-4 rounded-lg border border-[#1e2d4d] bg-[#0b1220] p-4 text-left">
              <p className="text-xs text-[#5a6a8a] mb-1">Next reservation</p>
              <p className="font-semibold">{upcoming.facilityName}</p>
              <p className="text-sm text-[#8a98b5]">
                {formatDateTime(upcoming.startTime)} - Space {upcoming.spaceNumber}
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => navigate('driver-reservations')} className="pe-btn-outline">
              My reservations
            </button>
            <button type="button" onClick={() => navigate('driver-search')} className="pe-btn-primary">
              Find Parking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#8a98b5]">{label}</span>
      <span className={`text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
