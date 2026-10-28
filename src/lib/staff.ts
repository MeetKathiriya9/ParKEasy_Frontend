/**
 * Staff accounts and facility assignments for operators and admins (DOC
 * sections 7, 10, 11, 21, 31).
 *
 * Thin wrappers over `/staff`, mirroring `lib/facilities.ts` so pages never
 * build a URL or reach for Axios directly. A staff member belongs to one
 * operator; assignments are periods, so an ended assignment stays in the
 * history as `INACTIVE` and re-assigning opens a new row.
 *
 * The password is set at creation (there is no invite email) and follows the
 * same rule as registration, mirrored by `staffPasswordIsValid`. Suspending an
 * account revokes its access on the next request while leaving its assignments
 * dormant, so reactivation needs no re-assignment work.
 */

import { del, get, patch, post } from './api';
import { endpoints } from './endpoints';
import type {
  AssignmentStatus,
  StaffAssignment,
  StaffAssignmentInput,
  StaffCreateInput,
  StaffDetail,
  StaffListParams,
  StaffStatus,
  StaffStatusInput,
  StaffSummary,
  StaffUpdateInput,
} from '@/types';

/** `GET /staff` - operators see their own staff, admins see every account. */
export async function fetchStaff(params: StaffListParams = {}): Promise<StaffSummary[]> {
  const query: Record<string, string> = {};
  if (params.facilityId) query.facilityId = params.facilityId;
  if (params.status) query.status = params.status;
  if (params.q?.trim()) query.q = params.q.trim();
  return get<StaffSummary[]>(endpoints.staff.list, { params: query });
}

/** `GET /staff/{id}` - the member plus the full assignment history. */
export async function fetchStaffMember(id: string): Promise<StaffDetail> {
  return get<StaffDetail>(endpoints.staff.detail(id));
}

/**
 * `POST /staff` - 201. An operator owns the account automatically; an admin
 * must send `operatorId`. `facilityIds` opens the same assignments the
 * assignment route would.
 */
export async function createStaffMember(input: StaffCreateInput): Promise<StaffDetail> {
  return post<StaffDetail>(endpoints.staff.create, input);
}

/** `PATCH /staff/{id}` - partial update of name / phone (admin: ownership). */
export async function updateStaffMember(
  id: string,
  input: StaffUpdateInput,
): Promise<StaffDetail> {
  return patch<StaffDetail>(endpoints.staff.update(id), input);
}

/** `PATCH /staff/{id}/status` - suspend or reactivate. */
export async function changeStaffStatus(
  id: string,
  input: StaffStatusInput,
): Promise<StaffDetail> {
  return patch<StaffDetail>(endpoints.staff.updateStatus(id), input);
}

/** `GET /staff/{id}/assignments` - newest first, optionally only `ACTIVE`. */
export async function fetchStaffAssignments(
  id: string,
  status?: AssignmentStatus,
): Promise<StaffAssignment[]> {
  return get<StaffAssignment[]>(
    endpoints.staff.assignments(id),
    status ? { params: { status } } : undefined,
  );
}

/** `POST /staff/{id}/assignments` - opens a new active period (201). */
export async function assignStaffFacility(
  id: string,
  input: StaffAssignmentInput,
): Promise<StaffAssignment> {
  return post<StaffAssignment>(endpoints.staff.assignments(id), input);
}

/**
 * `DELETE /staff/{id}/assignments/{assignmentId}` - closes the period as
 * `INACTIVE` with an optional reason; the row stays in the history.
 */
export async function unassignStaffFacility(
  id: string,
  assignmentId: string,
  reason?: string,
): Promise<StaffAssignment> {
  return del<StaffAssignment>(
    endpoints.staff.assignment(id, assignmentId),
    reason?.trim() ? { params: { reason: reason.trim() } } : undefined,
  );
}

/** Display names for the wire values of `StaffStatus`. */
export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  PENDING: 'Pending',
};

/** Badge colors matching those labels. */
export const STAFF_STATUS_COLORS: Record<StaffStatus, 'green' | 'gray' | 'red' | 'amber'> = {
  ACTIVE: 'green',
  SUSPENDED: 'red',
  PENDING: 'amber',
};

/** Display names for the wire values of `AssignmentStatus`. */
export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Ended',
};

/** Matches the server's password rule: 8-72 characters, a letter and a digit. */
export function staffPasswordIsValid(value: string): boolean {
  return (
    value.length >= 8 &&
    value.length <= 72 &&
    /[A-Za-z]/.test(value) &&
    /\d/.test(value)
  );
}

/** Collapses runs of whitespace the way the server does. */
export function collapseStaffName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** A short "City Mall +2" label for a staff row. */
export function facilitySummaryLabel(facilities: { name: string }[]): string {
  if (facilities.length === 0) return 'No facilities';
  if (facilities.length === 1) return facilities[0].name;
  return `${facilities[0].name} +${facilities.length - 1}`;
}
