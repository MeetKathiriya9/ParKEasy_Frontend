import { useState } from 'react';
import { SectionHeader, Badge, Modal } from '@/components/ui';
import { reservations } from '@/data/mockData';
import { ScanLine, CheckCircle2, XCircle, QrCode, Car, Clock, MapPin, Zap } from 'lucide-react';

export function StaffScanner() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [showDetails, setShowDetails] = useState(false);
  const [manualPlate, setManualPlate] = useState('');

  const matchedRes = reservations.find((r) => r.status === 'active' || r.status === 'confirmed');

  const handleScan = () => {
    setScanning(true);
    setScanResult('idle');
    setTimeout(() => {
      setScanning(false);
      setScanResult('success');
      setShowDetails(true);
    }, 2000);
  };

  return (
    <div>
      <SectionHeader title="QR Scanner" subtitle="Scan reservation QR codes for check-in and check-out" />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <div className="pe-card p-6">
          <h2 className="font-semibold text-lg mb-4">Scanner</h2>
          <div className="relative aspect-square max-w-sm mx-auto bg-[#0b1220] rounded-2xl border-2 border-[#1e2d4d] overflow-hidden">
            {scanning && <div className="pe-scan-line" />}
            <div className="absolute inset-0 flex items-center justify-center">
              {scanning ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-[#06b6d4] border-t-transparent pe-spin mx-auto mb-3" />
                  <p className="text-sm text-[#06b6d4]">Scanning...</p>
                </div>
              ) : (
                <div className="text-center">
                  <QrCode size={80} className="mx-auto text-[#3a4a6c] mb-3" />
                  <p className="text-sm text-[#8a98b5]">Position QR code within frame</p>
                </div>
              )}
            </div>
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#06b6d4] rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#06b6d4] rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#06b6d4] rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#06b6d4] rounded-br-lg" />
          </div>
          <button onClick={handleScan} disabled={scanning} className="pe-btn-primary w-full mt-4">
            <ScanLine size={18} /> {scanning ? 'Scanning...' : 'Start Scan'}
          </button>

          {scanResult === 'success' && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30">
              <CheckCircle2 size={18} className="text-[#10b981]" />
              <p className="text-sm text-[#10b981]">QR code matched successfully!</p>
            </div>
          )}
        </div>

        {/* Manual Verification */}
        <div className="pe-card p-6">
          <h2 className="font-semibold text-lg mb-4">Manual Verification</h2>
          <p className="text-sm text-[#8a98b5] mb-4">Enter a license plate to verify a reservation manually.</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">License Plate</label>
              <input type="text" value={manualPlate} onChange={(e) => setManualPlate(e.target.value.toUpperCase())} placeholder="GLR-2841" className="pe-input font-mono text-lg tracking-wider text-center" />
            </div>
            <button onClick={() => { setScanResult('success'); setShowDetails(true); }} disabled={!manualPlate} className="pe-btn-outline w-full">
              <Car size={16} /> Verify Vehicle
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-[#1e2d4d]">
            <h3 className="font-semibold mb-3 text-sm">Recent Scans</h3>
            <div className="space-y-2">
              {[
                { plate: 'GLR-2841', action: 'Check-in', time: '10:05 AM', status: 'success' },
                { plate: 'MXD-7732', action: 'Check-out', time: '9:45 AM', status: 'success' },
                { plate: 'TRB-9087', action: 'Check-in', time: '9:30 AM', status: 'error' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#0b1220]">
                  <div className="flex items-center gap-2">
                    {s.status === 'success' ? <CheckCircle2 size={16} className="text-[#10b981]" /> : <XCircle size={16} className="text-[#ef4444]" />}
                    <span className="text-sm font-mono">{s.plate}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#8a98b5]">
                    <span>{s.action}</span>
                    <span>{s.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scan Result Modal */}
      <Modal open={showDetails} onClose={() => { setShowDetails(false); setScanResult('idle'); }} title="Reservation Verified">
        {matchedRes && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30">
              <CheckCircle2 size={24} className="text-[#10b981]" />
              <div>
                <p className="font-semibold text-[#10b981]">Reservation Found</p>
                <p className="text-xs text-[#8a98b5]">QR: {matchedRes.qrCode}</p>
              </div>
            </div>
            <div className="bg-[#0b1220] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8a98b5] flex items-center gap-1"><MapPin size={14} /> Facility</span>
                <span className="text-sm font-medium">{matchedRes.facilityName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8a98b5] flex items-center gap-1"><Car size={14} /> Vehicle</span>
                <span className="text-sm font-mono font-medium">{matchedRes.vehiclePlate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8a98b5] flex items-center gap-1"><Clock size={14} /> Duration</span>
                <span className="text-sm font-medium">{matchedRes.durationHours}h ({new Date(matchedRes.startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(matchedRes.endDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })})</span>
              </div>
              {matchedRes.hasEVCharging && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8a98b5] flex items-center gap-1"><Zap size={14} /> EV Charging</span>
                  <Badge color="cyan">Requested</Badge>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-[#1e2d4d]">
                <span className="text-sm text-[#8a98b5]">Status</span>
                <Badge color={matchedRes.status === 'active' ? 'green' : 'blue'}>{matchedRes.status}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowDetails(false); setScanResult('idle'); }} className="pe-btn-outline flex-1">Cancel</button>
              <button onClick={() => { setShowDetails(false); setScanResult('idle'); }} className="pe-btn-primary flex-1">
                <CheckCircle2 size={16} /> Confirm Check-In
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
