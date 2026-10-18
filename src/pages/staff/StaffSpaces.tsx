import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { EmptyState, SectionHeader, StatCard } from '@/components/ui';
import { fetchFacilities } from '@/lib/facilities';
import {
  MANUAL_SPACE_STATUSES,
  SPACE_STATUS_LABELS,
  SPACE_TYPE_LABELS,
  ZONE_STATUS_LABELS,
  changeSpaceStatus,
  fetchFacilitySpaces,
  fetchFloors,
  spaceErrorMessage,
} from '@/lib/spaces';
import type { Facility, Floor, Space, SpaceStatus } from '@/types';
import {
  AlertCircle,
  Building2,
  Check,
  Car,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';

/**
 * Staff view of a facility's layout.
 *
 * Staff may read the facilities their token assigns them and change a space's
 * status there - nothing else. The structure (floors, zones, labels) is the
 * operator's to edit, so this page has no add, rename or delete controls, and
 * a space can only be moved between the statuses a person is allowed to set.
 */
export function StaffSpaces() {
  const { currentUser } = useApp();
  // The facilities this staff account was assigned when the token was minted.
  const facilityIds = currentUser?.facilityIds ?? [];

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusFor, setStatusFor] = useState<Space | null>(null);
  const [statusForm, setStatusForm] = useState<{ status: SpaceStatus; reason: string }>({
    status: 'available',
    reason: '',
  });
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = async (facilityId: string) => {
    const [layout, flat] = await Promise.all([
      fetchFloors(facilityId),
      fetchFacilitySpaces(facilityId),
    ]);
    setFloors(layout);
    setSpaces(flat);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Staff can only read facilities assigned to them, so the same list
        // call the operator uses already comes back scoped to this token.
        const list = await fetchFacilities();
        if (cancelled) return;
        setFacilities(list);
        if (list.length > 0) setSelectedFacility((current) => current || list[0].id);
      } catch (err) {
        if (!cancelled) setError(spaceErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedFacility) return;
    let cancelled = false;
    setSpaces([]);
    setFloors([]);
    (async () => {
      try {
        await refresh(selectedFacility);
      } catch (err) {
        if (!cancelled) setError(spaceErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedFacility]);

  const counts = useMemo(() => {
    const tally = {
      total: spaces.length,
      available: 0,
      occupied: 0,
      reserved: 0,
      maintenance: 0,
      blocked: 0,
    };
    for (const space of spaces) tally[space.status] += 1;
    return tally;
  }, [spaces]);

  const byZone = useMemo(() => {
    const grouped = new Map<string, Space[]>();
    for (const space of spaces) {
      const bucket = grouped.get(space.zoneId);
      if (bucket) bucket.push(space);
      else grouped.set(space.zoneId, [space]);
    }
    return grouped;
  }, [spaces]);

  const tileClass: Record<SpaceStatus, string> = {
    available: 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]',
    occupied: 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]',
    reserved: 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]',
    maintenance: 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#06b6d4]',
    blocked: 'bg-[#2a3a5c] border-[#3a4a6c] text-[#8a98b5]',
  };

  const openStatus = (space: Space) => {
    setStatusForm({ status: space.status, reason: '' });
    setDialogError('');
    setStatusFor(space);
  };

  const submitStatus = async () => {
    if (!statusFor) return;
    setDialogError('');
    if (statusFor.status === statusForm.status) {
      setDialogError('Pick a different status.');
      return;
    }
    const reason = statusForm.reason.trim();
    setSaving(true);
    setBusy(true);
    try {
      await changeSpaceStatus(statusFor.id, {
        status: statusForm.status,
        ...(reason === '' ? {} : { reason }),
      });
      await refresh(selectedFacility);
      setNotice(
        `Space ${statusFor.spaceNumber} is now ${SPACE_STATUS_LABELS[statusForm.status].toLowerCase()}.`,
      );
      setStatusFor(null);
    } catch (err) {
      setDialogError(spaceErrorMessage(err));
    } finally {
      setSaving(false);
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8a98b5]">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading spaces
      </div>
    );
  }

  if (facilityIds.length === 0) {
    return (
      <div>
        <SectionHeader title="Space Status" subtitle="View and update parking space status" />
        <EmptyState
          icon={<MapPin size={28} />}
          title="No facility assigned"
          message="An administrator has to assign you to a facility before you can see its spaces."
        />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Space Status"
        subtitle="View the layout and mark a space available, in maintenance or blocked."
        action={
          <button
            type="button"
            className="pe-btn-outline"
            onClick={() => {
              setError('');
              refresh(selectedFacility).catch((err) => setError(spaceErrorMessage(err)));
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      {notice && !error && (
        <div className="mb-4 rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 px-3 py-2 text-sm text-[#6ee7b7] flex items-center gap-2">
          <Check size={15} />
          {notice}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5] flex items-center gap-2"
        >
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {facilities.length === 0 ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title="No facilities to show"
          message="None of the facilities assigned to you could be loaded."
        />
      ) : (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {facilities.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFacility(f.id)}
                className={selectedFacility === f.id ? 'pe-chip-active' : 'pe-chip-idle'}
              >
                {f.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
            <StatCard icon={<Layers size={18} />} label="Total" value={String(counts.total)} accent="blue" />
            <StatCard icon={<Check size={18} />} label="Available" value={String(counts.available)} accent="green" />
            <StatCard icon={<Car size={18} />} label="Occupied" value={String(counts.occupied)} accent="red" />
            <StatCard icon={<MapPin size={18} />} label="Reserved" value={String(counts.reserved)} accent="amber" />
            <StatCard icon={<Building2 size={18} />} label="Maintenance" value={String(counts.maintenance)} accent="cyan" />
            <StatCard icon={<X size={18} />} label="Blocked" value={String(counts.blocked)} accent="violet" />
          </div>

          <div className="pe-card p-5">
            {floors.length === 0 ? (
              <p className="text-center text-[#8a98b5] py-10">
                This facility has no floors configured yet.
              </p>
            ) : (
              floors.map((floor) => (
                <div key={floor.id} className="mb-6 last:mb-0">
                  <p className="text-sm font-medium text-[#8a98b5] mb-2">
                    {floor.name} <span className="text-[#5a6a8a]">· level {floor.level}</span>
                  </p>
                  {floor.zones.length === 0 ? (
                    <p className="text-xs text-[#5a6a8a] py-1">No zones on this floor.</p>
                  ) : (
                    floor.zones.map((zone) => (
                      <div key={zone.id} className="bg-[#0b1220] rounded-lg p-3 mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium">{zone.name}</p>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              zone.status === 'ACTIVE'
                                ? 'bg-[#10b981]/15 text-[#10b981]'
                                : 'bg-[#2a3a5c] text-[#8a98b5]'
                            }`}
                          >
                            {ZONE_STATUS_LABELS[zone.status]}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                          {(byZone.get(zone.id) ?? []).map((space) => (
                            <button
                              key={space.id}
                              type="button"
                              onClick={() => openStatus(space)}
                              disabled={busy}
                              className={`rounded-lg border p-2 text-center text-xs font-semibold transition-all hover:scale-105 disabled:opacity-60 ${tileClass[space.status]}`}
                            >
                              {space.spaceNumber}
                              <p className="text-[9px] mt-0.5">
                                {SPACE_STATUS_LABELS[space.status]}
                              </p>
                              <p className="text-[9px] opacity-70 capitalize">
                                {SPACE_TYPE_LABELS[space.type]}
                              </p>
                            </button>
                          ))}
                        </div>
                        {(byZone.get(zone.id) ?? []).length === 0 && (
                          <p className="text-xs text-[#5a6a8a] py-1">No spaces in this zone.</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Change space status */}
      {statusFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="pe-card w-full max-w-md p-5">
            <h2 className="font-semibold mb-1">Change space status</h2>
            <p className="text-sm text-[#8a98b5] mb-4">
              Space {statusFor.spaceNumber} is currently{' '}
              {SPACE_STATUS_LABELS[statusFor.status].toLowerCase()}.
            </p>

            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Status</label>
            <select
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as SpaceStatus })}
              className="pe-input w-full mb-3"
            >
              {MANUAL_SPACE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {SPACE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#5a6a8a] mb-3">
              Occupied and reserved are set by the reservation engine.
            </p>

            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Reason (optional)
            </label>
            <input
              value={statusForm.reason}
              onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
              placeholder="Oil spill"
              className="pe-input w-full mb-4"
              autoComplete="off"
            />

            {dialogError && (
              <p role="alert" className="text-xs text-[#fca5a5] mb-3">
                {dialogError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatusFor(null)}
                disabled={saving}
                className="pe-btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitStatus}
                disabled={saving}
                className="pe-btn-primary flex-1 disabled:opacity-60"
              >
                {saving ? 'Saving' : 'Save status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
