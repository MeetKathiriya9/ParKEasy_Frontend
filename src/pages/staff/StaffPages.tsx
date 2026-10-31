/**
 * Staff session board and activity placeholder.
 *
 * `StaffSessions` reads the live `/sessions` list for the staff member's
 * assigned facilities. Closing a session is the same operation as a check-out
 * at the exit barrier, so it asks for a second click before settling the stay.
 */

import { useCallback, useEffect, useState } from 'react';
import { Badge, EmptyState, SectionHeader } from '@/components/ui';
import { formatDateTime, formatDuration, formatMoney } from '@/lib/format';
import {
  SESSION_STATUS_COLORS,
  SESSION_STATUS_LABELS,
  closeSession,
  extendSession,
  fetchSessions,
  reservationErrorMessage,
} from '@/lib/reservations';
import type { SessionRecord } from '@/types';
import { AlertCircle, Car, Clock, History, Loader2, LogOut, RefreshCw, Timer } from 'lucide-react';

export function StaffSessions() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [extensionMinutes, setExtensionMinutes] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setError('');
    try {
      const [active, extended] = await Promise.all([
        fetchSessions({ status: 'ACTIVE', limit: 100, order: 'desc' }),
        fetchSessions({ status: 'EXTENDED', limit: 100, order: 'desc' }),
      ]);
      setSessions(
        [...active.items, ...extended.items].sort(
          (a, b) => Date.parse(b.entryTime) - Date.parse(a.entryTime),
        ),
      );
    } catch (err) {
      setError(reservationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const handleClose = async (session: SessionRecord) => {
    setBusyId(session.id);
    setError('');
    setNotice('');
    try {
      const closed = await closeSession(session.id);
      setSessions((rows) => rows.filter((row) => row.id !== closed.id));
      setNotice(
        `${closed.vehiclePlate} checked out after ${formatDuration(closed.durationMinutes)}. ` +
          `Final amount ${formatMoney(closed.pricingBreakdown?.total ?? closed.amount ?? 0, 2)}.`,
      );
      setConfirmId(null);
    } catch (err) {
      setError(reservationErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleExtend = async (session: SessionRecord) => {
    const minutes = extensionMinutes[session.id] ?? 30;
    setBusyId(session.id);
    setError('');
    setNotice('');
    try {
      const result = await extendSession(session.id, minutes);
      setSessions((rows) =>
        rows.map((row) => (row.id === session.id ? result.session : row)),
      );
      setNotice(
        `${result.session.vehiclePlate} extended by ${formatDuration(minutes)}. ` +
          `New end ${formatDateTime(result.session.scheduledEndTime ?? result.reservation.endTime)}.`,
      );
    } catch (err) {
      setError(reservationErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Active Sessions"
        subtitle="Vehicles currently parked in your facilities"
        action={
          <button type="button" onClick={() => void load()} className="pe-btn-outline">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5] flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 px-3 py-2 text-sm text-[#6ee7b7]">
          {notice}
        </div>
      )}

      {loading && sessions.length === 0 ? (
        <div className="pe-card p-10 flex items-center justify-center gap-2 text-sm text-[#8a98b5]">
          <Loader2 size={16} className="animate-spin" /> Loading active sessions
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<Clock size={28} />}
          title="No active sessions"
          message="Vehicles appear here after staff check in a reservation."
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="pe-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold">{session.facilityName}</p>
                  <p className="text-xs font-mono text-[#5a6a8a]">{session.reference}</p>
                </div>
                <Badge color={SESSION_STATUS_COLORS[session.status]}>
                  {SESSION_STATUS_LABELS[session.status]}
                </Badge>
              </div>

              <div className="grid sm:grid-cols-4 gap-2 text-sm text-[#8a98b5] mb-3">
                <span className="flex items-center gap-1.5">
                  <Car size={14} /> {session.vehiclePlate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> {formatDateTime(session.entryTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Timer size={14} /> {formatDuration(session.durationMinutes)}
                </span>
                <span>Space {session.spaceNumber}</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">
                  <span className="text-[#8a98b5]">Estimate: </span>
                  {formatMoney(
                    session.estimatedBreakdown?.total ?? session.amount ?? 0,
                    2,
                  )}
                  {session.scheduledEndTime && (
                    <span className="text-[#8a98b5] ml-2">
                      until {formatDateTime(session.scheduledEndTime)}
                    </span>
                  )}
                  {session.overstayMinutes > 0 && (
                    <span className="text-[#f59e0b] ml-2">
                      overstay {formatDuration(session.overstayMinutes)}
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmId === session.id) {
                      void handleClose(session);
                    } else {
                      setConfirmId(session.id);
                    }
                  }}
                  disabled={busyId === session.id}
                  className={`pe-btn-outline text-sm ${
                    confirmId === session.id ? 'text-[#f59e0b] border-[#f59e0b]/50' : ''
                  }`}
                >
                  {busyId === session.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <LogOut size={14} />
                  )}
                  {confirmId === session.id ? 'Confirm checkout' : 'Check out'}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#1e2d4d] pt-3">
                <span className="text-xs text-[#5a6a8a]">Extend</span>
                <select
                  value={extensionMinutes[session.id] ?? 30}
                  onChange={(event) =>
                    setExtensionMinutes((current) => ({
                      ...current,
                      [session.id]: Number(event.target.value),
                    }))
                  }
                  disabled={busyId === session.id}
                  className="pe-input text-sm max-w-[8rem]"
                  aria-label={`Extension for ${session.vehiclePlate}`}
                >
                  {[30, 60, 90, 120, 180, 240].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {formatDuration(minutes)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleExtend(session)}
                  disabled={busyId === session.id}
                  className="pe-btn-outline text-sm"
                >
                  {busyId === session.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Timer size={14} />
                  )}
                  Add time
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StaffActivity() {
  return (
    <div>
      <SectionHeader title="My Activity" subtitle="Your recent actions and scans" />
      <EmptyState
        icon={<History size={28} />}
        title="No activity feed yet"
        message="Violations and audit entries will appear here once those staff endpoints are implemented. Reservations and sessions are already live."
      />
    </div>
  );
}
