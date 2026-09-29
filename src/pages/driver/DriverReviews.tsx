import { useApp } from '@/context/AppContext';
import { SectionHeader, Badge, Modal } from '@/components/ui';
import { reviews, complaints } from '@/data/mockData';
import { Star, MessageSquare, Plus, Send } from 'lucide-react';
import { useState } from 'react';

export function DriverReviews() {
  const { currentUser } = useApp();
  const userReviews = reviews.filter((r) => r.userId === currentUser?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <div>
      <SectionHeader
        title="My Reviews"
        subtitle="Reviews you've submitted"
        action={<button onClick={() => setShowAdd(true)} className="pe-btn-primary"><Plus size={16} /> Write Review</button>}
      />

      {userReviews.length === 0 ? (
        <div className="text-center py-16">
          <Star size={32} className="mx-auto text-[#5a6a8a] mb-2" />
          <p className="text-[#8a98b5]">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userReviews.map((r) => (
            <div key={r.id} className="pe-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">{r.facilityName}</p>
                  <p className="text-xs text-[#5a6a8a]">{r.date} · {r.category}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} size={14} className={i <= r.rating ? 'text-[#f59e0b]' : 'text-[#2a3a5c]'} fill={i <= r.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-[#8a98b5]">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Write a Review">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Facility</label>
            <select className="pe-input">
              <option>Downtown Central Garage</option>
              <option>SoMa Premium Parking</option>
              <option>Mission Bay Lot</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map((i) => (
                <button key={i} onClick={() => setRating(i)}>
                  <Star size={28} className={i <= rating ? 'text-[#f59e0b]' : 'text-[#2a3a5c]'} fill={i <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Comment</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." rows={4} className="pe-input resize-none" />
          </div>
          <button onClick={() => setShowAdd(false)} className="pe-btn-primary w-full"><Send size={16} /> Submit Review</button>
        </div>
      </Modal>
    </div>
  );
}

export function DriverComplaints() {
  const { currentUser } = useApp();
  const userComplaints = complaints.filter((c) => c.userId === currentUser?.id);
  const [showAdd, setShowAdd] = useState(false);

  const statusColors: Record<string, 'blue' | 'amber' | 'green' | 'red'> = {
    open: 'amber', assigned: 'blue', in_progress: 'blue', resolved: 'green',
  };

  return (
    <div>
      <SectionHeader
        title="My Complaints"
        subtitle="Track your filed complaints"
        action={<button onClick={() => setShowAdd(true)} className="pe-btn-primary"><Plus size={16} /> File Complaint</button>}
      />

      {userComplaints.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={32} className="mx-auto text-[#5a6a8a] mb-2" />
          <p className="text-[#8a98b5]">No complaints filed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userComplaints.map((c) => (
            <div key={c.id} className="pe-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">{c.subject}</p>
                  <p className="text-xs text-[#5a6a8a]">{c.facilityName} · {c.createdAt}</p>
                </div>
                <Badge color={statusColors[c.status]}>{c.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-sm text-[#8a98b5] mb-2">{c.description}</p>
              {c.assignedTo && <p className="text-xs text-[#5a6a8a]">Assigned to: {c.assignedTo}</p>}
              {c.resolution && (
                <div className="mt-2 bg-[#10b981]/5 rounded-lg p-2 border border-[#10b981]/20">
                  <p className="text-xs text-[#10b981] font-medium">Resolution: {c.resolution}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="File a Complaint">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Facility</label>
            <select className="pe-input">
              <option>Downtown Central Garage</option>
              <option>SoMa Premium Parking</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Category</label>
            <select className="pe-input">
              <option>Billing</option>
              <option>Safety</option>
              <option>Service</option>
              <option>Equipment</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Subject</label>
            <input type="text" placeholder="Brief description of the issue" className="pe-input" />
          </div>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Description</label>
            <textarea placeholder="Provide details..." rows={4} className="pe-input resize-none" />
          </div>
          <button onClick={() => setShowAdd(false)} className="pe-btn-primary w-full"><Send size={16} /> Submit Complaint</button>
        </div>
      </Modal>
    </div>
  );
}
