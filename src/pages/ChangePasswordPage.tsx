import { useApp } from '@/context/AppContext';
import { changePassword } from '@/lib/auth';
import { KeyRound, Lock, Loader2, LogOut, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

function checkStrength(value: string): string | null {
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(value)) return 'Password must contain at least one letter';
  if (!/\d/.test(value)) return 'Password must contain at least one digit';
  return null;
}

export function ChangePasswordPage() {
  const { navigate, goBack, clearLocalSession } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const strengthError = newPassword.length > 0 ? checkStrength(newPassword) : null;
  const mismatch = confirm.length > 0 && confirm !== newPassword;
  const sameAsCurrent =
    newPassword.length > 0 && currentPassword.length > 0 && newPassword === currentPassword;

  const canSubmit =
    !pending &&
    !strengthError &&
    !mismatch &&
    !sameAsCurrent &&
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (checkStrength(newPassword)) {
      setError('Please choose a stronger password');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Your new password must be different from the current one');
      return;
    }
    if (newPassword !== confirm) {
      setError('The two passwords do not match');
      return;
    }

    setPending(true);
    try {
      await changePassword(currentPassword, newPassword);
      // The token this request used is already invalid server-side; drop the
      // in-memory session too so the shell cannot outlive it.
      clearLocalSession();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md pe-card p-6 text-center">
          <KeyRound size={40} className="mx-auto text-[#10b981] mb-4" />
          <h2 className="text-lg font-semibold mb-2">Password updated</h2>
          <p className="text-sm text-[#8a98b5] mb-6">
            Your password has been changed and every signed-in device, including this one, has
            been signed out.
          </p>
          <button type="button" onClick={() => navigate('login')} className="pe-btn-primary w-full">
            <LogOut size={16} />
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm text-[#8a98b5] hover:text-[#e8edf5] transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="pe-card p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb]/15 flex items-center justify-center shrink-0">
              <KeyRound size={20} className="text-[#60a5fa]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Change password</h1>
              <p className="text-sm text-[#8a98b5]">
                Choose a new password for your ParkEasy account.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-2.5 mb-5">
            <p className="text-xs text-[#fbbf24]">
              Changing your password signs you out on every device, including this one.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Current password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                <input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pe-input pl-9"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#1e2d4d]">
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
                />
              </div>
              <p className="text-xs text-[#5a6a8a] mt-1.5">
                At least 8 characters, including a letter and a number.
              </p>
              {strengthError && <p className="text-xs text-[#f59e0b] mt-1">{strengthError}</p>}
              {sameAsCurrent && (
                <p className="text-xs text-[#ef4444] mt-1">Choose something different</p>
              )}
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

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={!canSubmit} className="pe-btn-primary disabled:opacity-60">
                {pending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating
                  </>
                ) : (
                  'Update password'
                )}
              </button>
              <button type="button" onClick={goBack} className="pe-btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}