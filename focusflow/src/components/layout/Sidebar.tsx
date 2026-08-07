import { NavLink } from 'react-router-dom';
import { Sparkles as LogoIcon } from 'lucide-react';
import { navItems } from '@/components/layout/navConfig';

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-sm shadow-indigo-500/30">
          <LogoIcon size={18} strokeWidth={2.25} />
        </div>
        <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">FocusFlow</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
              }`
            }
          >
            <item.icon size={18} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-xl bg-[var(--color-surface-hover)] px-3 py-3 text-xs text-[var(--color-text-muted)]">
        Stay focused, one task at a time.
      </div>
    </aside>
  );
}
