import { useCallback, useEffect, useState } from 'react';
import { Badge, EmptyState, SectionHeader } from '@/components/ui';
import { formatDateTime, formatDuration, formatMoney } from '@/lib/format';
import {
  SESSION_STATUS_COLORS,
  SESSION_STATUS_LABELS,
  fetchSessions,
  reservationErrorMessage,
} from '@/lib/reservations';
import type { SessionRecord } from '@/types';
import { AlertCircle, Car, Clock, History, Loader2, MapPin, RefreshCw } from 'lucide-react';

function sessionTotal(session: SessionRecord): number {
  return session.pricingBreakdown?.total ?? session.amount ?? 0;
}

export function DriverHistory() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const page = await fetchSessions({ status: 'COMPLETED', limit: 100, order: 'desc' });
      setSessions(page.items);
    } catch (err) {
      setError(reservationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalSpent = sessions.reduce((sum, session) => sum + sessionTotal(session), 0);
  const avgDuration =
    sessions.length === 0
      ? 0
      : Math.round(
          sessions.reduce((sum, session) => sum + session.durationMinutes, 0) / sessions.length,
        );

  return (
    <div>
      <SectionHeader
        title="Parking History"
        subtitle="Your completed parking sessions"
        action={
          <button type="button" onClick={() => void load()} className="pe-btn-outline">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5] flex items-center gap-2"
        >
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Total Sessions</p>
          <p className="text-2xl font-bold mt-1">{sessions.length}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Total Spent</p>
          <p className="text-2xl font-bold mt-1">{formatMoney(totalSpent, 2)}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs text-[#8a98b5]">Avg. Duration</p>
          <p className="text-2xl font-bold mt-1">{formatDuration(avgDuration)}</p>
        </div>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="pe-card p-10 flex items-center justify-center gap-2 text-sm text-[#8a98b5]">
          <Loader2 size={16} className="animate-spin" /> Loading your parking history
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<History size={28} />}
          title="No history yet"
          message="Completed parking sessions will appear here after staff close your session at the exit."
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="pe-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{session.facilityName}</p>
                  <p className="text-sm text-[#8a98b5] flex items-center gap-1.5 mt-1">
                    <MapPin size={13} /> Space {session.spaceNumber}
                    <span className="text-[#3a4a6a]">|</span>
                    <Car size={13} /> {session.vehiclePlate}
                  </p>
                </div>
                <Badge color={SESSION_STATUS_COLORS[session.status]}>
                  {SESSION_STATUS_LABELS[session.status]}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[#5a6a8a]">Entry</p>
                  <p className="mt-0.5">{formatDateTime(session.entryTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#5a6a8a]">Exit</p>
                  <p className="mt-0.5">
                    {session.exitTime ? formatDateTime(session.exitTime) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#5a6a8a]">Duration</p>
                  <p className="mt-0.5 flex items-center gap-1">
                    <Clock size={13} /> {formatDuration(session.durationMinutes)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#5a6a8a]">Final amount</p>
                  <p className="mt-0.5 font-semibold">{formatMoney(sessionTotal(session), 2)}</p>
                </div>
              </div>

              <p className="mt-3 text-xs font-mono text-[#5a6a8a]">{session.reference}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
