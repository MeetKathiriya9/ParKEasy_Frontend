import { useApp } from '@/context/AppContext';
import type { Role } from '@/types';
import { Car, ScanLine, Building2, Shield, Zap, ArrowRight, Lock, Mail } from 'lucide-react';
import { useState } from 'react';

const roles: { role: Role; title: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { role: 'driver', title: 'Driver / Customer', desc: 'Find and reserve parking spaces', icon: <Car size={28} />, color: 'from-[#2563eb] to-[#06b6d4]' },
  { role: 'staff', title: 'Parking Staff', desc: 'Manage check-in/out and violations', icon: <ScanLine size={28} />, color: 'from-[#10b981] to-[#06b6d4]' },
  { role: 'operator', title: 'Operator / Manager', desc: 'Manage facilities and operations', icon: <Building2 size={28} />, color: 'from-[#f59e0b] to-[#ef4444]' },
  { role: 'admin', title: 'Platform Admin', desc: 'Manage the entire platform', icon: <Shield size={28} />, color: 'from-[#8b5cf6] to-[#2563eb]' },
];

export function LoginPage() {
  const { login } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) login(selectedRole);
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#2563eb] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[#06b6d4] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#06b6d4] items-center justify-center mb-4 pe-pulse">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold">ParkEasy</h1>
          <p className="text-sm text-[#8a98b5] mt-1">Smart Parking Management Platform</p>
        </div>

        <div className="pe-card p-6 pe-fade-in">
          {!selectedRole ? (
            <>
              <h2 className="text-lg font-semibold mb-1">Choose your role to continue</h2>
              <p className="text-sm text-[#8a98b5] mb-5">Select a role to access the demo portal</p>
              <div className="space-y-3">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => setSelectedRole(r.role)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#0b1220] border border-[#1e2d4d] hover:border-[#2563eb] transition-all group text-left"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white flex-shrink-0`}>
                      {r.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{r.title}</p>
                      <p className="text-xs text-[#8a98b5]">{r.desc}</p>
                    </div>
                    <ArrowRight size={18} className="text-[#5a6a8a] group-hover:text-[#3b82f6] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setSelectedRole(null)} className="text-[#8a98b5] hover:text-[#e8edf5] text-sm">
                  ← Back
                </button>
              </div>
              <h2 className="text-lg font-semibold mb-1">{roles.find((r) => r.role === selectedRole)?.title}</h2>
              <p className="text-sm text-[#8a98b5] mb-5">Sign in to your account</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="pe-input pl-9"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#8a98b5] font-medium mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pe-input pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-[#8a98b5] cursor-pointer">
                    <input type="checkbox" className="accent-[#2563eb]" />
                    Remember me
                  </label>
                  <button type="button" className="text-[#3b82f6] hover:underline">Forgot password?</button>
                </div>
                <button type="submit" className="pe-btn-primary w-full">
                  Sign In
                  <ArrowRight size={16} />
                </button>
              </form>
              <p className="text-center text-xs text-[#5a6a8a] mt-4">
                Demo mode — any email and password will work
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
