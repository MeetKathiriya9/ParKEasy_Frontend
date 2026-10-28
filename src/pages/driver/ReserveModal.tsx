/**
 * Reserve a space at one facility.
 *
 * The dialog asks for a vehicle and a 30-minute-aligned window, then checks the
 * server's whole-window availability before offering the Book button. Booking
 * does not take money: the returned figure is a base-rate estimate, labelled as
 * one everywhere it appears.
 */

import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui';
import { formatDateTime, formatDuration, formatMoney } from '@/lib/format';
import {
  RESERVATION_DURATIONS,
  RESERVATION_SLOT_MINUTES,
  createReservation,
  fetchReservationAvailability,
  reservationErrorMessage,
} from '@/lib/reservations';
import { fetchVehicles } from '@/lib/vehicles';
import type {
  ParkingSearchResult,
  ReservationAvailability,
  ReservationRecord,
  Vehicle,
} from '@/types';
import { AlertCircle, Calendar, CheckCircle2, Clock, Loader2, QrCode } from 'lucide-react';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeInputValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The next 30-minute boundary at least five minutes from now. */
function nextSlot(): Date {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() + 5);
  const remainder = date.getMinutes() % RESERVATION_SLOT_MINUTES;
  if (remainder !== 0) date.setMinutes(date.getMinutes() + (RESERVATION_SLOT_MINUTES - remainder));
  return date;
}

function timeOptions(): string[] {
  const options: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += RESERVATION_SLOT_MINUTES) {
    options.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }
  return options;
}

export function ReserveModal({
  open,
  facility,
  onClose,
  onBooked,
  onViewReservations,
  onManageVehicles,
}: {
  open: boolean;
  facility: ParkingSearchResult;
  onClose: () => void;
  onBooked: () => void;
  onViewReservations: () => void;
  onManageVehicles: () => void;
}) {
  const initial = useMemo(nextSlot, []);
  const [date, setDate] = useState(() => dateInputValue(initial));
  const [time, setTime] = useState(() => timeInputValue(initial));
  const [duration, setDuration] = useState(60);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [availability, setAvailability] = useState<ReservationAvailability | null>(null);
  const [checking, setChecking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [booking, setBooking] = useState(false);
  const [formError, setFormError] = useState('');
  const [created, setCreated] = useState<ReservationRecord | null>(null);

  const start = useMemo(() => new Date(`${date}T${time}:00`), [date, time]);
  const end = useMemo(
    () => new Date(start.getTime() + duration * 60_000),
    [start, duration],
  );
  const startValid = !Number.isNaN(start.getTime()) && start.getTime() > Date.now() - 5 * 60_000;

  useEffect(() => {
    let cancelled = false;
    setVehiclesLoading(true);
    fetchVehicles()
      .then((list) => {
        if (cancelled) return;
        setVehicles(list);
        setVehicleId(list.find((vehicle) => vehicle.isDefault)?.id ?? list[0]?.id ?? '');
      })
      .catch((err) => {
        if (!cancelled) setFormError(reservationErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setVehiclesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!startValid) {
      setAvailability(null);
      setAvailabilityError('Pick a start time in the future.');
      return;
    }
    let cancelled = false;
    setChecking(true);
    setAvailabilityError('');
    fetchReservationAvailability({
      facilityId: facility.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    })
      .then((row) => {
        if (!cancelled) setAvailability(row);
      })
      .catch((err) => {
        if (!cancelled) {
          setAvailability(null);
          setAvailabilityError(reservationErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [facility.id, start, end, startValid]);

  const canBook =
    !booking &&
    startValid &&
    Boolean(vehicleId) &&
    Boolean(availability && availability.availableSpaces > 0);

  const handleBook = async () => {
    if (!canBook) return;
    setBooking(true);
    setFormError('');
    try {
      const reservation = await createReservation({
        vehicleId,
        facilityId: facility.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      setCreated(reservation);
      onBooked();
    } catch (err) {
      setFormError(reservationErrorMessage(err));
    } finally {
      setBooking(false);
    }
  };

  const close = () => {
    if (booking) return;
    onClose();
  };

  if (created) {
    return (
      <Modal open={open} onClose={close} title="Reservation confirmed">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#10b981]">
            <CheckCircle2 size={20} />
            <p className="font-semibold">You are booked.</p>
          </div>

          <div className="rounded-xl border border-[#1e2d4d] bg-white p-4 flex justify-center">
            <QRCodeSVG value={created.qrCode} size={176} />
          </div>

          <div className="rounded-lg border border-[#1e2d4d] bg-[#0b1220] p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-[#8a98b5]">Reference</span>
              <span className="font-mono font-semibold">{created.reference}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#8a98b5]">Space</span>
              <span className="font-semibold">{created.spaceNumber}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#8a98b5]">When</span>
              <span className="text-right">
                {formatDateTime(created.startTime)} - {formatDateTime(created.endTime)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#8a98b5]">Estimated amount</span>
              <span className="font-semibold">
                {formatMoney(created.estimatedAmount, 2)} <span className="text-xs text-[#5a6a8a]">estimate</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-[#5a6a8a]">
            Show this QR code to staff at the entrance. No payment has been taken; the amount above
            is a base-rate estimate.
          </p>

          <div className="flex gap-2">
            <button type="button" onClick={close} className="pe-btn-outline flex-1">
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                close();
                onViewReservations();
              }}
              className="pe-btn-primary flex-1"
            >
              View my reservations
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const windowLabel = startValid
    ? `${formatDateTime(start.toISOString())} - ${formatDateTime(end.toISOString())}`
    : '-';

  return (
    <Modal open={open} onClose={close} title={`Reserve at ${facility.name}`}>
      <div className="space-y-4">
        <div>
          <label htmlFor="reserve-vehicle" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
            Vehicle
          </label>
          {vehiclesLoading ? (
            <div className="flex items-center gap-2 text-sm text-[#8a98b5] py-2">
              <Loader2 size={15} className="animate-spin" /> Loading vehicles
            </div>
          ) : vehicles.length === 0 ? (
            <div className="rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-2 text-sm text-[#fcd34d] space-y-2">
              <p>Add a vehicle before booking a space.</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onManageVehicles();
                }}
                className="pe-btn-outline text-sm"
              >
                Add a vehicle
              </button>
            </div>
          ) : (
            <select
              id="reserve-vehicle"
              value={vehicleId}
              onChange={(event) => setVehicleId(event.target.value)}
              className="pe-input"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.model} - {vehicle.registrationNumber}
                  {vehicle.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="reserve-date" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              <Calendar size={12} className="inline mr-1" /> Date
            </label>
            <input
              id="reserve-date"
              type="date"
              value={date}
              min={dateInputValue(new Date())}
              max={dateInputValue(maxDate)}
              onChange={(event) => setDate(event.target.value)}
              className="pe-input"
            />
          </div>
          <div>
            <label htmlFor="reserve-time" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              <Clock size={12} className="inline mr-1" /> Start
            </label>
            <select
              id="reserve-time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="pe-input"
            >
              {timeOptions().map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="reserve-duration" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
            Duration
          </label>
          <select
            id="reserve-duration"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className="pe-input"
          >
            {RESERVATION_DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-[#1e2d4d] bg-[#0b1220] px-3 py-2 text-sm flex items-center justify-between gap-3">
          <span className="text-[#8a98b5]">Window</span>
          <span className="text-right">{windowLabel}</span>
        </div>

        <div className="rounded-lg border border-[#1e2d4d] bg-[#0b1220] px-3 py-2 text-sm flex items-center justify-between gap-3">
          <span className="text-[#8a98b5]">Free for the whole window</span>
          {checking ? (
            <Loader2 size={16} className="animate-spin text-[#8a98b5]" />
          ) : availability ? (
            <span className={availability.availableSpaces > 0 ? 'text-[#10b981] font-semibold' : 'text-[#ef4444] font-semibold'}>
              {availability.availableSpaces} of {availability.totalReservable} spaces
            </span>
          ) : (
            <span className="text-[#5a6a8a]">-</span>
          )}
        </div>

        {availabilityError && (
          <div className="rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-2 text-sm text-[#fcd34d]">
            {availabilityError}
          </div>
        )}

        {formError && (
          <div role="alert" className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]">
            {formError}
          </div>
        )}

        <p className="text-xs text-[#5a6a8a] flex items-start gap-1.5">
          <QrCode size={13} className="mt-0.5 flex-shrink-0" />
          The amount shown after booking is a base-rate estimate. Payment is handled separately.
        </p>

        <button
          type="button"
          onClick={() => void handleBook()}
          disabled={!canBook}
          className="pe-btn-primary w-full disabled:opacity-60"
        >
          {booking ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Booking
            </>
          ) : (
            <>
              <CheckCircle2 size={16} /> Book this space
            </>
          )}
        </button>

        {!startValid && (
          <p className="text-xs text-[#f59e0b] flex items-center gap-1.5">
            <AlertCircle size={13} /> Pick a start time in the future.
          </p>
        )}
      </div>
    </Modal>
  );
}
