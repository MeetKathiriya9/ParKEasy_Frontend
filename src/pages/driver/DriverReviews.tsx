import { SectionHeader } from '@/components/ui';
import { Star, MessageSquare } from 'lucide-react';

/**
 * Reviews and complaints are still `501` on the server, so both tabs show an
 * honest empty state rather than sample entries or a form that cannot submit.
 */
export function DriverReviews() {
  return (
    <div>
      <SectionHeader title="My Reviews" subtitle="Reviews you've submitted" />
      <div className="pe-card p-10 text-center">
        <Star size={32} className="mx-auto text-[#5a6a8a] mb-2" />
        <p className="text-[#8a98b5] mb-1">No reviews yet</p>
        <p className="text-xs text-[#5a6a8a]">
          Reviews open once the reviews group is implemented.
        </p>
      </div>
    </div>
  );
}

export function DriverComplaints() {
  return (
    <div>
      <SectionHeader title="My Complaints" subtitle="Track your filed complaints" />
      <div className="pe-card p-10 text-center">
        <MessageSquare size={32} className="mx-auto text-[#5a6a8a] mb-2" />
        <p className="text-[#8a98b5] mb-1">No complaints filed</p>
        <p className="text-xs text-[#5a6a8a]">
          Complaints open once the complaints group is implemented.
        </p>
      </div>
    </div>
  );
}
