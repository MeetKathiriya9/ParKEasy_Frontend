/**
 * Parking space management for operators, admins and staff (DOC sections 7.79,
 * 11.169, 10.151, 18, 33).
 *
 * Thin wrappers over the floor/zone/space routes, mirroring `lib/facilities.ts`
 * so pages never build a URL or reach for Axios directly.
 *
 * The hierarchy is Facility -> Floor -> Zone -> Space. A facility's `capacity`
 * is derived from how many spaces it holds, so adding or deleting a space is
 * what moves capacity - there is no capacity field to send. `PATCH` on a space
 * may never move it between zones; that is a delete-and-recreate, so the ids a
 * caller sees always match what is painted on the wall.
 *
 * A space's `status` may only be set to `AVAILABLE`, `MAINTENANCE` or
 * `BLOCKED`: `OCCUPIED` and `RESERVED` belong to the reservation engine, and
 * the server answers 422 if a person tries to set them.
 */

import { ApiError, del, get, patch, post } from './api';
import { endpoints } from './endpoints';
import type {
  BulkSpacesInput,
  Facility,
  Floor,
  FloorInput,
  FloorUpdateInput,
  Space,
  SpaceCounts,
  SpaceInput,
  SpaceStatus,
  SpaceStatusInput,
  SpaceType,
  SpaceUpdateInput,
  Zone,
  ZoneInput,
  ZoneStatus,
  ZoneStatusInput,
} from '@/types';

/** Display names for the wire values of `SpaceStatus`. */
export const SPACE_STATUS_LABELS: Record<SpaceStatus, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  MAINTENANCE: 'Maintenance',
  BLOCKED: 'Blocked',
};

/** Badge colors matching those labels. */
export const SPACE_STATUS_COLORS: Record<
  SpaceStatus,
  'green' | 'red' | 'amber' | 'gray'
> = {
  AVAILABLE: 'green',
  OCCUPIED: 'red',
  RESERVED: 'amber',
  MAINTENANCE: 'gray',
  BLOCKED: 'gray',
};

/** Display names for the wire values of `SpaceType`. */
export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  standard: 'Standard',
  compact: 'Compact',
  large: 'Large',
  ev: 'EV',
  accessible: 'Accessible',
};

/** Display names for the wire values of `ZoneStatus`. */
export const ZONE_STATUS_LABELS: Record<ZoneStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Closed',
};

/**
 * The statuses a person may set. The rest belong to the reservation engine and
 * are refused with a 422 pointing here.
 */
export const MANUAL_SPACE_STATUSES: SpaceStatus[] = ['AVAILABLE', 'MAINTENANCE', 'BLOCKED'];

/** Statuses a closed zone's spaces fall back to when it is closed. */
export const ZONE_CLOSE_STATUSES: SpaceStatus[] = ['AVAILABLE', 'RESERVED', 'OCCUPIED'];

// --- Floors ------------------------------------------------------------------

/**
 * `GET /facilities/{id}/floors` - the layout tree, a floor with its zones
 * nested, ordered by level. Operators and admins read their own; staff read
 * the facilities their token assigns them.
 */
export async function fetchFloors(facilityId: string): Promise<Floor[]> {
  return get<Floor[]>(endpoints.spaces.floors(facilityId));
}

/** `POST /facilities/{id}/floors` - 201. The ceiling answers 409. */
export async function createFloor(facilityId: string, input: FloorInput): Promise<Floor> {
  return post<Floor>(endpoints.spaces.floors(facilityId), input);
}

/** `PATCH /floors/{id}` - rename / re-level; a rename rewrites its spaces. */
export async function updateFloor(floorId: string, input: FloorUpdateInput): Promise<Floor> {
  return patch<Floor>(endpoints.spaces.floor(floorId), input);
}

/**
 * `DELETE /floors/{id}` - 204. Cascades: every zone and space beneath the floor
 * goes with it.
 */
export async function removeFloor(floorId: string): Promise<void> {
  await del<void>(endpoints.spaces.floor(floorId));
}

// --- Zones -------------------------------------------------------------------

/** `POST /floors/{id}/zones` - 201. The ceiling answers 409. */
export async function createZone(floorId: string, input: ZoneInput): Promise<Zone> {
  return post<Zone>(endpoints.spaces.floorZones(floorId), input);
}

/** `PATCH /zones/{id}` - rename; a rename rewrites the zone's spaces. */
export async function updateZone(zoneId: string, input: ZoneInput): Promise<Zone> {
  return patch<Zone>(endpoints.spaces.zone(zoneId), input);
}

/**
 * `PATCH /zones/{id}/status` - the only route that may close or reopen a zone.
 * Closing blocks the zone's open spaces; reopening restores them.
 */
export async function changeZoneStatus(
  zoneId: string,
  input: ZoneStatusInput,
): Promise<Zone> {
  return patch<Zone>(endpoints.spaces.zoneStatus(zoneId), input);
}

/**
 * `DELETE /zones/{id}` - 204. Cascades: every space in the zone goes with it,
 * while the parent floor survives.
 */
export async function removeZone(zoneId: string): Promise<void> {
  await del<void>(endpoints.spaces.zone(zoneId));
}

// --- Spaces ------------------------------------------------------------------

/**
 * `GET /facilities/{id}/spaces` - every space in a facility, optionally
 * narrowed by `floorId` or `status`.
 */
export async function fetchFacilitySpaces(
  facilityId: string,
  filter?: { floorId?: string; status?: SpaceStatus },
): Promise<Space[]> {
  const params: Record<string, string> = {};
  if (filter?.floorId) params.floorId = filter.floorId;
  if (filter?.status) params.status = filter.status;
  return get<Space[]>(
    endpoints.spaces.facilitySpaces(facilityId),
    Object.keys(params).length > 0 ? { params } : undefined,
  );
}

/** `GET /zones/{id}/spaces` - one zone's spaces, optionally by `status`. */
export async function fetchZoneSpaces(
  zoneId: string,
  status?: SpaceStatus,
): Promise<Space[]> {
  return get<Space[]>(
    endpoints.spaces.zoneSpaces(zoneId),
    status ? { params: { status } } : undefined,
  );
}

/** `POST /zones/{id}/spaces` - 201. A duplicate in the zone answers 409. */
export async function createSpace(zoneId: string, input: SpaceInput): Promise<Space> {
  return post<Space>(endpoints.spaces.zoneSpaces(zoneId), input);
}

/**
 * `POST /zones/{id}/spaces/bulk` - 201, creating a run of labels in one
 * request. A clash anywhere in the run is refused up front, so nothing is
 * half-created.
 */
export async function bulkCreateSpaces(
  zoneId: string,
  input: BulkSpacesInput,
): Promise<Space[]> {
  return post<Space[]>(endpoints.spaces.zoneSpacesBulk(zoneId), input);
}

/** `GET /spaces/{id}` - owner, admin, or staff assigned to the facility. */
export async function fetchSpace(spaceId: string): Promise<Space> {
  return get<Space>(endpoints.spaces.detail(spaceId));
}

/**
 * `PATCH /spaces/{id}` - label, type and reservable flag only. `status` is not
 * writable here, and the space cannot be moved to another zone.
 */
export async function updateSpace(
  spaceId: string,
  input: SpaceUpdateInput,
): Promise<Space> {
  return patch<Space>(endpoints.spaces.detail(spaceId), input);
}

/** `DELETE /spaces/{id}` - 204; the facility's derived capacity falls by one. */
export async function removeSpace(spaceId: string): Promise<void> {
  await del<void>(endpoints.spaces.detail(spaceId));
}

/**
 * `PATCH /spaces/{id}/status` - the only route that may change a space's
 * status. Staff may use it for the facilities they are assigned to.
 */
export async function changeSpaceStatus(
  spaceId: string,
  input: SpaceStatusInput,
): Promise<Space> {
  return patch<Space>(endpoints.spaces.updateStatus(spaceId), input);
}

/** `GET /facilities/{id}` - reads the derived `capacity` and `spaceCounts`. */
export async function fetchFacilityWithCounts(facilityId: string): Promise<Facility> {
  return get<Facility>(endpoints.facilities.detail(facilityId));
}

/** A zeroed tally, used as the initial state before a facility loads. */
export const EMPTY_SPACE_COUNTS: SpaceCounts = {
  total: 0,
  available: 0,
  occupied: 0,
  reserved: 0,
  maintenance: 0,
  blocked: 0,
};

/**
 * Turns any spaces-group failure into something worth showing the user. Codes
 * match `app/services/spaces.py` and `app/api/v1/spaces.py`, so a limit or a
 * duplicate label reads as a sentence rather than a status code.
 */
export function spaceErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Your session has expired. Sign in again to manage spaces.';
    if (err.status === 403) return 'You do not have access to manage this facility.';
    if (err.status === 429) return 'Too many changes for now. Wait a while and try again.';
    if (err.code === 'SPACE_DUPLICATE') {
      const duplicates = (err.details as { duplicates?: string[] } | null)?.duplicates;
      if (duplicates && duplicates.length > 0) {
        return `These labels already exist in this zone: ${duplicates.join(', ')}.`;
      }
      return err.message;
    }
    if (
      err.code === 'FLOOR_LIMIT_REACHED' ||
      err.code === 'ZONE_LIMIT_REACHED' ||
      err.code === 'SPACE_LIMIT_REACHED'
    ) {
      return err.message;
    }
    if (err.status === 422) {
      const details = err.details;
      if (Array.isArray(details)) {
        const first = details.find(
          (item): item is { msg: string } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { msg?: unknown }).msg === 'string',
        );
        if (first) return first.msg.replace(/^Value error, /, '');
      }
      return err.message;
    }
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}
