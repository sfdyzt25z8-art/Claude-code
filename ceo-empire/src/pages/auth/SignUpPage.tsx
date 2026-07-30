import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Sparkles } from 'lucide-react';
import { AuthLayout, GoogleIcon } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { friendlyAuthError } from '@/lib/authErrors';

export default function SignUpPage() {
  const { signUpWithEmail, loginWithGoogle, continueAsGuest, firebaseReady } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name.trim() || 'CEO');
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleGuest() {
    continueAsGuest();
    navigate('/dashboard');
  }

  return (
    <AuthLayout title="Start your empire" subtitle="Create an account and get $10,000 to invest.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!firebaseReady && (
          <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-xs text-gold-300">
            Firebase isn't configured in this environment — sign-up is disabled. Use Guest Mode
            below to play instantly (progress saves to this device).
          </div>
        )}
        <Input
          id="name"
          label="Full name"
          placeholder="Jordan Rivera"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!firebaseReady}
          required
        />
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
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!firebaseReady}
          required
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button
          type="submit"
          icon={<UserPlus className="h-4 w-4" />}
          loading={loading}
          disabled={!firebaseReady}
          className="mt-1 w-full"
        >
          Create Account
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/30">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="flex flex-col gap-3">
        <Button
          variant="secondary"
          icon={<GoogleIcon />}
          onClick={handleGoogle}
          loading={googleLoading}
          disabled={!firebaseReady}
          className="w-full"
        >
          Continue with Google
        </Button>
        <Button
          variant="ghost"
          icon={<Sparkles className="h-4 w-4" />}
          onClick={handleGuest}
          className="w-full border border-white/10"
        >
          Continue as Guest
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-white/50">
        Already building an empire?{' '}
        <Link to="/login" className="font-medium text-gold-400 hover:text-gold-300">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
