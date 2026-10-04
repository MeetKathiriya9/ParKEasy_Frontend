import { useApp } from '@/context/AppContext';
import { resetPassword } from '@/lib/auth';
import { Zap, Lock, Loader2, KeyRound, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

/**
 * Password strength rules, mirrored from the server so the user finds out
 * before submitting. The server validates independently - this is a
 * convenience, not a control.
 */
function checkStrength(value: string): string | null {
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(value)) return 'Password must contain at least one letter';
  if (!/\d/.test(value)) return 'Password must contain at least one digit';
  return null;
}

/** Reads `?token=` from the URL. The emailed link is the only way in. */
function tokenFromUrl(): string | null {
  const token = new URLSearchParams(window.location.search).get('token');
  return token && token.trim().length > 0 ? token.trim() : null;
}

export function ResetPasswordPage() {
  const { navigate } = useApp();
  const [token] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const strengthError = newPassword.length > 0 ? checkStrength(newPassword) : null;
  const mismatch = confirm.length > 0 && confirm !== newPassword;
  const canSubmit =
    Boolean(token) && !pending && !strengthError && !mismatch && newPassword.length > 0 && confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) return;
    if (checkStrength(newPassword)) {
      setError('Please choose a stronger password');
      return;
    }
    if (newPassword !== confirm) {
      setError('The two passwords do not match');
      return;
    }

    setPending(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
      // Drop the token from the address bar so a refresh cannot replay it and
      // so the link is not left sitting in history or a shared screenshot.
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-4">
        <div className="w-full max-w-md pe-card p-6 text-center">
          <AlertTriangle size={40} className="mx-auto text-[#f59e0b] mb-4" />
          <h1 className="text-lg font-semibold mb-2">This link is incomplete</h1>
          <p className="text-sm text-[#8a98b5] mb-6">
            The reset link is missing its token. Open the link straight from your email, or
            request a new one.
          </p>
          <button type="button" onClick={() => navigate('forgot-password')} className="pe-btn-primary w-full">
            Request a new link
          </button>
        </div>
      </div>
    );
  }

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
          {done ? (
            <div className="text-center py-4">
              <KeyRound size={40} className="mx-auto text-[#10b981] mb-4" />
              <h2 className="text-lg font-semibold mb-2">Password updated</h2>
              <p className="text-sm text-[#8a98b5] mb-6">
                For your security, every device that was signed in has been signed out. Use your
                new password to sign in again.
              </p>
              <button type="button" onClick={() => navigate('login')} className="pe-btn-primary w-full">
                Sign in
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-1">Choose a new password</h2>
              <p className="text-sm text-[#8a98b5] mb-5">
                At least 8 characters, including a letter and a number.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                    New password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                    <input
                      id="new-password"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pe-input pl-9"
                      required
                      autoFocus
                    />
                  </div>
                  {strengthError && <p className="text-xs text-[#f59e0b] mt-1.5">{strengthError}</p>}
                </div>

                <div>
                  <label htmlFor="confirm-password" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="pe-input pl-9"
                      required
                    />
                  </div>
                  {mismatch && <p className="text-xs text-[#ef4444] mt-1.5">Passwords do not match</p>}
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]"
                  >
                    {error}
                  </div>
                )}

                <button type="submit" disabled={!canSubmit} className="pe-btn-primary w-full disabled:opacity-60">
                  {pending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating
                    </>
                  ) : (
                    'Update password'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}