/**
 * The driver's reservations, read live from `/reservations`.
 *
 * The server returns only the signed-in driver's own bookings. The QR code is
 * the `qrCode` token staff scan at check-in; it is never reconstructed from the
 * reference. Cancelling is allowed only while the server says `CONFIRMED`.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '@/context/AppContext';
import { Badge, EmptyState, Modal, SectionHeader } from '@/components/ui';
import { formatDateTime, formatDuration, formatMoney } from '@/lib/format';
import {
  RESERVATION_STATUS_COLORS,
  RESERVATION_STATUS_LABELS,
  cancelReservation,
  fetchReservations,
  reservationErrorMessage,
} from '@/lib/reservations';
import type { ReservationRecord, ReservationStatusWire } from '@/types';
import {
  AlertCircle, CalendarCheck, CalendarClock, CheckCircle2, Clock, Loader2, QrCode,
  RefreshCw, XCircle,
} from 'lucide-react';

type Tab = 'upcoming' | 'past' | 'cancelled';

const UPCOMING: ReservationStatusWire[] = ['PENDING', 'CONFIRMED', 'ARRIVED', 'ACTIVE'];
const PAST: ReservationStatusWire[] = ['COMPLETED', 'EXPIRED', 'NO_SHOW'];
const CANCELLED: ReservationStatusWire[] = ['CANCELLED'];

function matchesTab(reservation: ReservationRecord, tab: Tab): boolean {
  if (tab === 'upcoming') return UPCOMING.includes(reservation.status);
  if (tab === 'past') return PAST.includes(reservation.status);
  return CANCELLED.includes(reservation.status);
}

export function DriverReservations() {
  const { navigate } = useApp();
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('upcoming');
  const [selected, setSelected] = useState<ReservationRecord | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await fetchReservations({ limit: 50, order: 'desc' });
      setReservations(page.items);
    } catch (err) {
      setError(reservationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => reservations.filter((reservation) => matchesTab(reservation, tab)),
    [reservations, tab],
  );

  const counts = useMemo(
    () => ({
      upcoming: reservations.filter((row) => matchesTab(row, 'upcoming')).length,
      past: reservations.filter((row) => matchesTab(row, 'past')).length,
      cancelled: reservations.filter((row) => matchesTab(row, 'cancelled')).length,
    }),
    [reservations],
  );

  const closeDetail = () => {
    if (cancelling) return;
    setSelected(null);
    setConfirmingCancel(false);
    setCancelReason('');
    setActionError('');
  };

  const handleCancel = async () => {
    if (!selected) return;
    setCancelling(true);
    setActionError('');
    try {
      const updated = await cancelReservation(selected.id, cancelReason);
      setReservations((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
      setSelected(updated);
      setConfirmingCancel(false);
      setCancelReason('');
    } catch (err) {
      setActionError(reservationErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="My Reservations"
        subtitle="Your bookings, QR codes and cancellations"
        action={
          <button type="button" onClick={() => void load()} disabled={loading} className="pe-btn-outline">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-5">
        {(
          [
            ['upcoming', 'Upcoming', counts.upcoming],
            ['past', 'Past', counts.past],
            ['cancelled', 'Cancelled', counts.cancelled],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-[#2563eb] text-white'
                : 'bg-[#111a2e] border border-[#1e2d4d] text-[#8a98b5] hover:text-[#e8edf5]'
            }`}
          >
            {label} <span className="opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5] flex items-center gap-2">
          <AlertCircle size={15} /> {error}
          <button type="button" onClick={() => void load()} className="ml-auto underline">
            Try again
          </button>
        </div>
      )}

      {loading && reservations.length === 0 ? (
        <div className="pe-card p-10 flex items-center justify-center gap-2 text-sm text-[#8a98b5]">
          <Loader2 size={16} className="animate-spin" /> Loading your reservations
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={28} />}
          title={tab === 'upcoming' ? 'No upcoming reservations' : tab === 'past' ? 'No past reservations' : 'No cancelled reservations'}
          message={
            tab === 'upcoming'
              ? 'Find a facility and reserve a space for a 30-minute-aligned window.'
              : 'Bookings appear here once they reach this state.'
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onOpen={() => {
                setSelected(reservation);
                setConfirmingCancel(false);
                setActionError('');
              }}
            />
          ))}
        </div>
      )}

      {tab === 'upcoming' && (
        <div className="flex justify-center mt-6">
          <button type="button" onClick={() => navigate('driver-search')} className="pe-btn-primary">
            Find Parking
          </button>
        </div>
      )}

      <Modal open={selected !== null} onClose={closeDetail} title="Reservation details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono font-semibold">{selected.reference}</p>
                <p className="text-xs text-[#5a6a8a]">{selected.facilityName}</p>
              </div>
              <Badge color={RESERVATION_STATUS_COLORS[selected.status]}>
                {RESERVATION_STATUS_LABELS[selected.status]}
              </Badge>
            </div>

            {(selected.status === 'CONFIRMED' || selected.status === 'ARRIVED' || selected.status === 'ACTIVE') && (
              <div className="rounded-xl border border-[#1e2d4d] bg-white p-4 flex justify-center">
                <QRCodeSVG value={selected.qrCode} size={180} />
              </div>
            )}

            <div className="rounded-lg border border-[#1e2d4d] bg-[#0b1220] p-4 space-y-2 text-sm">
              <Row label="Vehicle" value={selected.vehiclePlate} />
              <Row label="Space" value={selected.spaceNumber} />
              <Row label="Start" value={formatDateTime(selected.startTime)} />
              <Row label="End" value={formatDateTime(selected.endTime)} />
              <Row label="Duration" value={formatDuration(selected.durationMinutes)} />
              <Row
                label="Estimated amount"
                value={`${formatMoney(selected.estimatedAmount, 2)} (estimate)`}
              />
              {selected.checkedInAt && <Row label="Checked in" value={formatDateTime(selected.checkedInAt)} />}
              {selected.checkedOutAt && <Row label="Checked out" value={formatDateTime(selected.checkedOutAt)} />}
              {selected.cancelReason && <Row label="Cancel reason" value={selected.cancelReason} />}
            </div>

            {selected.status === 'CONFIRMED' && (
              <p className="text-xs text-[#5a6a8a] flex items-start gap-1.5">
                <QrCode size={13} className="mt-0.5 flex-shrink-0" />
                Show this QR code to staff. Check-in opens 30 minutes before the start.
              </p>
            )}

            {actionError && (
              <div role="alert" className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]">
                {actionError}
              </div>
            )}

            {confirmingCancel ? (
              <div className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 p-4 space-y-3">
                <p className="text-sm text-[#fca5a5] flex items-center gap-2">
                  <AlertCircle size={15} /> Cancel this reservation? The space is released immediately.
                </p>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  maxLength={200}
                  placeholder="Reason (optional)"
                  className="pe-input"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingCancel(false);
                      setActionError('');
                    }}
                    disabled={cancelling}
                    className="pe-btn-outline flex-1"
                  >
                    Keep booking
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCancel()}
                    disabled={cancelling}
                    className="pe-btn-primary flex-1 bg-[#ef4444] hover:bg-[#dc2626]"
                  >
                    {cancelling ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                    Cancel booking
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={closeDetail} className="pe-btn-outline flex-1">
                  Close
                </button>
                {selected.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    onClick={() => setConfirmingCancel(true)}
                    className="pe-btn-outline flex-1 text-[#ef4444] border-[#ef4444]/40"
                  >
                    <XCircle size={15} /> Cancel
                  </button>
                )}
                {selected.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => {
                      closeDetail();
                      navigate('driver-session');
                    }}
                    className="pe-btn-primary flex-1"
                  >
                    <Clock size={15} /> Active session
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ReservationCard({
  reservation,
  onOpen,
}: {
  reservation: ReservationRecord;
  onOpen: () => void;
}) {
  const upcoming = UPCOMING.includes(reservation.status);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left pe-card p-4 hover:border-[#2563eb]/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{reservation.facilityName}</p>
          <p className="text-xs font-mono text-[#5a6a8a] mt-0.5">{reservation.reference}</p>
        </div>
        <Badge color={RESERVATION_STATUS_COLORS[reservation.status]}>
          {RESERVATION_STATUS_LABELS[reservation.status]}
        </Badge>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-[#8a98b5]">
          <CalendarClock size={14} /> {formatDateTime(reservation.startTime)}
        </span>
        <span className="flex items-center gap-1.5 text-[#8a98b5]">
          <Clock size={14} /> {formatDuration(reservation.durationMinutes)}
        </span>
        <span className="flex items-center gap-1.5 text-[#8a98b5]">
          <CheckCircle2 size={14} /> Space {reservation.spaceNumber}
        </span>
      </div>
      {upcoming && (
        <p className="text-xs text-[#3b82f6] mt-3 flex items-center gap-1">
          <QrCode size={13} /> Tap to show QR code
        </p>
      )}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#8a98b5]">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
