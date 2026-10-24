import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, EmptyState, Modal, SectionHeader, StatCard } from '@/components/ui';
import { fetchFacilities } from '@/lib/facilities';
import {
  MANUAL_SPACE_STATUSES,
  SPACE_STATUS_LABELS,
  SPACE_TYPE_LABELS,
  ZONE_STATUS_LABELS,
  bulkCreateSpaces,
  changeSpaceStatus,
  changeZoneStatus,
  createFloor,
  createSpace,
  createZone,
  fetchFacilitySpaces,
  fetchFloors,
  removeFloor,
  removeSpace,
  removeZone,
  spaceErrorMessage,
  updateFloor,
  updateSpace,
  updateZone,
} from '@/lib/spaces';
import type {
  Facility,
  Floor,
  Space,
  SpaceStatus,
  SpaceType,
  Zone,
} from '@/types';
import {
  AlertCircle,
  Building2,
  Check,
  Clock,
  Edit,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';

const SPACE_TYPES: SpaceType[] = ['standard', 'compact', 'large', 'ev', 'accessible'];
/** Only these are settable by a person; the rest belong to the engine. */
const SETTABLE_STATUSES = MANUAL_SPACE_STATUSES;

interface FloorFormState {
  name: string;
  level: string;
}

const EMPTY_FLOOR_FORM: FloorFormState = { name: '', level: '0' };

interface ZoneFormState {
  name: string;
}

const EMPTY_ZONE_FORM: ZoneFormState = { name: '' };

interface SpaceFormState {
  spaceNumber: string;
  type: SpaceType;
  reservable: boolean;
}

const EMPTY_SPACE_FORM: SpaceFormState = {
  spaceNumber: '',
  type: 'standard',
  reservable: true,
};

interface BulkFormState {
  prefix: string;
  start: string;
  count: string;
  type: SpaceType;
  reservable: boolean;
}

const EMPTY_BULK_FORM: BulkFormState = {
  prefix: '',
  start: '1',
  count: '10',
  type: 'standard',
  reservable: true,
};

export function OperatorSpaces() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // One dialog at a time, so a stale form can never outlive its context.
  const [addingFloor, setAddingFloor] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [addingZone, setAddingZone] = useState<Floor | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [closingZone, setClosingZone] = useState<Zone | null>(null);
  const [addingSpace, setAddingSpace] = useState<Zone | null>(null);
  const [bulkAdding, setBulkAdding] = useState<Zone | null>(null);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [statusFor, setStatusFor] = useState<Space | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null);

  const [floorForm, setFloorForm] = useState<FloorFormState>(EMPTY_FLOOR_FORM);
  const [zoneForm, setZoneForm] = useState<ZoneFormState>(EMPTY_ZONE_FORM);
  const [spaceForm, setSpaceForm] = useState<SpaceFormState>(EMPTY_SPACE_FORM);
  const [bulkForm, setBulkForm] = useState<BulkFormState>(EMPTY_BULK_FORM);
  const [statusForm, setStatusForm] = useState<{ status: SpaceStatus; reason: string }>({
    status: 'AVAILABLE',
    reason: '',
  });
  const [zoneStatusForm, setZoneStatusForm] = useState<{ status: 'ACTIVE' | 'INACTIVE'; reason: string }>({
    status: 'ACTIVE',
    reason: '',
  });

  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => facilities.find((f) => f.id === selectedFacility) ?? null,
    [facilities, selectedFacility],
  );

  const refreshFloors = useCallback(async (facilityId: string) => {
    // Two round trips: the layout tree and the flat space list, grouped here so
    // a caller never has to walk the tree to find one space.
    const [layout, flat] = await Promise.all([
      fetchFloors(facilityId),
      fetchFacilitySpaces(facilityId),
    ]);
    setFloors(layout);
    setSpaces(flat);
    return layout;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchFacilities();
        if (cancelled) return;
        setFacilities(list);
        // Land on the first facility so the page is never an empty shell.
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
    setFloors([]);
    (async () => {
      try {
        await refreshFloors(selectedFacility);
      } catch (err) {
        if (!cancelled) setError(spaceErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedFacility, refreshFloors]);

  // Each dialog opens through its own helper: `openDialog` cannot stay a single
  // generic, because `setAddingFloor` and `setEditingFloor` share a variable
  // name pattern and TypeScript would unify their types at the call site.
  const openDialog = <T,>(setter: (value: T) => void, value: T) => {
    setDialogError('');
    setNotice('');
    setter(value);
  };

  const openAddFloor = () => {
    setFloorForm(EMPTY_FLOOR_FORM);
    openDialog<boolean>(setAddingFloor, true);
  };

  const openAddZone = (floor: Floor) => {
    setZoneForm(EMPTY_ZONE_FORM);
    // The floor travels with the dialog so the submit handler knows where to
    // attach the new zone; a bare `true` would leave it unparented.
    openDialog<Floor | null>(setAddingZone, floor);
  };

  const openAddSpace = (zone: Zone) => {
    setSpaceForm(EMPTY_SPACE_FORM);
    openDialog<Zone | null>(setAddingSpace, zone);
  };

  const openBulkAdd = (zone: Zone) => {
    setBulkForm(EMPTY_BULK_FORM);
    openDialog<Zone | null>(setBulkAdding, zone);
  };

  const closeAll = () => {
    setAddingFloor(false);
    setEditingFloor(null);
    setAddingZone(null);
    setEditingZone(null);
    setClosingZone(null);
    setAddingSpace(null);
    setBulkAdding(null);
    setEditingSpace(null);
    setStatusFor(null);
    setDeletingFloor(null);
    setDeletingZone(null);
    setDeletingSpace(null);
    setDialogError('');
  };

  // --- Floors ----------------------------------------------------------------

  const submitFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError('');
    const name = floorForm.name.replace(/\s+/g, ' ').trim();
    if (name.length < 1 || name.length > 40) {
      setDialogError('Floor name must be 1-40 characters.');
      return;
    }
    const level = Number(floorForm.level);
    if (!Number.isInteger(level) || level < -20 || level > 200) {
      setDialogError('Level must be a whole number from -20 to 200.');
      return;
    }

    setSaving(true);
    setBusy(true);
    try {
      if (editingFloor) {
        await updateFloor(editingFloor.id, { name, level });
        setNotice(`Floor renamed to ${name}.`);
      } else if (selectedFacility) {
        await createFloor(selectedFacility, { name, level });
        setNotice(`Floor ${name} added.`);
      }
      await refreshFloors(selectedFacility);
      closeAll();
    } catch (err) {
      setDialogError(spaceErrorMessage(err));
    } finally {
      setSaving(false);
      setBusy(false);
    }
  };

  const submitFloorDelete = async () => {
    if (!deletingFloor) return;
    setDialogError('');
    setSaving(true);
    setBusy(true);
    try {
      await removeFloor(deletingFloor.id);
      await refreshFloors(selectedFacility);
      setNotice(`Floor ${deletingFloor.name} and everything under it deleted.`);
      closeAll();
    } catch (err) {
      setDialogError(spaceErrorMessage(err));
    } finally {
      setSaving(false);
      setBusy(false);
    }
  };

  // --- Zones -----------------------------------------------------------------

  const submitZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError('');
    const name = zoneForm.name.replace(/\s+/g, ' ').trim();
    if (name.length < 1 || name.length > 40) {
      setDialogError('Zone name must be 1-40 characters.');
      return;
    }

    setSaving(true);
    setBusy(true);
    try {
      const floor = editingZone ? floors.find((f) => f.id === editingZone.floorId) : addingZone;
      if (editingZone) {
        await updateZone(editingZone.id, { name });
        setNotice(`Zone renamed to ${name}.`);
      } else if (floor) {
        await createZone(floor.id, { name });
        setNotice(`Zone ${name} added.`);
      }
      await refreshFloors(selectedFacility);
      closeAll();
    } catch (err) {
      setDialogError(spaceErrorMessage(err));
    } finally {
      setSaving(false);
      setBusy(false);
    }
  };

  const submitZoneStatus = async () => {
    if (!closingZone) return;
    setDialogError('');
    const reason = zoneStatusForm.reason.trim();
    if (zoneStatusForm.status === 'INACTIVE' && reason === '') {
      setDialogError('A reason is required when closing a zone.');
      return;
    }
    setSaving(true);
    setBusy(true);
    try {
      await changeZoneStatus(closingZone.id, {
        status: zoneStatusForm.status,
        ...(reason === '' ? {} : { reason }),
      });
      await refreshFloors(selectedFacility);
      setNotice(
        `Zone ${closingZone.name} is now ${ZONE_STATUS_LABELS[zoneStatusForm.status].toLowerCase()}.`,
      );
      closeAll();
    } catch (err) {
      setDialogError(spaceErrorMessage(err));
    } finally {
      setSaving(false);
      setBusy(false);
    }
  };

  const submitZoneDelete = async () => {
    if (!deletingZone) return;
    setDialogError('');
    setSaving(true);
    setBusy(true);
    try {
      await removeZone(deletingZone.id);
      await refreshFloors(selectedFacility);
      setNotice(`Zone ${deletingZone.name} and its spaces deleted.`);
      closeAll();
    } catch (err) {
      setDialogError(spaceErrorMessage(err));
    } finally {
      setSaving(false);
      setBusy(false);
    }
  };

  // --- Spaces ----------------------------------------------------------------

  const submitSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError('');
    const spaceNumber = spaceForm.spaceNumber.replace(/\s+/g, ' ').trim().toUpperCase();
    if (spaceNumber.length < 1 || spaceNumber.length > 20 || !/^[A-Z0-9][A-Z0-9_-]*$/.test(spaceNumber)) {
      setDialogError(
        'Space number must be 1-20 characters using only letters, digits, dashes or underscores.',
      );
      return;
    }

    setSaving(true);
    setBusy(true);
    try {
      if (editingSpace) {
        await updateSpace(editingSpace.id, {
          spaceNumber,
          type: spaceForm.type,
          reservable: spaceForm.reservable,
        });
        setNotice(`Space ${spaceNumber} updated.`);
      } else if (addingSpace) {
        await createSpace(addingSpace.id, {
          spaceNumber,
          type: spaceForm.type,
          reservable: spaceForm.reservable,
        });
        setNotice(`Space ${spaceNumber} added.`);
      }
      await refreshFloors(selectedFacility);
      closeAll();
    } catch (err) {
      setDialogError(spaceErrorMessage(err));
    } finally {
      setSaving(false);
      setBusy(false);
    }
  };

  const submitBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError('');
    const prefix = bulkForm.prefix.trim().toUpperCase();
    const start = Number(bulkForm.start);
    const count = Number(bulkForm.count);
    if (prefix.length > 12 || !/^[A-Z0-9-]*$/.test(prefix)) {
      setDialogError('Prefix must be at most 12 letters, digits or dashes.');
      return;
    }
    if (!Number.isInteger(start) || start < 0) {
      setDialogError('Start must be a whole number of 0 or more.');
      return;
    }
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      setDialogError('Count must be a whole number from 1 to 500.');
      return;
    }

    setSaving(true);
    setBusy(true);
    try {
      if (bulkAdding) {
        const created = await bulkCreateSpaces(bulkAdding.id, {
          prefix,
          start,
          count,
          type: bulkForm.type,
          reservable: bulkForm.reservable,
        });
        await refreshFloors(selectedFacility);
        setNotice(`${created.length} spaces added.`);
        closeAll();
      }
    } catch (err) {
      setDialogError(spaceErrorMessage(err));
    } finally {
      setSaving(false);
      setBusy(false);
    }
  };

  const submitSpaceStatus = async () => {
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
      await refreshFloors(selectedFacility);
      setNotice(
        `Space ${statusFor.spaceNumber} is now ${SPACE_STATUS_LABELS[statusForm.status].toLowerCase()}.`,
      );
      closeAll();
    } catch (err) {
      setDialogError(spaceErrorMessage(err));
    } finally {
      setSaving(false);
      setBusy(false);
    }
  };

  const submitSpaceDelete = async () => {
    if (!deletingSpace) return;
    setDialogError('');
    setSaving(true);
    setBusy(true);
    try {
      await removeSpace(deletingSpace.id);
      await refreshFloors(selectedFacility);
      setNotice(`Space ${deletingSpace.spaceNumber} deleted.`);
      closeAll();
    } catch (err) {
      setDialogError(spaceErrorMessage(err));
    } finally {
      setSaving(false);
      setBusy(false);
    }
  };

  // --- Render ----------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8a98b5]">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading spaces
      </div>
    );
  }

  const counts = selected?.spaceCounts;

  return (
    <div>
      <SectionHeader
        title="Space Management"
        subtitle="Configure floors, zones, and spaces. Capacity is derived from the spaces you add."
        action={
          <button
            type="button"
            className="pe-btn-outline"
            onClick={() => {
              setDialogError('');
              refreshFloors(selectedFacility).catch((err) => setError(spaceErrorMessage(err)));
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
          title="No facilities yet"
          message="Create a facility first, then come back to lay out its floors, zones and spaces."
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

          {counts && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
              <StatCard icon={<Layers size={18} />} label="Total" value={String(counts.total)} accent="blue" />
              <StatCard icon={<Check size={18} />} label="Available" value={String(counts.available)} accent="green" />
              <StatCard icon={<Building2 size={18} />} label="Occupied" value={String(counts.occupied)} accent="red" />
              <StatCard icon={<Clock size={18} />} label="Reserved" value={String(counts.reserved)} accent="amber" />
              <StatCard icon={<Edit size={18} />} label="Maintenance" value={String(counts.maintenance)} accent="cyan" />
              <StatCard icon={<X size={18} />} label="Blocked" value={String(counts.blocked)} accent="violet" />
            </div>
          )}

          <div className="pe-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Layout</h2>
              <button
                type="button"
                className="pe-btn-primary"
                onClick={openAddFloor}
              >
                <Plus size={16} /> Add Floor
              </button>
            </div>

            {floors.length === 0 ? (
              <p className="text-center text-[#8a98b5] py-10">
                No floors yet. Add one to start laying out this facility.
              </p>
            ) : (
              floors.map((floor) => (
                <FloorCard
                  key={floor.id}
                  floor={floor}
                  spaces={spaces.filter((s) => s.floorId === floor.id)}
                  busy={busy}
                  onEdit={() => {
                    setFloorForm({ name: floor.name, level: String(floor.level) });
                    openDialog(setEditingFloor, floor);
                  }}
                  onDelete={() => openDialog(setDeletingFloor, floor)}
                  onAddZone={openAddZone}
                  onEditZone={(zone) => {
                    setZoneForm({ name: zone.name });
                    openDialog(setEditingZone, zone);
                  }}
                  onToggleZone={(zone) => {
                    setZoneStatusForm({
                      status: zone.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                      reason: '',
                    });
                    openDialog(setClosingZone, zone);
                  }}
                  onDeleteZone={(zone) => openDialog(setDeletingZone, zone)}
                  onAddSpace={openAddSpace}
                  onBulkAdd={openBulkAdd}
                  onEditSpace={(space) => {
                    setSpaceForm({
                      spaceNumber: space.spaceNumber,
                      type: space.type,
                      reservable: space.reservable,
                    });
                    openDialog(setEditingSpace, space);
                  }}
                  onStatusSpace={(space) => {
                    setStatusForm({ status: space.status, reason: '' });
                    openDialog(setStatusFor, space);
                  }}
                  onDeleteSpace={(space) => openDialog(setDeletingSpace, space)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* --- Floor dialogs --- */}
      <Modal
        open={addingFloor || editingFloor !== null}
        onClose={() => {
          if (saving) return;
          closeAll();
        }}
        title={editingFloor ? 'Edit floor' : 'Add floor'}
        maxWidth="max-w-md"
      >
        <form onSubmit={submitFloor} className="space-y-3">
          <div>
            <label htmlFor="floor-name" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Name
            </label>
            <input
              id="floor-name"
              value={floorForm.name}
              onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
              className="pe-input"
              placeholder="Ground Floor"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="floor-level" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Level
            </label>
            <input
              id="floor-level"
              type="number"
              min={-20}
              max={200}
              value={floorForm.level}
              onChange={(e) => setFloorForm({ ...floorForm, level: e.target.value })}
              className="pe-input"
              autoComplete="off"
            />
            <p className="text-xs text-[#5a6a8a] mt-1">Use a negative level for a basement.</p>
          </div>
          {dialogError && (
            <p role="alert" className="text-xs text-[#fca5a5]">
              {dialogError}
            </p>
          )}
          <button type="submit" disabled={saving} className="pe-btn-primary w-full disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : editingFloor ? 'Save changes' : 'Add floor'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingFloor}
        title="Delete floor"
        message={`Delete floor ${deletingFloor?.name}? Its zones and spaces go with it. This cannot be undone.`}
        busy={saving}
        error={dialogError}
        onCancel={() => {
          if (!saving) closeAll();
        }}
        onConfirm={submitFloorDelete}
      />

      {/* --- Zone dialogs --- */}
      <Modal
        open={addingZone !== null || editingZone !== null}
        onClose={() => {
          if (saving) return;
          closeAll();
        }}
        title={editingZone ? 'Edit zone' : 'Add zone'}
        maxWidth="max-w-md"
      >
        <form onSubmit={submitZone} className="space-y-3">
          <div>
            <label htmlFor="zone-name" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Name
            </label>
            <input
              id="zone-name"
              value={zoneForm.name}
              onChange={(e) => setZoneForm({ name: e.target.value })}
              className="pe-input"
              placeholder="Zone A"
              autoComplete="off"
            />
          </div>
          {dialogError && (
            <p role="alert" className="text-xs text-[#fca5a5]">
              {dialogError}
            </p>
          )}
          <button type="submit" disabled={saving} className="pe-btn-primary w-full disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : editingZone ? 'Save changes' : 'Add zone'}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!closingZone}
        onClose={() => {
          if (saving) return;
          closeAll();
        }}
        title={zoneStatusForm.status === 'INACTIVE' ? 'Close zone' : 'Reopen zone'}
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <p className="text-sm text-[#8a98b5]">
            {zoneStatusForm.status === 'INACTIVE'
              ? `Closing ${closingZone?.name} blocks its open spaces. Reopening restores them.`
              : `Reopening ${closingZone?.name} restores its blocked spaces.`}
          </p>
          {zoneStatusForm.status === 'INACTIVE' && (
            <div>
              <label htmlFor="zone-reason" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Reason
              </label>
              <input
                id="zone-reason"
                value={zoneStatusForm.reason}
                onChange={(e) => setZoneStatusForm({ ...zoneStatusForm, reason: e.target.value })}
                className="pe-input"
                placeholder="Snow clearance"
                autoComplete="off"
              />
            </div>
          )}
          {dialogError && (
            <p role="alert" className="text-xs text-[#fca5a5]">
              {dialogError}
            </p>
          )}
          <button
            type="button"
            onClick={submitZoneStatus}
            disabled={saving}
            className="pe-btn-primary w-full disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : zoneStatusForm.status === 'INACTIVE' ? 'Close zone' : 'Reopen zone'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deletingZone}
        title="Delete zone"
        message={`Delete zone ${deletingZone?.name}? Its spaces go with it. This cannot be undone.`}
        busy={saving}
        error={dialogError}
        onCancel={() => {
          if (!saving) closeAll();
        }}
        onConfirm={submitZoneDelete}
      />

      {/* --- Space dialogs --- */}
      <Modal
        open={addingSpace !== null || editingSpace !== null}
        onClose={() => {
          if (saving) return;
          closeAll();
        }}
        title={editingSpace ? 'Edit space' : 'Add space'}
        maxWidth="max-w-md"
      >
        <form onSubmit={submitSpace} className="space-y-3">
          <div>
            <label htmlFor="space-number" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Space number
            </label>
            <input
              id="space-number"
              value={spaceForm.spaceNumber}
              onChange={(e) => setSpaceForm({ ...spaceForm, spaceNumber: e.target.value })}
              className="pe-input"
              placeholder="A-01"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="space-type" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Type
            </label>
            <select
              id="space-type"
              value={spaceForm.type}
              onChange={(e) => setSpaceForm({ ...spaceForm, type: e.target.value as SpaceType })}
              className="pe-input"
            >
              {SPACE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {SPACE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#8a98b5]">
            <input
              type="checkbox"
              checked={spaceForm.reservable}
              onChange={(e) => setSpaceForm({ ...spaceForm, reservable: e.target.checked })}
            />
            Reservable online
          </label>
          {dialogError && (
            <p role="alert" className="text-xs text-[#fca5a5]">
              {dialogError}
            </p>
          )}
          <button type="submit" disabled={saving} className="pe-btn-primary w-full disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : editingSpace ? 'Save changes' : 'Add space'}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!bulkAdding}
        onClose={() => {
          if (saving) return;
          closeAll();
        }}
        title="Add a run of spaces"
        maxWidth="max-w-md"
      >
        <form onSubmit={submitBulk} className="space-y-3">
          <p className="text-xs text-[#5a6a8a]">
            Generates a numbered run, such as A-01 through A-10, in one request.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="bulk-prefix" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Prefix
              </label>
              <input
                id="bulk-prefix"
                value={bulkForm.prefix}
                onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value })}
                className="pe-input"
                placeholder="A-"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="bulk-start" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Start
              </label>
              <input
                id="bulk-start"
                type="number"
                min={0}
                value={bulkForm.start}
                onChange={(e) => setBulkForm({ ...bulkForm, start: e.target.value })}
                className="pe-input"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="bulk-count" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Count
              </label>
              <input
                id="bulk-count"
                type="number"
                min={1}
                max={500}
                value={bulkForm.count}
                onChange={(e) => setBulkForm({ ...bulkForm, count: e.target.value })}
                className="pe-input"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label htmlFor="bulk-type" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Type
            </label>
            <select
              id="bulk-type"
              value={bulkForm.type}
              onChange={(e) => setBulkForm({ ...bulkForm, type: e.target.value as SpaceType })}
              className="pe-input"
            >
              {SPACE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {SPACE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#8a98b5]">
            <input
              type="checkbox"
              checked={bulkForm.reservable}
              onChange={(e) => setBulkForm({ ...bulkForm, reservable: e.target.checked })}
            />
            Reservable online
          </label>
          {dialogError && (
            <p role="alert" className="text-xs text-[#fca5a5]">
              {dialogError}
            </p>
          )}
          <button type="submit" disabled={saving} className="pe-btn-primary w-full disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Add spaces'}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!statusFor}
        onClose={() => {
          if (saving) return;
          closeAll();
        }}
        title="Change space status"
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <p className="text-sm text-[#8a98b5]">
            Space {statusFor?.spaceNumber} is currently {statusFor && SPACE_STATUS_LABELS[statusFor.status].toLowerCase()}.
          </p>
          <div>
            <label htmlFor="space-status" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Status
            </label>
            <select
              id="space-status"
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as SpaceStatus })}
              className="pe-input"
            >
              {SETTABLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {SPACE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#5a6a8a] mt-1">
              Occupied and reserved are set by the reservation engine.
            </p>
          </div>
          <div>
            <label htmlFor="space-status-reason" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Reason (optional)
            </label>
            <input
              id="space-status-reason"
              value={statusForm.reason}
              onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
              className="pe-input"
              placeholder="Bollard broken"
              autoComplete="off"
            />
          </div>
          {dialogError && (
            <p role="alert" className="text-xs text-[#fca5a5]">
              {dialogError}
            </p>
          )}
          <button
            type="button"
            onClick={submitSpaceStatus}
            disabled={saving}
            className="pe-btn-primary w-full disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save status'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deletingSpace}
        title="Delete space"
        message={`Delete space ${deletingSpace?.spaceNumber}? The facility's capacity falls by one.`}
        busy={saving}
        error={dialogError}
        onCancel={() => {
          if (!saving) closeAll();
        }}
        onConfirm={submitSpaceDelete}
      />
    </div>
  );
}

/** Small confirmation dialog, shared by every delete in this page. */
function ConfirmDialog({
  open,
  title,
  message,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-md">
      <div className="space-y-3">
        <p className="text-sm text-[#8a98b5]">{message}</p>
        {error && (
          <p role="alert" className="text-xs text-[#fca5a5]">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="pe-btn-outline flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="pe-btn-primary flex-1 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FloorCard({
  floor,
  spaces,
  busy,
  onEdit,
  onDelete,
  onAddZone,
  onEditZone,
  onToggleZone,
  onDeleteZone,
  onAddSpace,
  onBulkAdd,
  onEditSpace,
  onStatusSpace,
  onDeleteSpace,
}: {
  floor: Floor;
  spaces: Space[];
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddZone: (floor: Floor) => void;
  onEditZone: (zone: Zone) => void;
  onToggleZone: (zone: Zone) => void;
  onDeleteZone: (zone: Zone) => void;
  onAddSpace: (zone: Zone) => void;
  onBulkAdd: (zone: Zone) => void;
  onEditSpace: (space: Space) => void;
  onStatusSpace: (space: Space) => void;
  onDeleteSpace: (space: Space) => void;
}) {
  const byZone = useMemo(() => {
    const grouped = new Map<string, Space[]>();
    for (const space of spaces) {
      const bucket = grouped.get(space.zoneId);
      if (bucket) bucket.push(space);
      else grouped.set(space.zoneId, [space]);
    }
    return grouped;
  }, [spaces]);

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-[#8a98b5]">
          {floor.name} <span className="text-[#5a6a8a]">· level {floor.level}</span>
        </p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onAddZone(floor)} className="text-xs text-[#3b82f6] hover:underline" disabled={busy}>
            + Add zone
          </button>
          <button type="button" onClick={onEdit} className="text-xs text-[#3b82f6] hover:underline" disabled={busy}>
            Rename
          </button>
          <button type="button" onClick={onDelete} className="text-xs text-[#ef4444] hover:underline" disabled={busy}>
            Delete
          </button>
        </div>
      </div>

      {floor.zones.length === 0 ? (
        <p className="text-xs text-[#5a6a8a] py-2">No zones on this floor yet.</p>
      ) : (
        floor.zones.map((zone) => (
          <div key={zone.id} className="bg-[#0b1220] rounded-lg p-3 mb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{zone.name}</p>
                <Badge color={zone.status === 'ACTIVE' ? 'green' : 'gray'}>
                  {ZONE_STATUS_LABELS[zone.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => onAddSpace(zone)} className="text-xs text-[#3b82f6] hover:underline" disabled={busy}>
                  + Space
                </button>
                <button type="button" onClick={() => onBulkAdd(zone)} className="text-xs text-[#3b82f6] hover:underline" disabled={busy}>
                  + Run
                </button>
                <button type="button" onClick={() => onEditZone(zone)} className="text-xs text-[#3b82f6] hover:underline" disabled={busy}>
                  Rename
                </button>
                <button type="button" onClick={() => onToggleZone(zone)} className="text-xs text-[#f59e0b] hover:underline" disabled={busy}>
                  {zone.status === 'ACTIVE' ? 'Close' : 'Reopen'}
                </button>
                <button type="button" onClick={() => onDeleteZone(zone)} className="text-xs text-[#ef4444] hover:underline" disabled={busy}>
                  Delete
                </button>
              </div>
            </div>
            {zone.closeReason && (
              <p className="text-xs text-[#5a6a8a] mb-2">Reason: {zone.closeReason}</p>
            )}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {(byZone.get(zone.id) ?? []).map((space) => (
                <SpaceTile
                  key={space.id}
                  space={space}
                  busy={busy}
                  onEdit={() => onEditSpace(space)}
                  onStatus={() => onStatusSpace(space)}
                  onDelete={() => onDeleteSpace(space)}
                />
              ))}
            </div>
            {(byZone.get(zone.id) ?? []).length === 0 && (
              <p className="text-xs text-[#5a6a8a] py-1">No spaces in this zone yet.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function SpaceTile({
  space,
  busy,
  onEdit,
  onStatus,
  onDelete,
}: {
  space: Space;
  busy: boolean;
  onEdit: () => void;
  onStatus: () => void;
  onDelete: () => void;
}) {
  const statusClass: Record<SpaceStatus, string> = {
    AVAILABLE: 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]',
    OCCUPIED: 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]',
    RESERVED: 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]',
    MAINTENANCE: 'bg-[#2a3a5c] border-[#3a4a6c] text-[#8a98b5]',
    BLOCKED: 'bg-[#2a3a5c] border-[#3a4a6c] text-[#8a98b5]',
  };

  return (
    <div
      className={`rounded-lg border p-2 text-center text-xs font-semibold ${statusClass[space.status]}`}
    >
      {space.spaceNumber}
      <p className="text-[9px] mt-0.5 capitalize">
        {SPACE_TYPE_LABELS[space.type]}
      </p>
      <div className="flex justify-center gap-1 mt-1">
        <button type="button" onClick={onStatus} title="Change status" disabled={busy} className="hover:opacity-70">
          <Check size={11} />
        </button>
        <button type="button" onClick={onEdit} title="Edit" disabled={busy} className="hover:opacity-70">
          <Edit size={11} />
        </button>
        <button type="button" onClick={onDelete} title="Delete" disabled={busy} className="hover:opacity-70">
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
