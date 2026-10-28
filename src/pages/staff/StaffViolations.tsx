import { SectionHeader, EmptyState } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';

/**
 * Violations live in a `501` route group. The page stays visible in the staff
 * navigation but says so instead of listing mock records or offering a form
 * whose submit would fail.
 */
export function StaffViolations() {
  return (
    <div>
      <SectionHeader title="Violations" subtitle="Record and manage parking violations" />
      <EmptyState
        icon={<AlertTriangle size={28} />}
        title="Violation recording is not switched on yet"
        message="The violations API group is planned but not implemented. Once it lands, staff will record and resolve violations here for their assigned facilities."
      />
    </div>
  );
}
