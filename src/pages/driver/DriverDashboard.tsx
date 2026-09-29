import { useApp } from '@/context/AppContext';
import { StatCard, SectionHeader, Badge, ProgressBar } from '@/components/ui';
import { facilities, reservations, activeSession, notifications, vehicles } from '@/data/mockData';
import { Clock, MapPin, Car, CalendarCheck, Zap, TrendingUp, Navigation, Star } from 'lucide-react';

export function DriverDashboard() {
  const { currentUser, navigate, selectFacility } = useApp();
  const userReservations = reservations.filter((r) => r.userId === currentUser?.id);
  const activeRes = userReservations.find((r) => r.status === 'active');
  const upcomingRes = userReservations.filter((r) => r.status === 'confirmed');
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const userVehicles = vehicles.filter((v) => v.userId === currentUser?.id);

  const recommended = [...facilities]
    .filter((f) => f.isReservable && f.openNow)
    .sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0))
    .slice(0, 3);

  return (
    <div>
      <SectionHeader
        title={`Welcome back, ${currentUser?.name?.split(' ')[0]}`}
        subtitle="Manage your parking, reservations, and vehicles"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<CalendarCheck size={20} />} label="Active Session" value={activeRes ? '1' : '0'} accent="green" />
        <StatCard icon={<Clock size={20} />} label="Upcoming" value={String(upcomingRes.length)} accent="blue" />
        <StatCard icon={<Car size={20} />} label="Vehicles" value={String(userVehicles.length)} accent="cyan" />
        <StatCard icon={<Zap size={20} />} label="Unread Alerts" value={String(unreadNotifs)} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Session */}
        <div className="lg:col-span-2 pe-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Active Parking Session</h2>
            <button onClick={() => navigate('driver-session')} className="text-sm text-[#3b82f6] hover:underline">
              View details →
            </button>
          </div>
          {activeRes && activeSession ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-lg">{activeSession.facilityName}</p>
                  <p className="text-sm text-[#8a98b5] flex items-center gap-1 mt-1">
                    <MapPin size={14} /> Space {activeSession.spaceLabel} · {activeSession.vehiclePlate}
                  </p>
                </div>
                <Badge color="green">Active</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-[#0b1220] rounded-lg p-3">
                  <p className="text-xs text-[#8a98b5]">Elapsed</p>
                  <p className="text-lg font-bold">{Math.floor(activeSession.elapsedMinutes / 60)}h {activeSession.elapsedMinutes % 60}m</p>
                </div>
                <div className="bg-[#0b1220] rounded-lg p-3">
                  <p className="text-xs text-[#8a98b5]">Remaining</p>
                  <p className="text-lg font-bold text-[#10b981]">{Math.floor(activeSession.remainingMinutes / 60)}h {activeSession.remainingMinutes % 60}m</p>
                </div>
                <div className="bg-[#0b1220] rounded-lg p-3">
                  <p className="text-xs text-[#8a98b5]">Est. Cost</p>
                  <p className="text-lg font-bold">${activeSession.estimatedCost.toFixed(2)}</p>
                </div>
              </div>
              <ProgressBar value={activeSession.elapsedMinutes} max={activeSession.elapsedMinutes + activeSession.remainingMinutes} color="#10b981" />
              <div className="flex gap-2 mt-4">
                <button onClick={() => navigate('driver-session')} className="pe-btn-outline flex-1">Extend Time</button>
                <button onClick={() => navigate('driver-session')} className="pe-btn-primary flex-1">Navigate</button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock size={32} className="mx-auto text-[#5a6a8a] mb-2" />
              <p className="text-[#8a98b5] mb-3">No active parking session</p>
              <button onClick={() => navigate('driver-search')} className="pe-btn-primary">Find Parking</button>
            </div>
          )}
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
                <p className="text-xs text-[#8a98b5]">{userReservations.length} total</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recommended */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp size={20} className="text-[#10b981]" /> Recommended for You
          </h2>
          <button onClick={() => navigate('driver-search')} className="text-sm text-[#3b82f6] hover:underline">See all →</button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {recommended.map((f) => (
            <button key={f.id} onClick={() => selectFacility(f.id)} className="pe-card p-4 text-left hover:border-[#2563eb] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{f.name}</p>
                  <p className="text-xs text-[#8a98b5] flex items-center gap-1 mt-1"><MapPin size={12} /> {f.distanceMiles} mi away</p>
                </div>
                <Badge color="green">{f.availableSpaces} free</Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold">${f.hourlyRate}/hr</span>
                <span className="text-xs text-[#f59e0b] flex items-center gap-1"><Star size={12} fill="currentColor" /> {f.rating}</span>
              </div>
              {f.hasEV && <Badge color="cyan">EV Charging</Badge>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
