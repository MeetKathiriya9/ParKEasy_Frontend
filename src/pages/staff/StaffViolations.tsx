import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SectionHeader, Badge, Modal, EmptyState } from '@/components/ui';
import { violations, facilities, staffMembers } from '@/data/mockData';
import type { ViolationType, ViolationStatus } from '@/types';
import { AlertTriangle, Plus, Camera, Car, Clock, MapPin, FileText } from 'lucide-react';

const typeLabels: Record<ViolationType, string> = {
  overstay: 'Overstay',
  wrong_zone: 'Wrong Zone',
  unauthorized: 'Unauthorized',
  reserved_misuse: 'Reserved Space Misuse',
  no_permit: 'No Permit',
};

const statusColors: Record<ViolationStatus, 'red' | 'amber' | 'green' | 'gray'> = {
  open: 'red', appealed: 'amber', resolved: 'green', fined: 'gray',
};

export function StaffViolations() {
  const { currentUser } = useApp();
  const staff = staffMembers.find((s) => s.name === currentUser?.name);
  const facilityViolations = violations.filter((v) => v.facilityId === staff?.facilityId);
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<ViolationType>('overstay');
  const [plate, setPlate] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div>
      <SectionHeader
        title="Violations"
        subtitle="Record and manage parking violations"
        action={<button onClick={() => setShowAdd(true)} className="pe-btn-primary"><Plus size={16} /> Record Violation</button>}
      />

      {facilityViolations.length === 0 ? (
        <EmptyState icon={<AlertTriangle size={28} />} title="No violations" message="No violations recorded at this facility." />
      ) : (
        <div className="space-y-3">
          {facilityViolations.map((v) => (
            <div key={v.id} className="pe-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ef4444]/15 flex items-center justify-center text-[#ef4444]">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">{typeLabels[v.type]}</p>
                    <p className="text-xs text-[#5a6a8a]">{v.recordedAt} · by {v.recordedBy}</p>
                  </div>
                </div>
                <Badge color={statusColors[v.status]}>{v.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-[#8a98b5] mb-2">
                <span className="flex items-center gap-1"><Car size={14} /> {v.vehiclePlate}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {v.facilityName}</span>
                {v.fine > 0 && <span className="flex items-center gap-1"><FileText size={14} /> Fine: ${v.fine}</span>}
              </div>
              <p className="text-sm text-[#8a98b5] mb-2">{v.description}</p>
              {v.evidence && (
                <div className="flex items-center gap-2 text-xs text-[#5a6a8a] mt-2 pt-2 border-t border-[#1e2d4d]">
                  <Camera size={12} /> Evidence: {v.evidence}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Record Violation">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Violation Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as ViolationType)} className="pe-input">
              {Object.entries(typeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Vehicle Plate</label>
            <input type="text" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="GLR-2841" className="pe-input font-mono" />
          </div>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the violation..." rows={3} className="pe-input resize-none" />
          </div>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Fine Amount ($)</label>
            <input type="number" placeholder="25" className="pe-input" />
          </div>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Evidence</label>
            <button className="pe-btn-outline w-full"><Camera size={16} /> Upload Photo Evidence</button>
          </div>
          <button onClick={() => setShowAdd(false)} className="pe-btn-primary w-full">Record Violation</button>
        </div>
      </Modal>
    </div>
  );
}
