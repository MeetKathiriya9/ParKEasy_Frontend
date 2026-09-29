import { useApp } from '@/context/AppContext';
import { SectionHeader, Badge, EmptyState, Modal } from '@/components/ui';
import { reservations } from '@/data/mockData';
import type { ReservationStatus } from '@/types';
import { CalendarCheck, MapPin, Car, Clock, QrCode, CreditCard, X, Star } from 'lucide-react';
import { useState } from 'react';

const statusColors: Record<ReservationStatus, 'green' | 'blue' | 'amber' | 'red' | 'gray'> = {
  active: 'green',
  confirmed: 'blue',
  pending: 'amber',
  completed: 'gray',
  cancelled: 'red',
  'no-show': 'red',
};

export function DriverReservations() {
  const { currentUser, navigate } = useApp();
  const [showQR, setShowQR] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState<string | null>(null);

  const userRes = reservations.filter((r) => r.userId === currentUser?.id);
  const active = userRes.filter((r) => r.status === 'active');
  const upcoming = userRes.filter((r) => r.status === 'confirmed');
  const past = userRes.filter((r) => ['completed', 'cancelled', 'no-show'].includes(r.status));

  const selectedRes = reservations.find((r) => r.id === showQR);

  return (
    <div>
      <SectionHeader title="My Reservations" subtitle="Manage your parking reservations" />

      {active.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" /> Active
          </h2>
          <div className="space-y-3">
            {active.map((r) => (
              <div key={r.id} className="pe-card p-4 border-[#10b981]/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{r.facilityName}</p>
                      <Badge color={statusColors[r.status]}>{r.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-[#8a98b5]">
                      <span className="flex items-center gap-1"><MapPin size={14} /> Space {r.spaceLabel}</span>
                      <span className="flex items-center gap-1"><Car size={14} /> {r.vehiclePlate}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {r.durationHours}h</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${r.totalCost.toFixed(2)}</p>
                    <p className="text-xs text-[#5a6a8a]">{r.paid ? 'Paid' : 'Unpaid'}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setShowQR(r.id)} className="pe-btn-outline text-sm">
                    <QrCode size={14} /> View QR
                  </button>
                  <button onClick={() => navigate('driver-session')} className="pe-btn-primary text-sm">
                    View Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming.map((r) => (
              <div key={r.id} className="pe-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{r.facilityName}</p>
                      <Badge color={statusColors[r.status]}>{r.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-[#8a98b5]">
                      <span className="flex items-center gap-1"><CalendarCheck size={14} /> {new Date(r.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {new Date(r.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1"><Car size={14} /> {r.vehiclePlate}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${r.totalCost.toFixed(2)}</p>
                    <p className="text-xs text-[#5a6a8a]">{r.paid ? 'Paid' : 'Unpaid'}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setShowQR(r.id)} className="pe-btn-outline text-sm">
                    <QrCode size={14} /> View QR
                  </button>
                  <button onClick={() => setShowCancel(r.id)} className="pe-btn-ghost text-sm text-[#ef4444] hover:bg-[#ef4444]/10">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#5a6a8a]" /> Past Reservations
        </h2>
        {past.length > 0 ? (
          <div className="space-y-3">
            {past.map((r) => (
              <div key={r.id} className="pe-card p-4 opacity-75">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{r.facilityName}</p>
                      <Badge color={statusColors[r.status]}>{r.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-[#8a98b5]">
                      <span className="flex items-center gap-1"><CalendarCheck size={14} /> {new Date(r.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {r.durationHours}h</span>
                      <span className="flex items-center gap-1"><Car size={14} /> {r.vehiclePlate}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${r.totalCost.toFixed(2)}</p>
                    {r.status === 'completed' && (
                      <button className="text-xs text-[#f59e0b] hover:underline flex items-center gap-1 mt-1">
                        <Star size={12} /> Leave Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<CalendarCheck size={28} />} title="No past reservations" message="Your reservation history will appear here." />
        )}
      </div>

      {/* QR Modal */}
      <Modal open={!!showQR} onClose={() => setShowQR(null)} title="Your Reservation QR Code">
        {selectedRes && (
          <div className="text-center py-4">
            <div className="w-40 h-40 rounded-xl bg-[#0b1220] border-2 border-[#2563eb] flex items-center justify-center mx-auto mb-4">
              <QrCode size={80} className="text-[#3b82f6]" />
            </div>
            <p className="font-mono text-xl font-bold mb-2">{selectedRes.qrCode}</p>
            <div className="bg-[#0b1220] rounded-lg p-4 text-left space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#8a98b5]">Facility</span><span>{selectedRes.facilityName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#8a98b5]">Date</span><span>{new Date(selectedRes.startDateTime).toLocaleDateString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#8a98b5]">Time</span><span>{new Date(selectedRes.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#8a98b5]">Duration</span><span>{selectedRes.durationHours} hours</span></div>
            </div>
            <p className="text-xs text-[#5a6a8a] mt-4">Show this QR code to staff at the facility entrance.</p>
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal open={!!showCancel} onClose={() => setShowCancel(null)} title="Cancel Reservation">
        <div className="space-y-4">
          <p className="text-sm text-[#8a98b5]">Are you sure you want to cancel this reservation? Cancellation is free up to 2 hours before the start time.</p>
          <div className="bg-[#0b1220] rounded-lg p-3">
            <p className="text-sm">A full refund of <span className="font-bold text-[#10b981]">${reservations.find(r => r.id === showCancel)?.totalCost.toFixed(2)}</span> will be processed to your original payment method.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCancel(null)} className="pe-btn-outline flex-1">Keep Reservation</button>
            <button onClick={() => setShowCancel(null)} className="pe-btn bg-[#ef4444] text-white hover:bg-[#dc2626] flex-1">Confirm Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
