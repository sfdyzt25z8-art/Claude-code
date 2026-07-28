import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { friendlyAuthError } from '@/lib/authErrors';

export default function ForgotPasswordPage() {
  const { resetPassword, firebaseReady } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to get back into your empire."
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <p className="text-sm text-white/80">
            Check <span className="font-medium text-white">{email}</span> for a link to reset
            your password.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!firebaseReady && (
            <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-xs text-gold-300">
              Firebase isn't configured in this environment, so password reset is disabled.
            </div>
          )}
          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!firebaseReady}
            required
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button
            type="submit"
            icon={<Mail className="h-4 w-4" />}
            loading={loading}
            disabled={!firebaseReady}
            className="w-full"
          >
            Send Reset Link
          </Button>
        </form>
      )}

      <Link
        to="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to log in
      </Link>
    </AuthLayout>
  );
}
