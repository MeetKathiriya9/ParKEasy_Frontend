/**
 * Small geospatial helpers for the facility form (DOC sections 7/19).
 *
 * The backend stores coordinates as a GeoJSON Point and only ever sees plain
 * `lat`/`lng` numbers, so everything here runs in the browser: a default map
 * view and a best-effort reverse lookup that turns a dropped pin into a street
 * address. No API key is involved - the lookup uses the public OSM Nominatim
 * endpoint, which is rate limited, so callers must debounce and be ready for a
 * `null`.
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
