import { useApp } from '@/context/AppContext';
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/auth';
import type { Role } from '@/types';
import { Car, ScanLine, Building2, Shield, Zap, ArrowLeft, Loader2, Lock, Mail, User, Phone } from 'lucide-react';
import { useState } from 'react';

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  driver: <Car size={20} />,
  staff: <ScanLine size={20} />,
  operator: <Building2 size={20} />,
  admin: <Shield size={20} />,
};

/** Mirrors the server-side rule in `app/schemas/auth.py`. */
const PASSWORD_RULE = 'At least 8 characters, including a letter and a number';

export function RegisterPage() {
  const { register, authPending, navigate } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('driver');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await register({ name, email, password, phone, role });
    if (!result.ok) setError(result.message);
  };

  const field =
    'w-full rounded-lg bg-[#0b1220] border border-[#1e2d4d] px-3 py-2.5 text-sm text-[#e8edf5] placeholder-[#5a6a8a] focus:outline-none focus:border-[#2563eb] transition-colors';

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#2563eb] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[#06b6d4] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#06b6d4] items-center justify-center mb-3">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-[#8a98b5] mt-1">Choose a role and start using ParkEasy</p>
        </div>

        <div className="pe-card p-6 pe-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Full name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Shah"
                  className={`${field} pl-9`}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={`${field} pl-9`}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Phone <span className="text-[#5a6a8a]">(optional)</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`${field} pl-9`}
                  maxLength={20}
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-password" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${field} pl-9`}
                  minLength={8}
                  maxLength={72}
                  required
                />
              </div>
              <p className="text-[11px] text-[#5a6a8a] mt-1.5">{PASSWORD_RULE}</p>
            </div>

            <fieldset>
              <legend className="text-xs text-[#8a98b5] font-medium mb-2">I am signing up as</legend>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((option) => {
                  const active = role === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRole(option)}
                      aria-pressed={active}
                      title={ROLE_DESCRIPTIONS[option]}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                        active
                          ? 'border-[#2563eb] bg-[#2563eb]/10'
                          : 'border-[#1e2d4d] bg-[#0b1220] hover:border-[#3b82f6]/60'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          active ? 'bg-[#2563eb] text-white' : 'bg-[#111a2e] text-[#8a98b5]'
                        }`}
                      >
                        {ROLE_ICONS[option]}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold truncate">{ROLE_LABELS[option]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]"
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={authPending} className="pe-btn-primary w-full disabled:opacity-60">
              {authPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#5a6a8a] mt-4">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('login')}
              className="text-[#3b82f6] hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('login')}
          className="flex items-center gap-1.5 mx-auto mt-4 text-[#8a98b5] hover:text-[#e8edf5] text-sm"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </button>
      </div>
    </div>
  );
}
