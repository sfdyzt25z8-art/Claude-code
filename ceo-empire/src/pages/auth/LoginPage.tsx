import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';
import { AuthLayout, GoogleIcon } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { friendlyAuthError } from '@/lib/authErrors';

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle, continueAsGuest, firebaseReady } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email, password);
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
    <AuthLayout title="Welcome back, CEO" subtitle="Log in to keep growing your empire.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!firebaseReady && (
          <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-xs text-gold-300">
            Firebase isn't configured in this environment — sign-in is disabled. Use Guest Mode
            below to play instantly (progress saves to this device).
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
        <div className="flex flex-col gap-1.5">
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!firebaseReady}
            required
          />
          <Link
            to="/forgot-password"
            className="self-end text-xs text-gold-400 hover:text-gold-300"
          >
            Forgot password?
          </Link>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button
          type="submit"
          icon={<LogIn className="h-4 w-4" />}
          loading={loading}
          disabled={!firebaseReady}
          className="mt-1 w-full"
        >
          Log In
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
        New to CEO Empire?{' '}
        <Link to="/signup" className="font-medium text-gold-400 hover:text-gold-300">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
