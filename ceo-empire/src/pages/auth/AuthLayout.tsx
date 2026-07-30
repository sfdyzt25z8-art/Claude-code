import { type ReactNode } from 'react';
import { Crown } from 'lucide-react';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-ink-950">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-900 via-ink-900 to-ink-950 p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(234,184,74,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(28,53,96,0.5), transparent 45%)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-600/30 animate-float">
            <Crown className="h-6 w-6 text-[#05070d]" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">CEO Empire</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="mb-3 text-4xl font-bold leading-tight text-white">
            Build your empire. <span className="gold-text">Rule the market.</span>
          </h2>
          <p className="text-white/50">
            Start with $10,000. Buy businesses, hire talent, invest boldly, and claim your spot as
            the richest CEO in the world.
          </p>
        </div>
        <p className="relative text-xs text-white/30">
          &copy; {new Date().getFullYear()} CEO Empire. A business simulation game.
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-600">
                <Crown className="h-5 w-5 text-[#05070d]" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold text-white">CEO Empire</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-sm text-white/50">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.6H1.27A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.27 5.4z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.6l4 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}
