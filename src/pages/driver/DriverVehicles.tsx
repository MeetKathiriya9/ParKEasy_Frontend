import { useEffect, useState } from 'react';
import { SectionHeader, Badge, Modal } from '@/components/ui';
import { ApiError } from '@/lib/api';
import {
  FUEL_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
  createVehicle,
  fetchVehicles,
  normalizeRegistration,
  registrationIsValid,
  removeVehicle,
  setDefaultVehicle,
  updateVehicle,
} from '@/lib/vehicles';
import type { FuelType, Vehicle, VehicleType } from '@/types';
import {
  AlertCircle, Car, Check, Edit, Loader2, Plus, RefreshCw, Star, Trash2, Zap,
} from 'lucide-react';

interface FormState {
  registrationNumber: string;
  type: VehicleType;
  model: string;
  fuelType: FuelType;
}

const EMPTY_FORM: FormState = { registrationNumber: '', type: 'sedan', model: '', fuelType: 'petrol' };

/** Turns a vehicle API failure into something worth showing the user. */
function vehicleErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'REGISTRATION_DUPLICATE') {
      return 'You already have a vehicle with that registration number.';
    }
    if (err.code === 'VEHICLE_LIMIT_REACHED') return err.message;
    if (err.status === 401) return 'Your session has expired. Sign in again to manage vehicles.';
    if (err.status === 429) {
      return 'Too many changes for now. Wait a minute and try again.';
    }
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

export function DriverVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // One dialog at a time: add, edit an existing vehicle, or confirm a delete.
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async (): Promise<Vehicle[]> => {
    const list = await fetchVehicles();
    setVehicles(list);
    setError('');
    return list;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchVehicles();
        if (!cancelled) setVehicles(list);
      } catch (err) {
        if (!cancelled) setError(vehicleErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setNotice('');
    setAdding(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setForm({
      registrationNumber: vehicle.registrationNumber,
      type: vehicle.type,
      model: vehicle.model,
      fuelType: vehicle.fuelType,
    });
    setFormError('');
    setNotice('');
    setEditing(vehicle);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const registrationNumber = normalizeRegistration(form.registrationNumber);
    const model = form.model.trim();
    if (registrationNumber === '') {
      setFormError('Enter the registration number.');
      return;
    }
    if (!registrationIsValid(registrationNumber)) {
      setFormError('A registration number is 2-20 letters and digits.');
      return;
    }
    if (model.length < 2) {
      setFormError('Enter the make and model, e.g. "Honda Civic".');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const updated = await updateVehicle(editing.id, {
          registrationNumber,
          type: form.type,
          model,
          fuelType: form.fuelType,
        });
        setVehicles((list) => list.map((v) => (v.id === updated.id ? updated : v)));
        setEditing(null);
        setNotice('Vehicle updated.');
      } else {
        const created = await createVehicle({
          registrationNumber,
          type: form.type,
          model,
          fuelType: form.fuelType,
        });
        setVehicles((list) => [...list, created]);
        setAdding(false);
        setNotice(created.isDefault ? 'Vehicle added and set as your default.' : 'Vehicle added.');
      }
    } catch (err) {
      setFormError(vehicleErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (vehicle: Vehicle) => {
    setNotice('');
    setError('');
    setBusyId(vehicle.id);
    try {
      await setDefaultVehicle(vehicle.id);
      // The response carries only the promoted vehicle, so re-read the list to
      // see the one that was demoted.
      await refresh();
      setNotice(`${vehicle.model} is now your default vehicle.`);
    } catch (err) {
      setError(vehicleErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDialogError('');
    setBusyId(deleting.id);
    try {
      await removeVehicle(deleting.id);
      // Deleting the default promotes another vehicle, which only the server
      // knows about - re-read so the new flag is shown.
      await refresh();
      setDeleting(null);
      setNotice('Vehicle removed.');
    } catch (err) {
      setDialogError(vehicleErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError('');
    try {
      await refresh();
    } catch (err) {
      setError(vehicleErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const dialogOpen = adding || editing !== null;

  return (
    <div>
      <SectionHeader
        title="My Vehicles"
        subtitle="Register the vehicles you park so reservations can name them"
        action={
          <button type="button" onClick={openAdd} className="pe-btn-primary">
            <Plus size={16} /> Add Vehicle
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

      {loading ? (
        <div className="pe-card p-10 flex items-center justify-center gap-2 text-sm text-[#8a98b5]">
          <Loader2 size={16} className="animate-spin" />
          Loading your vehicles
        </div>
      ) : vehicles.length === 0 && !error ? (
        <div className="pe-card p-10 text-center">
          <Car size={32} className="mx-auto text-[#5a6a8a] mb-2" />
          <p className="text-[#8a98b5] mb-3">You have not registered a vehicle yet.</p>
          <button type="button" onClick={openAdd} className="pe-btn-primary">
            <Plus size={16} /> Add your first vehicle
          </button>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="pe-card p-10 text-center">
          <button type="button" onClick={handleRetry} className="pe-btn-outline">
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="pe-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      v.isEV ? 'bg-[#06b6d4]/15 text-[#06b6d4]' : 'bg-[#2563eb]/15 text-[#3b82f6]'
                    }`}
                  >
                    <Car size={24} />
                  </div>
                  <div>
                    <p className="font-semibold">{v.model}</p>
                    <p className="text-sm text-[#8a98b5]">
                      {VEHICLE_TYPE_LABELS[v.type]} · {FUEL_TYPE_LABELS[v.fuelType]}
                    </p>
                  </div>
                </div>
                {v.isDefault && (
                  <Badge color="amber">
                    <Star size={10} fill="currentColor" /> Default
                  </Badge>
                )}
              </div>

              <div className="bg-[#0b1220] rounded-lg p-3 mb-3">
                <p className="text-xs text-[#8a98b5] mb-1">Registration number</p>
                <p className="font-mono font-bold text-lg tracking-wider">{v.registrationNumber}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {v.isEV && (
                  <Badge color="cyan">
                    <Zap size={10} /> EV
                  </Badge>
                )}
                {!v.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(v)}
                    disabled={busyId === v.id}
                    className="pe-btn-outline text-sm disabled:opacity-60"
                  >
                    {busyId === v.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Star size={14} />
                    )}
                    Make default
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(v)}
                  className="pe-btn-outline flex-1 text-sm"
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleting(v);
                    setDialogError('');
                  }}
                  className="pe-btn-ghost text-sm text-[#ef4444]"
                  aria-label={`Remove ${v.model}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit */}
      <Modal
        open={dialogOpen}
        onClose={() => {
          if (saving) return;
          setAdding(false);
          setEditing(null);
        }}
        title={editing ? 'Edit vehicle' : 'Add vehicle'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="vehicle-plate" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Registration number
            </label>
            <input
              id="vehicle-plate"
              type="text"
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              placeholder="ABC-1234"
              maxLength={20}
              className="pe-input font-mono uppercase"
              autoComplete="off"
            />
            <p className="text-xs text-[#5a6a8a] mt-1.5">
              Spaces and dashes are ignored, so ABC-1234 and abc1234 are the same plate.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vehicle-type" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Type
              </label>
              <select
                id="vehicle-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })}
                className="pe-input"
              >
                {(Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map((type) => (
                  <option key={type} value={type}>
                    {VEHICLE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="vehicle-fuel" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Fuel
              </label>
              <select
                id="vehicle-fuel"
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value as FuelType })}
                className="pe-input"
              >
                {(Object.keys(FUEL_TYPE_LABELS) as FuelType[]).map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {FUEL_TYPE_LABELS[fuel]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="vehicle-model" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Make and model
            </label>
            <input
              id="vehicle-model"
              type="text"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="Honda Civic"
              maxLength={80}
              className="pe-input"
            />
          </div>

          <p className="text-xs text-[#5a6a8a] flex items-center gap-1.5">
            <Zap size={13} className="text-[#06b6d4]" />
            Choosing Electric marks the vehicle as EV-compatible automatically.
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
                <Loader2 size={16} className="animate-spin" />
                Saving
              </>
            ) : editing ? (
              'Save changes'
            ) : (
              'Add vehicle'
            )}
          </button>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleting !== null}
        onClose={() => {
          if (busyId !== null) return;
          setDeleting(null);
        }}
        title="Remove vehicle"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#8a98b5]">
            Remove <span className="text-[#e8edf5] font-semibold">{deleting?.model}</span> (
            <span className="font-mono">{deleting?.registrationNumber}</span>) from your vehicles? This
            cannot be undone.
          </p>
          {dialogError && (
            <div
              role="alert"
              className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]"
            >
              {dialogError}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              disabled={busyId !== null}
              className="pe-btn-outline flex-1 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busyId !== null}
              className="pe-btn-primary flex-1 bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-60"
            >
              {busyId !== null ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Remove
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
