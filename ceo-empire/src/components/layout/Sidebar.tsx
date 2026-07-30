import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  LineChart,
  Trophy,
  BarChart3,
  Settings,
  Crown,
  Award,
  X,
} from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/businesses', label: 'Businesses', icon: Building2 },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/investments', label: 'Investments', icon: LineChart },
  { to: '/achievements', label: 'Achievements', icon: Award },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.06] bg-ink-900/95 backdrop-blur-sm transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-600">
              <Crown className="h-5 w-5 text-[#05070d]" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-white">CEO Empire</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-gold-500/15 to-transparent text-gold-300 border border-gold-500/20'
                    : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent',
                )
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] px-5 py-4 text-xs text-white/30">
          CEO Empire &middot; Build your legacy
        </div>
      </aside>
    </>
  );
}
