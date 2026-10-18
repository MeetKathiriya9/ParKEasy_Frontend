import { SectionHeader, Badge } from '@/components/ui';
import { reservations, staffMembers } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { History, CheckCircle2, ScanLine, AlertTriangle } from 'lucide-react';

export function StaffSessions() {
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
