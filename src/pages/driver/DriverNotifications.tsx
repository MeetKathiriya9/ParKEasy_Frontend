import { useApp } from '@/context/AppContext';
import { SectionHeader, Badge } from '@/components/ui';
import { notifications } from '@/data/mockData';
import { Bell, Clock, CreditCard, XCircle, Star, AlertCircle, Calendar } from 'lucide-react';

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  reminder: { icon: <Calendar size={18} />, color: 'text-[#3b82f6] bg-[#2563eb]/15' },
  expiry: { icon: <Clock size={18} />, color: 'text-[#f59e0b] bg-[#f59e0b]/15' },
  payment: { icon: <CreditCard size={18} />, color: 'text-[#10b981] bg-[#10b981]/15' },
  cancellation: { icon: <XCircle size={18} />, color: 'text-[#ef4444] bg-[#ef4444]/15' },
  closure: { icon: <AlertCircle size={18} />, color: 'text-[#ef4444] bg-[#ef4444]/15' },
  alert: { icon: <AlertCircle size={18} />, color: 'text-[#f59e0b] bg-[#f59e0b]/15' },
  review: { icon: <Star size={18} />, color: 'text-[#f59e0b] bg-[#f59e0b]/15' },
};

export function DriverNotifications() {
  const { currentUser } = useApp();
  const userNotifs = notifications.filter((n) => n.userId === currentUser?.id);
  const unread = userNotifs.filter((n) => !n.read);

  return (
    <div>
      <SectionHeader title="Notifications" subtitle={`${unread.length} unread notifications`} />

      {userNotifs.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={32} className="mx-auto text-[#5a6a8a] mb-2" />
          <p className="text-[#8a98b5]">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userNotifs.map((n) => {
            const cfg = typeConfig[n.type];
            return (
              <div key={n.id} className={`pe-card p-4 ${!n.read ? 'border-[#2563eb]/30' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />}
                    </div>
                    <p className="text-sm text-[#8a98b5] mt-1">{n.message}</p>
                    <p className="text-xs text-[#5a6a8a] mt-2">{new Date(n.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
