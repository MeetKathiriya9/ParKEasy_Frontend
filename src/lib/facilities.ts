/**
 * Parking facility management for operators and admins (DOC sections 7, 11,
 * 16-17, 19, 21).
 *
 * Thin wrappers over the `/facilities` routes, mirroring `lib/vehicles.ts` so
 * pages never build a URL or reach for Axios directly. This is the management
 * API; the driver-facing discovery group (`/parking`) is a later phase.
 *
 * `status` is never part of create or PATCH bodies - transitions go through
 * `PATCH /facilities/{id}/status` with an optional reason - and the server
 * answers 422 if one is sent to the wrong route. `lat`/`lng` are stored as a
 * GeoJSON point and derived back at the API boundary, so they are always sent
 * as a pair. The derived flags (`hasEV`, `hasCovered`, `hasAccessible`,
 * `isOpenNow`) are read-only.
 */

import { del, get, patch, post } from './api';
import { endpoints } from './endpoints';
import type {
  Amenity,
  Facility,
  FacilityCreateInput,
  FacilityStatus,
  FacilityStatusInput,
  FacilityUpdateInput,
} from '@/types';

/**
 * `GET /facilities` - operators see their own, admins see all, staff see the
 * ones assigned in their token. Drivers get 403.
 */
export async function fetchFacilities(status?: FacilityStatus): Promise<Facility[]> {
  return get<Facility[]>(endpoints.facilities.list, status ? { params: { status } } : undefined);
}

/** `GET /facilities/{id}` - owner, admin, or staff assigned to the facility. */
export async function fetchFacility(id: string): Promise<Facility> {
  return get<Facility>(endpoints.facilities.detail(id));
}

/**
 * `POST /facilities` - 201. Admins may send `operatorId` to create on behalf
 * of another account; non-admins sending it get 422.
 */
export async function createFacility(input: FacilityCreateInput): Promise<Facility> {
  return post<Facility>(endpoints.facilities.create, input);
}

/** `PATCH /facilities/{id}` - partial update; `null` clears a nullable field. */
export async function updateFacility(id: string, input: FacilityUpdateInput): Promise<Facility> {
  return patch<Facility>(endpoints.facilities.update(id), input);
}

/**
 * `DELETE /facilities/{id}` - 204, or 409 `FACILITY_IN_USE` while reservations
 * or sessions still reference the facility.
 */
export async function removeFacility(id: string): Promise<void> {
  await del<void>(endpoints.facilities.remove(id));
}

/**
 * `PATCH /facilities/{id}/status` - the only route that may change `status`.
 * Any transition is allowed and a no-op change is not recorded twice.
 */
export async function changeFacilityStatus(
  id: string,
  input: FacilityStatusInput,
): Promise<Facility> {
  return patch<Facility>(endpoints.facilities.updateStatus(id), input);
}

/** Display names for the wire values of `FacilityStatus`. */
export const FACILITY_STATUS_LABELS: Record<FacilityStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  TEMPORARILY_CLOSED: 'Temporarily closed',
  MAINTENANCE: 'Maintenance',
};

/** Badge colors matching those labels. */
export const FACILITY_STATUS_COLORS: Record<FacilityStatus, 'green' | 'gray' | 'red' | 'amber'> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  TEMPORARILY_CLOSED: 'red',
  MAINTENANCE: 'amber',
};

/** Display names for the wire values of `Amenity`. */
export const AMENITY_LABELS: Record<Amenity, string> = {
  ev_charging: 'EV charging',
  covered: 'Covered',
  security: 'Security',
  cameras: 'Cameras',
  restrooms: 'Restrooms',
  accessible: 'Accessible',
  valet: 'Valet',
  elevator: 'Elevator',
};

/** Matches the server's "HH:MM" clock-time pattern. */
export function timeIsValid(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/**
 * Mirrors `hours_error` on the server: times are required exactly when the
 * facility is not open 24 hours, and the two times must differ.
 */
export function facilityHoursAreValid(
  open24h: boolean,
  openingTime: string,
  closingTime: string,
): boolean {
  if (open24h) return true;
  return (
    timeIsValid(openingTime) && timeIsValid(closingTime) && openingTime !== closingTime
  );
}

/** Matches the server's rate bounds: a number in (0, 10000]. */
export function rateIsValid(value: string): boolean {
  if (value.trim() === '') return true;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= 10000;
}

/**
 * Matches the server's rating bounds: a number in [0, 5]. An empty field is
 * valid and means "leave the rating alone".
 */
export function ratingIsValid(value: string): boolean {
  if (value.trim() === '') return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 5;
}

/**
 * Matches the server's review-count bounds: a whole number from 0 up. An
 * empty field is valid and means "leave the count alone".
 */
export function reviewCountIsValid(value: string): boolean {
  if (value.trim() === '') return true;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 10_000_000;
}

/**
 * Collapses runs of whitespace the way the server does, so validation of
 * name/address happens before the round trip.
 */
export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
