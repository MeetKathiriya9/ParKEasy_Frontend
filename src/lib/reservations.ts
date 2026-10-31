/**
 * Reservations and parking sessions (DOC sections 16, 17 and 21).
 *
 * Thin wrappers over `/reservations` and `/sessions`, mirroring `lib/parking.ts`.
 * The server owns the booking grid, space allocation and overlap check; this
 * module only builds the request and turns failures into readable sentences.
 *
 * The amount returned by the server is a **base-rate estimate**, not a payment:
 * pricing rules and payments are later modules, so the UI labels it as such.
 */

import { ApiError, get, patch, post } from './api';
import { endpoints } from './endpoints';
import type {
  CheckInResult,
  Paginated,
  ReservationAvailability,
  ReservationListParams,
  ReservationRecord,
  ReservationStatusWire,
  SessionListParams,
  SessionRecord,
  SessionStatusWire,
} from '@/types';

export const RESERVATION_STATUS_LABELS: Record<ReservationStatusWire, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  ARRIVED: 'Arrived',
  ACTIVE: 'Parked',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  NO_SHOW: 'No-show',
};

export const RESERVATION_STATUS_COLORS: Record<
  ReservationStatusWire,
  'blue' | 'green' | 'amber' | 'red' | 'gray' | 'cyan'
> = {
  PENDING: 'gray',
  CONFIRMED: 'blue',
  ARRIVED: 'cyan',
  ACTIVE: 'green',
  COMPLETED: 'gray',
  CANCELLED: 'red',
  EXPIRED: 'amber',
  NO_SHOW: 'red',
};

export const SESSION_STATUS_LABELS: Record<SessionStatusWire, string> = {
  ACTIVE: 'Active',
  EXTENDED: 'Extended',
  COMPLETED: 'Completed',
  ABORTED: 'Aborted',
};

export const SESSION_STATUS_COLORS: Record<
  SessionStatusWire,
  'blue' | 'green' | 'amber' | 'red' | 'gray' | 'cyan'
> = {
  ACTIVE: 'green',
  EXTENDED: 'cyan',
  COMPLETED: 'gray',
  ABORTED: 'red',
};

/** The booking grid the server accepts. */
export const RESERVATION_SLOT_MINUTES = 30;

/** The durations the reserve form offers, in minutes. */
export const RESERVATION_DURATIONS = [30, 60, 90, 120, 180, 240, 480, 720];

export interface CreateReservationInput {
  vehicleId: string;
  facilityId: string;
  spaceId?: string;
  startTime: string;
  endTime: string;
}

function queryOf(params: ReservationListParams | SessionListParams): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params.status) query.status = params.status;
  if (params.facilityId) query.facilityId = params.facilityId;
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  if (params.q) query.q = params.q;
  if (params.order) query.order = params.order;
  if (params.page !== undefined) query.page = params.page;
  if (params.limit !== undefined) query.limit = params.limit;
  return query;
}

/** `GET /reservations/availability` - free spaces for a whole interval. */
export async function fetchReservationAvailability(params: {
  facilityId: string;
  startTime: string;
  endTime: string;
  spaceType?: string;
}): Promise<ReservationAvailability> {
  const query: Record<string, string> = {
    facilityId: params.facilityId,
    startTime: params.startTime,
    endTime: params.endTime,
  };
  if (params.spaceType) query.spaceType = params.spaceType;
  return get<ReservationAvailability>(endpoints.reservations.availability, {
    params: query,
  });
}

/** `POST /reservations` - book a space. Drivers only. */
export async function createReservation(
  input: CreateReservationInput,
): Promise<ReservationRecord> {
  return post<ReservationRecord>(endpoints.reservations.create, input);
}

/** `GET /reservations` - the caller's bookings (scope enforced server-side). */
export async function fetchReservations(
  params: ReservationListParams = {},
): Promise<Paginated<ReservationRecord>> {
  return get<Paginated<ReservationRecord>>(endpoints.reservations.list, {
    params: queryOf(params),
  });
}

/** `GET /reservations/{id}` - one booking. */
export async function fetchReservation(id: string): Promise<ReservationRecord> {
  return get<ReservationRecord>(endpoints.reservations.detail(id));
}

/** `GET /reservations/lookup` - staff lookup by reference or QR token. */
export async function lookupReservation(code: string): Promise<ReservationRecord> {
  return get<ReservationRecord>(endpoints.reservations.lookup, {
    params: { code },
  });
}

/** `PATCH /reservations/{id}/cancel` - cancel a confirmed booking. */
export async function cancelReservation(
  id: string,
  reason?: string,
): Promise<ReservationRecord> {
  return patch<ReservationRecord>(endpoints.reservations.cancel(id), {
    ...(reason?.trim() ? { reason: reason.trim() } : {}),
  });
}

/** `POST /reservations/{id}/check-in` - staff starts a session. */
export async function checkInReservation(
  id: string,
  spaceId?: string,
): Promise<CheckInResult> {
  return post<CheckInResult>(endpoints.reservations.checkIn(id), {
    ...(spaceId ? { spaceId } : {}),
  });
}

/** `POST /reservations/{id}/check-out` - staff closes the session. */
export async function checkOutReservation(id: string): Promise<CheckInResult> {
  return post<CheckInResult>(endpoints.reservations.checkOut(id));
}

/** `GET /sessions/active` - the driver's open session, or `null`. */
export async function fetchActiveSession(): Promise<SessionRecord | null> {
  return get<SessionRecord | null>(endpoints.sessions.active);
}

/** `GET /sessions` - sessions in the caller's scope. */
export async function fetchSessions(
  params: SessionListParams = {},
): Promise<Paginated<SessionRecord>> {
  return get<Paginated<SessionRecord>>(endpoints.sessions.list, {
    params: queryOf(params),
  });
}

/** `GET /sessions/{id}` - one session. */
export async function fetchSession(id: string): Promise<SessionRecord> {
  return get<SessionRecord>(endpoints.sessions.detail(id));
}

/** `PATCH /sessions/{id}/extend` - add time to an active session. */
export async function extendSession(
  id: string,
  additionalMinutes: number,
): Promise<CheckInResult> {
  return patch<CheckInResult>(endpoints.sessions.extend(id), { additionalMinutes });
}

/** `POST /sessions/{id}/close` - staff closes an active session. */
export async function closeSession(id: string): Promise<SessionRecord> {
  return post<SessionRecord>(endpoints.sessions.close(id));
}

/** Turn a reservation/session failure into a sentence worth showing. */
export function reservationErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'FACILITY_NOT_ACCEPTING':
        return 'This facility is not accepting reservations right now.';
      case 'SPACE_NOT_AVAILABLE':
        return 'That space is no longer available. Pick another one.';
      case 'SPACE_ALREADY_BOOKED':
        return 'That space is already booked for this time. Try a different space or time.';
      case 'NO_SPACE_AVAILABLE':
        return 'No space is free for the whole window. Try a shorter stay or another time.';
      case 'RESERVATION_NOT_CANCELLABLE':
        return 'Only a confirmed booking can be cancelled.';
      case 'RESERVATION_TOO_EARLY':
        return 'It is too early to check in for this booking.';
      case 'RESERVATION_EXPIRED':
        return 'This booking has expired.';
      case 'RESERVATION_ALREADY_ACTIVE':
        return 'This booking is already checked in.';
      case 'RESERVATION_NOT_ACTIVE':
        return 'This booking is not in a state that allows that action.';
      case 'SESSION_ALREADY_CLOSED':
        return 'This parking session is already closed.';
      case 'SESSION_NOT_ACTIVE':
        return 'This parking session is not active.';
      case 'SESSION_EXTENSION_CONFLICT':
        return 'The space is already booked for that extension. Choose a shorter extension.';
      case 'SESSION_EXTENSION_TOO_LONG':
        return 'That extension is too long for this booking.';
      case 'SPACE_IN_USE':
        return 'This space is in use. Close the parking session first.';
      case 'RATE_LIMITED':
        return 'Too many attempts for now. Wait a little and try again.';
      case 'NOT_FOUND':
        return 'That booking or space does not exist.';
      default:
        break;
    }
    if (err.status === 401) return 'Your session has expired. Sign in again.';
    if (err.status === 403) return 'You do not have access to this booking.';
    if (err.status === 404) return 'That booking or space does not exist.';
    if (err.status === 409) return err.message;
    if (err.status === 422) return 'That booking request is not valid.';
    if (err.status === 429) return 'Too many attempts for now. Wait a little and try again.';
    return err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}
