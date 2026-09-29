import { useApp } from '@/context/AppContext';
import { StatCard, SectionHeader, Badge, ProgressBar, MiniBarChart, MiniLineChart } from '@/components/ui';
import { facilities, reports, weeklyRevenue, hourlyOccupancy, reservations, violations, complaints } from '@/data/mockData';
import { DollarSign, Building2, CalendarCheck, AlertTriangle, TrendingUp, Users, BarChart3, Car } from 'lucide-react';

export function OperatorDashboard() {
  const totalRevenue = reports.reduce((s, r) => s + r.revenue, 0);
  const totalReservations = reports.reduce((s, r) => s + r.reservations, 0);
  const totalViolations = reports.reduce((s, r) => s + r.violations, 0);
  const avgOccupancy = reports.reduce((s, r) => s + r.occupancyRate, 0) / reports.length;

  return (
    <div>
      <SectionHeader title="Operator Dashboard" subtitle="Overview of all your parking facilities" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<DollarSign size={20} />} label="Today's Revenue" value={`$${totalRevenue.toLocaleString()}`} trend="12%" trendUp accent="green" />
        <StatCard icon={<CalendarCheck size={20} />} label="Reservations" value={String(totalReservations)} trend="8%" trendUp accent="blue" />
        <StatCard icon={<Building2 size={20} />} label="Facilities" value={String(facilities.length)} accent="cyan" />
        <StatCard icon={<AlertTriangle size={20} />} label="Violations" value={String(totalViolations)} trend="15%" trendUp={false} accent="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="pe-card p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-[#3b82f6]" /> Weekly Revenue</h2>
          <MiniBarChart data={weeklyRevenue.map(d => ({ label: d.day, value: d.revenue }))} />
        </div>
        <div className="pe-card p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-[#10b981]" /> Hourly Occupancy</h2>
          <MiniLineChart data={hourlyOccupancy.map(d => ({ label: d.hour, value: d.occupancy }))} />
        </div>
      </div>

      <div className="pe-card p-5">
        <h2 className="font-semibold text-lg mb-4">Facility Performance</h2>
        <div className="space-y-4">
          {reports.map((r) => {
            const f = facilities.find(f => f.id === r.facilityId);
            return (
              <div key={r.id} className="flex items-center gap-4">
                <div className="w-40 flex-shrink-0">
                  <p className="text-sm font-medium truncate">{r.facilityName}</p>
                  <p className="text-xs text-[#5a6a8a]">{f?.totalSpaces} spaces</p>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-[#8a98b5] mb-1">
                    <span>Occupancy</span>
                    <span>{Math.round(r.occupancyRate * 100)}%</span>
                  </div>
                  <ProgressBar value={r.occupancyRate * 100} max={100} color={r.occupancyRate > 0.8 ? '#ef4444' : r.occupancyRate > 0.6 ? '#f59e0b' : '#10b981'} />
                </div>
                <div className="text-right w-24">
                  <p className="font-bold text-sm">${r.revenue.toLocaleString()}</p>
                  <p className="text-xs text-[#5a6a8a]">{r.reservations} res.</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
