import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Badge, Modal, ProgressBar } from '@/components/ui';
import { StarRating } from '@/components/StarRating';
import { formatFreshness, formatMoney, formatRate } from '@/lib/format';
import { fetchParkingAvailability, fetchParkingFacility, fetchParkingSpaces, parkingErrorMessage } from '@/lib/parking';
import { SPACE_STATUS_LABELS } from '@/lib/spaces';
import type { Amenity, ParkingAvailability, ParkingSearchResult, Space } from '@/types';
import {
  Accessibility, AlertCircle, ArrowLeft, Calendar, CheckCircle2, Clock, Loader2, MapPin, Navigation, Zap,
} from 'lucide-react';

/**
 * One facility, as a driver sees it (DOC sections 7, 19, 22).
 *
 * Everything on this page is read live from the discovery group: the facility
 * itself, its per-status space tally, and its spaces for the layout grid. The
 * availability numbers carry the moment they were read, so the page says how
 * fresh they are instead of implying they are live to the second.
 *
 * Two things are deliberately *not* here. The written reviews and the EV
 * charger list were placeholders with no data behind them, so they are gone
 * rather than faked; and the availability "prediction" was a hard-coded
 * number, which is worse than no number at all.
 *
 * Reserving is the third. The reservations module is not switched on yet, so
 * the button says so rather than pretending to take money.
 */

const AMENITY_LABELS: Record<Amenity, string> = {
  ev_charging: 'EV charging',
  covered: 'Covered',
  security: 'Security',
  cameras: 'Cameras',
  restrooms: 'Restrooms',
  accessible: 'Accessible',
  valet: 'Valet',
  elevator: 'Elevator',
};

/** The space-status colours, keyed by the status the server returns. */
const SPACE_TILE_CLASSES: Record<string, string> = {
  AVAILABLE: 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]',
  OCCUPIED: 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]',
  RESERVED: 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]',
  MAINTENANCE: 'bg-[#2a3a5c] border-[#3a4a6c] text-[#5a6a8a]',
  BLOCKED: 'bg-[#2a3a5c] border-[#3a4a6c] text-[#5a6a8a]',
};

/** Groups a facility's spaces by floor, then by zone, for the layout grid. */
function groupSpaces(spaces: Space[]): { floor: string; zones: { name: string; spaces: Space[] }[] }[] {
  const byFloor = new Map<string, Map<string, Space[]>>();
  for (const space of spaces) {
    const floor = space.floorName ?? 'Floor';
    if (!byFloor.has(floor)) byFloor.set(floor, new Map());
    const zones = byFloor.get(floor)!;
    const zone = space.zoneName ?? 'Zone';
    if (!zones.has(zone)) zones.set(zone, []);
    zones.get(zone)!.push(space);
  }
  return [...byFloor.entries()].map(([floor, zones]) => ({
    floor,
    zones: [...zones.entries()].map(([name, list]) => ({ name, spaces: list })),
  }));
}

export function DriverFacility() {
  const { selectedFacilityId, navigate } = useApp();
  const facilityId = selectedFacilityId;

  const [facility, setFacility] = useState<ParkingSearchResult | null>(null);
  const [availability, setAvailability] = useState<ParkingAvailability | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReserve, setShowReserve] = useState(false);

  const load = useCallback(async () => {
    if (!facilityId) return;
    setLoading(true);
    setError('');
    try {
      // The three reads are independent, so they go out together.
      const [facilityRow, availabilityRow, spacesRow] = await Promise.all([
        fetchParkingFacility(facilityId),
        fetchParkingAvailability(facilityId),
        fetchParkingSpaces(facilityId),
      ]);
      setFacility(facilityRow);
      setAvailability(availabilityRow);
      setSpaces(spacesRow.spaces);
    } catch (err) {
      setFacility(null);
      setAvailability(null);
      setSpaces([]);
      setError(parkingErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!facilityId) {
    return (
      <div className="text-center py-16 text-[#8a98b5]">
        <p>No facility selected.</p>
        <button type="button" onClick={() => navigate('driver-search')} className="pe-btn-primary mt-4">
          Back to search
        </button>
      </div>
    );
  }

  if (loading && !facility) {
    return (
      <div className="pe-card p-10 flex items-center justify-center gap-2 text-sm text-[#8a98b5]">
        <Loader2 size={16} className="animate-spin" />
        Loading the facility
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={28} className="mx-auto text-[#ef4444] mb-3" />
        <p className="text-[#8a98b5] mb-4">{error || 'Facility not found.'}</p>
        <button type="button" onClick={() => void load()} className="pe-btn-outline">
          Try again
        </button>
      </div>
    );
  }

  const counts = availability?.spaceCounts ?? facility.spaceCounts;
  const layout = groupSpaces(spaces);
  const hours = facility.open24h
    ? 'Open 24 hours'
    : `${facility.openingTime ?? '--:--'} - ${facility.closingTime ?? '--:--'}`;
  const directions =
    facility.lat !== null && facility.lng !== null
      ? `https://www.openstreetmap.org/directions?to=${facility.lat}%2C${facility.lng}`
      : null;

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('driver-search')}
        className="flex items-center gap-2 text-sm text-[#8a98b5] hover:text-[#e8edf5] mb-4"
      >
        <ArrowLeft size={16} /> Back to search
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="pe-card p-6">
            <div className="flex items-start justify-between mb-3 gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold">{facility.name}</h1>
                <p className="text-sm text-[#8a98b5] flex items-center gap-1 mt-1">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span className="truncate">
                    {facility.address}
                    {facility.city ? `, ${facility.city}` : ''}
                  </span>
                </p>
                {facility.operatorName && (
                  <p className="text-xs text-[#5a6a8a] mt-1">Operated by {facility.operatorName}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <StarRating rating={facility.rating} reviewCount={facility.reviewCount} size={16} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {facility.isOpenNow ? <Badge color="green">Open Now</Badge> : <Badge color="red">Closed</Badge>}
              {facility.hasEV && <Badge color="cyan">EV Charging</Badge>}
              {facility.hasCovered && <Badge color="blue">Covered</Badge>}
              {facility.hasAccessible && <Badge color="green">Accessible</Badge>}
            </div>

            <div className="flex items-center gap-2 text-sm text-[#8a98b5] mb-4">
              <Clock size={16} /> {hours}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowReserve(true)} className="pe-btn-primary flex-1">
                <Calendar size={16} /> Reserve a Space
              </button>
              {directions && (
                <a
                  href={directions}
                  target="_blank"
                  rel="noreferrer"
                  className="pe-btn-outline flex items-center justify-center gap-2 flex-1"
                >
                  <Navigation size={16} /> Navigate
                </a>
              )}
            </div>
          </div>

          {/* Live availability */}
          <div className="pe-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Live Availability</h2>
              <span className="text-xs text-[#5a6a8a]">
                read {formatFreshness(availability?.availabilityAsOf ?? facility.availabilityAsOf)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#10b981]">{counts.available}</p>
                <p className="text-xs text-[#8a98b5] mt-1">Available</p>
              </div>
              <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#f59e0b]">{counts.reserved}</p>
                <p className="text-xs text-[#8a98b5] mt-1">Reserved</p>
              </div>
              <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#ef4444]">{counts.occupied}</p>
                <p className="text-xs text-[#8a98b5] mt-1">Occupied</p>
              </div>
              <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#5a6a8a]">{counts.maintenance}</p>
                <p className="text-xs text-[#8a98b5] mt-1">Maint.</p>
              </div>
            </div>
            <ProgressBar
              value={counts.occupied + counts.reserved}
              max={counts.total || 1}
              color="#f59e0b"
            />
            <p className="text-xs text-[#8a98b5] mt-2 text-center">
              {counts.total - counts.available} of {counts.total} spaces in use
            </p>
          </div>

          {/* Amenities */}
          {facility.amenities.length > 0 && (
            <div className="pe-card p-6">
              <h2 className="font-semibold text-lg mb-4">Amenities &amp; Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {facility.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} className="text-[#10b981] flex-shrink-0" />
                    {AMENITY_LABELS[amenity]}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Space layout */}
          <div className="pe-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Space Layout</h2>
              <span className="text-xs text-[#5a6a8a]">{spaces.length} spaces</span>
            </div>
            {layout.length === 0 ? (
              <p className="text-sm text-[#8a98b5]">This facility has no spaces set up yet.</p>
            ) : (
              <div className="space-y-4">
                {layout.map((floor) => (
                  <div key={floor.floor}>
                    <p className="text-xs font-semibold text-[#8a98b5] uppercase tracking-wider mb-2">
                      {floor.floor}
                    </p>
                    {floor.zones.map((zone) => (
                      <div key={zone.name} className="mb-3">
                        <p className="text-xs text-[#5a6a8a] mb-1.5">{zone.name}</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {zone.spaces.map((space) => (
                            <div
                              key={space.id}
                              title={`${space.spaceNumber} - ${SPACE_STATUS_LABELS[space.status]}`}
                              className={`rounded-lg border p-2 text-center text-xs font-semibold ${
                                SPACE_TILE_CLASSES[space.status] ?? SPACE_TILE_CLASSES.BLOCKED
                              }`}
                            >
                              {space.spaceNumber}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-4 text-xs">
              {(['AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE'] as const).map((status) => (
                <span key={status} className="flex items-center gap-1">
                  <span
                    className={`w-3 h-3 rounded ${SPACE_TILE_CLASSES[status].split(' ')[0]}`}
                  />
                  {SPACE_STATUS_LABELS[status]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="pe-card p-5">
            <h3 className="font-semibold mb-3">Pricing</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8a98b5]">Hourly rate</span>
                <span className="font-bold text-lg">
                  {facility.hourlyRate === null || facility.hourlyRate === undefined
                    ? 'Not published'
                    : formatRate(facility.hourlyRate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8a98b5]">Daily max</span>
                <span className="font-bold text-lg">
                  {facility.dailyMax === null || facility.dailyMax === undefined
                    ? 'Not published'
                    : formatMoney(facility.dailyMax)}
                </span>
              </div>
            </div>
          </div>

          <div className="pe-card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap size={16} className="text-[#f59e0b]" /> Ratings
            </h3>
            <StarRating rating={facility.rating} reviewCount={facility.reviewCount} size={16} />
            <p className="text-xs text-[#5a6a8a] mt-2">
              Written reviews are not open yet. The score above is the average the operator has
              published for this facility.
            </p>
          </div>

          <div className="pe-card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Accessibility size={16} className="text-[#3b82f6]" /> At a glance
            </h3>
            <ul className="space-y-2 text-sm text-[#8a98b5]">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#10b981] mt-0.5 flex-shrink-0" />
                {counts.total} spaces in total
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#10b981] mt-0.5 flex-shrink-0" />
                {facility.spaceTypes.length > 0
                  ? `Space types: ${facility.spaceTypes.join(', ')}`
                  : 'No space types recorded'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#10b981] mt-0.5 flex-shrink-0" />
                {facility.isOpenNow ? 'Open right now' : `Closed - ${hours}`}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reservations are not switched on yet, so the dialog says so. */}
      <Modal open={showReserve} onClose={() => setShowReserve(false)} title="Reserve a Space">
        <div className="space-y-4">
          <div className="rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-[#f59e0b] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#fcd34d]">
              Reserving a space is not switched on yet. The reservation module is still being
              built, so nothing can be booked from this page and no payment is taken.
            </p>
          </div>
          <p className="text-sm text-[#8a98b5]">
            You can still check the live availability above, and use Navigate to get directions to
            {` ${facility.name}`}.
          </p>
          <button
            type="button"
            onClick={() => setShowReserve(false)}
            className="pe-btn-outline w-full"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
