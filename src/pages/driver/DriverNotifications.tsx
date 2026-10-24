import { SectionHeader } from '@/components/ui';
import { Bell } from 'lucide-react';

/**
 * Notifications are not implemented on the server yet (`/notifications`
 * answers `501`), so there is nothing real to list. The page says so instead
 * of showing sample alerts.
 */
export function DriverNotifications() {
  return (
    <div>
      <SectionHeader title="Notifications" subtitle="No unread notifications" />

      <div className="pe-card p-10 text-center">
        <Bell size={32} className="mx-auto text-[#5a6a8a] mb-2" />
        <p className="text-[#8a98b5] mb-1">No notifications</p>
        <p className="text-xs text-[#5a6a8a]">
          Alerts will appear here once the notifications group is implemented.
        </p>
      </div>
    </div>
  );
}
