import { Outlet, useLocation } from 'react-router-dom';
import { Sparkles as LogoIcon } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toaster } from '@/components/ui/Toaster';
import { navItems } from '@/components/layout/navConfig';

export function AppLayout() {
  const location = useLocation();
  const currentLabel = navItems.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path),
  )?.label;

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
            <LogoIcon size={15} strokeWidth={2.25} />
          </div>
          <span className="font-semibold text-[var(--color-text)]">{currentLabel ?? 'FocusFlow'}</span>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-6xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
      <Toaster />
    </div>
  );
}
