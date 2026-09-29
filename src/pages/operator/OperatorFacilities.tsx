import { useState } from 'react';
import { SectionHeader, Badge, Modal, ProgressBar } from '@/components/ui';
import { facilities, spaces } from '@/data/mockData';
import { Building2, Plus, MapPin, Star, Clock, Zap, Car, Edit, Trash2, X, Check } from 'lucide-react';

export function OperatorFacilities() {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

  const facility = facilities.find(f => f.id === selectedFacility);
  const facilitySpaces = spaces.filter(s => s.facilityId === selectedFacility);

  return (
    <div>
      <SectionHeader
        title="Facilities"
        subtitle="Manage your parking facilities"
        action={<button onClick={() => setShowAdd(true)} className="pe-btn-primary"><Plus size={16} /> Add Facility</button>}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map((f) => (
          <div key={f.id} className="pe-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{f.name}</p>
                <p className="text-sm text-[#8a98b5] flex items-center gap-1 mt-1"><MapPin size={14} /> {f.address}</p>
              </div>
              {f.openNow ? <Badge color="green">Open</Badge> : <Badge color="red">Closed</Badge>}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-[#0b1220] rounded-lg p-2">
                <p className="text-lg font-bold">{f.totalSpaces}</p>
                <p className="text-xs text-[#8a98b5]">Total</p>
              </div>
              <div className="bg-[#0b1220] rounded-lg p-2">
                <p className="text-lg font-bold text-[#10b981]">{f.availableSpaces}</p>
                <p className="text-xs text-[#8a98b5]">Free</p>
              </div>
              <div className="bg-[#0b1220] rounded-lg p-2">
                <p className="text-lg font-bold text-[#f59e0b]">{Math.round(((f.occupiedSpaces + f.reservedSpaces) / f.totalSpaces) * 100)}%</p>
                <p className="text-xs text-[#8a98b5]">Occ.</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-[#8a98b5]">${f.hourlyRate}/hr · {f.rating} ★</span>
              <div className="flex gap-1">
                {f.hasEV && <Zap size={14} className="text-[#06b6d4]" />}
                {f.hasCovered && <Building2 size={14} className="text-[#3b82f6]" />}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedFacility(f.id)} className="pe-btn-outline flex-1 text-sm"><Edit size={14} /> Manage</button>
              <button className="pe-btn-ghost text-sm text-[#ef4444]"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Manage Facility Modal */}
      <Modal open={!!selectedFacility} onClose={() => setSelectedFacility(null)} title="Manage Facility" maxWidth="max-w-2xl">
        {facility && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Facility Name</label>
                <input type="text" defaultValue={facility.name} className="pe-input" />
              </div>
              <div>
                <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Total Spaces</label>
                <input type="number" defaultValue={facility.totalSpaces} className="pe-input" />
              </div>
              <div>
                <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Address</label>
                <input type="text" defaultValue={facility.address} className="pe-input" />
              </div>
              <div>
                <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Hourly Rate ($)</label>
                <input type="number" defaultValue={facility.hourlyRate} className="pe-input" />
              </div>
              <div>
                <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Operating Hours</label>
                <input type="text" defaultValue={facility.hours} className="pe-input" />
              </div>
              <div>
                <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Daily Max ($)</label>
                <input type="number" defaultValue={facility.dailyMax} className="pe-input" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {['EV Charging', 'Covered', 'Security', 'CCTV', 'Restrooms', 'Valet', 'Accessible'].map(a => (
                  <span key={a} className={`pe-chip-idle ${facility.amenities.includes(a) ? 'pe-chip-active' : ''}`}>{a}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedFacility(null)} className="pe-btn-outline flex-1"><X size={16} /> Cancel</button>
              <button onClick={() => setSelectedFacility(null)} className="pe-btn-primary flex-1"><Check size={16} /> Save Changes</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Facility Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Facility">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Facility Name</label>
            <input type="text" placeholder="e.g. Union Square Garage" className="pe-input" />
          </div>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Address</label>
            <input type="text" placeholder="Street address" className="pe-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Total Spaces</label>
              <input type="number" placeholder="100" className="pe-input" />
            </div>
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Hourly Rate ($)</label>
              <input type="number" placeholder="4.00" className="pe-input" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Operating Hours</label>
            <input type="text" placeholder="24/7 or 6:00 AM - 11:00 PM" className="pe-input" />
          </div>
          <button onClick={() => setShowAdd(false)} className="pe-btn-primary w-full">Create Facility</button>
        </div>
      </Modal>
    </div>
  );
}
