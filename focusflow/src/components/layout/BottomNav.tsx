import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MoreHorizontal, X } from 'lucide-react';
import { mobilePrimaryPaths, navItems } from '@/components/layout/navConfig';

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const primaryItems = navItems.filter((item) => mobilePrimaryPaths.includes(item.path));
  const moreItems = navItems.filter((item) => !mobilePrimaryPaths.includes(item.path));
  const isMoreActive = moreItems.some((item) => item.path === location.pathname);

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/40 backdrop-blur-sm animate-fade-in lg:hidden"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMoreOpen(false);
          }}
        >
          <div className="w-full rounded-t-3xl border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-slide-up">
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-[var(--color-text)]">More</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
                    }`
                  }
                >
                  <item.icon size={20} strokeWidth={2} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden">
        {primaryItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
              }`
            }
          >
            <item.icon size={20} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
            isMoreActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
          }`}
        >
          <MoreHorizontal size={20} strokeWidth={2} />
          More
        </button>
      </nav>
    </>
  );
}
