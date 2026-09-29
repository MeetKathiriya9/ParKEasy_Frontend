import { useApp } from '@/context/AppContext';
import { StatCard, SectionHeader, Badge, ProgressBar, MiniBarChart } from '@/components/ui';
import { platformUsers, facilities, reports, auditLogs, complaints, reservations, weeklyRevenue } from '@/data/mockData';
import { Users, Building2, DollarSign, AlertTriangle, FileText, Shield, Settings, TrendingUp, CheckCircle2, Download } from 'lucide-react';
import { useState } from 'react';

export function AdminDashboard() {
  const totalRevenue = reports.reduce((s, r) => s + r.revenue, 0);
  const activeUsers = platformUsers.filter(u => u.status === 'active').length;
  const openComplaints = complaints.filter(c => c.status === 'open').length;

  return (
    <div>
      <SectionHeader title="Platform Admin Dashboard" subtitle="System-wide overview and management" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users size={20} />} label="Total Users" value={String(platformUsers.length)} trend="5%" trendUp accent="blue" />
        <StatCard icon={<Building2 size={20} />} label="Facilities" value={String(facilities.length)} accent="cyan" />
        <StatCard icon={<DollarSign size={20} />} label="Platform Revenue" value={`$${totalRevenue.toLocaleString()}`} trend="12%" trendUp accent="green" />
        <StatCard icon={<AlertTriangle size={20} />} label="Open Complaints" value={String(openComplaints)} accent="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="pe-card p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-[#3b82f6]" /> Platform Revenue (Weekly)</h2>
          <MiniBarChart data={weeklyRevenue.map(d => ({ label: d.day, value: d.revenue }))} />
        </div>
        <div className="pe-card p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText size={18} className="text-[#10b981]" /> Recent Audit Activity</h2>
          <div className="space-y-3">
            {auditLogs.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-[#1e2d4d] last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-lg bg-[#1e2d4d] flex items-center justify-center flex-shrink-0 text-[#8a98b5]">
                  <Shield size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-[#5a6a8a]">{a.userName} · {a.timestamp.slice(11)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pe-card p-5">
        <h2 className="font-semibold text-lg mb-4">Facility Overview</h2>
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="flex items-center gap-4">
              <div className="w-40 flex-shrink-0">
                <p className="text-sm font-medium truncate">{r.facilityName}</p>
              </div>
              <div className="flex-1">
                <ProgressBar value={r.occupancyRate * 100} max={100} color={r.occupancyRate > 0.8 ? '#ef4444' : '#3b82f6'} />
              </div>
              <div className="text-right w-24">
                <p className="font-bold text-sm">${r.revenue.toLocaleString()}</p>
              </div>
              <div className="w-20 text-right">
                <p className="text-sm text-[#8a98b5]">{Math.round(r.occupancyRate * 100)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminUsers() {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? platformUsers : platformUsers.filter(u => u.role === filter);

  const roleColors: Record<string, 'blue' | 'green' | 'amber' | 'cyan'> = {
    driver: 'blue', staff: 'green', operator: 'amber', admin: 'cyan',
  };
  const statusColors: Record<string, 'green' | 'red' | 'amber'> = {
    active: 'green', suspended: 'red', pending: 'amber',
  };

  return (
    <div>
      <SectionHeader title="User Management" subtitle="Manage all platform users" />

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'driver', 'staff', 'operator', 'admin'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'pe-chip-active' : 'pe-chip-idle'}>
            {f === 'all' ? 'All Users' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
          </button>
        ))}
      </div>

      <div className="pe-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2d4d] text-xs text-[#8a98b5] uppercase">
              <th className="text-left p-3 font-medium">User</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-left p-3 font-medium">Joined</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-[#1e2d4d] last:border-0 text-sm">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563eb] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold">
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-[#5a6a8a]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3"><Badge color={roleColors[u.role]}>{u.role}</Badge></td>
                <td className="p-3 text-[#8a98b5]">{u.joinedDate}</td>
                <td className="p-3"><Badge color={statusColors[u.status]}>{u.status}</Badge></td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="text-xs text-[#3b82f6] hover:underline">Edit</button>
                    {u.status === 'active' ? (
                      <button className="text-xs text-[#ef4444] hover:underline">Suspend</button>
                    ) : (
                      <button className="text-xs text-[#10b981] hover:underline">Activate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminFacilities() {
  return (
    <div>
      <SectionHeader title="All Facilities" subtitle="Platform-wide facility management" />

      <div className="pe-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2d4d] text-xs text-[#8a98b5] uppercase">
              <th className="text-left p-3 font-medium">Facility</th>
              <th className="text-left p-3 font-medium">Address</th>
              <th className="text-right p-3 font-medium">Spaces</th>
              <th className="text-right p-3 font-medium">Rate</th>
              <th className="text-right p-3 font-medium">Rating</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map(f => (
              <tr key={f.id} className="border-b border-[#1e2d4d] last:border-0 text-sm">
                <td className="p-3 font-medium">{f.name}</td>
                <td className="p-3 text-[#8a98b5]">{f.address}</td>
                <td className="p-3 text-right">{f.totalSpaces}</td>
                <td className="p-3 text-right">${f.hourlyRate}/hr</td>
                <td className="p-3 text-right">{f.rating} ★</td>
                <td className="p-3">{f.openNow ? <Badge color="green">Open</Badge> : <Badge color="red">Closed</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminPayments() {
  const allPayments = reservations.filter(r => r.paid);
  const totalRevenue = allPayments.reduce((s, r) => s + r.totalCost, 0);

  return (
    <div>
      <SectionHeader title="Payments" subtitle="Track all platform transactions" action={<button className="pe-btn-outline"><Download size={16} /> Export</button>} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<DollarSign size={20} />} label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} accent="green" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Transactions" value={String(allPayments.length)} accent="blue" />
        <StatCard icon={<TrendingUp size={20} />} label="Avg. Transaction" value={`$${(totalRevenue / allPayments.length).toFixed(2)}`} accent="cyan" />
      </div>

      <div className="pe-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2d4d] text-xs text-[#8a98b5] uppercase">
              <th className="text-left p-3 font-medium">Reservation</th>
              <th className="text-left p-3 font-medium">Facility</th>
              <th className="text-left p-3 font-medium">Vehicle</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-right p-3 font-medium">Amount</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {allPayments.map(r => (
              <tr key={r.id} className="border-b border-[#1e2d4d] last:border-0 text-sm">
                <td className="p-3 font-mono text-xs">{r.qrCode}</td>
                <td className="p-3 text-[#8a98b5]">{r.facilityName}</td>
                <td className="p-3 font-mono">{r.vehiclePlate}</td>
                <td className="p-3 text-[#8a98b5]">{new Date(r.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                <td className="p-3 text-right font-bold">${r.totalCost.toFixed(2)}</td>
                <td className="p-3"><Badge color="green">Paid</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminComplaints() {
  const statusColors: Record<string, 'amber' | 'blue' | 'green'> = {
    open: 'amber', assigned: 'blue', in_progress: 'blue', resolved: 'green',
  };

  return (
    <div>
      <SectionHeader title="All Complaints" subtitle="Platform-wide complaint management" />

      <div className="space-y-3">
        {complaints.map(c => (
          <div key={c.id} className="pe-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold">{c.subject}</p>
                <p className="text-xs text-[#5a6a8a]">{c.facilityName} · {c.category} · {c.userName} · {c.createdAt}</p>
              </div>
              <Badge color={statusColors[c.status]}>{c.status.replace('_', ' ')}</Badge>
            </div>
            <p className="text-sm text-[#8a98b5]">{c.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAudit() {
  return (
    <div>
      <SectionHeader title="Audit Logs" subtitle="Track critical administrative and operational actions" action={<button className="pe-btn-outline"><Download size={16} /> Export Logs</button>} />

      <div className="pe-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2d4d] text-xs text-[#8a98b5] uppercase">
              <th className="text-left p-3 font-medium">Timestamp</th>
              <th className="text-left p-3 font-medium">User</th>
              <th className="text-left p-3 font-medium">Action</th>
              <th className="text-left p-3 font-medium">Resource</th>
              <th className="text-left p-3 font-medium">Details</th>
              <th className="text-left p-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(a => (
              <tr key={a.id} className="border-b border-[#1e2d4d] last:border-0 text-sm">
                <td className="p-3 text-[#8a98b5] whitespace-nowrap">{a.timestamp.replace('T', ' ')}</td>
                <td className="p-3 font-medium">{a.userName}</td>
                <td className="p-3"><Badge color="blue">{a.action.replace(/_/g, ' ')}</Badge></td>
                <td className="p-3 text-[#8a98b5]">{a.resource}</td>
                <td className="p-3 text-[#8a98b5] max-w-xs truncate">{a.details}</td>
                <td className="p-3 font-mono text-xs text-[#5a6a8a]">{a.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminConfig() {
  const configs = [
    { label: 'Cancellation Window', value: '2 hours before start', desc: 'Free cancellation period' },
    { label: 'No-Show Threshold', value: '30 minutes', desc: 'Time after which reservation is marked no-show' },
    { label: 'Overstay Fine', value: '$25', desc: 'Fine for exceeding reservation duration' },
    { label: 'Max Advance Reservation', value: '30 days', desc: 'How far in advance users can reserve' },
    { label: 'Platform Fee', value: '5%', desc: 'Commission on each transaction' },
    { label: 'Min Hourly Rate', value: '$1.00', desc: 'Minimum allowed hourly rate' },
    { label: 'Max Hourly Rate', value: '$20.00', desc: 'Maximum allowed hourly rate' },
    { label: 'EV Charging Rate Cap', value: '$0.50/kWh', desc: 'Maximum EV charging rate' },
  ];

  return (
    <div>
      <SectionHeader title="System Configuration" subtitle="Platform-wide settings and policies" />

      <div className="grid md:grid-cols-2 gap-4">
        {configs.map(c => (
          <div key={c.label} className="pe-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Settings size={16} className="text-[#3b82f6]" />
                  <p className="font-semibold text-sm">{c.label}</p>
                </div>
                <p className="text-xs text-[#5a6a8a]">{c.desc}</p>
              </div>
              <button className="text-xs text-[#3b82f6] hover:underline">Edit</button>
            </div>
            <div className="mt-3 bg-[#0b1220] rounded-lg p-3">
              <p className="text-lg font-bold">{c.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
