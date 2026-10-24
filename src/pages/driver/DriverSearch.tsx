import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SectionHeader, Badge, EmptyState } from '@/components/ui';
import { ParkingMap } from '@/components/ParkingMap';
import { StarRating } from '@/components/StarRating';
import { DEFAULT_CENTER, forwardGeocode } from '@/lib/geo';
import { formatDistance, formatFreshness, formatRate } from '@/lib/format';
import {
  MIN_AVAILABLE_OPTIONS,
  PARKING_SORT_LABELS,
  RADIUS_OPTIONS_KM,
  SEARCH_PAGE_SIZE,
  parkingErrorMessage,
  searchNearbyParking,
} from '@/lib/parking';
import type { ParkingSearchResult, ParkingSortBy, SpaceType } from '@/types';
import {
  Accessibility, AlertCircle, Clock, Filter, Loader2, LocateFixed,
  Map as MapIcon, MapPin, RefreshCw, Search, Shield, Zap,
} from 'lucide-react';

/**
 * The driver search page (DOC section 22).
 *
 * Everything here is live: the results come from `GET /parking/nearby`, and
 * the availability numbers on each card are the ones the server read when it
 * answered - the page never invents a count.
 *
 * The one decision the page makes for the driver is where to search from. The
 * browser's own position is asked for as soon as the page opens, so the
 * distances on every card are measured from where the driver actually is.
 * Three ways to change that centre are offered, and all three end up as
 * coordinates:
 *
 *  - "Near me" asks the browser for the current position again.
 *  - A typed destination is resolved with a forward geocode.
 *  - A click on the map drops the pin wherever they want.
 *
 * If the browser cannot share a location, the page falls back to the default
 * area and says so, rather than silently pretending the distances are local.
 *
 * The server never sees free text, so it never has to guess which city a
 * query meant.
 *
 * There is no pager: the API ranks the facilities inside the chosen radius
 * first and tops the page up with the nearest ones beyond it, and this page
 * asks for a single page of `SEARCH_PAGE_SIZE`. Twelve cards is the whole
 * answer, closest first, whatever the driver's distance from a garage.
 */

/** The space types the search page can filter by. */
const SPACE_TYPES: SpaceType[] = ['standard', 'compact', 'large', 'ev', 'accessible'];

const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  standard: 'Standard',
  compact: 'Compact',
  large: 'Large',
  ev: 'EV',
  accessible: 'Accessible',
};

interface Centre {
  lat: number;
  lng: number;
  /** How the centre is described to the driver. */
  label: string;
}

const DEFAULT_CENTRE: Centre = {
  lat: DEFAULT_CENTER[0],
  lng: DEFAULT_CENTER[1],
  label: 'Default map view',
};

/** Turn a browser position into the centre the search runs from. */
function positionToCentre(position: GeolocationPosition): Centre {
  return {
    lat: Number(position.coords.latitude.toFixed(6)),
    lng: Number(position.coords.longitude.toFixed(6)),
    label: 'Your current location',
  };
}

export function DriverSearch() {
  const { selectFacility } = useApp();

  const [centre, setCentre] = useState<Centre>(DEFAULT_CENTRE);
  const [destination, setDestination] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoNote, setGeoNote] = useState('');
  // The first search waits for the location attempt, so the distances on the
  // cards are never briefly measured from the default area.
  const [geoResolved, setGeoResolved] = useState(false);

  const [radiusKm, setRadiusKm] = useState(5);
  const [minAvailable, setMinAvailable] = useState(0);
  const [maxPrice, setMaxPrice] = useState('');
  const [wantEv, setWantEv] = useState(false);
  const [wantCovered, setWantCovered] = useState(false);
  const [wantAccessible, setWantAccessible] = useState(false);
  const [wantOpenNow, setWantOpenNow] = useState(false);
  const [spaceType, setSpaceType] = useState<'' | SpaceType>('');
  const [sort, setSort] = useState<ParkingSortBy>('distance');

  const [results, setResults] = useState<ParkingSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Bumped to make the search run again after a failure.
  const [retryToken, setRetryToken] = useState(0);

  // The forward lookup is debounced and abortable: Nominatim is rate limited,
  // and a driver typing "Ahmed" should not fire one request per keystroke.
  const geocodeRef = useRef<AbortController | null>(null);
  const geocodeTimer = useRef<number | null>(null);

  // Ask for the driver's own position on arrival, so every card's distance is
  // measured from where they actually are rather than from a fixed campus
  // point. The search waits for the answer, but not forever: if the browser is
  // slow or the permission prompt is ignored, it falls back to the default area
  // after a few seconds and still corrects itself if a position arrives later.
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoNote('This browser cannot share a location - showing the default area.');
      setGeoResolved(true);
      return;
    }

    const fallback = window.setTimeout(() => setGeoResolved(true), 4000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(fallback);
        setCentre(positionToCentre(position));
        setGeoResolved(true);
      },
      () => {
        window.clearTimeout(fallback);
        setGeoNote('Location is off - showing the default area. Use Near me to try again.');
        setGeoResolved(true);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );

    return () => window.clearTimeout(fallback);
  }, []);

  // The search itself. It runs whenever the centre or a filter changes, and it
  // is debounced so that typing a price does not fire a request per keystroke.
  // A stale response is discarded: only the newest request may write to the
  // page.
  useEffect(() => {
    if (!geoResolved) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    const timer = window.setTimeout(() => {
      (async () => {
        try {
          const response = await searchNearbyParking({
            lat: centre.lat,
            lng: centre.lng,
            radiusKm,
            minAvailable,
            ...(maxPrice.trim() === '' ? {} : { maxPrice: Number(maxPrice) }),
            ...(wantEv ? { ev: true } : {}),
            ...(wantCovered ? { covered: true } : {}),
            ...(wantAccessible ? { accessible: true } : {}),
            ...(wantOpenNow ? { openNow: true } : {}),
            ...(spaceType === '' ? {} : { spaceType }),
            sort,
            limit: SEARCH_PAGE_SIZE,
          });
          if (cancelled) return;
          setResults(response.items);
        } catch (err) {
          if (cancelled) return;
          setResults([]);
          setError(parkingErrorMessage(err));
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    geoResolved,
    centre,
    radiusKm,
    minAvailable,
    maxPrice,
    wantEv,
    wantCovered,
    wantAccessible,
    wantOpenNow,
    spaceType,
    sort,
    retryToken,
  ]);

  useEffect(() => {
    return () => {
      geocodeRef.current?.abort();
      if (geocodeTimer.current !== null) window.clearTimeout(geocodeTimer.current);
    };
  }, []);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoNote('This browser cannot share a location.');
      return;
    }
    setLocating(true);
    setGeoNote('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setCentre(positionToCentre(position));
      },
      () => {
        setLocating(false);
        setGeoNote('Could not get your location - search from the map instead.');
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    setGeoNote('');

    if (geocodeTimer.current !== null) window.clearTimeout(geocodeTimer.current);
    geocodeRef.current?.abort();

    const trimmed = value.trim();
    if (trimmed === '') return;

    geocodeTimer.current = window.setTimeout(() => {
      const controller = new AbortController();
      geocodeRef.current = controller;
      forwardGeocode(trimmed, controller.signal)
        .then((result) => {
          if (controller.signal.aborted || !result) return;
          setCentre({ lat: result.lat, lng: result.lng, label: result.label });
        })
        .catch(() => {
          // `forwardGeocode` does not throw; this is belt and braces.
        });
    }, 600);
  };

  const handlePick = (lat: number, lng: number) => {
    setCentre({ lat, lng, label: 'Point on the map' });
  };

  // Any filter change re-runs the search; there is only one page of results.
  const applyFilters = (change: () => void) => {
    change();
  };

  return (
    <div>
      <SectionHeader
        title="Find Parking"
        subtitle="Search for parking near your destination"
      />

      {/* Where to search from */}
      <div className="pe-card p-4 mb-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
            <input
              type="text"
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              placeholder="Enter destination, address, or landmark..."
              className="pe-input pl-9"
              aria-label="Destination"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={useMyLocation} disabled={locating} className="pe-btn-outline">
              {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
              Near me
            </button>
            <button
              type="button"
              onClick={() => setShowMap((open) => !open)}
              className={`pe-btn-outline ${showMap ? 'border-[#2563eb] text-[#3b82f6]' : ''}`}
            >
              <MapIcon size={16} /> Map
            </button>
            <button
              type="button"
              onClick={() => setShowFilters((open) => !open)}
              className={`pe-btn-outline ${showFilters ? 'border-[#2563eb] text-[#3b82f6]' : ''}`}
            >
              <Filter size={16} /> Filters
            </button>
          </div>
        </div>

        <p className="text-xs text-[#5a6a8a] mt-2 flex items-center gap-1.5">
          <MapPin size={12} />
          Searching from {centre.label}
          {centre.lat !== DEFAULT_CENTRE.lat || centre.lng !== DEFAULT_CENTRE.lng
            ? ` (${centre.lat.toFixed(4)}, ${centre.lng.toFixed(4)})`
            : ''}
        </p>
        {geoNote && (
          <p className="text-xs text-[#fca5a5] mt-1.5 flex items-center gap-1.5">
            <AlertCircle size={12} />
            {geoNote}
          </p>
        )}

        {showMap && (
          <div className="mt-4">
            <ParkingMap centre={centre} results={results} onPick={handlePick} />
            <p className="text-xs text-[#5a6a8a] mt-2">
              Click the map to search around that spot. Green markers have free spaces, amber ones do
              not.
            </p>
          </div>
        )}

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[#1e2d4d] pe-fade-in space-y-4">
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'ev', label: 'EV Charging', icon: <Zap size={14} /> },
                { key: 'covered', label: 'Covered', icon: <Shield size={14} /> },
                { key: 'accessible', label: 'Accessible', icon: <Accessibility size={14} /> },
                { key: 'openNow', label: 'Open Now', icon: <Clock size={14} /> },
              ] as const).map((toggle) => (
                <button
                  key={toggle.key}
                  type="button"
                  onClick={() =>
                    applyFilters(() => {
                      if (toggle.key === 'ev') setWantEv((on) => !on);
                      if (toggle.key === 'covered') setWantCovered((on) => !on);
                      if (toggle.key === 'accessible') setWantAccessible((on) => !on);
                      if (toggle.key === 'openNow') setWantOpenNow((on) => !on);
                    })
                  }
                  className={
                    (toggle.key === 'ev' && wantEv) ||
                    (toggle.key === 'covered' && wantCovered) ||
                    (toggle.key === 'accessible' && wantAccessible) ||
                    (toggle.key === 'openNow' && wantOpenNow)
                      ? 'pe-chip-active'
                      : 'pe-chip-idle'
                  }
                >
                  {toggle.icon} {toggle.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search-radius" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                  Priority radius: {radiusKm} km
                </label>
                <select
                  id="search-radius"
                  value={radiusKm}
                  onChange={(e) => applyFilters(() => setRadiusKm(Number(e.target.value)))}
                  className="pe-input"
                >
                  {RADIUS_OPTIONS_KM.map((km) => (
                    <option key={km} value={km}>
                      {km} km
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="search-min-available" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                  At least this many free spaces
                </label>
                <select
                  id="search-min-available"
                  value={minAvailable}
                  onChange={(e) => applyFilters(() => setMinAvailable(Number(e.target.value)))}
                  className="pe-input"
                >
                  {MIN_AVAILABLE_OPTIONS.map((count) => (
                    <option key={count} value={count}>
                      {count === 0 ? 'Any number of spaces' : `${count}+ spaces`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="search-space-type" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                  Space type
                </label>
                <select
                  id="search-space-type"
                  value={spaceType}
                  onChange={(e) =>
                    applyFilters(() => setSpaceType(e.target.value as '' | SpaceType))
                  }
                  className="pe-input"
                >
                  <option value="">Any type</option>
                  {SPACE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {SPACE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="search-max-price" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                  Maximum hourly rate
                </label>
                <input
                  id="search-max-price"
                  type="number"
                  min={0}
                  step="0.5"
                  value={maxPrice}
                  onChange={(e) => applyFilters(() => setMaxPrice(e.target.value))}
                  placeholder="Any price"
                  className="pe-input"
                />
                <p className="text-xs text-[#5a6a8a] mt-1.5">
                  Facilities with no published rate are left out of a price search.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sort and count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#8a98b5]">
          {loading
            ? 'Searching...'
            : `${results.length} facilit${results.length === 1 ? 'y' : 'ies'} nearby`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8a98b5]">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => {
              const next = e.target.value as ParkingSortBy;
              applyFilters(() => setSort(next));
            }}
            className="pe-input w-auto py-1.5 text-xs"
            aria-label="Sort results"
          >
            {(Object.keys(PARKING_SORT_LABELS) as ParkingSortBy[]).map((key) => (
              <option key={key} value={key}>
                {PARKING_SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5] flex items-center gap-2"
        >
          <AlertCircle size={15} />
          {error}
          <button
            type="button"
            onClick={() => setRetryToken((n) => n + 1)}
            className="ml-auto"
            aria-label="Try the search again"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      )}

      {loading && results.length === 0 ? (
        <div className="pe-card p-10 flex items-center justify-center gap-2 text-sm text-[#8a98b5]">
          <Loader2 size={16} className="animate-spin" />
          Searching for parking
        </div>
      ) : results.length === 0 && !error ? (
        <EmptyState
          icon={<Search size={28} />}
          title="No facilities found"
          message="Try relaxing the filters or searching from a different destination."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((facility) => (
            <button
              key={facility.id}
              type="button"
              onClick={() => selectFacility(facility.id)}
              className="pe-card p-5 text-left hover:border-[#2563eb] transition-all group"
            >
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{facility.name}</p>
                  <p className="text-sm text-[#8a98b5] flex items-center gap-1 mt-1">
                    <MapPin size={14} className="flex-shrink-0" />
                    <span className="truncate">
                      {facility.address}
                      {facility.city ? `, ${facility.city}` : ''}
                    </span>
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <StarRating rating={facility.rating} reviewCount={facility.reviewCount} />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge color="blue">{formatDistance(facility.distanceMeters)} away</Badge>
                {facility.isOpenNow ? <Badge color="green">Open Now</Badge> : <Badge color="red">Closed</Badge>}
                {facility.hasEV && <Badge color="cyan">EV</Badge>}
                {facility.hasCovered && <Badge color="blue">Covered</Badge>}
                {facility.hasAccessible && <Badge color="green">Accessible</Badge>}
                {facility.spaceTypes
                  .filter((type) => type !== 'standard')
                  .map((type) => (
                    <Badge key={type} color="gray">
                      {SPACE_TYPE_LABELS[type]}
                    </Badge>
                  ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-[#8a98b5]">Available</p>
                    <p className="font-bold text-[#10b981]">
                      {facility.spaceCounts.available} / {facility.spaceCounts.total}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-[#1e2d4d]" />
                  <div>
                    <p className="text-xs text-[#8a98b5]">Rate</p>
                    <p className="font-bold">{formatRate(facility.hourlyRate)}</p>
                  </div>
                </div>
                <span className="text-[#3b82f6] text-sm font-medium group-hover:translate-x-1 transition-transform">
                  View Details →
                </span>
              </div>

              <p className="text-[10px] text-[#5a6a8a] mt-3">
                Availability read {formatFreshness(facility.availabilityAsOf)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
