import { SectionHeader, Badge } from '@/components/ui';
import { spaces, reservations, staffMembers } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { ParkingSquare, Clock, History, CheckCircle2, ScanLine, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function StaffSpaces() {
  const { currentUser } = useApp();
  const staff = staffMembers.find((s) => s.name === currentUser?.name);
  const facilitySpaces = spaces.filter((s) => s.facilityId === staff?.facilityId);

  const [spaceStatuses, setSpaceStatuses] = useState(
    Object.fromEntries(facilitySpaces.map((s) => [s.id, s.status]))
  );

  const toggleStatus = (id: string) => {
    const current = spaceStatuses[id];
    const next = current === 'available' ? 'maintenance' : 'available';
    setSpaceStatuses({ ...spaceStatuses, [id]: next });
  };

  const statusColors: Record<string, string> = {
    available: 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]',
    occupied: 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]',
    reserved: 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]',
    maintenance: 'bg-[#2a3a5c] border-[#3a4a6c] text-[#8a98b5]',
  };

  return (
    <div>
      <SectionHeader title="Space Status" subtitle="View and update parking space status" />

      <div className="pe-card p-5 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><ParkingSquare size={18} /> Floor Plan</h2>
        {['1', '2', '3'].map((floor) => (
          <div key={floor} className="mb-6">
            <p className="text-sm font-medium text-[#8a98b5] mb-2">Floor {floor}</p>
            <div className="grid grid-cols-5 gap-2">
              {facilitySpaces.filter((s) => s.floor === floor).map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleStatus(s.id)}
                  className={`rounded-lg border p-3 text-center text-xs font-semibold transition-all hover:scale-105 ${statusColors[spaceStatuses[s.id]]}`}
                >
                  {s.label}
                  <p className="text-[10px] mt-1 capitalize">{spaceStatuses[s.id]}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="text-xs text-[#5a6a8a]">Click a space to toggle between available and maintenance</p>
      </div>
    </div>
  );
}

export function StaffSessions() {
  const { currentUser } = useApp();
  const staff = staffMembers.find((s) => s.name === currentUser?.name);
  const activeSessions = reservations.filter((r) => r.status === 'active');

  return (
    <div>
      <SectionHeader title="Active Sessions" subtitle="Currently parked vehicles" />

      <div className="pe-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2d4d] text-xs text-[#8a98b5] uppercase">
              <th className="text-left p-3 font-medium">Vehicle</th>
              <th className="text-left p-3 font-medium">Facility</th>
              <th className="text-left p-3 font-medium">Space</th>
              <th className="text-left p-3 font-medium">Check-in</th>
              <th className="text-left p-3 font-medium">Duration</th>
              <th className="text-left p-3 font-medium">EV</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {activeSessions.map((s) => (
              <tr key={s.id} className="border-b border-[#1e2d4d] last:border-0 text-sm">
                <td className="p-3 font-mono">{s.vehiclePlate}</td>
                <td className="p-3 text-[#8a98b5]">{s.facilityName}</td>
                <td className="p-3">{s.spaceLabel || 'N/A'}</td>
                <td className="p-3 text-[#8a98b5]">{s.checkInTime?.slice(11) || 'N/A'}</td>
                <td className="p-3">{s.durationHours}h</td>
                <td className="p-3">{s.hasEVCharging ? <Badge color="cyan">Yes</Badge> : <span className="text-[#5a6a8a]">No</span>}</td>
                <td className="p-3"><Badge color="green">Active</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StaffActivity() {
  const { currentUser } = useApp();
  const staff = staffMembers.find((s) => s.name === currentUser?.name);

  const activities = [
    { action: 'QR Scan - Check-in', detail: 'GLR-2841 at Downtown Central', time: '10:05 AM', icon: <ScanLine size={16} />, color: 'text-[#3b82f6] bg-[#2563eb]/15' },
    { action: 'QR Scan - Check-out', detail: 'MXD-7732 at Downtown Central', time: '9:45 AM', icon: <ScanLine size={16} />, color: 'text-[#10b981] bg-[#10b981]/15' },
    { action: 'Violation Recorded', detail: 'Overstay - NYC-3321', time: '8:30 AM', icon: <AlertTriangle size={16} />, color: 'text-[#ef4444] bg-[#ef4444]/15' },
    { action: 'Space Status Updated', detail: 'Space C-02 marked maintenance', time: '8:15 AM', icon: <CheckCircle2 size={16} />, color: 'text-[#f59e0b] bg-[#f59e0b]/15' },
    { action: 'QR Scan - Check-in', detail: 'TRB-9087 at Downtown Central', time: '8:00 AM', icon: <ScanLine size={16} />, color: 'text-[#3b82f6] bg-[#2563eb]/15' },
  ];

  return (
    <div>
      <SectionHeader title="My Activity" subtitle="Your recent actions and scans" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Scans Today</p>
          <p className="text-2xl font-bold mt-1">{staff?.scansToday ?? 0}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Violations Logged</p>
          <p className="text-2xl font-bold mt-1">{staff?.violationsLogged ?? 0}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Last Active</p>
          <p className="text-sm font-bold mt-1">{staff?.lastActive?.slice(11) || 'N/A'}</p>
        </div>
      </div>

      <div className="pe-card p-5">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><History size={18} /> Activity Log</h2>
        <div className="space-y-3">
          {activities.map((a, i) => (
            <div key={i} className="flex items-center gap-3 pb-3 border-b border-[#1e2d4d] last:border-0 last:pb-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color}`}>{a.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{a.action}</p>
                <p className="text-xs text-[#8a98b5]">{a.detail}</p>
              </div>
              <span className="text-xs text-[#5a6a8a]">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
