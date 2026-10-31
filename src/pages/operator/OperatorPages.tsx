import { useEffect, useState } from 'react';
import { SectionHeader, Badge, Modal } from '@/components/ui';
import { reservations, violations, complaints, reports, eventParkings, weeklyRevenue, hourlyOccupancy } from '@/data/mockData';
import { Plus, DollarSign, Users, CalendarCheck, AlertTriangle, TrendingUp, BarChart3, CalendarDays, Download, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { StatCard, MiniBarChart, MiniLineChart } from '@/components/ui';
import { fetchFacilities } from '@/lib/facilities';
import { formatDuration, formatMoney } from '@/lib/format';
import {
  PRICING_RULE_KIND_LABELS,
  createPricingRule,
  deletePricingRule,
  fetchPricingRules,
  pricingErrorMessage,
  updatePricingRule,
} from '@/lib/pricing';
import type { Facility, PricingRuleKind, PricingRuleRecord } from '@/types';

interface RuleFormState {
  name: string;
  ruleType: PricingRuleKind;
  rate: string;
  durationMinutes: string;
  priority: string;
  active: boolean;
}

const EMPTY_RULE_FORM: RuleFormState = {
  name: '',
  ruleType: 'hourly',
  rate: '',
  durationMinutes: '120',
  priority: '0',
  active: true,
};

export function OperatorPricing() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [rules, setRules] = useState<PricingRuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PricingRuleRecord | null>(null);
  const [form, setForm] = useState<RuleFormState>(EMPTY_RULE_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchFacilities();
        if (cancelled) return;
        setFacilities(list);
        setSelectedFacility((current) => current || list[0]?.id || '');
      } catch (err) {
        if (!cancelled) setError(pricingErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedFacility) {
      setRules([]);
      return;
    }
    let cancelled = false;
    setRulesLoading(true);
    setError('');
    (async () => {
      try {
        const page = await fetchPricingRules(selectedFacility);
        if (!cancelled) setRules(page.items);
      } catch (err) {
        if (!cancelled) setError(pricingErrorMessage(err));
      } finally {
        if (!cancelled) setRulesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedFacility]);

  const selected = facilities.find((facility) => facility.id === selectedFacility);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_RULE_FORM);
    setFormError('');
    setNotice('');
    setDialogOpen(true);
  };

  const openEdit = (rule: PricingRuleRecord) => {
    setEditing(rule);
    setForm({
      name: rule.name,
      ruleType: rule.ruleType,
      rate: String(rule.rate),
      durationMinutes: rule.durationMinutes ? String(rule.durationMinutes) : '120',
      priority: String(rule.priority),
      active: rule.active,
    });
    setFormError('');
    setNotice('');
    setDialogOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    const name = form.name.replace(/\s+/g, ' ').trim();
    if (name.length < 2 || name.length > 80) {
      setFormError('Rule name must be 2-80 characters.');
      return;
    }
    const rate = Number(form.rate);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 100000) {
      setFormError('Rate must be greater than 0 and at most 100000.');
      return;
    }
    const priority = Number(form.priority);
    if (!Number.isInteger(priority) || priority < 0 || priority > 100) {
      setFormError('Priority must be a whole number between 0 and 100.');
      return;
    }
    let duration: number | null = null;
    if (form.ruleType === 'fixed') {
      duration = Number(form.durationMinutes);
      if (!Number.isInteger(duration) || duration < 30 || duration > 1440) {
        setFormError('A fixed package must last 30-1440 minutes.');
        return;
      }
    }

    setSaving(true);
    try {
      if (editing) {
        const updated = await updatePricingRule(editing.id, {
          name,
          ruleType: form.ruleType,
          rate,
          durationMinutes: duration,
          priority,
          active: form.active,
        });
        setRules((list) => list.map((rule) => (rule.id === updated.id ? updated : rule)));
        setNotice(`${updated.name} updated.`);
      } else {
        const created = await createPricingRule({
          facilityId: selectedFacility,
          name,
          ruleType: form.ruleType,
          rate,
          ...(duration === null ? {} : { durationMinutes: duration }),
          priority,
          active: form.active,
        });
        setRules((list) => [...list, created]);
        setNotice(`${created.name} added.`);
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(pricingErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: PricingRuleRecord) => {
    setBusyId(rule.id);
    setError('');
    try {
      const updated = await updatePricingRule(rule.id, { active: !rule.active });
      setRules((list) => list.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(pricingErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const removeRule = async (rule: PricingRuleRecord) => {
    if (!window.confirm(`Delete "${rule.name}"? This cannot be undone.`)) return;
    setBusyId(rule.id);
    setError('');
    try {
      await deletePricingRule(rule.id);
      setRules((list) => list.filter((item) => item.id !== rule.id));
      setNotice(`${rule.name} deleted.`);
    } catch (err) {
      setError(pricingErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const typeColors: Record<PricingRuleKind, 'blue' | 'green' | 'amber'> = {
    hourly: 'blue',
    fixed: 'amber',
    daily: 'green',
  };

  const rateSuffix = (rule: PricingRuleRecord): string => {
    if (rule.ruleType === 'daily') return '/day max';
    if (rule.ruleType === 'fixed') return ` / ${formatDuration(rule.durationMinutes)}`;
    return '/hour';
  };

  return (
    <div>
      <SectionHeader
        title="Pricing Management"
        subtitle="Configure rates and pricing rules"
        action={
          <button
            type="button"
            onClick={openAdd}
            disabled={!selectedFacility}
            className="pe-btn-primary disabled:opacity-60"
          >
            <Plus size={16} /> Add Rule
          </button>
        }
      />

      {notice && !error && (
        <div className="mb-4 rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 px-3 py-2 text-sm text-[#6ee7b7]">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5] flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {loading ? (
        <div className="pe-card p-10 text-center text-[#8a98b5]">
          <Loader2 size={22} className="mx-auto mb-2 animate-spin" />
          Loading facilities
        </div>
      ) : facilities.length === 0 ? (
        <div className="pe-card p-10 text-center text-[#8a98b5]">
          Add a facility before configuring pricing.
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {facilities.map((facility) => (
              <button
                type="button"
                key={facility.id}
                onClick={() => setSelectedFacility(facility.id)}
                className={selectedFacility === facility.id ? 'pe-chip-active' : 'pe-chip-idle'}
              >
                {facility.name}
              </button>
            ))}
          </div>

          {selected && (
            <div className="pe-card p-3 mb-4 text-xs text-[#8a98b5] flex flex-wrap gap-x-5 gap-y-1">
              <span>Base hourly: {formatMoney(selected.hourlyRate, 2)}</span>
              <span>Daily max: {formatMoney(selected.dailyMax, 2)}</span>
              <span>Grace: {formatDuration(selected.graceMinutes)}</span>
              <span>Overstay grace: {formatDuration(selected.overstayGraceMinutes)}</span>
              <span>Overstay rate: {formatMoney(selected.overstayRate, 2)}/hour</span>
            </div>
          )}

          <div className="space-y-3">
            {rulesLoading && (
              <div className="pe-card p-8 text-center text-[#8a98b5]">
                <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
                Loading rules
              </div>
            )}
            {!rulesLoading && rules.length === 0 && (
              <div className="pe-card p-8 text-center text-[#8a98b5]">
                No pricing rules for this facility. The base rates above still apply.
              </div>
            )}
            {!rulesLoading &&
              rules.map((rule) => (
                <div key={rule.id} className="pe-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold">{rule.name}</p>
                        <Badge color={typeColors[rule.ruleType]}>
                          {PRICING_RULE_KIND_LABELS[rule.ruleType]}
                        </Badge>
                        <Badge color={rule.active ? 'green' : 'gray'}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge color="cyan">Priority {rule.priority}</Badge>
                      </div>
                      <p className="text-sm text-[#8a98b5]">
                        {rule.ruleType === 'fixed'
                          ? `Covers ${formatDuration(rule.durationMinutes)}; extra time is billed hourly.`
                          : rule.ruleType === 'daily'
                            ? 'Caps the total for one parking stay.'
                            : 'Applied to the billable time before the daily cap.'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold">{formatMoney(rule.rate, 2)}</p>
                      <p className="text-xs text-[#5a6a8a]">{rateSuffix(rule)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(rule)}
                      className="pe-btn-outline text-sm"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRule(rule)}
                      disabled={busyId === rule.id}
                      className="pe-btn-outline text-sm disabled:opacity-60"
                    >
                      {rule.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRule(rule)}
                      disabled={busyId === rule.id}
                      className="pe-btn-outline text-sm text-[#fca5a5] disabled:opacity-60"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      <Modal
        open={dialogOpen}
        onClose={() => {
          if (!saving) setDialogOpen(false);
        }}
        title={editing ? 'Edit Pricing Rule' : 'Add Pricing Rule'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="rule-name" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Rule name
            </label>
            <input
              id="rule-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Weekend special"
              maxLength={80}
              className="pe-input"
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rule-type" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Type
              </label>
              <select
                id="rule-type"
                value={form.ruleType}
                onChange={(e) =>
                  setForm({ ...form, ruleType: e.target.value as PricingRuleKind })
                }
                className="pe-input"
              >
                <option value="hourly">Hourly</option>
                <option value="fixed">Fixed package</option>
                <option value="daily">Daily maximum</option>
              </select>
            </div>
            <div>
              <label htmlFor="rule-rate" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Rate (INR)
              </label>
              <input
                id="rule-rate"
                type="number"
                step="0.01"
                min={0}
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="50.00"
                className="pe-input"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {form.ruleType === 'fixed' && (
              <div>
                <label
                  htmlFor="rule-duration"
                  className="text-xs text-[#8a98b5] font-medium mb-1.5 block"
                >
                  Package minutes
                </label>
                <input
                  id="rule-duration"
                  type="number"
                  step={30}
                  min={30}
                  max={1440}
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  className="pe-input"
                  autoComplete="off"
                />
              </div>
            )}
            <div>
              <label
                htmlFor="rule-priority"
                className="text-xs text-[#8a98b5] font-medium mb-1.5 block"
              >
                Priority
              </label>
              <input
                id="rule-priority"
                type="number"
                step={1}
                min={0}
                max={100}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="pe-input"
                autoComplete="off"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#8a98b5]">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="accent-[#2563eb]"
            />
            Rule is active
          </label>
          <p className="text-xs text-[#5a6a8a]">
            Fixed packages cover their duration; extra time falls back to the hourly rate.
            Daily rules cap the total for the stay.
          </p>
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]"
            >
              {formError}
            </div>
          )}
          <button type="submit" disabled={saving} className="pe-btn-primary w-full disabled:opacity-60">
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving
              </>
            ) : editing ? (
              'Save changes'
            ) : (
              'Add rule'
            )}
          </button>
        </form>
      </Modal>
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
