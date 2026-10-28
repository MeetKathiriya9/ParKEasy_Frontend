/**
 * Staff check-in and check-out by QR code.
 *
 * The camera is optional: the same lookup works by typing the reference or QR
 * token, which is the fallback when a phone camera is unavailable. The server
 * enforces facility scope, so a scan that belongs to another operator comes
 * back as "not found" rather than leaking the booking.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import { Badge, SectionHeader } from '@/components/ui';
import { formatDateTime, formatDuration, formatMoney } from '@/lib/format';
import {
  RESERVATION_STATUS_COLORS,
  RESERVATION_STATUS_LABELS,
  checkInReservation,
  checkOutReservation,
  lookupReservation,
  reservationErrorMessage,
} from '@/lib/reservations';
import type { ReservationRecord, SessionRecord } from '@/types';
import {
  AlertCircle, Camera, CameraOff, CheckCircle2, Loader2, LogIn, LogOut, QrCode,
  Search, XCircle,
} from 'lucide-react';

const READER_ID = 'parkeasy-qr-reader';

export function StaffScanner() {
  const [manualCode, setManualCode] = useState('');
  const [reservation, setReservation] = useState<ReservationRecord | null>(null);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [looking, setLooking] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startingRef = useRef(false);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!scanner) return;
    try {
      await scanner.stop();
    } catch {
      // Already stopped or never started; clearing below is still safe.
    }
    scanner.clear();
  }, []);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  const lookup = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      setLooking(true);
      setError('');
      setNotice('');
      try {
        const found = await lookupReservation(trimmed);
        setReservation(found);
        setSession(null);
      } catch (err) {
        setReservation(null);
        setSession(null);
        setError(reservationErrorMessage(err));
      } finally {
        setLooking(false);
      }
    },
    [],
  );

  const startScanner = async () => {
    if (scanning || startingRef.current) return;
    startingRef.current = true;
    setCameraError('');
    setError('');
    try {
      // Loaded on demand: the QR library is only needed once a staff member
      // actually opens the camera, so it should not weigh down the first paint.
      const { Html5Qrcode: Html5QrcodeClass } = await import('html5-qrcode');
      const scanner = new Html5QrcodeClass(READER_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          void stopScanner();
          void lookup(decodedText);
        },
        () => {
          // Per-frame decode misses are normal; only surface start failures.
        },
      );
      setScanning(true);
    } catch (err) {
      await stopScanner();
      setCameraError(
        err instanceof Error
          ? `Could not start the camera: ${err.message}`
          : 'Could not start the camera. Type the reference below instead.',
      );
    } finally {
      startingRef.current = false;
    }
  };

  const handleCheckIn = async () => {
    if (!reservation) return;
    setActionPending(true);
    setError('');
    setNotice('');
    try {
      const result = await checkInReservation(reservation.id);
      setReservation(result.reservation);
      setSession(result.session);
      setNotice(`Checked in to space ${result.session.spaceNumber}.`);
    } catch (err) {
      setError(reservationErrorMessage(err));
    } finally {
      setActionPending(false);
    }
  };

  const handleCheckOut = async () => {
    if (!reservation) return;
    setActionPending(true);
    setError('');
    setNotice('');
    try {
      const result = await checkOutReservation(reservation.id);
      setReservation(result.reservation);
      setSession(result.session);
      setNotice(
        `Checked out after ${formatDuration(result.session.durationMinutes)}. ` +
          `Estimated amount ${formatMoney(result.session.amount, 2)}.`,
      );
    } catch (err) {
      setError(reservationErrorMessage(err));
    } finally {
      setActionPending(false);
    }
  };

  const reset = () => {
    setReservation(null);
    setSession(null);
    setManualCode('');
    setError('');
    setNotice('');
  };

  const canCheckIn = reservation?.status === 'CONFIRMED' || reservation?.status === 'PENDING';
  const canCheckOut = reservation?.status === 'ACTIVE' || reservation?.status === 'ARRIVED';

  return (
    <div>
      <SectionHeader
        title="QR Scanner"
        subtitle="Scan a reservation QR code for check-in and check-out"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="pe-card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Camera size={17} className="text-[#3b82f6]" /> Camera
            </h2>

            <div className="relative rounded-xl border border-[#1e2d4d] bg-[#0b1220] overflow-hidden min-h-[240px] flex items-center justify-center">
              <div id={READER_ID} className="w-full" />
              {!scanning && (
                <div className="absolute pointer-events-none text-center px-6">
                  <QrCode size={36} className="mx-auto text-[#5a6a8a] mb-2" />
                  <p className="text-sm text-[#8a98b5]">
                    {startingRef.current ? 'Starting camera...' : 'Camera is off'}
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-3 rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-2 text-sm text-[#fcd34d]">
                {cameraError}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              {scanning ? (
                <button type="button" onClick={() => void stopScanner()} className="pe-btn-outline flex-1">
                  <CameraOff size={15} /> Stop camera
                </button>
              ) : (
                <button type="button" onClick={() => void startScanner()} className="pe-btn-primary flex-1">
                  <Camera size={15} /> Start camera
                </button>
              )}
            </div>
            <p className="text-xs text-[#5a6a8a] mt-2">
              The camera is only used while this page is open. Nothing is recorded.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void lookup(manualCode);
            }}
            className="pe-card p-5 space-y-3"
          >
            <h2 className="font-semibold flex items-center gap-2">
              <Search size={17} className="text-[#10b981]" /> Manual lookup
            </h2>
            <p className="text-xs text-[#5a6a8a]">
              Type the reference (e.g. PE-XXXXXX) or paste the QR token.
            </p>
            <input
              type="text"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Reservation reference or QR token"
              className="pe-input font-mono"
              autoComplete="off"
            />
            <button type="submit" disabled={looking || !manualCode.trim()} className="pe-btn-primary w-full">
              {looking ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              Find reservation
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {error && (
            <div role="alert" className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5] flex items-center gap-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {notice && (
            <div className="rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 px-3 py-2 text-sm text-[#6ee7b7] flex items-center gap-2">
              <CheckCircle2 size={15} /> {notice}
            </div>
          )}

          {!reservation ? (
            <div className="pe-card p-10 text-center">
              <QrCode size={38} className="mx-auto text-[#5a6a8a] mb-3" />
              <p className="text-[#8a98b5]">Scan or look up a reservation</p>
              <p className="text-xs text-[#5a6a8a] mt-1">
                The booking's status decides whether check-in or check-out is offered.
              </p>
            </div>
          ) : (
            <div className="pe-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono font-semibold">{reservation.reference}</p>
                  <p className="text-sm text-[#8a98b5]">{reservation.facilityName}</p>
                </div>
                <Badge color={RESERVATION_STATUS_COLORS[reservation.status]}>
                  {RESERVATION_STATUS_LABELS[reservation.status]}
                </Badge>
              </div>

              <div className="rounded-lg border border-[#1e2d4d] bg-[#0b1220] p-4 space-y-2 text-sm">
                <Row label="Vehicle" value={reservation.vehiclePlate} />
                <Row label="Space" value={reservation.spaceNumber} />
                <Row label="Start" value={formatDateTime(reservation.startTime)} />
                <Row label="End" value={formatDateTime(reservation.endTime)} />
                <Row label="Duration" value={formatDuration(reservation.durationMinutes)} />
                <Row label="Estimated amount" value={`${formatMoney(reservation.estimatedAmount, 2)} (estimate)`} />
                {reservation.checkedInAt && <Row label="Checked in" value={formatDateTime(reservation.checkedInAt)} />}
              </div>

              {session && (
                <div className="rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 p-4 text-sm">
                  <p className="font-semibold text-[#6ee7b7] mb-2">Session</p>
                  <Row label="Entry" value={formatDateTime(session.entryTime)} />
                  <Row label="Duration" value={formatDuration(session.durationMinutes)} />
                  <Row label="Amount" value={`${formatMoney(session.amount, 2)} (estimate)`} />
                  {session.overstayMinutes > 0 && (
                    <p className="text-[#fcd34d] mt-2">Overstay: {formatDuration(session.overstayMinutes)}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={reset} className="pe-btn-outline flex-1">
                  Clear
                </button>
                {canCheckIn && (
                  <button
                    type="button"
                    onClick={() => void handleCheckIn()}
                    disabled={actionPending}
                    className="pe-btn-primary flex-1"
                  >
                    {actionPending ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                    Check in
                  </button>
                )}
                {canCheckOut && (
                  <button
                    type="button"
                    onClick={() => void handleCheckOut()}
                    disabled={actionPending}
                    className="pe-btn-primary flex-1 bg-[#f59e0b] hover:bg-[#d97706]"
                  >
                    {actionPending ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
                    Check out
                  </button>
                )}
                {!canCheckIn && !canCheckOut && (
                  <span className="flex-1 flex items-center justify-end gap-1.5 text-xs text-[#5a6a8a]">
                    <XCircle size={14} /> No action available
                  </span>
                )}
              </div>

              {reservation.status === 'CONFIRMED' && (
                <p className="text-xs text-[#5a6a8a]">
                  Check-in opens 30 minutes before the booking start and stays open until its end.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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
