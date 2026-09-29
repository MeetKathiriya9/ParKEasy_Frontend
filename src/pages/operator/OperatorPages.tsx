import { useState } from 'react';
import { SectionHeader, Badge, Modal, ProgressBar } from '@/components/ui';
import { spaces, facilities, pricingRules, staffMembers, reservations, violations, complaints, reports, eventParkings, weeklyRevenue, hourlyOccupancy } from '@/data/mockData';
import { Plus, DollarSign, Users, CalendarCheck, AlertTriangle, TrendingUp, BarChart3, CalendarDays, Download, Building2, Zap, Car, MessageSquare } from 'lucide-react';
import { StatCard, MiniBarChart, MiniLineChart } from '@/components/ui';

export function OperatorSpaces() {
  const [selectedFacility, setSelectedFacility] = useState(facilities[0].id);
  const facilitySpaces = spaces.filter(s => s.facilityId === selectedFacility);

  const statusColors: Record<string, string> = {
    available: 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]',
    occupied: 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]',
    reserved: 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]',
    maintenance: 'bg-[#2a3a5c] border-[#3a4a6c] text-[#8a98b5]',
  };

  return (
    <div>
      <SectionHeader title="Space Management" subtitle="Configure floors, zones, and spaces" action={<button className="pe-btn-primary"><Plus size={16} /> Add Space</button>} />

      <div className="flex gap-2 mb-4 flex-wrap">
        {facilities.map(f => (
          <button key={f.id} onClick={() => setSelectedFacility(f.id)} className={selectedFacility === f.id ? 'pe-chip-active' : 'pe-chip-idle'}>
            {f.name}
          </button>
        ))}
      </div>

      <div className="pe-card p-5">
        {['1', '2', '3'].map(floor => {
          const floorSpaces = facilitySpaces.filter(s => s.floor === floor);
          if (floorSpaces.length === 0) return null;
          return (
            <div key={floor} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[#8a98b5]">Floor {floor}</p>
                <button className="text-xs text-[#3b82f6] hover:underline">+ Add Zone</button>
              </div>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {floorSpaces.map(s => (
                  <div key={s.id} className={`rounded-lg border p-2 text-center text-xs font-semibold ${statusColors[s.status]}`}>
                    {s.label}
                    <p className="text-[9px] mt-0.5 capitalize">{s.type}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {facilitySpaces.length === 0 && <p className="text-center text-[#8a98b5] py-8">No spaces configured for this facility.</p>}
      </div>
    </div>
  );
}

export function OperatorPricing() {
  const [selectedFacility, setSelectedFacility] = useState(facilities[0].id);
  const [showAdd, setShowAdd] = useState(false);
  const facilityRules = pricingRules.filter(p => p.facilityId === selectedFacility);

  const typeColors: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'cyan'> = {
    hourly: 'blue', daily: 'green', peak: 'amber', event: 'red', overnight: 'cyan',
  };

  return (
    <div>
      <SectionHeader title="Pricing Management" subtitle="Configure rates and pricing rules" action={<button onClick={() => setShowAdd(true)} className="pe-btn-primary"><Plus size={16} /> Add Rule</button>} />

      <div className="flex gap-2 mb-4 flex-wrap">
        {facilities.map(f => (
          <button key={f.id} onClick={() => setSelectedFacility(f.id)} className={selectedFacility === f.id ? 'pe-chip-active' : 'pe-chip-idle'}>
            {f.name}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {facilityRules.map(r => (
          <div key={r.id} className="pe-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{r.name}</p>
                  <Badge color={typeColors[r.type]}>{r.type}</Badge>
                  {r.active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}
                </div>
                <p className="text-sm text-[#8a98b5]">{r.startTime} - {r.endTime} · {r.daysOfWeek.join(', ')}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">${r.rate}</p>
                <p className="text-xs text-[#5a6a8a]">{r.type === 'daily' ? 'max' : r.type === 'overnight' ? 'flat' : '/hr'}</p>
              </div>
            </div>
          </div>
        ))}
        {facilityRules.length === 0 && <p className="text-center text-[#8a98b5] py-8">No pricing rules for this facility.</p>}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Pricing Rule">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Rule Name</label>
            <input type="text" placeholder="e.g. Weekend Special" className="pe-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Type</label>
              <select className="pe-input">
                <option value="hourly">Hourly</option>
                <option value="daily">Daily Max</option>
                <option value="peak">Peak Surcharge</option>
                <option value="event">Event Pricing</option>
                <option value="overnight">Overnight</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Rate ($)</label>
              <input type="number" placeholder="5.00" className="pe-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Start Time</label>
              <input type="time" className="pe-input" />
            </div>
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">End Time</label>
              <input type="time" className="pe-input" />
            </div>
          </div>
          <button onClick={() => setShowAdd(false)} className="pe-btn-primary w-full">Add Rule</button>
        </div>
      </Modal>
    </div>
  );
}

export function OperatorStaff() {
  return (
    <div>
      <SectionHeader title="Staff Management" subtitle="Manage staff accounts and assignments" action={<button className="pe-btn-primary"><Plus size={16} /> Add Staff</button>} />

      <div className="pe-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2d4d] text-xs text-[#8a98b5] uppercase">
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Facility</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-left p-3 font-medium">Scans Today</th>
              <th className="text-left p-3 font-medium">Violations</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {staffMembers.map(s => (
              <tr key={s.id} className="border-b border-[#1e2d4d] last:border-0 text-sm">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563eb] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold">
                      {s.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-[#5a6a8a]">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-[#8a98b5]">{s.facilityName}</td>
                <td className="p-3">{s.role}</td>
                <td className="p-3">{s.scansToday}</td>
                <td className="p-3">{s.violationsLogged}</td>
                <td className="p-3">{s.active ? <Badge color="green">Active</Badge> : <Badge color="gray">Off Duty</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OperatorReservations() {
  return (
    <div>
      <SectionHeader title="Reservations" subtitle="All reservations across your facilities" />

      <div className="pe-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2d4d] text-xs text-[#8a98b5] uppercase">
              <th className="text-left p-3 font-medium">QR Code</th>
              <th className="text-left p-3 font-medium">Facility</th>
              <th className="text-left p-3 font-medium">Vehicle</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Duration</th>
              <th className="text-left p-3 font-medium">Cost</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(r => (
              <tr key={r.id} className="border-b border-[#1e2d4d] last:border-0 text-sm">
                <td className="p-3 font-mono text-xs">{r.qrCode}</td>
                <td className="p-3 text-[#8a98b5]">{r.facilityName}</td>
                <td className="p-3 font-mono">{r.vehiclePlate}</td>
                <td className="p-3 text-[#8a98b5]">{new Date(r.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                <td className="p-3">{r.durationHours}h</td>
                <td className="p-3 font-bold">${r.totalCost.toFixed(2)}</td>
                <td className="p-3">
                  <Badge color={r.status === 'active' ? 'green' : r.status === 'confirmed' ? 'blue' : r.status === 'cancelled' ? 'red' : 'gray'}>
                    {r.status.replace('-', ' ')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OperatorAnalytics() {
  const totalRevenue = reports.reduce((s, r) => s + r.revenue, 0);
  const totalReservations = reports.reduce((s, r) => s + r.reservations, 0);
  const totalCancellations = reports.reduce((s, r) => s + r.cancellations, 0);
  const totalNoShows = reports.reduce((s, r) => s + r.noShows, 0);

  return (
    <div>
      <SectionHeader title="Analytics & Reports" subtitle="Revenue, occupancy, and performance metrics" action={<button className="pe-btn-outline"><Download size={16} /> Export Report</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<DollarSign size={20} />} label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} trend="12%" trendUp accent="green" />
        <StatCard icon={<CalendarCheck size={20} />} label="Reservations" value={String(totalReservations)} trend="8%" trendUp accent="blue" />
        <StatCard icon={<AlertTriangle size={20} />} label="Cancellations" value={String(totalCancellations)} accent="amber" />
        <StatCard icon={<Users size={20} />} label="No-Shows" value={String(totalNoShows)} accent="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="pe-card p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-[#3b82f6]" /> Weekly Revenue</h2>
          <MiniBarChart data={weeklyRevenue.map(d => ({ label: d.day, value: d.revenue }))} />
        </div>
        <div className="pe-card p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-[#10b981]" /> Hourly Occupancy Pattern</h2>
          <MiniLineChart data={hourlyOccupancy.map(d => ({ label: d.hour, value: d.occupancy }))} />
        </div>
      </div>

      <div className="pe-card p-5">
        <h2 className="font-semibold text-lg mb-4">Facility Reports</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2d4d] text-xs text-[#8a98b5] uppercase">
                <th className="text-left p-3 font-medium">Facility</th>
                <th className="text-right p-3 font-medium">Revenue</th>
                <th className="text-right p-3 font-medium">Reservations</th>
                <th className="text-right p-3 font-medium">Cancellations</th>
                <th className="text-right p-3 font-medium">No-Shows</th>
                <th className="text-right p-3 font-medium">Occupancy</th>
                <th className="text-right p-3 font-medium">Violations</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-b border-[#1e2d4d] last:border-0 text-sm">
                  <td className="p-3 font-medium">{r.facilityName}</td>
                  <td className="p-3 text-right font-bold">${r.revenue.toLocaleString()}</td>
                  <td className="p-3 text-right">{r.reservations}</td>
                  <td className="p-3 text-right text-[#f59e0b]">{r.cancellations}</td>
                  <td className="p-3 text-right text-[#ef4444]">{r.noShows}</td>
                  <td className="p-3 text-right">{Math.round(r.occupancyRate * 100)}%</td>
                  <td className="p-3 text-right">{r.violations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function OperatorEvents() {
  return (
    <div>
      <SectionHeader title="Event Parking" subtitle="Manage special event parking and pricing" action={<button className="pe-btn-primary"><Plus size={16} /> Create Event</button>} />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventParkings.map(e => (
          <div key={e.id} className="pe-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/15 flex items-center justify-center text-[#8b5cf6]">
                <CalendarDays size={20} />
              </div>
              <Badge color="amber">{e.advanceReservations} reserved</Badge>
            </div>
            <p className="font-semibold">{e.name}</p>
            <p className="text-sm text-[#8a98b5] mt-1">{e.facilityName}</p>
            <p className="text-xs text-[#5a6a8a] mt-1">{e.date}</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-[#0b1220] rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{e.expectedDemand}</p>
                <p className="text-xs text-[#8a98b5]">Expected Demand</p>
              </div>
              <div className="bg-[#0b1220] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-[#f59e0b]">${e.specialRate}</p>
                <p className="text-xs text-[#8a98b5]">Special Rate</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OperatorComplaints() {
  const statusColors: Record<string, 'amber' | 'blue' | 'green'> = {
    open: 'amber', assigned: 'blue', in_progress: 'blue', resolved: 'green',
  };

  return (
    <div>
      <SectionHeader title="Complaints" subtitle="Review and resolve customer complaints" />

      <div className="space-y-3">
        {complaints.map(c => (
          <div key={c.id} className="pe-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold">{c.subject}</p>
                <p className="text-xs text-[#5a6a8a]">{c.facilityName} · {c.category} · {c.createdAt}</p>
              </div>
              <Badge color={statusColors[c.status]}>{c.status.replace('_', ' ')}</Badge>
            </div>
            <p className="text-sm text-[#8a98b5] mb-2">{c.description}</p>
            <p className="text-xs text-[#5a6a8a]">From: {c.userName}</p>
            {c.assignedTo && <p className="text-xs text-[#5a6a8a]">Assigned to: {c.assignedTo}</p>}
            {c.resolution && (
              <div className="mt-2 bg-[#10b981]/5 rounded-lg p-2 border border-[#10b981]/20">
                <p className="text-xs text-[#10b981] font-medium">Resolution: {c.resolution}</p>
              </div>
            )}
            {c.status !== 'resolved' && (
              <div className="flex gap-2 mt-3">
                <button className="pe-btn-outline text-sm">Assign</button>
                <button className="pe-btn-primary text-sm">Resolve</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OperatorViolations() {
  const statusColors: Record<string, 'red' | 'amber' | 'green' | 'gray'> = {
    open: 'red', appealed: 'amber', resolved: 'green', fined: 'gray',
  };

  return (
    <div>
      <SectionHeader title="Violations" subtitle="All violations across your facilities" />

      <div className="pe-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2d4d] text-xs text-[#8a98b5] uppercase">
              <th className="text-left p-3 font-medium">Vehicle</th>
              <th className="text-left p-3 font-medium">Facility</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-left p-3 font-medium">Fine</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {violations.map(v => (
              <tr key={v.id} className="border-b border-[#1e2d4d] last:border-0 text-sm">
                <td className="p-3 font-mono">{v.vehiclePlate}</td>
                <td className="p-3 text-[#8a98b5]">{v.facilityName}</td>
                <td className="p-3 capitalize">{v.type.replace('_', ' ')}</td>
                <td className="p-3 text-[#8a98b5] max-w-xs truncate">{v.description}</td>
                <td className="p-3 font-bold">${v.fine}</td>
                <td className="p-3"><Badge color={statusColors[v.status]}>{v.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
