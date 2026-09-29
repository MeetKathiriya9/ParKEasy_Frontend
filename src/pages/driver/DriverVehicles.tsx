import { useApp } from '@/context/AppContext';
import { SectionHeader, Badge, Modal } from '@/components/ui';
import { vehicles } from '@/data/mockData';
import type { Vehicle } from '@/types';
import { Car, Plus, Zap, Star, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';

export function DriverVehicles() {
  const { currentUser } = useApp();
  const userVehicles = vehicles.filter((v) => v.userId === currentUser?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ plate: '', make: '', model: '', color: '', isEV: false });

  return (
    <div>
      <SectionHeader
        title="My Vehicles"
        subtitle="Manage your registered vehicles"
        action={
          <button onClick={() => setShowAdd(true)} className="pe-btn-primary">
            <Plus size={16} /> Add Vehicle
          </button>
        }
      />

      <div className="grid md:grid-cols-2 gap-4">
        {userVehicles.map((v: Vehicle) => (
          <div key={v.id} className="pe-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${v.isEV ? 'bg-[#06b6d4]/15 text-[#06b6d4]' : 'bg-[#2563eb]/15 text-[#3b82f6]'}`}>
                  <Car size={24} />
                </div>
                <div>
                  <p className="font-semibold">{v.make} {v.model}</p>
                  <p className="text-sm text-[#8a98b5]">{v.color}</p>
                </div>
              </div>
              {v.isDefault && <Badge color="amber"><Star size={10} fill="currentColor" /> Default</Badge>}
            </div>
            <div className="bg-[#0b1220] rounded-lg p-3 mb-3">
              <p className="text-xs text-[#8a98b5] mb-1">License Plate</p>
              <p className="font-mono font-bold text-lg tracking-wider">{v.plate}</p>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {v.isEV && <Badge color="cyan"><Zap size={10} /> EV Compatible</Badge>}
            </div>
            <div className="flex gap-2">
              <button className="pe-btn-outline flex-1 text-sm"><Edit size={14} /> Edit</button>
              <button className="pe-btn-ghost text-sm text-[#ef4444]"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Vehicle">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Make</label>
              <input type="text" placeholder="Toyota" value={newVehicle.make} onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })} className="pe-input" />
            </div>
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Model</label>
              <input type="text" placeholder="Camry" value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} className="pe-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Color</label>
              <input type="text" placeholder="Blue" value={newVehicle.color} onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })} className="pe-input" />
            </div>
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">License Plate</label>
              <input type="text" placeholder="ABC-1234" value={newVehicle.plate} onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })} className="pe-input" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newVehicle.isEV} onChange={(e) => setNewVehicle({ ...newVehicle, isEV: e.target.checked })} className="accent-[#06b6d4]" />
            <span className="text-sm flex items-center gap-1"><Zap size={14} className="text-[#06b6d4]" /> This is an EV</span>
          </label>
          <button onClick={() => setShowAdd(false)} className="pe-btn-primary w-full">Add Vehicle</button>
        </div>
      </Modal>
    </div>
  );
}
