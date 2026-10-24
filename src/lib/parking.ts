/**
 * Parking discovery for drivers (DOC sections 7, 19, 20, 22).
 *
 * Thin wrappers over the `/parking` group, mirroring `lib/spaces.ts` so pages
 * never build a URL or reach for Axios directly.
 *
 * The group is read-only and open to every signed-in role: the management
 * group (`/facilities`) is the write side of the same collection and refuses
 * drivers outright. There is no `/parking/search` route - a search always
 * carries a centre (`lat`/`lng`), and the client turns "near me", a typed
 * address and a dropped map pin into a point before the request goes out.
 *
 * Two rules the server applies are worth knowing here, because the UI has to
 * agree with them: a facility with no published `hourlyRate` is *excluded* by
 * `maxPrice` rather than counted as free, and `spaceType` matches only when
 * the facility has an *available* space of that type.
 */

import { ApiError, get } from './api';
import { endpoints } from './endpoints';
import type {
  Paginated,
  ParkingAvailability,
  ParkingSearchParams,
  ParkingSearchResult,
  ParkingSortBy,
  ParkingSpaces,
} from '@/types';

/** Display names for the sort keys the server accepts. */
export const PARKING_SORT_LABELS: Record<ParkingSortBy, string> = {
  distance: 'Distance',
  price: 'Price',
  availability: 'Availability',
  rating: 'Rating',
};

/** The radii the search page offers, in kilometres. */
export const RADIUS_OPTIONS_KM = [1, 2, 5, 10, 25];

/** The "at least N free spaces" options the search page offers. */
export const MIN_AVAILABLE_OPTIONS = [0, 1, 5, 10, 20];

/** How many results the search shows. The server caps a page at 50. */
export const SEARCH_PAGE_SIZE = 12;

/**
 * `GET /parking/nearby` - the `ACTIVE` facilities around a point.
 *
 * `radiusKm` is a tier boundary rather than a filter: the facilities inside it
 * are listed first, then the nearest ones beyond it fill the rest of the page.
 * So a search always returns up to `limit` facilities, closest first, even when
 * the driver is nowhere near a garage.
 *
 * The filters are optional, and only the ones that are set are sent: a
 * `false` toggle is left out entirely so the server's own defaults apply.
 */
export async function searchNearbyParking(
  params: ParkingSearchParams,
): Promise<Paginated<ParkingSearchResult>> {
  const query: Record<string, string | number | boolean> = {
    lat: params.lat,
    lng: params.lng,
  };
  if (params.radiusKm !== undefined) query.radiusKm = params.radiusKm;
  if (params.minAvailable !== undefined) query.minAvailable = params.minAvailable;
  if (params.maxPrice !== undefined) query.maxPrice = params.maxPrice;
  if (params.ev) query.ev = true;
  if (params.covered) query.covered = true;
  if (params.accessible) query.accessible = true;
  if (params.openNow) query.openNow = true;
  if (params.spaceType) query.spaceType = params.spaceType;
  if (params.sort) query.sort = params.sort;
  if (params.page !== undefined) query.page = params.page;
  if (params.limit !== undefined) query.limit = params.limit;

  return get<Paginated<ParkingSearchResult>>(endpoints.parking.nearby, { params: query });
}

/** `GET /parking/{id}` - one facility with its live availability. */
export async function fetchParkingFacility(id: string): Promise<ParkingSearchResult> {
  return get<ParkingSearchResult>(endpoints.parking.detail(id));
}

/** `GET /parking/{id}/availability` - the per-status space tally. */
export async function fetchParkingAvailability(id: string): Promise<ParkingAvailability> {
  return get<ParkingAvailability>(endpoints.parking.availability(id));
}

/** `GET /parking/{id}/spaces` - the facility's spaces, for the layout grid. */
export async function fetchParkingSpaces(id: string): Promise<ParkingSpaces> {
  return get<ParkingSpaces>(endpoints.parking.spaces(id));
}

/**
 * Turns a parking-group failure into something worth showing the user.
 *
 * The codes match `app/api/v1/parking.py` and `app/core/errors.py`, so a
 * missing facility or a throttled search reads as a sentence rather than a
 * status code.
 */
export function parkingErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Your session has expired. Sign in again to search.';
    if (err.status === 403) return 'You do not have access to this parking search.';
    if (err.status === 404) return 'That parking facility no longer exists.';
    if (err.status === 429) return 'Too many searches for now. Wait a while and try again.';
    if (err.status === 422) return 'That search does not make sense. Try a different filter.';
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}
