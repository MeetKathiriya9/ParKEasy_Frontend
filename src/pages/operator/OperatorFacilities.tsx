import { useEffect, useRef, useState } from 'react';
import { SectionHeader, Badge, Modal } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { ApiError } from '@/lib/api';
import {
  AMENITY_LABELS,
  FACILITY_STATUS_COLORS,
  FACILITY_STATUS_LABELS,
  changeFacilityStatus,
  collapseWhitespace,
  createFacility,
  facilityHoursAreValid,
  fetchFacilities,
  rateIsValid,
  removeFacility,
  updateFacility,
} from '@/lib/facilities';
import { DEFAULT_CENTER, reverseGeocode } from '@/lib/geo';
import type { Amenity, Facility, FacilityStatus, FacilityUpdateInput } from '@/types';
import {
  AlertCircle, Building2, Check, Clock, Edit, Loader2, MapPin, Plus, Power, RefreshCw, Trash2,
} from 'lucide-react';

const STATUSES: FacilityStatus[] = ['ACTIVE', 'INACTIVE', 'TEMPORARILY_CLOSED', 'MAINTENANCE'];
const AMENITIES = Object.keys(AMENITY_LABELS) as Amenity[];

interface FormState {
  name: string;
  description: string;
  address: string;
  city: string;
  lat: string;
  lng: string;
  open24h: boolean;
  openingTime: string;
  closingTime: string;
  amenities: Amenity[];
  hourlyRate: string;
  dailyMax: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  address: '',
  city: '',
  lat: '',
  lng: '',
  open24h: false,
  openingTime: '08:00',
  closingTime: '22:00',
  amenities: [],
  hourlyRate: '',
  dailyMax: '',
};

/** Turns a facility API failure into something worth showing the user. */
function facilityErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return 'Your session has expired. Sign in again to manage facilities.';
    }
    if (err.status === 403) return 'You do not have access to manage this facility.';
    if (err.status === 429) {
      return 'Too many changes for now. Wait a while and try again.';
    }
    if (err.code === 'FACILITY_LIMIT_REACHED') return err.message;
    if (err.code === 'FACILITY_IN_USE') {
      const d = err.details;
      if (d && typeof d === 'object' && !Array.isArray(d)) {
        const { reservations, sessions } = d as { reservations?: number; sessions?: number };
        if (typeof reservations === 'number' && typeof sessions === 'number') {
          return `${reservations} reservation(s) and ${sessions} session(s) still reference this facility, so it cannot be deleted.`;
        }
      }
      return err.message;
    }
    if (err.status === 422) {
      const d = err.details;
      if (Array.isArray(d)) {
        const first = d.find(
          (x): x is { msg: string } =>
            typeof x === 'object' && x !== null && typeof (x as { msg?: unknown }).msg === 'string',
        );
        if (first) return first.msg.replace(/^Value error, /, '');
      }
      return err.message;
    }
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

export function OperatorFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // One dialog at a time: add, edit, change status, or confirm a delete.
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [statusFor, setStatusFor] = useState<Facility | null>(null);
  const [deleting, setDeleting] = useState<Facility | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [statusForm, setStatusForm] = useState<{ status: FacilityStatus; reason: string }>({
    status: 'ACTIVE',
    reason: '',
  });
  const [formError, setFormError] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Map view for the location picker; the pin itself always follows `form`.
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [geocoding, setGeocoding] = useState(false);
  // Reverse lookups are best-effort: a newer pick cancels the one in flight.
  const geocodeRef = useRef<AbortController | null>(null);
  useEffect(() => () => geocodeRef.current?.abort(), []);

  const pickedLat = form.lat.trim() === '' ? null : Number(form.lat);
  const pickedLng = form.lng.trim() === '' ? null : Number(form.lng);
  const pickerLat = pickedLat !== null && Number.isFinite(pickedLat) ? pickedLat : null;
  const pickerLng = pickedLng !== null && Number.isFinite(pickedLng) ? pickedLng : null;

  const refresh = async (): Promise<Facility[]> => {
    const list = await fetchFacilities();
    setFacilities(list);
    setError('');
    return list;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchFacilities();
        if (!cancelled) setFacilities(list);
      } catch (err) {
        if (!cancelled) setError(facilityErrorMessage(err));
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
    // Fallback view only; `LocationPicker` re-centres on the visitor's current
    // position on open when it has no pin yet.
    setMapCenter(DEFAULT_CENTER);
  };

  const openEdit = (facility: Facility) => {
    setForm({
      name: facility.name,
      description: facility.description ?? '',
      address: facility.address,
      city: facility.city ?? '',
      lat: facility.lat === null ? '' : String(facility.lat),
      lng: facility.lng === null ? '' : String(facility.lng),
      open24h: facility.open24h,
      openingTime: facility.openingTime ?? '08:00',
      closingTime: facility.closingTime ?? '22:00',
      amenities: [...facility.amenities],
      hourlyRate:
        facility.hourlyRate === null || facility.hourlyRate === undefined
          ? ''
          : String(facility.hourlyRate),
      dailyMax:
        facility.dailyMax === null || facility.dailyMax === undefined
          ? ''
          : String(facility.dailyMax),
    });
    setFormError('');
    setNotice('');
    setEditing(facility);
    setMapCenter(
      facility.lat !== null && facility.lng !== null
        ? [facility.lat, facility.lng]
        : DEFAULT_CENTER,
    );
  };

  /**
   * A map click or pin drag: store the coordinates, then fill any still-empty
   * address fields from the reverse lookup so typed text is never clobbered.
   */
  const handlePick = (lat: number, lng: number) => {
    const fillAddress = form.address.trim() === '';
    const fillCity = form.city.trim() === '';
    setForm((f) => ({ ...f, lat: String(lat), lng: String(lng) }));

    if (!fillAddress && !fillCity) return;
    geocodeRef.current?.abort();
    const controller = new AbortController();
    geocodeRef.current = controller;
    setGeocoding(true);
    reverseGeocode(lat, lng, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result) {
          setForm((f) => ({
            ...f,
            address: fillAddress && result.address ? result.address : f.address,
            city: fillCity && result.city ? result.city : f.city,
          }));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setGeocoding(false);
      });
  };

  const toggleAmenity = (amenity: Amenity) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(amenity)
        ? f.amenities.filter((a) => a !== amenity)
        : [...f.amenities, amenity],
    }));
  };

  /** Shared pre-flight checks; messages match the server's field limits. */
  const validateForm = (): { values: ReturnType<typeof parseForm> | null; error: string } => {
    const name = collapseWhitespace(form.name);
    const address = collapseWhitespace(form.address);
    const city = collapseWhitespace(form.city);
    const description = form.description.trim();
    const lat = Number(form.lat);
    const lng = Number(form.lng);

    if (name.length < 3 || name.length > 80) {
      return { values: null, error: 'Name must be 3-80 characters.' };
    }
    if (address.length < 3 || address.length > 200) {
      return { values: null, error: 'Address must be 3-200 characters.' };
    }
    if (city.length > 80) return { values: null, error: 'City must be 80 characters or fewer.' };
    if (description.length > 500) {
      return { values: null, error: 'Description must be 500 characters or fewer.' };
    }
    if (form.lat.trim() === '' || form.lng.trim() === '' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { values: null, error: 'Enter both latitude and longitude as numbers.' };
    }
    if (lat < -90 || lat > 90) return { values: null, error: 'Latitude must be between -90 and 90.' };
    if (lng < -180 || lng > 180) {
      return { values: null, error: 'Longitude must be between -180 and 180.' };
    }
    if (!facilityHoursAreValid(form.open24h, form.openingTime, form.closingTime)) {
      return {
        values: null,
        error: 'Opening and closing times are required unless the facility is open 24 hours, and they must differ.',
      };
    }
    if (!rateIsValid(form.hourlyRate) || !rateIsValid(form.dailyMax)) {
      return { values: null, error: 'Rates must be numbers greater than 0 and at most 10000.' };
    }

    return { values: parseForm(form, { name, address, city, description, lat, lng }), error: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const { values, error: validationError } = validateForm();
    if (!values) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const updated = await updateFacility(editing.id, values.update);
        setFacilities((list) => list.map((f) => (f.id === updated.id ? updated : f)));
        setEditing(null);
        setNotice(`${updated.name} updated.`);
      } else {
        const created = await createFacility(values.create);
        setFacilities((list) => [...list, created]);
        setAdding(false);
        setNotice(`${created.name} added.`);
      }
    } catch (err) {
      setFormError(facilityErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openStatusChange = (facility: Facility) => {
    setStatusForm({
      status: STATUSES.find((s) => s !== facility.status) ?? 'ACTIVE',
      reason: '',
    });
    setDialogError('');
    setNotice('');
    setStatusFor(facility);
  };

  const handleStatusChange = async () => {
    if (!statusFor) return;
    setDialogError('');
    if (statusForm.status === statusFor.status) {
      setDialogError('Pick a different status.');
      return;
    }
    // DOC section 11: closing and reopening carry a reason.
    const reason = statusForm.reason.trim();
    if (statusFor.status === 'ACTIVE' && reason === '') {
      setDialogError('A reason is required when moving a facility out of active service.');
      return;
    }
    setBusyId(statusFor.id);
    try {
      const updated = await changeFacilityStatus(statusFor.id, {
        status: statusForm.status,
        ...(reason === '' ? {} : { reason }),
      });
      setFacilities((list) => list.map((f) => (f.id === updated.id ? updated : f)));
      setStatusFor(null);
      setNotice(`${updated.name} is now ${FACILITY_STATUS_LABELS[updated.status].toLowerCase()}.`);
    } catch (err) {
      setDialogError(facilityErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDialogError('');
    setBusyId(deleting.id);
    try {
      await removeFacility(deleting.id);
      setFacilities((list) => list.filter((f) => f.id !== deleting.id));
      setDeleting(null);
      setNotice(`${deleting.name} deleted.`);
    } catch (err) {
      setDialogError(facilityErrorMessage(err));
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
      setError(facilityErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const dialogOpen = adding || editing !== null;

  return (
    <div>
      <SectionHeader
        title="My Facilities"
        subtitle="Add the parking facilities you operate and keep their details current"
        action={
          <button type="button" onClick={openAdd} className="pe-btn-primary">
            <Plus size={16} /> Add Facility
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
          Loading your facilities
        </div>
      ) : facilities.length === 0 && !error ? (
        <div className="pe-card p-10 text-center">
          <Building2 size={32} className="mx-auto text-[#5a6a8a] mb-2" />
          <p className="text-[#8a98b5] mb-3">You have not added a facility yet.</p>
          <button type="button" onClick={openAdd} className="pe-btn-primary">
            <Plus size={16} /> Add your first facility
          </button>
        </div>
      ) : facilities.length === 0 ? (
        <div className="pe-card p-10 text-center">
          <button type="button" onClick={handleRetry} className="pe-btn-outline">
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {facilities.map((f) => (
            <div key={f.id} className="pe-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#2563eb]/15 text-[#3b82f6] flex items-center justify-center flex-shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{f.name}</p>
                    <p className="text-sm text-[#8a98b5] flex items-center gap-1 truncate">
                      <MapPin size={12} className="flex-shrink-0" />
                      {f.address}
                      {f.city ? `, ${f.city}` : ''}
                    </p>
                  </div>
                </div>
                <Badge color={FACILITY_STATUS_COLORS[f.status]}>{FACILITY_STATUS_LABELS[f.status]}</Badge>
              </div>

              <div className="bg-[#0b1220] rounded-lg p-3 mb-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-[#8a98b5] mb-0.5">Capacity</p>
                  <p className="font-semibold">{f.capacity} spaces</p>
                </div>
                <div>
                  <p className="text-xs text-[#8a98b5] mb-0.5">Hours</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Clock size={12} />
                    {f.open24h ? 'Open 24 hours' : `${f.openingTime} - ${f.closingTime}`}
                  </p>
                </div>
                {(f.hourlyRate !== null && f.hourlyRate !== undefined) && (
                  <div>
                    <p className="text-xs text-[#8a98b5] mb-0.5">Hourly rate</p>
                    <p className="font-semibold">${f.hourlyRate}</p>
                  </div>
                )}
                {(f.dailyMax !== null && f.dailyMax !== undefined) && (
                  <div>
                    <p className="text-xs text-[#8a98b5] mb-0.5">Daily max</p>
                    <p className="font-semibold">${f.dailyMax}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {f.isOpenNow && <Badge color="green">Open now</Badge>}
                {f.amenities.map((a) => (
                  <Badge key={a} color="cyan">
                    {AMENITY_LABELS[a]}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(f)}
                  className="pe-btn-outline flex-1 text-sm"
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => openStatusChange(f)}
                  className="pe-btn-outline flex-1 text-sm"
                  disabled={busyId === f.id}
                >
                  <Power size={14} /> Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleting(f);
                    setDialogError('');
                  }}
                  className="pe-btn-ghost text-sm text-[#ef4444]"
                  aria-label={`Delete ${f.name}`}
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
        title={editing ? 'Edit facility' : 'Add facility'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="facility-name" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Name
            </label>
            <input
              id="facility-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Central Plaza Parking"
              maxLength={80}
              className="pe-input"
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="facility-address" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Street address
            </label>
            <input
              id="facility-address"
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main Street"
              maxLength={200}
              className="pe-input"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Location on map
            </label>
            <LocationPicker
              lat={pickerLat}
              lng={pickerLng}
              center={mapCenter}
              onPick={handlePick}
            />
            {geocoding && (
              <p className="text-xs text-[#5a6a8a] mt-1.5 flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                Looking up the address for this spot
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="facility-city" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                City
              </label>
              <input
                id="facility-city"
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ahmedabad"
                maxLength={80}
                className="pe-input"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="facility-lat" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Latitude
              </label>
              <input
                id="facility-lat"
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                placeholder="Set from the map"
                className="pe-input"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="facility-lng" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Longitude
              </label>
              <input
                id="facility-lng"
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                placeholder="Set from the map"
                className="pe-input"
                autoComplete="off"
              />
            </div>
          </div>
          <p className="text-xs text-[#5a6a8a]">
            The map and these fields stay in sync - click the map to fill them, or type to move the pin.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="facility-hourly" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Hourly rate
              </label>
              <input
                id="facility-hourly"
                type="number"
                step="0.01"
                min={0}
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                placeholder="Optional"
                className="pe-input"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="facility-daily" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Daily max
              </label>
              <input
                id="facility-daily"
                type="number"
                step="0.01"
                min={0}
                value={form.dailyMax}
                onChange={(e) => setForm({ ...form, dailyMax: e.target.value })}
                placeholder="Optional"
                className="pe-input"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="facility-24h"
              type="checkbox"
              checked={form.open24h}
              onChange={(e) => setForm({ ...form, open24h: e.target.checked })}
              className="accent-[#2563eb]"
            />
            <label htmlFor="facility-24h" className="text-sm text-[#8a98b5]">
              Open 24 hours
            </label>
          </div>

          {!form.open24h && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="facility-open" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                  Opening time
                </label>
                <input
                  id="facility-open"
                  type="time"
                  value={form.openingTime}
                  onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                  className="pe-input"
                />
              </div>
              <div>
                <label htmlFor="facility-close" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                  Closing time
                </label>
                <input
                  id="facility-close"
                  type="time"
                  value={form.closingTime}
                  onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                  className="pe-input"
                />
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-[#8a98b5] font-medium mb-1.5">Amenities</p>
            <div className="flex flex-wrap gap-1.5">
              {AMENITIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={form.amenities.includes(a) ? 'pe-chip-active' : 'pe-chip-idle'}
                >
                  {AMENITY_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="facility-description" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Description
            </label>
            <textarea
              id="facility-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional notes shown with the facility"
              maxLength={500}
              rows={3}
              className="pe-input resize-y"
            />
          </div>

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
              'Add facility'
            )}
          </button>
        </form>
      </Modal>

      {/* Status change */}
      <Modal
        open={statusFor !== null}
        onClose={() => {
          if (busyId !== null) return;
          setStatusFor(null);
        }}
        title="Change status"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#8a98b5]">
            <span className="text-[#e8edf5] font-semibold">{statusFor?.name}</span> is currently{' '}
            <span className="font-medium">
              {statusFor ? FACILITY_STATUS_LABELS[statusFor.status] : ''}
            </span>
            .
          </p>
          <div>
            <label htmlFor="facility-new-status" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              New status
            </label>
            <select
              id="facility-new-status"
              value={statusForm.status}
              onChange={(e) =>
                setStatusForm({ ...statusForm, status: e.target.value as FacilityStatus })
              }
              className="pe-input"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {FACILITY_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="facility-status-reason" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Reason {statusFor?.status === 'ACTIVE' ? '(required)' : '(optional)'}
            </label>
            <textarea
              id="facility-status-reason"
              value={statusForm.reason}
              onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
              placeholder="e.g. resurfacing until further notice"
              maxLength={200}
              rows={2}
              className="pe-input resize-y"
            />
          </div>
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
              onClick={() => setStatusFor(null)}
              disabled={busyId !== null}
              className="pe-btn-outline flex-1 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStatusChange}
              disabled={busyId !== null}
              className="pe-btn-primary flex-1 disabled:opacity-60"
            >
              {busyId !== null ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
              Apply
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleting !== null}
        onClose={() => {
          if (busyId !== null) return;
          setDeleting(null);
        }}
        title="Delete facility"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#8a98b5]">
            Delete <span className="text-[#e8edf5] font-semibold">{deleting?.name}</span>? This
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
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Builds the wire payloads from a validated form. Capacity is derived from
 * the facility's spaces, so it is never part of either payload. */
function parseForm(
  form: FormState,
  v: { name: string; address: string; city: string; description: string; lat: number; lng: number },
): { create: Parameters<typeof createFacility>[0]; update: FacilityUpdateInput } {
  const common = {
    name: v.name,
    address: v.address,
    lat: v.lat,
    lng: v.lng,
    open24h: form.open24h,
    amenities: form.amenities,
  };
  return {
    create: {
      ...common,
      ...(v.city === '' ? {} : { city: v.city }),
      ...(v.description === '' ? {} : { description: v.description }),
      ...(form.open24h
        ? {}
        : { openingTime: form.openingTime, closingTime: form.closingTime }),
      ...(form.hourlyRate === '' ? {} : { hourlyRate: Number(form.hourlyRate) }),
      ...(form.dailyMax === '' ? {} : { dailyMax: Number(form.dailyMax) }),
    },
    update: {
      ...common,
      city: v.city === '' ? null : v.city,
      description: v.description === '' ? null : v.description,
      openingTime: form.open24h ? null : form.openingTime,
      closingTime: form.open24h ? null : form.closingTime,
      hourlyRate: form.hourlyRate === '' ? null : Number(form.hourlyRate),
      dailyMax: form.dailyMax === '' ? null : Number(form.dailyMax),
    },
  };
}
