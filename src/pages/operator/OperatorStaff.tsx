import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionHeader, Badge, Modal } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { ApiError } from '@/lib/api';
import { fetchFacilities } from '@/lib/facilities';
import {
  ASSIGNMENT_STATUS_LABELS,
  STAFF_STATUS_COLORS,
  STAFF_STATUS_LABELS,
  assignStaffFacility,
  changeStaffStatus,
  collapseStaffName,
  createStaffMember,
  facilitySummaryLabel,
  fetchStaff,
  fetchStaffMember,
  staffPasswordIsValid,
  unassignStaffFacility,
  updateStaffMember,
} from '@/lib/staff';
import type {
  Facility,
  StaffAssignment,
  StaffDetail,
  StaffStatus,
  StaffSummary,
} from '@/types';
import {
  AlertCircle, CalendarOff, Check, Edit, History, Loader2, Plus, RefreshCw, Search,
  UserCheck, Users, UserX,
} from 'lucide-react';

type StatusFilter = 'ALL' | StaffStatus;

interface CreateForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  operatorId: string;
  facilityIds: string[];
}

const EMPTY_CREATE: CreateForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  operatorId: '',
  facilityIds: [],
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Turns a staff API failure into something worth showing the user. */
function staffErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Your session has expired. Sign in again to manage staff.';
    if (err.status === 403) return 'You do not have access to manage this staff member.';
    if (err.status === 404) return 'That staff member or assignment no longer exists.';
    if (err.status === 429) return 'Too many changes for now. Wait a while and try again.';
    if (err.code === 'ASSIGNMENT_EXISTS') {
      return 'This staff member is already assigned to that facility.';
    }
    if (err.code === 'STAFF_NOT_ACTIVE') {
      return 'Activate this staff member before assigning a facility.';
    }
    if (err.code === 'STAFF_LIMIT_REACHED' || err.code === 'EMAIL_ALREADY_REGISTERED') {
      return err.message;
    }
    if (err.code === 'OPERATOR_MISMATCH') return err.message;
    if (err.status === 422) {
      const details = err.details;
      if (Array.isArray(details)) {
        const first = details.find(
          (item): item is { msg: string } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { msg?: unknown }).msg === 'string',
        );
        if (first) return first.msg.replace(/^Value error, /, '');
      }
      return err.message;
    }
    return err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

export function OperatorStaff() {
  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [staff, setStaff] = useState<StaffSummary[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [facilityError, setFacilityError] = useState('');

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [facilityFilter, setFacilityFilter] = useState('ALL');

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [createError, setCreateError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<StaffSummary | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [editError, setEditError] = useState('');

  const [statusFor, setStatusFor] = useState<StaffSummary | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState('');

  const [assignFor, setAssignFor] = useState<StaffSummary | null>(null);
  const [assignFacilityId, setAssignFacilityId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assignError, setAssignError] = useState('');

  const [detail, setDetail] = useState<StaffDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [ending, setEnding] = useState<{
    staff: StaffSummary;
    assignment: StaffAssignment;
  } | null>(null);
  const [endReason, setEndReason] = useState('');
  const [endError, setEndError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadStaff = useCallback(async () => {
    const params = {
      ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
      ...(facilityFilter === 'ALL' ? {} : { facilityId: facilityFilter }),
      ...(query.trim() === '' ? {} : { q: query.trim() }),
    };
    const list = await fetchStaff(params);
    setStaff(list);
    setError('');
    return list;
  }, [facilityFilter, query, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(
      () => {
        (async () => {
          try {
            const list = await fetchStaff({
              ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
              ...(facilityFilter === 'ALL' ? {} : { facilityId: facilityFilter }),
              ...(query.trim() === '' ? {} : { q: query.trim() }),
            });
            if (!cancelled) {
              setStaff(list);
              setError('');
            }
          } catch (err) {
            if (!cancelled) setError(staffErrorMessage(err));
          } finally {
            if (!cancelled) setLoading(false);
          }
        })();
      },
      query.trim() === '' ? 0 : 300,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [facilityFilter, query, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchFacilities();
        if (!cancelled) setFacilities(list);
      } catch (err) {
        if (!cancelled) setFacilityError(staffErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const facilityOptions = useMemo(
    () => [...facilities].sort((a, b) => a.name.localeCompare(b.name)),
    [facilities],
  );

  const refreshDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      setDetail(await fetchStaffMember(id));
    } catch (err) {
      setError(staffErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = (member: StaffSummary) => {
    setDetail(null);
    setNotice('');
    void refreshDetail(member.id);
  };

  const openCreate = () => {
    setCreateForm(EMPTY_CREATE);
    setCreateError('');
    setNotice('');
    setCreating(true);
  };

  const toggleCreateFacility = (id: string) => {
    setCreateForm((form) => ({
      ...form,
      facilityIds: form.facilityIds.includes(id)
        ? form.facilityIds.filter((value) => value !== id)
        : [...form.facilityIds, id],
    }));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError('');

    const name = collapseStaffName(createForm.name);
    if (name.length < 2 || name.length > 80) {
      setCreateError('Name must be 2-80 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      setCreateError('Enter a valid email address.');
      return;
    }
    if (!staffPasswordIsValid(createForm.password)) {
      setCreateError('Password must be 8-72 characters and include a letter and a digit.');
      return;
    }
    if (isAdmin && createForm.operatorId.trim() === '') {
      setCreateError('Enter the id of the operator who will own this account.');
      return;
    }

    setSaving(true);
    try {
      const created = await createStaffMember({
        name,
        email: createForm.email.trim().toLowerCase(),
        ...(createForm.phone.trim() === '' ? {} : { phone: createForm.phone.trim() }),
        password: createForm.password,
        ...(createForm.facilityIds.length === 0
          ? {}
          : { facilityIds: createForm.facilityIds }),
        ...(isAdmin ? { operatorId: createForm.operatorId.trim() } : {}),
      });
      setCreating(false);
      setNotice(`${created.name} added.`);
      await loadStaff();
    } catch (err) {
      setCreateError(staffErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (member: StaffSummary) => {
    setEditForm({ name: member.name, phone: member.phone ?? '' });
    setEditError('');
    setNotice('');
    setEditing(member);
  };

  const handleEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setEditError('');
    const name = collapseStaffName(editForm.name);
    if (name.length < 2 || name.length > 80) {
      setEditError('Name must be 2-80 characters.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateStaffMember(editing.id, {
        name,
        phone: editForm.phone.trim() === '' ? undefined : editForm.phone.trim(),
      });
      setEditing(null);
      setNotice(`${updated.name} updated.`);
      await loadStaff();
      if (detail?.id === updated.id) setDetail(updated);
    } catch (err) {
      setEditError(staffErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openStatus = (member: StaffSummary) => {
    setStatusReason('');
    setStatusError('');
    setNotice('');
    setStatusFor(member);
  };

  const handleStatus = async () => {
    if (!statusFor) return;
    setStatusError('');
    setBusy(true);
    const next: 'ACTIVE' | 'SUSPENDED' =
      statusFor.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const updated = await changeStaffStatus(statusFor.id, {
        status: next,
        ...(statusReason.trim() === '' ? {} : { reason: statusReason.trim() }),
      });
      setStatusFor(null);
      setNotice(
        `${updated.name} is now ${STAFF_STATUS_LABELS[updated.status].toLowerCase()}.`,
      );
      await loadStaff();
      if (detail?.id === updated.id) setDetail(updated);
    } catch (err) {
      setStatusError(staffErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openAssign = (member: StaffSummary) => {
    const available = facilityOptions.find((f) => !member.facilityIds.includes(f.id));
    setAssignFacilityId(available?.id ?? '');
    setAssignNote('');
    setAssignError('');
    setNotice('');
    setAssignFor(member);
  };

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assignFor) return;
    setAssignError('');
    if (assignFacilityId === '') {
      setAssignError('Choose a facility to assign.');
      return;
    }

    setSaving(true);
    try {
      await assignStaffFacility(assignFor.id, {
        facilityId: assignFacilityId,
        ...(assignNote.trim() === '' ? {} : { note: assignNote.trim() }),
      });
      setAssignFor(null);
      setNotice('Facility assigned.');
      await loadStaff();
      if (detail?.id === assignFor.id) await refreshDetail(assignFor.id);
    } catch (err) {
      setAssignError(staffErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openEnd = (member: StaffSummary, assignment: StaffAssignment) => {
    setEndReason('');
    setEndError('');
    setNotice('');
    setEnding({ staff: member, assignment });
  };

  const handleEnd = async () => {
    if (!ending) return;
    setEndError('');
    setBusy(true);
    try {
      await unassignStaffFacility(
        ending.staff.id,
        ending.assignment.id,
        endReason.trim() === '' ? undefined : endReason.trim(),
      );
      setEnding(null);
      setNotice('Assignment ended.');
      await loadStaff();
      if (detail?.id === ending.staff.id) await refreshDetail(ending.staff.id);
    } catch (err) {
      setEndError(staffErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError('');
    try {
      await loadStaff();
    } catch (err) {
      setError(staffErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createFacilityChoices = facilityOptions;

  return (
    <div>
      <SectionHeader
        title="Staff Management"
        subtitle="Create staff accounts and control which of your facilities they can work at"
        action={
          <button type="button" onClick={openCreate} className="pe-btn-primary">
            <Plus size={16} /> Add Staff
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

      <div className="pe-card p-3 mb-4 flex flex-col lg:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            aria-label="Search staff"
            className="pe-input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          aria-label="Filter by status"
          className="pe-input lg:w-44"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING">Pending</option>
        </select>
        <select
          value={facilityFilter}
          onChange={(event) => setFacilityFilter(event.target.value)}
          aria-label="Filter by facility"
          className="pe-input lg:w-56"
        >
          <option value="ALL">All facilities</option>
          {facilityOptions.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="pe-card p-10 flex items-center justify-center gap-2 text-sm text-[#8a98b5]">
          <Loader2 size={16} className="animate-spin" />
          Loading staff
        </div>
      ) : staff.length === 0 && !error ? (
        <div className="pe-card p-10 text-center">
          <Users size={32} className="mx-auto text-[#5a6a8a] mb-2" />
          <p className="text-[#8a98b5] mb-1">
            {query || statusFilter !== 'ALL' || facilityFilter !== 'ALL'
              ? 'No staff match these filters.'
              : 'You have not added any staff yet.'}
          </p>
          <p className="text-xs text-[#5a6a8a] mb-3">
            {query || statusFilter !== 'ALL' || facilityFilter !== 'ALL'
              ? 'Try clearing the search or filters.'
              : 'Create an account, then assign the facilities they cover.'}
          </p>
          <button type="button" onClick={openCreate} className="pe-btn-primary">
            <Plus size={16} /> Add your first staff member
          </button>
        </div>
      ) : staff.length === 0 ? (
        <div className="pe-card p-10 text-center">
          <button type="button" onClick={handleRetry} className="pe-btn-outline">
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      ) : (
        <div className="pe-card overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-[#1e2d4d] text-xs text-[#8a98b5] uppercase">
                <th className="text-left p-3 font-medium">Staff</th>
                <th className="text-left p-3 font-medium">Facilities</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Last login</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-[#1e2d4d] last:border-0 text-sm align-top"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563eb] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {member.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{member.name}</p>
                        <p className="text-xs text-[#5a6a8a] truncate">{member.email}</p>
                        {member.phone && (
                          <p className="text-xs text-[#5a6a8a]">{member.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="text-[#8a98b5]">{facilitySummaryLabel(member.facilities)}</p>
                    {member.facilities.length > 1 && (
                      <p className="text-xs text-[#5a6a8a] mt-0.5">
                        {member.facilities.map((facility) => facility.name).join(', ')}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge color={STAFF_STATUS_COLORS[member.status]}>
                      {STAFF_STATUS_LABELS[member.status]}
                    </Badge>
                  </td>
                  <td className="p-3 text-[#8a98b5]">{formatDate(member.lastLoginAt)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openDetail(member)}
                        className="pe-btn-outline text-xs"
                      >
                        <History size={13} /> History
                      </button>
                      <button
                        type="button"
                        onClick={() => openAssign(member)}
                        disabled={member.status !== 'ACTIVE'}
                        className="pe-btn-outline text-xs disabled:opacity-40"
                        title={
                          member.status === 'ACTIVE'
                            ? 'Assign a facility'
                            : 'Activate the account before assigning'
                        }
                      >
                        <Plus size={13} /> Assign
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        className="pe-btn-outline text-xs"
                      >
                        <Edit size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openStatus(member)}
                        className="pe-btn-ghost text-xs"
                      >
                        {member.status === 'ACTIVE' ? (
                          <>
                            <UserX size={13} /> Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck size={13} /> Activate
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create */}
      <Modal
        open={creating}
        onClose={() => {
          if (!saving) setCreating(false);
        }}
        title="Add staff member"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="staff-name" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Name
              </label>
              <input
                id="staff-name"
                type="text"
                value={createForm.name}
                onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
                placeholder="Ravi Shah"
                maxLength={80}
                className="pe-input"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="staff-phone" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Phone (optional)
              </label>
              <input
                id="staff-phone"
                type="tel"
                value={createForm.phone}
                onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value })}
                placeholder="+91 98765 43210"
                maxLength={20}
                className="pe-input"
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label htmlFor="staff-email" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Email (used to sign in)
            </label>
            <input
              id="staff-email"
              type="email"
              value={createForm.email}
              onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
              placeholder="ravi@example.com"
              className="pe-input"
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="staff-password" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Initial password
            </label>
            <input
              id="staff-password"
              type="password"
              value={createForm.password}
              onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })}
              placeholder="At least 8 characters, a letter and a digit"
              maxLength={72}
              className="pe-input"
              autoComplete="new-password"
            />
            <p className="text-xs text-[#5a6a8a] mt-1.5">
              Share this with the staff member; they can change it after signing in.
            </p>
          </div>

          {isAdmin && (
            <div>
              <label htmlFor="staff-operator" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Owning operator id
              </label>
              <input
                id="staff-operator"
                type="text"
                value={createForm.operatorId}
                onChange={(event) =>
                  setCreateForm({ ...createForm, operatorId: event.target.value })
                }
                placeholder="24-character account id"
                className="pe-input"
                autoComplete="off"
              />
            </div>
          )}

          <div>
            <p className="text-xs text-[#8a98b5] font-medium mb-1.5">
              Initial facilities (optional)
            </p>
            {facilityError ? (
              <p className="text-xs text-[#fca5a5]">{facilityError}</p>
            ) : createFacilityChoices.length === 0 ? (
              <p className="text-xs text-[#5a6a8a]">
                Add a facility first if you want to assign one now.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {createFacilityChoices.map((facility) => (
                  <button
                    key={facility.id}
                    type="button"
                    onClick={() => toggleCreateFacility(facility.id)}
                    className={
                      createForm.facilityIds.includes(facility.id)
                        ? 'pe-chip-active'
                        : 'pe-chip-idle'
                    }
                  >
                    {facility.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {createError && (
            <div
              role="alert"
              className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]"
            >
              {createError}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="pe-btn-primary w-full disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating
              </>
            ) : (
              'Create staff account'
            )}
          </button>
        </form>
      </Modal>

      {/* Edit */}
      <Modal
        open={editing !== null}
        onClose={() => {
          if (!saving) setEditing(null);
        }}
        title="Edit staff member"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label htmlFor="staff-edit-name" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Name
            </label>
            <input
              id="staff-edit-name"
              type="text"
              value={editForm.name}
              onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
              maxLength={80}
              className="pe-input"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="staff-edit-phone" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Phone
            </label>
            <input
              id="staff-edit-phone"
              type="tel"
              value={editForm.phone}
              onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })}
              maxLength={20}
              className="pe-input"
              autoComplete="off"
            />
          </div>
          <p className="text-xs text-[#5a6a8a]">
            Email and ownership cannot be changed here. Suspending the account is on the row.
          </p>
          {editError && (
            <div
              role="alert"
              className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]"
            >
              {editError}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="pe-btn-primary w-full disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </form>
      </Modal>

      {/* Suspend / reactivate */}
      <Modal
        open={statusFor !== null}
        onClose={() => {
          if (!busy) setStatusFor(null);
        }}
        title={statusFor?.status === 'ACTIVE' ? 'Suspend staff member' : 'Reactivate staff member'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#8a98b5]">
            {statusFor?.status === 'ACTIVE' ? (
              <>
                <span className="text-[#e8edf5] font-semibold">{statusFor?.name}</span> will lose
                access immediately. Their assignments stay in place, so reactivating restores the
                same facilities.
              </>
            ) : (
              <>
                <span className="text-[#e8edf5] font-semibold">{statusFor?.name}</span> will be
                able to sign in again with the facilities they were assigned before.
              </>
            )}
          </p>
          <div>
            <label htmlFor="staff-status-reason" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Reason (optional)
            </label>
            <textarea
              id="staff-status-reason"
              value={statusReason}
              onChange={(event) => setStatusReason(event.target.value)}
              placeholder="e.g. left the company"
              maxLength={200}
              rows={2}
              className="pe-input resize-y"
            />
          </div>
          {statusError && (
            <div
              role="alert"
              className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]"
            >
              {statusError}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatusFor(null)}
              disabled={busy}
              className="pe-btn-outline flex-1 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStatus}
              disabled={busy}
              className="pe-btn-primary flex-1 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : statusFor?.status === 'ACTIVE' ? (
                <UserX size={16} />
              ) : (
                <UserCheck size={16} />
              )}
              {statusFor?.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign */}
      <Modal
        open={assignFor !== null}
        onClose={() => {
          if (!saving) setAssignFor(null);
        }}
        title="Assign a facility"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <p className="text-sm text-[#8a98b5]">
            Add a facility to{' '}
            <span className="text-[#e8edf5] font-semibold">{assignFor?.name}</span>. This opens a
            new assignment period.
          </p>
          {facilityError ? (
            <p className="text-sm text-[#fca5a5]">{facilityError}</p>
          ) : (
            <div>
              <label htmlFor="staff-assign-facility" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Facility
              </label>
              <select
                id="staff-assign-facility"
                value={assignFacilityId}
                onChange={(event) => setAssignFacilityId(event.target.value)}
                className="pe-input"
              >
                {facilityOptions
                  .filter((facility) => !assignFor?.facilityIds.includes(facility.id))
                  .map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
              </select>
              {assignFor && assignFor.facilityIds.length === facilityOptions.length && (
                <p className="text-xs text-[#5a6a8a] mt-1.5">
                  This member already covers every facility you own.
                </p>
              )}
            </div>
          )}
          <div>
            <label htmlFor="staff-assign-note" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Note (optional)
            </label>
            <input
              id="staff-assign-note"
              type="text"
              value={assignNote}
              onChange={(event) => setAssignNote(event.target.value)}
              placeholder="e.g. weekend shift"
              maxLength={200}
              className="pe-input"
              autoComplete="off"
            />
          </div>
          {assignError && (
            <div
              role="alert"
              className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]"
            >
              {assignError}
            </div>
          )}
          <button
            type="submit"
            disabled={saving || assignFacilityId === ''}
            className="pe-btn-primary w-full disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Assigning
              </>
            ) : (
              'Assign facility'
            )}
          </button>
        </form>
      </Modal>

      {/* History */}
      <Modal
        open={detail !== null || detailLoading}
        onClose={() => {
          if (!detailLoading) setDetail(null);
        }}
        title={detail ? `${detail.name} — assignments` : 'Assignments'}
        maxWidth="max-w-2xl"
      >
        {detailLoading && !detail ? (
          <div className="p-6 flex items-center justify-center gap-2 text-sm text-[#8a98b5]">
            <Loader2 size={16} className="animate-spin" /> Loading history
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge color={STAFF_STATUS_COLORS[detail.status]}>
                {STAFF_STATUS_LABELS[detail.status]}
              </Badge>
              <span className="text-[#8a98b5]">{detail.email}</span>
              {detail.phone && <span className="text-[#5a6a8a]">{detail.phone}</span>}
            </div>

            {detail.assignments.length === 0 ? (
              <div className="rounded-lg border border-[#1e2d4d] p-6 text-center text-sm text-[#8a98b5]">
                No facilities assigned yet.
              </div>
            ) : (
              <div className="space-y-2">
                {detail.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-lg border border-[#1e2d4d] bg-[#0b1220] p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {assignment.facilityName ?? 'Unknown facility'}
                        </p>
                        <p className="text-xs text-[#8a98b5] mt-0.5">
                          {ASSIGNMENT_STATUS_LABELS[assignment.status]} · assigned{' '}
                          {formatDate(assignment.assignedAt)}
                          {assignment.assignedByName
                            ? ` by ${assignment.assignedByName}`
                            : ''}
                        </p>
                        {assignment.status === 'INACTIVE' && (
                          <p className="text-xs text-[#5a6a8a] mt-0.5">
                            ended {formatDate(assignment.deactivatedAt)}
                            {assignment.deactivatedByName
                              ? ` by ${assignment.deactivatedByName}`
                              : ''}
                            {assignment.reason ? ` — ${assignment.reason}` : ''}
                          </p>
                        )}
                        {assignment.status === 'ACTIVE' && assignment.reason && (
                          <p className="text-xs text-[#5a6a8a] mt-0.5">
                            note: {assignment.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color={assignment.status === 'ACTIVE' ? 'green' : 'gray'}>
                          {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                        </Badge>
                        {assignment.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => openEnd(detail, assignment)}
                            className="pe-btn-ghost text-xs text-[#ef4444]"
                          >
                            <CalendarOff size={13} /> End
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openAssign(detail)}
                disabled={detail.status !== 'ACTIVE'}
                className="pe-btn-outline text-sm disabled:opacity-40"
              >
                <Plus size={14} /> Assign facility
              </button>
              <button
                type="button"
                onClick={() => openEdit(detail)}
                className="pe-btn-outline text-sm"
              >
                <Edit size={14} /> Edit details
              </button>
              <button
                type="button"
                onClick={() => openStatus(detail)}
                className="pe-btn-ghost text-sm"
              >
                {detail.status === 'ACTIVE' ? (
                  <>
                    <UserX size={14} /> Suspend
                  </>
                ) : (
                  <>
                    <UserCheck size={14} /> Activate
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* End assignment */}
      <Modal
        open={ending !== null}
        onClose={() => {
          if (!busy) setEnding(null);
        }}
        title="End assignment"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#8a98b5]">
            End{' '}
            <span className="text-[#e8edf5] font-semibold">
              {ending?.assignment.facilityName ?? 'this facility'}
            </span>{' '}
            for <span className="text-[#e8edf5] font-semibold">{ending?.staff.name}</span>? The
            staff member loses access on their next request; the period stays in the history.
          </p>
          <div>
            <label htmlFor="staff-end-reason" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
              Reason (optional)
            </label>
            <input
              id="staff-end-reason"
              type="text"
              value={endReason}
              onChange={(event) => setEndReason(event.target.value)}
              placeholder="e.g. moved branches"
              maxLength={200}
              className="pe-input"
              autoComplete="off"
            />
          </div>
          {endError && (
            <div
              role="alert"
              className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]"
            >
              {endError}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEnding(null)}
              disabled={busy}
              className="pe-btn-outline flex-1 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEnd}
              disabled={busy}
              className="pe-btn-primary flex-1 bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-60"
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CalendarOff size={16} />
              )}
              End assignment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
