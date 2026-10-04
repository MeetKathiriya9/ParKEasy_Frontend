import { useApp } from '@/context/AppContext';
import { forgotPassword } from '@/lib/auth';
import { Zap, ArrowLeft, Mail, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export function ForgotPasswordPage() {
  const { navigate } = useApp();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  // Populated only in development, where the server has no mailbox to send to.
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      const result = await forgotPassword(email);
      setSent(true);
      setDevLink(result.devResetLink);
    } catch (err) {
      // A transport failure is worth surfacing; a 202 for an unknown address
      // arrives as `sent` above and is deliberately not an error.
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
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
          {sent ? (
            <>
              <div className="text-center py-4">
                <CheckCircle2 size={40} className="mx-auto text-[#10b981] mb-4" />
                <h2 className="text-lg font-semibold mb-2">Check your inbox</h2>
                <p className="text-sm text-[#8a98b5]">
                  If an account exists for <span className="text-[#e8edf5]">{email}</span>, we
                  have sent it a link to choose a new password.
                </p>
              </div>

              {devLink && (
                <div className="mt-4 rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3">
                  <p className="text-xs font-semibold text-[#fbbf24] mb-2">
                    Development mode - the email was not actually sent
                  </p>
                  <a
                    href={devLink}
                    className="text-xs text-[#93c5fd] underline break-all inline-flex items-start gap-1"
                  >
                    {devLink.replace(/^https?:\/\/[^/]+/, '')}
                    <ExternalLink size={12} className="shrink-0 mt-0.5" />
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate('login')}
                className="pe-btn-primary w-full mt-6"
              >
                Back to sign in
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-1">Reset your password</h2>
              <p className="text-sm text-[#8a98b5] mb-5">
                Enter your account email and we will send you a link to set a new password.
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
                      autoFocus
                    />
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

                <button type="submit" disabled={pending} className="pe-btn-primary w-full disabled:opacity-60">
                  {pending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>
            </>
          )}

          <button
            type="button"
            onClick={() => navigate('login')}
            className="mt-5 w-full flex items-center justify-center gap-1.5 text-xs text-[#8a98b5] hover:text-[#e8edf5] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}