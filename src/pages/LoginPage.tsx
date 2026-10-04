import { useApp } from '@/context/AppContext';
import { Zap, ArrowRight, Lock, Mail, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function LoginPage() {
  const { login, authPending, navigate } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await login({ email, password });
    if (!result.ok) setError(result.message);
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#2563eb] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[#06b6d4] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#06b6d4] items-center justify-center mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold">ParkEasy</h1>
          <p className="text-sm text-[#8a98b5] mt-1">Smart Parking Management Platform</p>
        </div>

        <div className="pe-card p-6 pe-fade-in">
          <h2 className="text-lg font-semibold mb-1">Sign in to your account</h2>
          <p className="text-sm text-[#8a98b5] mb-5">
            Use the email and password you registered with
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="pe-input pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pe-input pl-9"
                  required
                />
              </div>
              <div className="text-right mt-1.5">
                <button
                  type="button"
                  onClick={() => navigate('forgot-password')}
                  className="text-xs text-[#3b82f6] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

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
                  Signing in
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#5a6a8a] mt-4">
            New to ParkEasy?{' '}
            <button
              type="button"
              onClick={() => navigate('register')}
              className="text-[#3b82f6] hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
