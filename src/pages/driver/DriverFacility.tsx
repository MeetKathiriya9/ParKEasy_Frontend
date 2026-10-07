import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Badge, ProgressBar, Modal } from '@/components/ui';
import { facilities, spaces, reviews, evChargers } from '@/data/mockData';
import { fetchVehicles } from '@/lib/vehicles';
import type { Vehicle } from '@/types';
import { MapPin, Star, Clock, Zap, Accessibility, CheckCircle2, Navigation, ArrowLeft, Calendar, QrCode, CreditCard, TrendingUp, Plus, RefreshCw } from 'lucide-react';

export function DriverFacility() {
  const { selectedFacilityId, navigate, selectReservation } = useApp();
  const facility = facilities.find((f) => f.id === selectedFacilityId);
  const [showReserve, setShowReserve] = useState(false);
  const [date, setDate] = useState('2026-09-29');
  const [startTime, setStartTime] = useState('10:00');
  const [duration, setDuration] = useState(4);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesFailed, setVehiclesFailed] = useState(false);

  const loadVehicles = async () => {
    setVehiclesLoading(true);
    setVehiclesFailed(false);
    try {
      const list = await fetchVehicles();
      setUserVehicles(list);
      // Preselect the default vehicle, falling back to the first one.
      setSelectedVehicle((current) =>
        current || list.find((v) => v.isDefault)?.id || list[0]?.id || '',
      );
    } catch {
      setVehiclesFailed(true);
    } finally {
      setVehiclesLoading(false);
    }
  };

  useEffect(() => {
    // Runs once: loadVehicles only writes to state.
    void loadVehicles();
  }, []);

  if (!facility) {
    return <div className="text-center py-16 text-[#8a98b5]">Facility not found.</div>;
  }

  const facilitySpaces = spaces.filter((s) => s.facilityId === facility.id);
  const facilityReviews = reviews.filter((r) => r.facilityId === facility.id);
  const facilityEVs = evChargers.filter((e) => e.facilityId === facility.id);

  const totalCost = Math.min(duration * facility.hourlyRate, facility.dailyMax);

  const handleReserve = () => {
    setConfirmed(true);
  };

  const handleConfirm = () => {
    setShowReserve(false);
    setConfirmed(false);
    selectReservation('r3');
    navigate('driver-reservations');
  };

  return (
    <div>
      <button onClick={() => navigate('driver-search')} className="flex items-center gap-2 text-sm text-[#8a98b5] hover:text-[#e8edf5] mb-4">
        <ArrowLeft size={16} /> Back to search
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="pe-card p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-2xl font-bold">{facility.name}</h1>
                <p className="text-sm text-[#8a98b5] flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {facility.address}, {facility.city}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star size={18} className="text-[#f59e0b]" fill="currentColor" />
                  <span className="font-bold text-lg">{facility.rating}</span>
                </div>
                <p className="text-xs text-[#5a6a8a]">{facility.reviewCount} reviews</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {facility.openNow ? <Badge color="green">Open Now</Badge> : <Badge color="red">Closed</Badge>}
              {facility.hasEV && <Badge color="cyan"><Zap size={10} /> EV Charging</Badge>}
              {facility.hasCovered && <Badge color="blue">Covered</Badge>}
              {facility.hasAccessible && <Badge color="green"><Accessibility size={10} /> Accessible</Badge>}
              {facility.isReservable && <Badge color="amber">Reservable</Badge>}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#8a98b5] mb-4">
              <Clock size={16} /> {facility.hours}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowReserve(true)} disabled={!facility.isReservable} className="pe-btn-primary flex-1">
                <Calendar size={16} /> Reserve a Space
              </button>
              <button className="pe-btn-outline">
                <Navigation size={16} /> Navigate
              </button>
            </div>
          </div>

          {/* Live Availability */}
          <div className="pe-card p-6">
            <h2 className="font-semibold text-lg mb-4">Live Availability</h2>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#10b981]">{facility.availableSpaces}</p>
                <p className="text-xs text-[#8a98b5] mt-1">Available</p>
              </div>
              <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#f59e0b]">{facility.reservedSpaces}</p>
                <p className="text-xs text-[#8a98b5] mt-1">Reserved</p>
              </div>
              <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#ef4444]">{facility.occupiedSpaces}</p>
                <p className="text-xs text-[#8a98b5] mt-1">Occupied</p>
              </div>
              <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#5a6a8a]">{facility.maintenanceSpaces}</p>
                <p className="text-xs text-[#8a98b5] mt-1">Maint.</p>
              </div>
            </div>
            <ProgressBar value={facility.occupiedSpaces + facility.reservedSpaces} max={facility.totalSpaces} color="#f59e0b" />
            <p className="text-xs text-[#8a98b5] mt-2 text-center">
              {facility.totalSpaces - facility.availableSpaces - facility.reservedSpaces} of {facility.totalSpaces} spaces in use
            </p>
          </div>

          {/* Amenities */}
          <div className="pe-card p-6">
            <h2 className="font-semibold text-lg mb-4">Amenities & Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {facility.amenities.map((a) => (
                <div key={a} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={16} className="text-[#10b981]" /> {a}
                </div>
              ))}
            </div>
          </div>

          {/* Space Layout */}
          <div className="pe-card p-6">
            <h2 className="font-semibold text-lg mb-4">Space Layout (Sample)</h2>
            <div className="grid grid-cols-5 gap-2">
              {facilitySpaces.map((s) => {
                const colorMap: Record<string, string> = {
                  available: 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]',
                  occupied: 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]',
                  reserved: 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]',
                  maintenance: 'bg-[#2a3a5c] border-[#3a4a6c] text-[#5a6a8a]',
                };
                return (
                  <div key={s.id} className={`rounded-lg border p-2 text-center text-xs font-semibold ${colorMap[s.status]}`}>
                    {s.label}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#10b981]" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#f59e0b]" /> Reserved</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#ef4444]" /> Occupied</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#5a6a8a]" /> Maintenance</span>
            </div>
          </div>

          {/* EV Chargers */}
          {facilityEVs.length > 0 && (
            <div className="pe-card p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Zap size={18} className="text-[#06b6d4]" /> EV Chargers</h2>
              <div className="space-y-2">
                {facilityEVs.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0b1220]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#06b6d4]/15 flex items-center justify-center text-[#06b6d4]">
                        <Zap size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ev.label}</p>
                        <p className="text-xs text-[#8a98b5]">{ev.power}kW · ${ev.pricePerKwh}/kWh</p>
                      </div>
                    </div>
                    {ev.status === 'available' ? <Badge color="green">Available</Badge> : ev.status === 'in_use' ? <Badge color="amber">In Use</Badge> : <Badge color="gray">Maintenance</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="pe-card p-6">
            <h2 className="font-semibold text-lg mb-4">Reviews</h2>
            {facilityReviews.length > 0 ? (
              <div className="space-y-4">
                {facilityReviews.map((r) => (
                  <div key={r.id} className="border-b border-[#1e2d4d] last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{r.userName}</p>
                        <p className="text-xs text-[#5a6a8a]">{r.date} · {r.category}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map((i) => (
                          <Star key={i} size={12} className={i <= r.rating ? 'text-[#f59e0b]' : 'text-[#2a3a5c]'} fill={i <= r.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-[#8a98b5]">{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8a98b5]">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="pe-card p-5">
            <h3 className="font-semibold mb-3">Pricing</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8a98b5]">Hourly Rate</span>
                <span className="font-bold text-lg">${facility.hourlyRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8a98b5]">Daily Max</span>
                <span className="font-bold text-lg">${facility.dailyMax}</span>
              </div>
            </div>
          </div>

          <div className="pe-card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-[#10b981]" /> Availability Prediction</h3>
            <p className="text-sm text-[#8a98b5] mb-3">Predicted for tomorrow at 10:00 AM:</p>
            <div className="flex items-center gap-3">
              <ProgressBar value={65} max={100} color="#3b82f6" />
              <span className="text-sm font-bold text-[#3b82f6]">65%</span>
            </div>
            <p className="text-xs text-[#5a6a8a] mt-2">Moderate availability expected. Reserve early for best spots.</p>
          </div>

          <div className="pe-card p-5">
            <h3 className="font-semibold mb-3">Rules & Policies</h3>
            <ul className="space-y-2 text-sm text-[#8a98b5]">
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-[#10b981] mt-0.5 flex-shrink-0" /> Free cancellation up to 2 hours before start</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-[#10b981] mt-0.5 flex-shrink-0" /> Extension allowed if capacity permits</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-[#10b981] mt-0.5 flex-shrink-0" /> QR code required for entry</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-[#10b981] mt-0.5 flex-shrink-0" /> Overstay fee: $25</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      <Modal open={showReserve} onClose={() => { setShowReserve(false); setConfirmed(false); }} title={confirmed ? 'Reservation Confirmed' : 'Reserve a Space'}>
        {confirmed ? (
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-2xl bg-[#10b981]/15 flex items-center justify-center mx-auto mb-4">
              <QrCode size={40} className="text-[#10b981]" />
            </div>
            <h3 className="text-lg font-bold mb-1">You're all set!</h3>
            <p className="text-sm text-[#8a98b5] mb-4">Your reservation at {facility.name} is confirmed.</p>
            <div className="bg-[#0b1220] rounded-lg p-4 mb-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#8a98b5]">QR Code</span>
                <span className="font-mono font-bold text-[#3b82f6]">PE-R3-QB81</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#8a98b5]">Date</span>
                <span className="text-sm font-medium">{date}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#8a98b5]">Time</span>
                <span className="text-sm font-medium">{startTime} ({duration}h)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8a98b5]">Total</span>
                <span className="font-bold">${totalCost.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={handleConfirm} className="pe-btn-primary w-full">View My Reservations</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Select Vehicle</label>
              {vehiclesLoading ? (
                <p className="text-sm text-[#8a98b5]">Loading your vehicles…</p>
              ) : vehiclesFailed ? (
                <button type="button" onClick={() => void loadVehicles()} className="pe-btn-outline text-sm">
                  <RefreshCw size={14} /> Could not load vehicles - try again
                </button>
              ) : userVehicles.length === 0 ? (
                <div className="rounded-lg border border-[#1e2d4d] bg-[#0b1220] p-3">
                  <p className="text-sm text-[#8a98b5] mb-2">
                    You need a registered vehicle to reserve a space.
                  </p>
                  <button type="button" onClick={() => navigate('driver-vehicles')} className="pe-btn-outline text-sm">
                    <Plus size={14} /> Add a vehicle
                  </button>
                </div>
              ) : (
                <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="pe-input">
                  {userVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} - {v.model}
                      {v.isDefault ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pe-input" />
              </div>
              <div>
                <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Start Time</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="pe-input" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Duration: {duration} hours</label>
              <input type="range" min="1" max="12" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-[#2563eb]" />
            </div>
            <div className="bg-[#0b1220] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8a98b5]">{duration}h × ${facility.hourlyRate}/hr</span>
                <span>${(duration * facility.hourlyRate).toFixed(2)}</span>
              </div>
              {duration * facility.hourlyRate > facility.dailyMax && (
                <div className="flex items-center justify-between text-sm text-[#10b981]">
                  <span>Daily max applied</span>
                  <span>-${(duration * facility.hourlyRate - facility.dailyMax).toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-[#1e2d4d]">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">${totalCost.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleReserve}
              disabled={selectedVehicle === ''}
              className="pe-btn-primary w-full disabled:opacity-60"
            >
              <CreditCard size={16} /> Pay & Reserve
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
