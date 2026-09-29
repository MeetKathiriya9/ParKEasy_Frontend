import { useApp } from '@/context/AppContext';
import { StatCard, SectionHeader, Badge, ProgressBar } from '@/components/ui';
import { facilities, reservations, violations, staffMembers } from '@/data/mockData';
import { ScanLine, Clock, AlertTriangle, CheckCircle2, Car, Zap, TrendingUp } from 'lucide-react';

export function StaffDashboard() {
  const { currentUser, navigate } = useApp();
  const staff = staffMembers.find((s) => s.name === currentUser?.name);
  const facility = facilities.find((f) => f.id === staff?.facilityId);
  const activeSessions = reservations.filter((r) => r.status === 'active' && r.facilityId === staff?.facilityId);
  const facilityViolations = violations.filter((v) => v.facilityId === staff?.facilityId);

  return (
    <div>
      <SectionHeader title="Staff Dashboard" subtitle={facility?.name || 'Your assigned facility'} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<ScanLine size={20} />} label="Scans Today" value={String(staff?.scansToday ?? 0)} accent="blue" />
        <StatCard icon={<Clock size={20} />} label="Active Sessions" value={String(activeSessions.length)} accent="green" />
        <StatCard icon={<AlertTriangle size={20} />} label="Open Violations" value={String(facilityViolations.filter(v => v.status === 'open').length)} accent="amber" />
        <StatCard icon={<Car size={20} />} label="Available Spaces" value={String(facility?.availableSpaces ?? 0)} accent="cyan" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Facility Status */}
        <div className="pe-card p-5">
          <h2 className="font-semibold text-lg mb-4">Facility Status</h2>
          {facility && (
            <>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#10b981]">{facility.availableSpaces}</p>
                  <p className="text-xs text-[#8a98b5]">Available</p>
                </div>
                <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#f59e0b]">{facility.reservedSpaces}</p>
                  <p className="text-xs text-[#8a98b5]">Reserved</p>
                </div>
                <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#ef4444]">{facility.occupiedSpaces}</p>
                  <p className="text-xs text-[#8a98b5]">Occupied</p>
                </div>
                <div className="bg-[#0b1220] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#5a6a8a]">{facility.maintenanceSpaces}</p>
                  <p className="text-xs text-[#8a98b5]">Maint.</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-[#8a98b5] mb-1">
                  <span>Occupancy</span>
                  <span>{Math.round(((facility.occupiedSpaces + facility.reservedSpaces) / facility.totalSpaces) * 100)}%</span>
                </div>
                <ProgressBar value={facility.occupiedSpaces + facility.reservedSpaces} max={facility.totalSpaces} color="#f59e0b" />
              </div>
              {((facility.occupiedSpaces + facility.reservedSpaces) / facility.totalSpaces) > 0.85 && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
                  <AlertTriangle size={18} className="text-[#f59e0b]" />
                  <p className="text-sm text-[#f59e0b] font-medium">High occupancy alert - facility nearing capacity</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pe-card p-5">
          <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button onClick={() => navigate('staff-scanner')} className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] hover:bg-[#1e2d4d] transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-[#2563eb]/15 flex items-center justify-center text-[#3b82f6]"><ScanLine size={18} /></div>
              <div><p className="text-sm font-medium">Scan QR Code</p><p className="text-xs text-[#8a98b5]">Check-in or check-out a vehicle</p></div>
            </button>
            <button onClick={() => navigate('staff-violations')} className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] hover:bg-[#1e2d4d] transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-[#ef4444]/15 flex items-center justify-center text-[#ef4444]"><AlertTriangle size={18} /></div>
              <div><p className="text-sm font-medium">Record Violation</p><p className="text-xs text-[#8a98b5]">Log a parking violation</p></div>
            </button>
            <button onClick={() => navigate('staff-spaces')} className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] hover:bg-[#1e2d4d] transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-[#10b981]/15 flex items-center justify-center text-[#10b981]"><CheckCircle2 size={18} /></div>
              <div><p className="text-sm font-medium">Update Space Status</p><p className="text-xs text-[#8a98b5]">Mark spaces as available/maintenance</p></div>
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="mt-6">
        <h2 className="font-semibold text-lg mb-3">Active Sessions at Your Facility</h2>
        <div className="pe-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2d4d] text-xs text-[#8a98b5] uppercase">
                <th className="text-left p-3 font-medium">Vehicle</th>
                <th className="text-left p-3 font-medium">Space</th>
                <th className="text-left p-3 font-medium">Check-in</th>
                <th className="text-left p-3 font-medium">Duration</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((s) => (
                <tr key={s.id} className="border-b border-[#1e2d4d] last:border-0 text-sm">
                  <td className="p-3 font-mono">{s.vehiclePlate}</td>
                  <td className="p-3">{s.spaceLabel || 'N/A'}</td>
                  <td className="p-3 text-[#8a98b5]">{s.checkInTime?.slice(11) || 'N/A'}</td>
                  <td className="p-3">{s.durationHours}h</td>
                  <td className="p-3"><Badge color="green">Active</Badge></td>
                </tr>
              ))}
              {activeSessions.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-[#8a98b5]">No active sessions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
