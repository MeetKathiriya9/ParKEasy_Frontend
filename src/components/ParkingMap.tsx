import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import type { ParkingSearchResult } from '@/types';
import 'leaflet/dist/leaflet.css';

/**
 * The map on the driver search page (DOC section 22).
 *
 * It answers two things at once: where the search is centred (the blue pin,
 * which a click moves) and where the results are (a marker per facility,
 * green when it has free spaces and amber when it does not).
 *
 * The view follows the search centre rather than the results, because the
 * centre is what the driver chose - re-fitting to the results on every search
 * would move the map out from under them.
 */

const CENTRE_ICON = L.divIcon({
  // An empty className drops Leaflet's default white square behind the HTML.
  className: '',
  html:
    '<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="13" cy="13" r="12" fill="#2563eb" fill-opacity="0.25" stroke="#0b1220" stroke-width="1"/>' +
    '<circle cx="13" cy="13" r="5.5" fill="#3b82f6" stroke="#e8edf5" stroke-width="1.5"/></svg>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function resultIcon(hasSpace: boolean): L.DivIcon {
  const fill = hasSpace ? '#10b981' : '#f59e0b';
  return L.divIcon({
    className: '',
    html:
      '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
      `<circle cx="10" cy="10" r="8" fill="${fill}" stroke="#0b1220" stroke-width="1.5"/>` +
      '<circle cx="10" cy="10" r="3" fill="#e8edf5"/></svg>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

/** Reports map clicks as a new search centre. */
function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

/** Keeps the view on the search centre whenever it moves. */
function ViewController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng]);
  }, [map, lat, lng]);

  return null;
}

interface ParkingMapProps {
  centre: { lat: number; lng: number };
  results: ParkingSearchResult[];
  onPick: (lat: number, lng: number) => void;
  height?: number;
}

export function ParkingMap({ centre, results, onPick, height = 320 }: ParkingMapProps) {
  return (
    <div className="relative z-0 rounded-lg overflow-hidden border border-[#1e2d4d]">
      <MapContainer center={[centre.lat, centre.lng]} zoom={13} style={{ height, width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ClickCatcher onPick={onPick} />
        <ViewController lat={centre.lat} lng={centre.lng} />
        <Marker position={[centre.lat, centre.lng]} icon={CENTRE_ICON} />
        {results.map((facility) => {
          if (facility.lat === null || facility.lng === null) return null;
          const available = facility.spaceCounts.available;
          return (
            <Marker
              key={facility.id}
              position={[facility.lat, facility.lng]}
              icon={resultIcon(available > 0)}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                {facility.name} - {available} free
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
