/**
 * The driver's current parking session, read from `/sessions/active`.
 *
 * A session starts at staff check-in and ends at staff check-out. Drivers can
 * extend an active stay, but only staff close it. The page shows the space,
 * entry time, elapsed stay, scheduled end and the live pricing estimate, and
 * refreshes itself so a check-in at the barrier appears without a reload.
 */

import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Badge, SectionHeader } from '@/components/ui';
import { formatDateTime, formatDuration, formatMoney } from '@/lib/format';
import {
  SESSION_STATUS_COLORS,
  SESSION_STATUS_LABELS,
  extendSession,
  fetchActiveSession,
  fetchReservations,
  reservationErrorMessage,
} from '@/lib/reservations';
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
  const [extensionMinutes, setExtensionMinutes] = useState(30);
  const [extending, setExtending] = useState(false);
  const [extensionError, setExtensionError] = useState('');
  const [extensionNotice, setExtensionNotice] = useState('');

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

  const handleExtend = async () => {
    if (!session || extending) return;
    setExtending(true);
    setExtensionError('');
    setExtensionNotice('');
    try {
      const result = await extendSession(session.id, extensionMinutes);
      setSession(result.session);
      setNow(Date.now());
      setExtensionNotice(
        `Extended by ${formatDuration(extensionMinutes)}. New end ${formatDateTime(
          result.session.scheduledEndTime ?? result.reservation.endTime,
        )}.`,
      );
    } catch (err) {
      setExtensionError(reservationErrorMessage(err));
    } finally {
      setExtending(false);
    }
  };

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
                  <p className="text-xs text-[#8a98b5]">
                    {session.amountEstimated ? 'Estimated amount' : 'Final amount'}
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {formatMoney(
                      session.pricingBreakdown?.total ??
                        session.estimatedBreakdown?.total ??
                        session.amount ??
                        0,
                      2,
                    )}
                    <span className="block text-[10px] font-normal text-[#5a6a8a] mt-0.5">
                      {session.amountEstimated ? 'estimate for this stay' : 'final charge'}
                    </span>
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
                {session.scheduledEndTime && (
                  <Row label="Booked until" value={formatDateTime(session.scheduledEndTime)} />
                )}
                <Row label="Booking" value={session.reservationId} mono />
              </div>
            </div>

            <div className="pe-card p-5">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock size={16} className="text-[#3b82f6]" /> Extend your stay
              </h3>
              <p className="text-sm text-[#8a98b5] mb-3">
                Need more time? Extend before staff close the session at the exit barrier.
              </p>
              <div className="flex gap-2">
                <select
                  value={extensionMinutes}
                  onChange={(event) => setExtensionMinutes(Number(event.target.value))}
                  className="pe-input"
                  aria-label="Extension length"
                >
                  {[30, 60, 90, 120, 180, 240].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {formatDuration(minutes)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleExtend()}
                  disabled={extending}
                  className="pe-btn-primary whitespace-nowrap disabled:opacity-60"
                >
                  {extending ? <Loader2 size={15} className="animate-spin" /> : <Timer size={15} />}
                  Extend
                </button>
              </div>
              {extensionNotice && (
                <p className="mt-3 text-sm text-[#10b981]">{extensionNotice}</p>
              )}
              {extensionError && (
                <p role="alert" className="mt-3 text-sm text-[#fca5a5]">
                  {extensionError}
                </p>
              )}
              <p className="mt-3 text-xs text-[#5a6a8a]">
                The final amount is settled when staff close the session. Payment is handled
                separately.
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
