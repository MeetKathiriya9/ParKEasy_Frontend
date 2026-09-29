import { useApp } from '@/context/AppContext';
import { SectionHeader, Badge, ProgressBar, Modal } from '@/components/ui';
import { activeSession } from '@/data/mockData';
import { Clock, MapPin, Car, Zap, Navigation, CreditCard, Plus, QrCode, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function DriverSession() {
  const { navigate } = useApp();
  const [showExtend, setShowExtend] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [extendHours, setExtendHours] = useState(1);
  const [paid, setPaid] = useState(false);

  if (!activeSession) {
    return (
      <div className="text-center py-16">
        <Clock size={40} className="mx-auto text-[#5a6a8a] mb-3" />
        <p className="text-[#8a98b5] mb-4">No active parking session</p>
        <button onClick={() => navigate('driver-search')} className="pe-btn-primary">Find Parking</button>
      </div>
    );
  }

  const totalCost = activeSession.estimatedCost + (activeSession.evKwh ? activeSession.evCost ?? 0 : 0);

  return (
    <div>
      <SectionHeader title="Active Parking Session" subtitle="Your current parking session details" />

      {/* QR Code Banner */}
      <div className="pe-card p-6 mb-6 bg-gradient-to-r from-[#2563eb]/10 to-[#06b6d4]/10 border-[#2563eb]/30">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl bg-[#0b1220] border-2 border-[#2563eb] flex items-center justify-center">
            <QrCode size={48} className="text-[#3b82f6]" />
          </div>
          <div>
            <Badge color="green">Session Active</Badge>
            <p className="font-mono text-lg font-bold mt-2">{activeSession.id.toUpperCase()}</p>
            <p className="text-sm text-[#8a98b5]">Show this QR at exit gate</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Session Info */}
          <div className="pe-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lg">{activeSession.facilityName}</h2>
                <p className="text-sm text-[#8a98b5] flex items-center gap-1 mt-1">
                  <MapPin size={14} /> Space {activeSession.spaceLabel}
                </p>
                <p className="text-sm text-[#8a98b5] flex items-center gap-1 mt-1">
                  <Car size={14} /> {activeSession.vehiclePlate}
                </p>
              </div>
              <button className="pe-btn-outline">
                <Navigation size={16} /> Navigate
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#0b1220] rounded-lg p-4 text-center">
                <Clock size={18} className="mx-auto text-[#8a98b5] mb-1" />
                <p className="text-xs text-[#8a98b5]">Elapsed</p>
                <p className="text-lg font-bold">{Math.floor(activeSession.elapsedMinutes / 60)}h {activeSession.elapsedMinutes % 60}m</p>
              </div>
              <div className="bg-[#0b1220] rounded-lg p-4 text-center">
                <Clock size={18} className="mx-auto text-[#10b981] mb-1" />
                <p className="text-xs text-[#8a98b5]">Remaining</p>
                <p className="text-lg font-bold text-[#10b981]">{Math.floor(activeSession.remainingMinutes / 60)}h {activeSession.remainingMinutes % 60}m</p>
              </div>
              <div className="bg-[#0b1220] rounded-lg p-4 text-center">
                <CreditCard size={18} className="mx-auto text-[#3b82f6] mb-1" />
                <p className="text-xs text-[#8a98b5]">Est. Cost</p>
                <p className="text-lg font-bold">${totalCost.toFixed(2)}</p>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-[#8a98b5] mb-1">
                <span>Session Progress</span>
                <span>{Math.round((activeSession.elapsedMinutes / (activeSession.elapsedMinutes + activeSession.remainingMinutes)) * 100)}%</span>
              </div>
              <ProgressBar value={activeSession.elapsedMinutes} max={activeSession.elapsedMinutes + activeSession.remainingMinutes} color="#10b981" />
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowExtend(true)} className="pe-btn-outline flex-1">
                <Plus size={16} /> Extend Time
              </button>
              <button onClick={() => setShowPay(true)} className="pe-btn-primary flex-1">
                <CreditCard size={16} /> Pay & Check Out
              </button>
            </div>
          </div>

          {/* EV Charging */}
          {activeSession.evKwh ? (
            <div className="pe-card p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Zap size={18} className="text-[#06b6d4]" /> EV Charging Session</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0b1220] rounded-lg p-3">
                  <p className="text-xs text-[#8a98b5]">Energy Used</p>
                  <p className="text-lg font-bold">{activeSession.evKwh} kWh</p>
                </div>
                <div className="bg-[#0b1220] rounded-lg p-3">
                  <p className="text-xs text-[#8a98b5]">Rate</p>
                  <p className="text-lg font-bold">$0.35/kWh</p>
                </div>
                <div className="bg-[#0b1220] rounded-lg p-3">
                  <p className="text-xs text-[#8a98b5]">Charging Cost</p>
                  <p className="text-lg font-bold text-[#06b6d4]">${activeSession.evCost?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Timeline */}
        <div className="pe-card p-5">
          <h3 className="font-semibold mb-4">Session Timeline</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Reservation Confirmed</p>
                <p className="text-xs text-[#5a6a8a]">Sep 28, 2026 9:00 AM</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Checked In</p>
                <p className="text-xs text-[#5a6a8a]">Sep 28, 2026 10:05 AM</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center flex-shrink-0 pe-pulse">
                <Clock size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#3b82f6]">Parking Active</p>
                <p className="text-xs text-[#5a6a8a]">Currently in progress</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1e2d4d] flex items-center justify-center flex-shrink-0">
                <CreditCard size={16} className="text-[#5a6a8a]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#8a98b5]">Check Out & Pay</p>
                <p className="text-xs text-[#5a6a8a]">Est. Sep 28, 2:05 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extend Modal */}
      <Modal open={showExtend} onClose={() => setShowExtend(false)} title="Extend Parking Time">
        <div className="space-y-4">
          <p className="text-sm text-[#8a98b5]">Add more time to your current session. Extension is subject to capacity availability.</p>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Extend by: {extendHours} hour{extendHours > 1 ? 's' : ''}</label>
            <input type="range" min="1" max="6" value={extendHours} onChange={(e) => setExtendHours(Number(e.target.value))} className="w-full accent-[#2563eb]" />
          </div>
          <div className="bg-[#0b1220] rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-[#8a98b5]">Additional cost</span>
            <span className="font-bold text-lg">${(extendHours * activeSession.hourlyRate).toFixed(2)}</span>
          </div>
          <button onClick={() => setShowExtend(false)} className="pe-btn-primary w-full">
            <CheckCircle2 size={16} /> Confirm Extension
          </button>
        </div>
      </Modal>

      {/* Pay Modal */}
      <Modal open={showPay} onClose={() => { setShowPay(false); setPaid(false); }} title={paid ? 'Payment Complete' : 'Check Out & Pay'}>
        {paid ? (
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-2xl bg-[#10b981]/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-[#10b981]" />
            </div>
            <h3 className="text-lg font-bold mb-1">Payment Successful</h3>
            <p className="text-sm text-[#8a98b5] mb-4">Your receipt has been sent to your email.</p>
            <div className="bg-[#0b1220] rounded-lg p-4 mb-4 text-left space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#8a98b5]">Parking</span><span>${activeSession.estimatedCost.toFixed(2)}</span></div>
              {activeSession.evCost && <div className="flex justify-between text-sm"><span className="text-[#8a98b5]">EV Charging</span><span>${activeSession.evCost.toFixed(2)}</span></div>}
              <div className="flex justify-between pt-2 border-t border-[#1e2d4d]"><span className="font-semibold">Total Paid</span><span className="font-bold">${totalCost.toFixed(2)}</span></div>
            </div>
            <button onClick={() => navigate('driver-history')} className="pe-btn-primary w-full">View History</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#0b1220] rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#8a98b5]">Parking ({activeSession.elapsedMinutes} min)</span><span>${activeSession.estimatedCost.toFixed(2)}</span></div>
              {activeSession.evCost && <div className="flex justify-between text-sm"><span className="text-[#8a98b5]">EV Charging ({activeSession.evKwh} kWh)</span><span>${activeSession.evCost.toFixed(2)}</span></div>}
              <div className="flex justify-between pt-2 border-t border-[#1e2d4d]"><span className="font-semibold">Total Due</span><span className="font-bold text-lg">${totalCost.toFixed(2)}</span></div>
            </div>
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Payment Method</label>
              <select className="pe-input">
                <option>Visa •••• 4242</option>
                <option>Mastercard •••• 5555</option>
                <option>Apple Pay</option>
              </select>
            </div>
            <button onClick={() => setPaid(true)} className="pe-btn-primary w-full">
              <CreditCard size={16} /> Pay ${totalCost.toFixed(2)}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
