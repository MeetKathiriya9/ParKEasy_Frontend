/**
 * Small geospatial helpers for the facility form and the driver search
 * (DOC sections 7/19/22).
 *
 * The backend stores coordinates as a GeoJSON Point and only ever sees plain
 * `lat`/`lng` numbers, so everything here runs in the browser: a default map
 * view, a best-effort reverse lookup that turns a dropped pin into a street
 * address, and a forward lookup that turns a typed place into a point. No API
 * key is involved - the lookups use the public OSM Nominatim endpoint, which is
 * rate limited, so callers must debounce and be ready for a `null`.
 */

/** Fallback view when a browser will not share its location: the CHARUSAT campus. */
export const DEFAULT_CENTER: [number, number] = [22.5561, 72.9242];

export interface ReverseGeocodeResult {
  /** Street line, e.g. "12 Station Road"; falls back to a locality. */
  address: string;
  /** City / town / village, when OSM knows one. */
  city: string | null;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

interface NominatimHit {
  lat?: string;
  lon?: string;
  display_name?: string;
}

function firstNonEmpty(...values: (string | undefined)[]): string | null {
  for (const value of values) {
    if (value && value.trim() !== '') return value;
  }
  return null;
}

/**
 * Resolve `lat`/`lng` to an address and city, or `null` when the lookup fails
 * (offline, rate limited, or nothing mapped). Never throws: the pin's
 * coordinates are the important part, the address is a convenience.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult | null> {
  const url =
    'https://nominatim.openstreetmap.org/reverse?' +
    new URLSearchParams({
      format: 'jsonv2',
      lat: String(lat),
      lon: String(lng),
      addressdetails: '1',
      zoom: '18',
    }).toString();

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal,
    });
    if (!response.ok) return null;

    const data = (await response.json()) as NominatimResponse;
    const a = data.address ?? {};

    const street = [a.house_number, a.road].filter(Boolean).join(' ').trim();
    const address =
      street ||
      firstNonEmpty(a.neighbourhood, a.suburb, a.village, a.town, a.city) ||
      data.display_name?.split(',').slice(0, 2).join(',').trim() ||
      '';
    const city = firstNonEmpty(a.city, a.town, a.village, a.municipality, a.county);

    if (address === '' && city === null) return null;
    return { address, city };
  } catch {
    // Aborted or unreachable - the coordinates still stand on their own.
    return null;
  }
}

export interface ForwardGeocodeResult {
  lat: number;
  lng: number;
  /** A human label for the place, e.g. "Ahmedabad, Gujarat, India". */
  label: string;
}

/**
 * Resolve a typed place ("Ahmedabad", "Panjrapol") to a point.
 *
 * This is how the driver search turns free text into the coordinates the
 * `/parking/nearby` route needs: the server never guesses which city a query
 * meant, so the client does the guessing with a lookup instead.
 *
 * Never throws. A lookup that fails, is rate limited or finds nothing returns
 * `null`, and the caller keeps whatever centre it already had - a failed
 * geocode should never wipe out a working search.
 */
export async function forwardGeocode(
  query: string,
  signal?: AbortSignal,
): Promise<ForwardGeocodeResult | null> {
  const trimmed = query.trim();
  if (trimmed === '') return null;

  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      format: 'jsonv2',
      q: trimmed,
      limit: '1',
    }).toString();

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal,
    });
    if (!response.ok) return null;

    const data = (await response.json()) as NominatimHit[] | NominatimHit;
    const hit = Array.isArray(data) ? data[0] : data;
    if (!hit) return null;

    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return {
      lat,
      lng,
      label: hit.display_name?.split(',').slice(0, 3).join(',').trim() || trimmed,
    };
  } catch {
    // Aborted, offline or rate limited - the caller keeps its current centre.
    return null;
  }
}
