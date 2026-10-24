import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StatCard, SectionHeader, Badge } from '@/components/ui';
import { StarRating } from '@/components/StarRating';
import { fetchVehicles } from '@/lib/vehicles';
import { searchNearbyParking } from '@/lib/parking';
import { DEFAULT_CENTER } from '@/lib/geo';
import { formatDistance, formatRate } from '@/lib/format';
import type { ParkingSearchResult, Vehicle } from '@/types';
import { Clock, MapPin, Car, CalendarCheck, Zap, TrendingUp, Navigation, Loader2 } from 'lucide-react';

export function DriverDashboard() {
  const { currentUser, navigate, selectFacility } = useApp();
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);

// The nearby strip is live: the same search the driver search page runs,
// asked for the three closest facilities, with the 5 km radius ranking first.
  const [nearby, setNearby] = useState<ParkingSearchResult[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbyError, setNearbyError] = useState('');

  // Vehicle counts are secondary here, so a failed read stays at zero rather
  // than replacing the whole dashboard with an error state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchVehicles();
        if (!cancelled) setUserVehicles(list);
      } catch {
        // Ignored: the vehicles page surfaces the failure.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async (lat: number, lng: number) => {
      try {
        const response = await searchNearbyParking({
          lat,
          lng,
          radiusKm: 5,
          sort: 'distance',
          page: 1,
          limit: 3,
        });
        if (!cancelled) {
          setNearby(response.items);
          setNearbyError('');
        }
      } catch {
        if (!cancelled) {
          setNearby([]);
          setNearbyError('Could not load the parking nearby you.');
        }
      } finally {
        if (!cancelled) setNearbyLoading(false);
      }
    };

    // The browser's own position when it is willing to share one, and the
    // default map view when it is not - the same fallback the search page uses.
    if (!('geolocation' in navigator)) {
      void load(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void load(position.coords.latitude, position.coords.longitude);
      },
      () => {
        void load(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <SectionHeader
        title={`Welcome back, ${currentUser?.name?.split(' ')[0]}`}
        subtitle="Manage your parking, reservations, and vehicles"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<CalendarCheck size={20} />} label="Active Session" value="0" accent="green" />
        <StatCard icon={<Clock size={20} />} label="Upcoming" value="0" accent="blue" />
        <StatCard icon={<Car size={20} />} label="Vehicles" value={String(userVehicles.length)} accent="cyan" />
        <StatCard icon={<Zap size={20} />} label="Unread Alerts" value="0" accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Session */}
        <div className="lg:col-span-2 pe-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Active Parking Session</h2>
          </div>
          <div className="text-center py-8">
            <Clock size={32} className="mx-auto text-[#5a6a8a] mb-2" />
            <p className="text-[#8a98b5] mb-1">No active parking session</p>
            <p className="text-xs text-[#5a6a8a] mb-4">
              Sessions appear here once reservations open.
            </p>
            <button onClick={() => navigate('driver-search')} className="pe-btn-primary">Find Parking</button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pe-card p-5">
          <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button onClick={() => navigate('driver-search')} className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] hover:bg-[#1e2d4d] transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-[#2563eb]/15 flex items-center justify-center text-[#3b82f6]">
                <Navigation size={18} />
              </div>
              <div>
                <p className="text-sm font-medium">Find Parking</p>
                <p className="text-xs text-[#8a98b5]">Search nearby facilities</p>
              </div>
            </button>
            <button onClick={() => navigate('driver-vehicles')} className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] hover:bg-[#1e2d4d] transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-[#06b6d4]/15 flex items-center justify-center text-[#06b6d4]">
                <Car size={18} />
              </div>
              <div>
                <p className="text-sm font-medium">Manage Vehicles</p>
                <p className="text-xs text-[#8a98b5]">{userVehicles.length} vehicles registered</p>
              </div>
            </button>
            <button onClick={() => navigate('driver-reservations')} className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] hover:bg-[#1e2d4d] transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-[#10b981]/15 flex items-center justify-center text-[#10b981]">
                <CalendarCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-medium">My Reservations</p>
                <p className="text-xs text-[#8a98b5]">Not open yet</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Nearby parking */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp size={20} className="text-[#10b981]" /> Parking Near You
          </h2>
          <button onClick={() => navigate('driver-search')} className="text-sm text-[#3b82f6] hover:underline">See all →</button>
        </div>
        {nearbyLoading ? (
          <div className="pe-card p-6 flex items-center justify-center gap-2 text-sm text-[#8a98b5]">
            <Loader2 size={16} className="animate-spin" />
            Looking for parking near you
          </div>
        ) : nearbyError ? (
          <div className="pe-card p-6 text-sm text-[#8a98b5]">{nearbyError}</div>
        ) : nearby.length === 0 ? (
          <div className="pe-card p-6 text-sm text-[#8a98b5]">
                  No parking found near you.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {nearby.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => selectFacility(f.id)}
                className="pe-card p-4 text-left hover:border-[#2563eb] transition-colors"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{f.name}</p>
                    <p className="text-xs text-[#8a98b5] flex items-center gap-1 mt-1">
                      <MapPin size={12} className="flex-shrink-0" />
                      {formatDistance(f.distanceMeters)} away
                    </p>
                  </div>
                  <Badge color="green">{f.spaceCounts.available} free</Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold">{formatRate(f.hourlyRate)}</span>
                  <StarRating rating={f.rating} reviewCount={f.reviewCount} size={12} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
