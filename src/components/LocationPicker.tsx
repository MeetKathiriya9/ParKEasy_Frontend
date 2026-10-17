import { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Loader2, LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/**
 * A click-to-place pin on an OpenStreetMap tile layer, used by the facility
 * form so an operator never has to type coordinates (DOC section 19).
 *
 * The parent owns `lat`/`lng` and stays the single source of truth: clicking
 * the map or dragging the pin calls `onPick`, and moving the values from
 * elsewhere (a typed coordinate, a fresh reverse lookup) re-centres the view.
 * There is no API key - tiles and reverse lookups are OSM's public endpoints.
 */

const PIN_ICON = L.divIcon({
  // Empty className drops Leaflet's default white square behind custom HTML.
  className: '',
  html:
    '<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 27 15 27s15-16 15-27C30 6.7 23.3 0 15 0z" ' +
    'fill="#2563eb" stroke="#0b1220" stroke-width="2"/>' +
    '<circle cx="15" cy="15" r="5.5" fill="#e8edf5"/></svg>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  /** View to open on when no coordinates are set yet (and geolocation fails). */
  center: [number, number];
  onPick: (lat: number, lng: number) => void;
  height?: number;
  /** Ask the browser for the current position on open when no pin is set yet. */
  autoLocate?: boolean;
}

type LocateState = 'idle' | 'locating' | 'done' | 'error';

/** Reports map clicks as coordinate picks. */
function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

/**
 * Opens the map on the visitor's own position. Runs once the map exists and
 * only while there is no pin, so the default view is "where I am" rather than
 * an arbitrary city; the parent's `center` remains the fallback when the
 * browser will not (or cannot) share a location.
 */
function AutoLocate({
  enabled,
  onState,
}: {
  enabled: boolean;
  onState: (state: LocateState) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;
    if (!('geolocation' in navigator)) {
      onState('error');
      return;
    }
    let cancelled = false;
    onState('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        map.setView(
          [position.coords.latitude, position.coords.longitude],
          Math.max(map.getZoom(), 15),
        );
        onState('done');
      },
      () => {
        if (!cancelled) onState('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    return () => {
      cancelled = true;
    };
  }, [map, enabled, onState]);

  return null;
}

/**
 * Keeps the view in step with the values and works around a Leaflet quirk: a
 * map mounted inside a just-opened, fading modal measures itself before the
 * layout settles, so it needs an `invalidateSize` once the transition ends.
 */
function MapController({
  lat,
  lng,
  center,
}: {
  lat: number | null;
  lng: number | null;
  center: [number, number];
}) {
  const map = useMap();
  const [centerLat, centerLng] = center;

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    // Follow the pin once one exists; otherwise follow the suggested view, so
    // a geolocation fix that lands after mount still re-centres the map.
    if (lat !== null && lng !== null) {
      map.setView([lat, lng]);
    } else {
      map.setView([centerLat, centerLng]);
    }
  }, [map, lat, lng, centerLat, centerLng]);

  return null;
}

export function LocationPicker({
  lat,
  lng,
  center,
  onPick,
  height = 260,
  autoLocate = true,
}: LocationPickerProps) {
  const hasPoint = lat !== null && lng !== null;
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const [autoState, setAutoState] = useState<LocateState>('idle');

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocateError('This browser cannot share a location.');
      return;
    }
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onPick(
          Number(position.coords.latitude.toFixed(6)),
          Number(position.coords.longitude.toFixed(6)),
        );
      },
      () => {
        setLocating(false);
        setLocateError('Location unavailable - click the map to set the pin instead.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div>
      {/* `relative z-0` contains Leaflet's own high z-index panes so they never
          climb over the modal chrome. */}
      <div className="relative z-0 rounded-lg overflow-hidden border border-[#1e2d4d]">
        <MapContainer
          center={hasPoint ? [lat, lng] : center}
          zoom={hasPoint ? 16 : 13}
          style={{ height, width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ClickCatcher onPick={onPick} />
          <MapController lat={lat} lng={lng} center={center} />
          <AutoLocate enabled={autoLocate && !hasPoint} onState={setAutoState} />
          {hasPoint && (
            <Marker
              position={[lat, lng]}
              icon={PIN_ICON}
              draggable
              eventHandlers={{
                dragend(event) {
                  const { lat: newLat, lng: newLng } = event.target.getLatLng();
                  onPick(Number(newLat.toFixed(6)), Number(newLng.toFixed(6)));
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="pe-btn-outline text-sm disabled:opacity-60"
        >
          {locating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <LocateFixed size={14} />
          )}
          Use my current location
        </button>
        <p className="text-xs text-[#5a6a8a]">Click the map or drag the pin to set the spot.</p>
      </div>
      {autoState === 'locating' && (
        <p className="text-xs text-[#5a6a8a] mt-1.5 flex items-center gap-1.5">
          <Loader2 size={12} className="animate-spin" />
          Finding your current location
        </p>
      )}
      {autoState === 'error' && (
        <p className="text-xs text-[#5a6a8a] mt-1.5">
          Could not get your location - showing a default view. Click the map or use the button
          above.
        </p>
      )}
      {locateError && <p className="text-xs text-[#fca5a5] mt-1.5">{locateError}</p>}
    </div>
  );
}
