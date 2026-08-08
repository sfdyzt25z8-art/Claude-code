import {
  LayoutDashboard,
  ListChecks,
  Target,
  Repeat,
  Timer,
  BarChart3,
  Sparkles,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Tasks', path: '/tasks', icon: ListChecks },
  { label: 'Goals', path: '/goals', icon: Target },
  { label: 'Habits', path: '/habits', icon: Repeat },
  { label: 'Focus', path: '/focus', icon: Timer },
  { label: 'Statistics', path: '/statistics', icon: BarChart3 },
  { label: 'AI Coach', path: '/ai-coach', icon: Sparkles },
  { label: 'Settings', path: '/settings', icon: Settings },
];

// Primary items shown directly in the mobile bottom nav; the rest live behind "More".
export const mobilePrimaryPaths = ['/', '/tasks', '/focus', '/habits'];
